# Section 7. The Model View Controller (MVC)

Section6의 코드를 베이스로 활용한다

### lecture 93. What is the MVC?

관심사의 분리
* 처리해야 할 여러 작업들을 작업의 성격에 따라 분리해서 다루면 관리가 쉽다
* Models
  - 데이터
  - 저장, 수정 등  
* Views
  - 사용자가 보는 화면
  - 애플리케이션 코드와 결합도를 낮춤으로써 관리가 쉬워진다
* Controllers
  - 모델과 뷰를 연결시켜주는 역할
  - 앞서 작성했던 코드에서 라우터들이 일종의 컨트롤러 역할을 했다고 볼 수 있다

---

### lecture 94. Adding Controllers

앞서 작성했던 라우터 함수들
* 경로 다음에 작성한 콜백함수가 전형적으로 MVC에서 컨트롤러 역할을 맡은 것이라고 볼 수 있다
```js
// shop.js
router.get('/', /* Controller function begin */ (req, res, next) => {
  const products = adminData.products;
  res.render('shop', { 
    prods: products, 
    pageTitle: 'Shop', 
    path: '/', 
    activeShop: true, 
    hasProducts: products.length > 0 ? true : false,
    productCSS: true
  }); /* End */
});
```
* products 라는 모델을 생성하고, 뷰와 모델을 연결해주고 있다

라우터 안에 이미 컨트롤러들이 있으니 지금처럼 작성하면 되는것 아닐까?
* 물론 그렇게해도 프로그램 자체는 잘 작동한다
* 그러나 프로젝트 규모가 커지면 라우터 자체가 지나치게 비대해져 관리가 어렵다
* 따라서 외부 파일로 컨트롤러 로직을 분리시키는 것이 좋다

```js
// controllers/product.js
const products = [];

exports.getAddProduct = (req, res, next) => {
  res.render('add-product', { 
    pageTitle: 'Add Product', 
    path: '/admin/add-product', 
    activeAddProduct: true,
    formsCSS: true,
    productCSS: true
  });
};

exports.postAddProduct = (req, res, next) => {
  products.push({ title : req.body.title });
  res.redirect('/');
};

exports.getProducts = (req, res, next) => {
  res.render('shop', { 
    prods: products, 
    pageTitle: 'Shop', 
    path: '/', 
    hasProducts: products.length > 0 ? true : false,
    activeShop: true, 
    productCSS: true
  });
};

// routes/admin.js
const express = require('express');

const productsController = require('../controllers/products');

const router = express.Router();

router.get('/add-product', productsController.getAddProduct);

router.post('/add-product', productsController.postAddProduct);

module.exports = router;

// routes/shop.js
const express = require('express');

const router = express.Router();
const productsController = require('../controllers/products');

router.get('/', productsController.getProducts);

module.exports = router;
```
* products와 관련된 컨트롤러 로직을 controllers 폴더에 proudcts.js파일을 생성해 모았다

---

### lecture 95. Finishing the Controllers

404 페이지 컨트롤러 분기
* 404는 products와 연관이 없으므로 error.js 파일을 만들어 에러코드마다 알맞는 컨트롤러를 지정한다

```js
// controllers/error.js
exports.get404 = (req, res, next) => {
  res.status(404).render('404', { pageTitle: 'Page Not Found', path: '404' });
};

// app.js
(...)
const errorController = require('./controllers/error');
(...)
app.use(errorController.get404);
(...)
```

---

### lecture 96. Adding a Product Model

모델을 분리해서 다루기
* models 폴더에 product 모델을 만들어서 다뤄보자
* 아직은 데이터베이스를 사용하지 않으므로 그대로 배열을 이용해서 구현한다

```js
// models/proudcts.js
const products = [];

module.exports = class Product {
  constructor(t) {
    this.title = t;
  }

  save() {
    products.push(this);
  }

  static fetchAll() {
    return products;
  }
}

// controllers/products.js
const Product = require('../models/products');

exports.getAddProduct = (req, res, next) => {
  res.render('add-product', { 
    pageTitle: 'Add Product', 
    path: '/admin/add-product', 
    activeAddProduct: true,
    formsCSS: true,
    productCSS: true
  });
};

exports.postAddProduct = (req, res, next) => {
  const product = new Product(req.body.title);
  product.save();
  res.redirect('/');
};

exports.getProducts = (req, res, next) => {
  const products = Product.fetchAll();
  res.render('shop', { 
    prods: products, 
    pageTitle: 'Shop', 
    path: '/', 
    hasProducts: products.length > 0 ? true : false,
    activeShop: true, 
    productCSS: true
  });
};
```

---

### lecture 97 ~ 99. 파일을 이용해 모델 다루기

파일 읽기와 쓰기로 JSON 데이터를 이용해 모델로 다루기
```js
// models/products.js
const fs = require('fs');
const path = require('path');
const rootDir = require('../util/path');

const p = path.join(rootDir, 'data', 'products.json');

const getProductsFromFile = cb => {
  fs.readFile(p, (err, fileContent) => {
    if (err) {
      cb([]);
    } else {
      cb(JSON.parse(fileContent));
    }
  });
};

module.exports = class Product {
  constructor(t) {
    this.title = t;

  }

  save() {
    getProductsFromFile(products => {
      products.push(this);
      fs.writeFile(p, JSON.stringify(products), err => {
        console.log(err);
      });
    })
  }

  static fetchAll(cb) {
    getProductsFromFile(cb);
  }
}

// controllers/products.js
(...)
exports.getProducts = (req, res, next) => {
  Product.fetchAll(products => {
    res.render('shop', { 
      prods: products, 
      pageTitle: 'Shop', 
      path: '/', 
      hasProducts: products.length > 0 ? true : false,
      activeShop: true, 
      productCSS: true
    });
  });
};
```
* 비동기 로직이 있어 코드가 약간 복잡하지만 콜백함수를 잘 활용하면 된다

