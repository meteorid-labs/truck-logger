import { LeveledLogMethod, LoggerOptions } from "winston";

var winston = require('winston');
require('winston-mongodb');

var _ = require('lodash');
var { v1: uuidV1 } = require('uuid');
var helper = require('./helper');

interface truckOptionType {
    useTruck?: any;
    transports?: any;
    mongodb?: false;
}

interface truckerType extends LoggerOptions {
    error: LeveledLogMethod;
    warn: LeveledLogMethod;
    help: LeveledLogMethod;
    data: LeveledLogMethod;
    info: LeveledLogMethod;
}

var { combine, timestamp, printf, colorize, metadata } = winston.format;
const truckContainer = new winston.Container();

let trucker: () => truckerType;

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
    let msg = `\x1B[33m${timestamp}\x1b[0m ${metadata[_default.truckKey] ? `[\x1B[33m${metadata[_default.truckKey]}\x1b[0m]` : ''}[${level}]: ${message} ${JSON.stringify(helper.redactor(metadata) || {})}`;
    return msg;
});
const _defaultCombine = () => combine(
    metadata(),
    colorize({ all: true }),
    timestamp(),
    _defaultPrintf,
)

const _pickRequest = ['httpVersion', 'headers', 'url', 'originalUrl', 'query', 'body'];
/**
 * * This one generate metadata request
 * @param {*} req
 * @returns {object}
 */
const generateMetaRequest = (req) => {
    const result = _().merge({
        name: `HTTP ${req.method} ${req.originalUrl}`,
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
export function truckExpress(collection: string, options: truckOptionType = {}) {
    const transports = [new winston.transports.Console(_default.transports)];
    if (options.mongodb) {
        transports.push(newMongoTransport(_.merge({ winstonMongoDb: _.merge(collection, _.get(options, 'winstonMongoDb') || {}) }, { mongodb: _.merge(_default.mongodb, _.get(options, 'mongodb') || {}) }, _default.transports)))
    }

    truckContainer.add(collection,
        options.useTruck ||
        _().merge({
            format: _defaultCombine(),
            transports,
            exitOnError: false,
        }, _.omit(options, ['winstonMongoDb', 'mongodb'])).value()
    );

    return (req, res, next) => {
        req.requestTime = (new Date);
        trucker = () => truckContainer.get(collection);
        trucker().defaultMeta = { [_default.truckKey]: uuidV1() };

        const end = res.end;
        res.end = function (chunk, encoding) {
            const currentTime = new Date();
            trucker().defaultMeta = _.merge(trucker().defaultMeta, generateMetaRequest(req), {
                res: {
                    statusCode: res.statusCode.toString() || "000",
                    statusMessage: res.statusMessage || "",
                    body: chunk.toString('utf8'),
                },
                responseTime: (currentTime.getTime() - req.requestTime)
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
export function truckCrashed(err, req, res, next) {
    const currentTime = new Date();
    const exceptionHandler = new winston.ExceptionHandler(trucker());
    const generateMetaException = exceptionHandler.getAllInfo.bind(exceptionHandler);

    trucker().defaultMeta = _.merge(trucker().defaultMeta, { responseTime: currentTime.getTime() - req.requestTime });

    trucker().error(_.get(trucker().defaultMeta, 'req.name'), _.omit(generateMetaException(err), ['exception', 'os']));
    next(err);
};

/**
 * Trucker
 * @param {string} collection
 * @returns winston instance
 */
export function truck(collection: string) {
    if (collection) { // get other collection
        const otherContainer = truckContainer.get(collection);
        otherContainer.defaultMeta = trucker().defaultMeta;
        return otherContainer;
    }
    return trucker();
};

exports.useTruck = winston;
exports.useTruckFormat = _defaultCombine();