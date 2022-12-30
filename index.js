var winston = require('winston');
require('winston-mongodb');

var _ = require('lodash');
var { v1: uuidV1 } = require('uuid');
var helper = require('./helper');

var { combine, timestamp, printf, colorize, metadata } = winston.format;

this.truckContainer = new winston.Container();

/**
 * Trucker
 * @param {string} collection
 * @returns winston instance
 */
let trucker = exports.truck = (collection) => {
  if (collection) { // get other collection
    const otherContainer = this.truckContainer.get(collection);
    otherContainer.defaultMeta = trucker().defaultMeta;
    return otherContainer;
  }
  return trucker();
};

/**
 * Default option that truck used
 */
const _default = {
  truckKey: process.env.TRUCK_REQUEST_KEY || 'truckNo',
  mongodb: {
    host: process.env.TRUCK_DB_HOST,
    port: process.env.TRUCK_DB_PORT,
    user: process.env.TRUCK_DB_USER,
    password: process.env.TRUCK_DB_PASSWORD,
  },
  transports: {
    handleExceptions: true,
    handleRejections: true,
  },
  winstonMongoDb: {
    dbName: 'truck',
    dbNamePrefix: 'log_',
    collection: 'general',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      poolSize: 2,
    },
    storeHost: true,
    decolorize: true,
  }
};
const _defaultPrintf = printf(({ level, message, timestamp, metadata }) => {
  let msg = `\x1B[33m${timestamp}\x1b[0m [\x1B[33m${metadata[_default.truckKey]}\x1b[0m][${level}]: ${message} ${JSON.stringify(helper.redactor(metadata) || {})}`;
  return msg;
});

const _pickRequest = ['httpVersion', 'headers', 'url', 'originalUrl', 'query', 'body'];
/**
 * * This one generate metadata request
 * @param {*} req
 * @returns {object}
 */
const generateMetaRequest = (req) => {
  const result = _().merge({
    name: `HTTP ${req.method} ${req.url}`,
  }, _.pick(req, _pickRequest)).value();
  return { req: result }
};

const newMongoTransport = (options) => {
  const finaleOpt = _().merge(options, _.get(_default, 'winstonMongoDb'), _.get(options, 'winstonMongoDb'))
    .omit(['winstonMongoDb', 'mongodb', 'dbNamePrefix'])
    .merge({
      db: `mongodb://${_.get(options, 'mongodb.user')}:${encodeURIComponent(_.get(options, 'mongodb.password'))}@${_.get(options, 'mongodb.host')}:${_.get(options, 'mongodb.port')}/database?authSource=admin`,
      dbName: ((_.get(options, 'winstonMongoDb.dbNamePrefix') || _.get(_default, 'winstonMongoDb.dbNamePrefix')) + (_.get(options, 'winstonMongoDb.dbName') || _.get(_default, 'winstonMongoDb.dbName'))).toLowerCase().replace(/ /g, '_'),
    }).value();
  return new winston.transports.MongoDB(finaleOpt);
};

/**
 * * Truck Middleware
 * @param {string} collection name of log collection for container & mongodb instance
 * @param {useTruck, winstonMongoDb, mongodb} opt
 * @returns {function}
 * TODO: More dynamic setup for default opt
 */
exports.truckExpress = (collection, options = {}) => {
  this.truckContainer.add(collection,
    options.useTruck ||
    _().merge({
      format: combine(
        metadata(),
        colorize({ all: true }),
        timestamp(),
        _defaultPrintf,
      ),
      transports: [
        new winston.transports.Console(_default.transports),
        newMongoTransport(_.merge({ winstonMongoDb: { collection, ...options.winstonMongoDb } }, { mongodb: _.merge(_default.mongodb, options.mongodb) }, _default.transports))
      ],
      exitOnError: false,
    }, _.omit(options, ['winstonMongoDb', 'mongodb'])).value()
  );

  return (req, res, next) => {
    req.requestTime = (new Date);
    trucker = () => this.truckContainer.get(collection);
    trucker().defaultMeta = { [_default.truckKey]: uuidV1() };

    const end = res.end;
    res.end = function (chunk, encoding) {
      trucker().defaultMeta = _.merge(trucker().defaultMeta, generateMetaRequest(req), {
        res: {
          statusCode: res.statusCode.toString() || "000",
          statusMessage: res.statusMessage || "",
          body: chunk.toString('utf8'),
        },
        responseTime: ((new Date) - req.requestTime)
      });

      res.end = end;
      res.end(chunk, encoding);

      trucker().info('Result ' + _.get(trucker().defaultMeta, 'req.name'));
    };
    next();
  }
};

/**
 * * Truck - handling error res
 * @param {*} err
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
exports.truckCrashed = (err, req, res, next) => {
  const exceptionHandler = new winston.ExceptionHandler(trucker());
  const generateMetaException = exceptionHandler.getAllInfo.bind(exceptionHandler);

  trucker().defaultMeta = _.merge(trucker().defaultMeta, { responseTime: (new Date) - req.requestTime });

  trucker().error(_.get(trucker().defaultMeta, 'req.name'), _.omit(generateMetaException(err), ['exception', 'os']));
  next(err);
};

exports.newMongoTransport = newMongoTransport;
exports.generateMetaRequest = generateMetaRequest;

exports.useWinston = winston;