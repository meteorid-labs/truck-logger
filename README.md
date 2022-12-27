
<h2 align="center">
  <a href="http://www.amitmerchant.com/electron-markdownify"><img src="https://img.freepik.com/premium-vector/dump-truck-icon-isolated-white-background_103044-862.jpg?w=1380" alt="truck-logger" width="200"></a>
  <br>
  Truck Logger
</h2>

<h4 align="center">A minimal Logger built with <a href="https://github.com/winstonjs/winston" target="_blank">Winston</a>.</h4>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#how-to-use">How to use</a>
  <!-- <a href="#related">Related</a> -->
</p>

### Installation
<!-- _Below is an example of how you can install and setting your app._ -->

1. Install package
    <br>
   ```sh
   # using npm
   npm install truck-logger
   ```
   ```sh
   # using yarn
   yarn add truck-logger
   ```
   <br>
2. Add your MongoDB access to your .env
    <br>
   ```js
    DB_LOG_HOST=
    DB_LOG_PORT=
    DB_LOG_USER=
    DB_LOG_PASSWORD=
   ```

### How To Use

To use truck logger you must add ```truckMiddleware``` on your API routes:

##### truckMiddleware
```js
const { truckMiddleware } = require('truck-logger');

app.get('/products', truckMiddleware('log-collection'), ...);

// or

router.post('/products', truckMiddleware('log-collection'), ...);
```
or .. if you prefer your own winston instance:
```js
const { truckMiddleware, useWinston } = require('truck-logger');

app.get('/products', truckMiddleware('log-collection',
  {
    useTruck: useWinston.createLogger({
      transports: [
        new useWinston.transports.Console(),
        new useWinston.transports.File({ filename: 'combined.log' })
      ]
    }),
  }
), ...)
```
##### truck
then you can use it like this:
```js
const { truck } = require('truck-logger');

const productController = () => {
  ...

  truck().info('Start getting product..')

  ...
};
```
this will be generate

## Credits

This package uses the following open source packages:

- [Winston](https://github.com/winstonjs/winston)
- [Lodash](https://github.com/lodash/lodash)

## Support

<a href="#" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/purple_img.png" alt="Buy Me A Coffee" style="height: 41px !important;width: 174px !important;box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;-webkit-box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;" ></a>

<p>Or</p> 

<a href="#">
	<img src="https://c5.patreon.com/external/logo/become_a_patron_button@2x.png" width="160">
</a>
