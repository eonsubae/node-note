# Section 13. Working with Mongoose

### lecture 206. What is Mongoose?

몽구스
* SQL의 시퀄라이즈와 같은 역할을 하는 라이브러리
```js
db.collection('users').insertOne({key : value...}) // 앞서 작성한 쿼리문
const user = User.create({key : value...}) // 몽구스
```
* db 자체의 문법보다 데이터에 집중하도록 도와주는 다양한 헬퍼함수를 가지고 있다

---

### lecture 207. Connecting to the MongoDB Server with Mongoose

몽구스 설치하기
```terminal
$ npm i --save mongoose
```

앞서 작성했던 데이터베이스 연결코드
* 몽구스가 뒷단에서 알아서 관리해준다
* 따라서 util/database.js는 더이상 필요없다
* 대신 app.js에 몽구스를 임포트하고 연결하는 코드를 작성하면된다

```js
// app.js
(...)
const mongoose = require('mongoose');

(...)
mongoose
  .connect(
    'mongodb+srv://eonsu-1:SJE6LQ5Ym2Si97l9@cluster0-iqzdk.mongodb.net/shop?retryWrites=true',
    { useNewUrlParser: true }
  )
  .then(result => {
    app.listen(3000);
  })
  .catch(err => {
    console.log(err);
  });
```

---

### lecture 208. Creating the Product Schema

몽구스를 이용한 상품 스키마 정의
* 앞서 NoSQL은 데이터 구조를 강제하지 않는다고 설명했었다
* 그럼에도 일정한 데이터 구조를 지정하는 것이 도움이 될 때가 있다
* 물론 이것은 어디까지나 데이터의 대략적인 구조이지 무조건 강제되는 요소가 아니다

```js
// models/product.js
const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const productSchema = new Schema({
  title : {
    type: String,
    required: true
  },
  price : {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  }
});
```

---

### lecture 209. Saving Data Through Mongoose

앞서 정의한 스키마 저장하기
```js
// models/product.js
(...)
module.exports = mongoose.model('Product', productSchema);
```
* 첫번째 인자로 컬렉션 이름을 넘겨준다
  - 몽구스는 인자로 받은 컬렉션 이름을 소문자 & 복수형으로 변경해서 저장한다(이 경우 products)
* 두번째 인자로 앞서 정의했던 스키마를 넘겨준다

상품 추가기능 작동시키기
```js
// controllers/admin.js
exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const imageUrl = req.body.imageUrl;
  const price = req.body.price;
  const description = req.body.description;
  const product = new Product({
    title,
    price,
    description,
    imageUrl,
  });
  product
    .save()
    .then(result => {
      // console.log(result);
      console.log('Created Product');
      res.redirect('/admin/products');
    })
    .catch(err => {
      console.log(err);
    });
};
```
* 자바스크립트 오브젝트로 앞서 정의한 스키마 순서에 맞게 데이터를 넘겨준다
* 이젠 save를 직접 구현하지 않아도 몽구스가 제공해주는 기능을 사용하면 동일하게 작동한다
 
---

### lecture 210. Fetching All Products

Shop과 Products 네비게이션 활성화하기
* 라우터에서 두 컨트롤러 메서드의 주석을 해제한다
* 컬렉션 전체 데이터를 가져오는 find 메서드를 이용해 컨트롤러를 수정한다

```js
// controllers/shop.js
exports.getProducts = (req, res, next) => {
  Product.find()
    .then(products => {
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'All Products',
        path: '/products'
      });
    })
    .catch(err => {
      console.log(err);
    });
};
(...)

exports.getIndex = (req, res, next) => {
  Product.find()
    .then(products => {
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/'
      });
    })
    .catch(err => {
      console.log(err);
    });
};
(...)
```

---

### lecture 211. Fetching a Single Product

개별 상품을 가져오기
* 라우터에서 관련 컨트롤러 주석을 해제
* findById메서드를 이용해 인자로 _id값을 넘겨 상품 찾아오기

```js
// controllers/shop.js
(...)
exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products'
      });
    })
    .catch(err => console.log(err));
};
(...)
```
* ObjectId로 변환을 수동으로 하지 않아도 몽구스가 처리해준다

---

### lecture 212. Updating Products

기존 상품을 수정하는 로직 작성
* 관련 라우터의 주석을 해제한다
* findById로 상품을 찾고 자바스크립트 오브젝트의 프로퍼티를 변경하듯이 변경사항을 적용한다
* save메서드로 저장하면 변경사항이 적용된다

```js
// controllers/admin.js
(...)
exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect('/');
  }
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      if (!product) {
        return res.redirect('/');
      }
      res.render('admin/edit-product', {
        pageTitle: 'Edit Product',
        path: '/admin/edit-product',
        editing: editMode,
        product: product
      });
    })
    .catch(err => console.log(err));
};
(...)

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const updatedImageUrl = req.body.imageUrl;
  const updatedDesc = req.body.description;

  Product.findById(prodId)
    .then(product => {
      product.title = updatedTitle;
      product.price = updatedPrice;
      product.description = updatedDesc;
      product.imageUrl = updatedImageUrl;
      return product.save()
    })
    .then(result => {
      console.log('UPDATED PRODUCT!');
      res.redirect('/admin/products');
    })
    .catch(err => console.log(err));
};
(...)
```

---

### lecture 213. Deleting Products

상품을 삭제하는 로직 작성하기
* findById와 delete를 따로 작성하는 방법과 findByIdAndRemove를 사용하는 방법이 있다

```js
// controllers/admin.js
// 방법 1
(...)
exports.postDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then(product => {
      return product.delete();
    })
    .then(() => {
      console.log('DESTROYED PRODUCT');
      res.redirect('/admin/products');
    })
    .catch(err => console.log(err));
};

// 방법 2
(...)
exports.postDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findByIdAndRemove(prodId)
    .then(() => {
      console.log('DESTROYED PRODUCT');
      res.redirect('/admin/products');
    })
    .catch(err => console.log(err));
};
```

---

### lecture 214. Adding and Using a User Model

User스키마 작성하기
* 앞서 Product와 동일한 과정을 거친다

```js
// models/user.js
const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  cart: {
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          required: true
        },
        quantity: {
          type: Number,
          required: true
        }
      }
    ]
  }
});

module.exports = mongoose.model('User', userSchema);
```

유저를 생성하는 코드를 작성하기
* 한 번만 생성할 것이다
* 실제 사용하는 인증기능은 이후에 배운다

```js
// app.js
(...)
mongoose
  .connect(
    'mongodb+srv://eonsu-1:SJE6LQ5Ym2Si97l9@cluster0-iqzdk.mongodb.net/shop?retryWrites=true',
   { useNewUrlParser: true }
  )
  .then(result => {
    const user = new User({
      name: 'ES',
      email: 'esbae@gg.com',
      cart: []
    });
    user.save();
    app.listen(3000);
  })
  .catch(err => {
    console.log(err);
  });
```
* 한번 적용한 뒤 반드시 지운다
* 그리고 주석처리했던 미들웨어를 다시 작동하게 만든다

```js
// app.js
(...)
app.use((req, res, next) => {
  User.findById('5cd0c864f99a4a13844086cb')
    .then(user => {
      req.user = user;
      next();
    })
    .catch(err => console.log(err));
});
(...)
```

---

### lecture 215. Using Relations in Mongoose

컬렉션 간 관계를 사용하기
```js
// models/product.js
(...)
const productSchema = new Schema({
  title : {
    type: String,
    required: true
  },
  price : {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
});
```
* ref에 앞서 mongoose.model에 첫번째 인자로 넘겨줬던 모델명과 같은 값을 넘겨주면 해당 모델과 관계지어진다
  
User 모델에도 관계 적용하기
```js
// models/user.js
(...)
const userSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  cart: {
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          required: true
        },
        quantity: {
          type: Number,
          required: true
        }
      }
    ]
  }
});
```

상품 추가 로직에 userId값을 넘겨주도록 수정하기
```js
// controllers/admin.js
(...)
exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const imageUrl = req.body.imageUrl;
  const price = req.body.price;
  const description = req.body.description;
  const product = new Product({
    title,
    price,
    description,
    imageUrl,
    userId: req.user
  });
  product
    .save()
    .then(result => {
      // console.log(result);
      console.log('Created Product');
      res.redirect('/admin/products');
    })
    .catch(err => {
      console.log(err);
    });
};
(...)
```
* req.user._id가 아닌 req.user로만 넘겨줘도 몽구스에서 알아서 id만 저장해준다

---

### lecture 216. One Important Thing About Fetching Relations

기존의 상품목록을 가져오는 코드
* 콘솔에 실제 상품을 출력해보면 userId만 가져오고 user의 전체 정보를 가져오지는 않는다
* 그런데 실제로는 user의 전체 정보를 가져와야 할 때가 필요하고 이를 처리하기 위한 코드를 작성하면 코드가 복잡해진다
* 몽구스에서는 populate를 이용하면 관련된 모델의 정보를 가져온다

```js
// controllers/admin.js
(...)
exports.getProducts = (req, res, next) => {
  Product.find()
    .populate('userId')
    .then(products => {
      res.render('admin/products', {
        prods: products,
        pageTitle: 'Admin Products',
        path: '/admin/products'
      });
    })
    .catch(err => console.log(err));
};
(...)
```

특정 정보만 선택적으로 가져오기
* select와 populate에 인자로 가져올 정보와 제외할 정보를 작성한다
```js
(...)
exports.getProducts = (req, res, next) => {
  Product.find()
    .select('title price -id')
    .populate('userId', 'name')
    .then(products => {
      res.render('admin/products', {
        prods: products,
        pageTitle: 'Admin Products',
        path: '/admin/products'
      });
    })
    .catch(err => console.log(err));
};
(...)
```
* title과 price만 Product에서 가져오고 _id는 제외한다(-를 이용하면 제외할 데이터를 선택할 수 있다)
* userId를 통해 가져오는 User 데이터에서는 name만 가져온다

---

### lecture 217. Working on the Shopping Cart

앞서 작성했던 카트에 상품추가로직 재활용하기
* 몽구스에는 Schema.methods.메소드명 방식으로 커스텀 메서드를 작성할 수 있다

```js
// models/product.js
(...)
userSchema.methods.addToCart = function(product) {
  const cartProductIndex = this.cart.items.findIndex(cp => {
    return cp.productId.toString() === product._id.toString();
  });
  let newQuantity = 1;
  const updatedCartItems = [...this.cart.items];

  if (cartProductIndex >= 0) {
    newQuantity = this.cart.items[cartProductIndex].quantity + 1;
    updatedCartItems[cartProductIndex].quantity = newQuantity;
  } else {
    updatedCartItems.push({ 
      productId: product._id, 
      quantity: newQuantity
    });
  }

  const updatedCart = { 
    items: updatedCartItems 
  };
  this.cart = updatedCart;
  return this.save();
};
(...)
```
* ObjectId를 적용했던 코드들은 몽구스에서 알아서 처리하므로 삭제했다

---

### lecture 218. Loading the Cart

카트를 불러오기 위한 컨트롤러 작성하기
```js
// controllers/shop.js
(...)
exports.getCart = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      console.log(user.cart.items);
      const products = user.cart.items;
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products: products
      });
    })
    .catch(err => console.log(err));
};
(...)
```
* populate로 user의 카트에 있는 상품들을 가져온다
* execPopulate는 populate가 프로미스를 리턴하도록 만들어 대너블체인을 사용할 수 있게한다

데이터 구조에 맞게 뷰 코드 수정하기
```html
<!-- views/shop/cart.ejs -->
<%- include('../includes/head.ejs') %>
    <link rel="stylesheet" href="/css/cart.css">
    </head>

    <body>
        <%- include('../includes/navigation.ejs') %>
        <main>
            <% if (products.length > 0) { %>
                <ul class="cart__item-list">
                    <% products.forEach(p => { %>
                        <li class="cart__item">
                            <h1><%= p.productId.title %></h1>
                            <h2>Quantity: <%= p.quantity %></h2>
                            <form action="/cart-delete-item" method="POST">
                                <input type="hidden" value="<%= p.productId._id %>" name="productId">
                                <button class="btn danger" type="submit">Delete</button>
                            </form>
                        </li>
                    <% }) %>
                </ul>
                <hr>
                <div class="centered">
                    <form action="/create-order" method="POST">
                        <button type="submit" class="btn">Order Now!</button>
                    </form>
                </div>
                
            <% } else { %>
                <h1>No Products in Cart!</h1>
            <% } %>
        </main>
        <%- include('../includes/end.ejs') %>
```

---

### lecture 219. Deleting Cart Items

카트에서 상품 삭제하기
* 커스텀 메서드를 만들어 처리한다

```js
// models/user.js
(...)
userSchema.methods.removeFromCart = function(prodId) {
  const updatedCartItems = this.cart.items.filter(i => {
    return i.productId.toString() !== prodId.toString();
  });
  this.cart.items = updatedCartItems;
  return this.save();
};
(...)
```

```js
// controllers/shop.js
(...)
exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .removeFromCart(prodId)
    .then(result => {
      res.redirect('/cart');
    })
    .catch(err => console.log(err));
};
(...)
```

---

### lecture 220. Creating All Order Related Data

카트에 있는 상품을 주문하기
* Order 컬렉션의 스키마를 먼저 정의한다
* 유저의 카트에 있는 상품들을 불러와 Order 스키마에 맞춰 저장한다
* 카트를 비운다

```js
// models/order.js
const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const orderSchema = new Schema({
  products: [{
    productData: { type: Object, required: true},
    quantity: { type: Number, required: true}
  }],
  user: {
    name: {
      type: String,
      required: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User'
    }
  }
});

module.exports = mongoose.model('Order', orderSchema);
```

```js
// controllers/shop.js
(...)
exports.postOrder = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items.map(i => {
        return { productData: { ...i.productId._doc }, quantity: i.quantity };
      });
      const order = new Order({
        products: products,
        user: {
          name: req.user.name,
          userId: req.user
        }
      });
      return order.save();
    })
    .then(result => {
      res.redirect('/orders');
    })
    .catch(err => console.log(err));
};
(...)
```
* _doc을 사용하면 여러 메타데이터를 제외한 실제 데이터들에 접근할 수 있다

카트 비우기 로직 추가
```js
// models/user.js
(...)
userSchema.methods.clearCart = function() {
  this.cart = {items: []};
  return this.save();
};
(...)
```

```js
// controllers/shop.js
(...)
exports.postOrder = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items.map(i => {
        return { productData: { ...i.productId._doc }, quantity: i.quantity };
      });
      const order = new Order({
        products: products,
        user: {
          name: req.user.name,
          userId: req.user
        }
      });
      return order.save();
    })
    .then(_ => {
      return req.user.clearCart();
    })
    .then(_ => {
      res.redirect('/orders');
    })
    .catch(err => console.log(err));
};
(...)
```

---

### lecture 223. Getting & Displaying the Orders

주문 목록을 가져오는 코드 작성하기
```js
// controllers/shop.js
exports.getOrders = (req, res, next) => {
  Order.find({'user.userId': req.user._id})
    .then(orders => {
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders
      });
    })
    .catch(err => console.log(err));
};
```

데이터 구조에 맞게 마크업 수정하기
```html
<!-- /views/shop/orders.ejs -->
<%- include('../includes/head.ejs') %>
    <link rel="stylesheet" href="/css/orders.css">
    </head>

    <body>
        <%- include('../includes/navigation.ejs') %>
        <main>
            <% if (orders.length <= 0) { %>
                <h1>Nothing there!</h1>
            <% } else { %>
                <ul class="orders">
                    <% orders.forEach(order => { %>
                        <li class="orders__item">
                            <h1>Order - # <%= order._id %></h1>
                            <ul class="orders__products">
                                <% order.products.forEach(product => { %>
                                    <li class="orders__products-item"><%= product.productData.title %> (<%= product.quantity %>)</li>
                                <% }); %>
                            </ul>
                        </li>
                    <% }); %>
                </ul>
            <% } %>
        </main>
        <%- include('../includes/end.ejs') %>
```

---

