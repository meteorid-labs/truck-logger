
<h2 align="center">
  <a href="https://github.com/meteorid-labs/truck-logger"><img src="https://img.freepik.com/premium-vector/dump-truck-icon-isolated-white-background_103044-862.jpg?w=1380" alt="@meteor-labs/truck-logger" width="200"></a>
  <br>
  Truck Logger
</h2>

<h4 align="center">A minimal Express Logger built with <a href="https://github.com/winstonjs/winston" target="_blank">Winston</a>.</h4>
<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#how-to-use">How to use</a>
  <!-- <a href="#related">Related</a> -->
</p>

### Installation
<!-- _Below is an example of how you can install and setting your app._ -->
1. Install package
   ```sh
   # using npm
   npm i @meteor-labs/truck-logger
   ```
   ```sh
   # using yarn
   yarn add @meteor-labs/truck-logger
   ```
2. Add your MongoDB access to your .env
   ```js
    TRUCK_REQUEST_KEY= // requestId. default: truckNo
    TRUCK_DB_HOST=
    TRUCK_DB_PORT=
    TRUCK_DB_USER=
    TRUCK_DB_PASSWORD=
   ```

### How To Use

To use truck-logger add ```truckExpress``` to your API Route. Here is an example:

```js
const { truckExpress } = require('@meteor-labs/truck-logger');

app.get('/truck/number/1', truckExpress('truck_1_collection'), ...);

// or

router.get('/truck/number/1', truckExpress('truck_1_collection'), ...);
```
and.. That`s it!! 🦀

As default ```truckExpress``` will be generated request result for you, which is log console & log data on MongoDB along with default meta info inside. Like this:

<img width="1089" alt="ss_1" src="https://user-images.githubusercontent.com/5293897/210051861-6a3706c0-60be-4814-af8d-64a107f34559.png">
<img style="margin-bottom:24px" width="654" alt="ss_2" src="https://user-images.githubusercontent.com/5293897/210051865-ed240599-a38c-4b7e-bf86-6ac1694ceb27.png">


Oh.. If you want to create new log with same ```truckNo (requestId)```. You can do this inside your controller:

<!-- ##### truck(collection) -->
```js
const { truck } = require('@meteor-labs/truck-logger');

const truck1Controller = () => {
  ...

  truck().info('The truck is still on its way..')

  truck().warn('Almost there..')

  truck().error('Oops..')
  
  ...
};
```
<img width="1088" alt="Screenshot 2022-12-30 at 16 04 08" src="https://user-images.githubusercontent.com/5293897/210053182-a612fb50-5e93-4202-96db-4f5caf08fe94.png">


## Credits

This package uses the following open source packages:

- [Winston](https://github.com/winstonjs/winston)
- [Winston-MongoDB](https://github.com/winstonjs/winston-mongodb)
- [Lodash](https://github.com/lodash/lodash)
- [Traverse](https://github.com/ljharb/js-traverse)
- [Klona](https://github.com/lukeed/klona)

## Support

<a href="https://www.buymeacoffee.com/riodewanto" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/purple_img.png" alt="Buy Me A Coffee" style="height: 41px !important;width: 174px !important;box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;-webkit-box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;" ></a>
