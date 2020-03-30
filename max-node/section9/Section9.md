# Section 9. Dynamic Routes & Advanced Models

### lecture 114. Adding the Product ID to the Path

개별 상품 페이지를 만들기 위한 버튼 생성
```html
<!-- product-list.ejs -->
(...)
<div class="card__actions">
    <a href="/products/<%= product.id %>" class="btn">Details</a>
    <form action="/add-to-cart" method="POST">
        <button class="btn">Add to Cart</button>
    </form>
</div>
(...)
```

상품 모델을 저장할 시 아이디를 지정하도록 수정
```js
// models/product.js
(...)
save() {
    this.id = Math.random().toString();
    getProductsFromFile(products => {
      products.push(this);
      fs.writeFile(p, JSON.stringify(products), err => {
        console.log(err);
      });
    });
}
(...)
```
* Math.random으로 id의 유니크함이 반드시 보장되진 않는다
  - 편의를 위해 데이터베이스를 사용하기 이전까지는 임의로 사용한다

---

### lecture 115. Extracting Dynamic Params

상품의 id를 동적으로 추출해 조작하기
```js
// routes/shop.js
(...)
router.get('/products', shopController.getProducts);

// router.get('/products/delete');

router.get('/products/:productId', shopController.getProduct);
(...)
```
* :을 이용해 앵커태그에서 넘어온 상품의 id값을 동적으로 받아올 수 있다
* 이렇게 :을 이용할 때 주의해야 할 점은 위에 주석처리 해놓은 delete 같은 라우터가 코드 위치 상 아래에 있을 시 :을 이용한 라우터가 매칭되는 것이다
* 따라서 라우터 경로의 계층이 동일한 라우터들에 :을 이용할 때는 가장 아래에 위치시켜야 한다

라우터에서 동적으로 처리한 id값을 캐싱하기
```js
// controllers/shop.js
(...)
exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
}
(...)
```
* req.params.[라우터에서 :을 이용한 값]으로 변수를 캐싱할 수 있다

---

### lecture 116. Loading Product Detail Data

모델에서 id에 맞는 데이터를 찾아오는 메서드 작성
```js
// models/product.js
(...)
static findById(id, cb) {
    getProductsFromFile(products => {
      const product = products.find(p => p.id === id);
      cb(product);
    })
}
(...)
```
* id와 콜백함수를 인자로 받는다
* 전체 상품 목록에서 id와 일치하는 상품을 추출한다
* 콜백함수를 실행해 개별 상품 페이지를 렌더링한다

개별 상품 페이지를 렌더링할 콜백함수 작성
```js
// controllers/shop.js
(...)
exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId, product => {
    res.render('shop/product-detail', {
      product: product,
      pageTitle: product.title,
      path: '/products'
    })
  });
};
(...)
```

개별 상품 페이지 마크업
```html
<%- include('../includes/head.ejs') %>
</head>

<body>
  <%- include('../includes/navigation.ejs') %>
  <main class="centered">
    <h1><%= product.title %></h1>
    <hr>
    <div>
      <img src="<%= product.imageUrl %>" alt="<%= product.title %>">
    </div>
    <h2><%= product.price %></h2>
    <p><%= product.description %></p>
    <form action="/cart" method="POST">
      <button type="submit">Add to Cart</button>
    </form>
  </main>  

<%- include('../includes/end.ejs') %>
```
* cart로 보내는 로직은 이후에 작성한다

---

### lecture 118. Passing Data with POST Requests

카트에 상품을 보내는 마크업 작성
* 상품에 관한 정보는 id값을 hidden타입 input태그에 작성해 전송한다
* index.ejs, product-list.ejs, product-detail.ejs 총 세 곳에 반복해서 사용하고 있다
```html
<!-- includes/add-to-cart.ejs -->
<form action="/cart" method="POST">
  <button type="submit" class="btn">Add to Cart</button>
  <input type="hidden" name="productId" value="<%= product.id %>" />
</form>

<!-- views/shop/index.ejs -->
(...)
<div class="card__actions">
        <%- include('../includes/add-to-cart.ejs', {product: product}) %>
    </div>
</article>
(...)

<!-- views/shop/product-list.ejs -->
<div class="card__actions">
    <a href="/products/<%= product.id %>" class="btn">Details</a>
    <%- include('../includes/add-to-cart.ejs', {product: product}) %>
</div>
</article>

<!-- views/shop/product-detail.ejs -->
(...)
<%- include('../includes/add-to-cart.ejs') %>
</main> 
(...)
```

### lecture 119. Adding a Cart Model

카트 모델 만들기
```js
// models/cart.js
const fs = require('fs');
const path = require('path');

const p = path.join(
  path.dirname(process.mainModule.filename),
  'data',
  'cart.json'
);

module.exports = class Cart {
  static addProduct(id, productPrice) {
    // Fetch the previous cart
    fs.readFile(p, (err, fileContent) => {
      let cart = { products: [], totalPrice: 0 };
      if (!err) {
        cart = JSON.parse(fileContent);
      }
      // Analyze the cart => Find existing product
      const existingProductIndex = cart.products.findIndex(prod => prod.id === id);
      const existingProduct = cart.products[existingProductIndex];
      let updatedProduct;
      // Add new product/ increase quantity
      if (existingProduct) {
        updatedProduct = {...existingProduct};
        updatedProduct.qty = updatedProduct.qty + 1;
        cart.products = [...cart.products];
        cart.products[existingProductIndex] = updatedProduct;
      } else {
        updatedProduct = { id: id, qty: 1};
        cart.products = [...cart.products, updatedProduct];
      }
      cart.totalPrice = cart.totalPrice + +productPrice;
      fs.writeFile(p, JSON.stringify(cart), (err) => {
        console.log(err);
      });
    });
  }
};
```

postCart 라우터와 컨트롤러 생성
```js
// routes/shop.js
(...)
router.post('/cart', shopController.postCart);
(...)

// controller/shop.js
(...)
exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId, (product) => {
    console.log(product);
    Cart.addProduct(prodId, product.price);
  });
  res.redirect('/cart');
};
(...)
```

---

### lecture 120,121 - Using Query Params, Pre-Populating the Edit Product Page with Data

쿼리 파라미터를 이용하기
* 수정모드인지 추가모드인지를 체크해서 수정모드이면 상품의 데이터를 폼에 미리 채워준다

```js
// routes/admin.js
const path = require('path');

const express = require('express');

const adminController = require('../controllers/admin');

const router = express.Router();

// /admin/add-product => GET
router.get('/add-product', adminController.getAddProduct);

// /admin/products => GET
router.get('/products', adminController.getProducts);

// /admin/add-product => POST
router.post('/add-product', adminController.postAddProduct);

// /admin/edit-product/:productId => get
router.get('/edit-product/:productId', adminController.getEditProduct);

module.exports = router;

```
* 상품을 수정하는 라우터를 만들고 컨트롤러를 지정했다

컨트롤러 작성하기
```js
// controllers/admin.js
(...)
exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect('/');
  }
  const prodId = req.params.productId;
  Product.findById(prodId, product => {
    if (!product) {
      return res.redirect('/');
    }
    res.render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      editing: editMode,
      product: product
    });
  });
};
(...)
```
* req.query.key 형식으로 쿼리 파라미터를 이용해 값을 구해올 수 있다
* 수정모드인지 쿼리 파라미터를 체크하고 상품 아이디에 맞는 상품을 추출해 뷰에 보낸다

뷰 코드 작성
```html
<!-- views/admin/edit-product.ejs -->
<%- include('../includes/head.ejs') %>
    <link rel="stylesheet" href="/css/forms.css">
    <link rel="stylesheet" href="/css/product.css">
</head>

<body>
   <%- include('../includes/navigation.ejs') %>

    <main>
        <form class="product-form" action="/admin/<% if (editing) { %>edit-product<% } else { %>add-product<% } %>" method="POST">
            <div class="form-control">
                <label for="title">Title</label>
                <input type="text" name="title" id="title" value="<% if (editing) { %><%= product.title %><% } %>">
            </div>
            <div class="form-control">
                <label for="imageUrl">Image URL</label>
                <input type="text" name="imageUrl" id="imageUrl" value="<% if (editing) { %><%= product.imageUrl %><% } %>">
            </div>
            <div class="form-control">
                <label for="price">Price</label>
                <input type="number" name="price" id="price" step="0.01" value="<% if (editing) { %><%= product.price %><% } %>">
            </div>
            <div class="form-control">
                <label for="description">Description</label>
                <textarea name="description" id="description" rows="5"><% if (editing) { %><%= product.description %><% } %></textarea>
            </div>

            <button class="btn" type="submit"><% if (editing) { %>Update Product<% } else { %>Add Product<% } %></button>
        </form>
    </main>
<%- include('../includes/end.ejs') %>
```
* 기존의 add-product를 edit-product로 이름을 바꿨다
* if 문으로 수정모드인지(editing)를 체크해서 폼의 값을 다르게 보여준다
* 제출버튼도 수정모드 여부에 따라 다른 텍스트를 보여준다

---

### lecture 122. Linking to the Edit Page

관리자 페이지에서 상품수정 버튼을 눌렀을 때 앞서 작성한 수정 페이지와 연결시키기
```html
<!-- views/admin/products.ejs -->
(...)
<div class="card__actions">
  <a href="/admin/edit-product/<%= product.id %>?edit=true" class="btn">Edit</a>
  <form action="/admin/delete-product" method="POST">
      <button class="btn" type="submit">Delete</button>
  </form>
</div>
(...)
```
* 쿼리 파라미터를 반드시 작성해야 '/' 경로로 리다이렉트 되지 않는다

---

### lecture 123. Editing the Product Data

수정 버튼을 눌렀을 때 실제로 수정되도록 코드를 작성하기
```js
// models/product.js
(...)
module.exports = class Product {
  constructor(id, title, imageUrl, description, price) {
    this.id = id;
    this.title = title;
    this.imageUrl = imageUrl;
    this.description = description;
    this.price = price;
  }

  save() {
    getProductsFromFile(products => {
      if (this.id) {
        const existingProductIndex = products.findIndex(p => p.id === this.id);
        const updatedProducts = [...products];
        updatedProducts[existingProductIndex] = this;
        fs.writeFile(p, JSON.stringify(updatedProducts), err => {
          console.log(err);
        });
      } else {
        this.id = Math.random().toString();
        products.push(this);
        fs.writeFile(p, JSON.stringify(products), err => {
          console.log(err);
        });
      }
    });
  }
(...)
```
* 상품 인스턴스 생성시 id를 지정하도록 생성자를 변경했다
* save에서 id값을 체크해서 수정인지 추가인지를 분리해서 처리한다

라우터와 컨트롤러 작성
```js
// routes/admin.js
(...)
router.post('/edit-product', adminController.postEditProduct);
(...)

// controllers/admin.js
exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedImageUrl = req.body.imageUrl;
  const updatedPrice = req.body.price;
  const updatedDesc = req.body.description;
  const updatedProduct = new Product(
    prodId, 
    updatedTitle, 
    updatedImageUrl, 
    updatedDesc, 
    updatedPrice
  );

  updatedProduct.save();
  res.redirect('/admin/products');
};
```

위에 작성한 컨트롤러 코드의 id값을 넘겨줄 html 코드 작성
```html
<!-- views/admin/edit-product.ejs -->
(...)
<% if (editing) { %>
  <input type="hidden" name="productId" value="<%= product.id %>" />
<% } %>
<button class="btn" type="submit"><% if (editing) { %>Update Product<% } else { %>Add Product<% } %></button>
(...)
```

---

### lecture 124. Adding the Product-Delete Functionality

상품을 삭제하는 로직 작성하기
```js
// models/product.js
(...)
const Cart = require('./cart');
(...)

static deleteById(id) {
    getProductsFromFile(products => {
      const product = products.find(p => p.id === id);
      const updatedProducts = products.filter(p => p.id !== id);
      fs.writeFile(p, JSON.stringify(updatedProducts), err => {
        if (!err) {
          Cart.deleteProduct(id, product.price);
        }
      });
    })
}
(...)

// models/cart.js
static deleteProduct(id, productPrice) {
    fs.readFile(p, (err, fileContent) => {
      if (err) {
        return;
      }
      const updatedCart = { ...JSON.parse(fileContent) };
      const product = updatedCart.products.find(p => p.id === id);
      const productQty = product.qty;
      updatedCart.products = updatedCart.products.filter(p => p.id !== id);
      updatedCart.totalPrice = updatedCart.totalPrice - productPrice * productQty;

      fs.writeFile(p, JSON.stringify(updatedCart), err => {
        console.log(err);
      });
    })
}
```
* 점점 예제가 별로 실용적이지 않아보인다
* 데이터베이스를 사용하면 편리하게 처리될 코드들이 난잡하게 작성되어있다