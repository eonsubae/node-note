# Section 12. Working with NoSQL & Using MongoDB

### lecture 173. What is MongoDB?

MongoDB 어원
* humongous
  - huge and monstrous
  - 엄청난 정도의 의미로 해석할 수 있다
* 데이터베이스 이름이 이 단어에서 기원한 이유는 MongoDB가 매우 많은 데이터를 저장할 수 있기 때문이다
* MongoDB는 매우 큰 애플리케이션을 위해 설계된 데이터베이스다

작동원리
* Shop 이라는 데이터베이스가 있다고 가정하자
* 앞서 SQL에서 Users와 Orders 테이블이 있었다면 NoSQL에서는 이를 컬렉션이라 부른다
* 그리고 각 컬렉션들로부터 생성된 데이터는 레코드(record)가 아닌 다큐먼트(document)라 부른다
* 다큐먼트들은 각각 다른 형태를 가질 수 있다
  - MongoDB는 schemeless하다
  - 때문에 데이터를 유연하게 다룰 수 있다
  - JSON 형태로 데이터를 표시한다(binary json)

---

### lecture 174. Relations in NoSQL

NoSQL에서 관계를 다루는 방법
* ![nosql_relation](../img/nosql-relations.png)
* 위 사진처럼 데이터 간의 관계를 맺을 때 데이터를 중복 저장하는 방식을 NoSQL에서는 더 자주 사용한다
  
NoSQL에서 관계를 다루는 방법2
* ![nosql_relation](../img/nosql-relations2.png)
* 앞서 본 방법은 데이터를 자주 변경하는 경우 중복된 데이터 모두를 변경해야 하므로 비효율적이다
* 따라서 참조를 이용한 방법 역시 NoSQL에서도 사용가능하다

---

### lecture 175. Setting Up MongoDB

MongoDB 사이트에 접속해서 Cloud버전 다운로드
* https://www.mongodb.com/download-center/cloud로 접속하면 받을 수 있다
* 실제 개발환경에 더 적합한 버전이기 때문에 Atlas(Cloud버전)를 사용할 것이다
* 프리티어로 새 클러스터를 생성하고 보안탭에서 새 유저도 생성하자
  - 읽기, 쓰기에 관련된 권한을 부여하자
  - 자세한 설명은 생략. 필요하면 영상을 다시 볼 것

---

### lecture 176. Installing the MongoDB Server

MongoDB를 Node와 연동하기
* MongoDB 드라이버 패키지 설치하기
```terminal
$ npm i --save mongodb
```
* mongodb와 연결하기 위해 필요한 드라이버다

mongodb패키지를 이용해 MongoDB서버와 Node앱 연결하기
```js
// util/database.js
const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;

const mongoConnect = (callback) => {
  MongoClient.connect('mongodb+srv://eonsu-1:SJE6LQ5Ym2Si97l9@cluster0-iqzdk.mongodb.net/test?retryWrites=true', { useNewUrlParser: true })
    .then(client => {
      console.log('Connected!');
      callback(client);
    })
    .catch(err => console.log(err));
};

module.exports = mongoConnect;
```

```js
// app.js
const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');

const errorController = require('./controllers/error');
const mongoConnect = require('./util/database');

const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');

// const adminRoutes = require('./routes/admin');
// const shopRoutes = require('./routes/shop');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  // User.findById(1)
  //   .then(user => {
  //     req.user = user;
  //     next();
  //   })
  //   .catch(err => console.log(err));
});

// app.use('/admin', adminRoutes);
// app.use(shopRoutes);

app.use(errorController.get404);

mongoConnect(client => {
  console.log(client);
  app.listen(3000);
})
```
* 앞서 작성했던 SQL로직 때문에 에러가 발생하는 부분들을 주석처리하거나 삭제했다

---

### lecture 177. Creating the Database Connection

admin 부분부터 차례대로 수정해나간다
* 먼저 app.js파일에서 admin 관련 부분 주석을 제거하자
```js
// app.js
(...)
const adminRoutes = require('./routes/admin');
(...)
app.use('/admin', adminRoutes);
(...)
```

admin 컨트롤러와 연관된 Product 모델 수정하기
```js
// models/product.js
const mongoConnect = require('../util/database');

class Product {
  constructor(title, price, description, imageUrl) {
    this.title = title;
    this.price = price;
    this.description = description;
    this.imageUrl = imageUrl;
  }

  save() {

  }
}

module.exports = Product;

```
* save 메서드를 통해 mongodb클라이언트와 연결할 것이다
* 그런데 현재 작성된 util/database.js 파일의 연결방식은 매번 연결을 시도하는 방식이므로 비효율적이다
* 연결은 한번만 하고 여러 곳에서 접근할 수 있도록 다음 강의에서 세팅을 변경할 것이다

---

### lecture 178. Finishing the Database Connection

```js
// util/database.js
const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;

let _db;

const mongoConnect = (callback) => {
  MongoClient.connect('mongodb+srv://eonsu-1:SJE6LQ5Ym2Si97l9@cluster0-iqzdk.mongodb.net/shop?retryWrites=true', { useNewUrlParser: true })
    .then(client => {
      console.log('Connected!');
      _db = client.db();
      callback();
    })
    .catch(err => {
      console.log(err)
      throw err; 
    });
};

const getDb = () => {
  if (_db) {
    return _db;
  }
  throw 'No database found!';
};

exports.mongoConnect = mongoConnect;
exports.getDb = getDb;
```
* connect호출시 인자로 넘어간 포트 이후의 경로(지금은 shop)이 기본 데이터베이스가 된다
* client.db()의 인자로 다른 값을 넘기면 다른 데이터베이스를 사용할 수 있다
* SQL과 다르게 NoSQL은 데이터베이스나 테이블을 먼저 생성할 필요가 없다
* 첫번째 접근시 자동으로 생성된다
  - shop에 접근시 shop 데이터베이스가 없다면 mongodb가 알아서 생성한다
* mongoConnect로 최초연결을 하고 getDb로는 개별 데이터베이스에 접근할 때 사용한다
  - 이제 서버와 연결하는 코드와 개별 데이터베이스 접근하는 코드가 분리됐다

서버연결코드와 데이터베이스 접근코드 적용
```js
// app.js
(...)
mongoConnect(_ => {
  app.listen(3000);
})

// models/product.js
const getDb = require('../util/database').getDb;
(...)
```

---

### lecture 179. Using the Database Connection

product 콜렉션 생성하기
```js
// models/product.js
const getDb = require('../util/database').getDb;

class Product {
  constructor(title, price, description, imageUrl) {
    this.title = title;
    this.price = price;
    this.description = description;
    this.imageUrl = imageUrl;
  }

  save() {
    const db = getDb();
    db.collection('products').define(this)
      .then(result => {
        console.log(result);
      })
      .catch(err => console.log(err));
  }
}

module.exports = Product;
```
* 데이터베이스와 마찬가지로 컬렉션도 없다면 알아서 생성해준다

admin라우터와 컨트롤러 수정하기
```js
// routes/admin.js
const path = require('path');

const express = require('express');

const adminController = require('../controllers/admin');

const router = express.Router();

// /admin/add-product => GET
router.get('/add-product', adminController.getAddProduct);

// /admin/products => GET
// router.get('/products', adminController.getProducts);

// /admin/add-product => POST
router.post('/add-product', adminController.postAddProduct);

// router.get('/edit-product/:productId', adminController.getEditProduct);

// router.post('/edit-product', adminController.postEditProduct);

// router.post('/delete-product', adminController.postDeleteProduct);

module.exports = router;

// controllers/admin.js
// exports.getEditProduct = (req, res, next) => {
//   const editMode = req.query.edit;
//   if (!editMode) {
//     return res.redirect('/');
//   }
//   const prodId = req.params.productId;
//   req.user
//     .getProducts({ where: { id: prodId } })
//     // Product.findById(prodId)
//     .then(products => {
//       const product = products[0];
//       if (!product) {
//         return res.redirect('/');
//       }
//       res.render('admin/edit-product', {
//         pageTitle: 'Edit Product',
//         path: '/admin/edit-product',
//         editing: editMode,
//         product: product
//       });
//     })
//     .catch(err => console.log(err));
// };
```
* 일단 getAddProduct와 postAddProduct를 제외하고 주석처리한다
* 차후 하나씩 mongodb관련 코드로 작성해나갈 것이다

```js
// app.js
(...)
app.use((req, res, next) => {
  // User.findById(1)
  //   .then(user => {
  //     req.user = user;
  //     next();
  //   })
  //   .catch(err => console.log(err));
  next();
});
(...)
```

---

### lecture 180. Creating Products

product 모델의 save가 프로미스를 리턴하도록 수정
```js
// models/product.js
(...)
save() {
    const db = getDb();
    return db.collection('products')
      .insertOne(this)
      .then(result => {
        console.log(result);
      })
      .catch(err => console.log(err));
  }
(...)
```

상품을 추가하는 컨트롤러 작성
```js
// controllers/admin.js
(...)
exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const imageUrl = req.body.imageUrl;
  const price = req.body.price;
  const description = req.body.description;
  const product = new Product(title, price, description, imageUrl);

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
* 상품을 추가해보면 product.save()메서드에서 상품 정보를 출력해준다
* 상품 정보 중 _id가 자동으로 생성된 것이 보인다
```js
(...)
 [ Product {
       title: 'A Book',
       price: '25',
       description: 'qqtwqt',
       imageUrl:
        'http://static.lulu.com/cmsmedia/create-page/create_page_images_book.jpg',
       _id: 5ccb74701d1fcc33a8c95c82 } ]
(...)
```
* mongodb는 다큐먼트가 생성될때 _id값을 자동으로 추가해준다

---

### lecture 181. Understanding the MongoDB Compass

앞서 추가한 데이터를 MongoDB Compass로 확인하기
* https://www.mongodb.com/products/compass 
* compass는 mongodb를 위한 gui 툴이다
* 위 링크에 접속해서 compass를 다운받아 실행하자
* Atlas에 접속해 로그인 한 후 connect를 누르고 compass와 연동하자
  - compass버전을 선택하고 아래 나오는 코드를 복사하기
  - 코드를 복사하고 창을 다시 키면 복사한 코드를 compass가 감지해서 폼을 채워준다 
  - connect를 누르면 데이터베이스 목록을 보여준다
  - 데이터베이스에 접속하면 해당 데이터베이스가 가진 컬렉션들을 보여준다

product 모델의 모든 다큐먼트들을 가져오는 정적 메서드 작성하기
```js
// models/product.js
(...)
static fetchAll() {
    // return db.collection('products').find(/*{key : value }*/); // using cursor
    return db.collection('products').find().toArray(); // fetch all data at once
  }
(...)
```
* find을 통해 다큐먼트들을 가져올 때 한 번에 데이터 전체를 가져오지 않는다
* mongodb는 커서를 이용해 일부 다큐먼트만 가져오게 하고 필요시마다 순차적으로 다음 데이터를 제공한다
* 모든 다큐먼트들을 한 번에 받고 싶다면 메서드 체이닝으로 toArray를 호출하면 된다
* 페이지네이션을 구현할 때는 toArray를 사용하는 것이 좋다(이후에 구현할 것이다)

fetchAll 최종 구현
```js
(...)
static fetchAll() {
    const db = getDb();
    return db
      .collection('products')
      .find()
      .toArray()
      .then(products => {
        console.log(products);
        return products;
      })
      .catch(err => console.log(err));
  }
(...)
```

shop.js 컨트롤러에 있는 findAll을 fetchAll로 변경하기
```js
// controllers/shop.js
(...)
exports.getProducts = (req, res, next) => {
  Product.fetchAll()
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
```
* 아래 있는 findAll코드들도 전부 변경해주자

app.js에 주석처리했던 shop라우터를 활성화하기
```js
// app.js
(...)
const shopRoutes = require('./routes/shop');
(...)
app.use(shopRoutes);
```
* /와 /products 경로로 접속해보면 잘 작동할 것이다

---

### lecture 183. Fetching a Single Product

개별 상품 정보를 볼 수 있는 detail 페이지를 활성화하기
```js
// models/product.js
const mongodb = require('mongodb');
(...)
static findById(id) {
    const db = getDb();
    return db.collection('products')
      .find({_id: new mongodb.ObjectId(id)})
      .next()
      .then(product => {
        console.log(product);
        return product;
      })
      .catch(err => console.log(err));
  }
```
* mongodb는 id를 저장할 때 binary json이라는 오브젝트 타입으로 저장하므로 그냥 값을 넘겨주면 안된다

컨트롤러 수정
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

view 페이지들에서 product.id로 참조하던 것들을 _id로 수정
* views/shop/index.ejs와 views/shop/product-list.ejs를 수정하자

---

### lecture 184 Making the "Edit" & "Delete" Buttons Work Again

admin 페이지에서 수정과 삭제 버튼을 다시 활성화시키기
* 먼저 admin 페이지에 상품들을 리스팅하는 작업부터 완료하자
* routes/admin.js에서 getProducts를 주석처리한 것을 복구하자
* views/admin/product.ejs에서 product.id를 product._id로 수정

```js
// controllers/admin.js
(...)
exports.getProducts = (req, res, next) => {
  Product.fetchAll()
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

---

### lecture 185. Working on the Product Model to Edit our Product

다큐먼트 수정하기
```js
// models/product.js
class Product {
  constructor(title, price, description, imageUrl, id) {
    this.title = title;
    this.price = price;
    this.description = description;
    this.imageUrl = imageUrl;
    this._id = id;
  }
  save() {
      const db = getDb();
      let dbOp;
      if (this._id) {
        // Update the product
        dbOp = db
          .collection('products')
          .updateOne({_id: new mongodb.ObjectId(this._id)}, {$set: this});
      } else {
        dbOp = db.collection('products').insertOne(this);
      }
        return dbOp
          .then(result => {
            console.log(result);
          })
          .catch(err => console.log(err));
    }
(...)
```
* _id 필드를 추가해서 save 호출시 새로 저장인지 수정인지를 분기시킨다
* 한 개의 다큐먼트를 수정할 때는 updateOne을 사용한다(다수는 updateMany)
* 첫번째 인자로 업데이트할 대상을 찾고, 두번째 인자에 변경할 값을 지정한다
  - {$set: this}는 {%set: {title: this.title, price: this.price, ...}}와 같다

---

### lecture 186. Finishing the "Update Product" Code

컨트롤러에서 업데이트 로직 완성하기
```js
// controllers/admin.js
const mongodb = require('mongodb');
(...)
const ObjectId = mongodb.ObjectId;
(...)
exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const updatedImageUrl = req.body.imageUrl;
  const updatedDesc = req.body.description;
  
  const product = new Product(
    updatedTitle, 
    updatedPrice, 
    updatedDesc, 
    updatedImageUrl, 
    new ObjectId(prodId)
  );
  product.save()
    .then(result => {
      console.log('UPDATED PRODUCT!');
      res.redirect('/admin/products');
    })
    .catch(err => console.log(err));
};
```

---

### lecture 187. One Note About Updating Products

컨트롤러에서 ObjectId로 변환하던 로직을 모델로 옮기기
```js
// controllers/admin.js
(...)
exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const updatedImageUrl = req.body.imageUrl;
  const updatedDesc = req.body.description;
  
  const product = new Product(
    updatedTitle, 
    updatedPrice, 
    updatedDesc, 
    updatedImageUrl, 
    prodId
  );
  product.save()
    .then(result => {
      console.log('UPDATED PRODUCT!');
      res.redirect('/admin/products');
    })
    .catch(err => console.log(err));
};
(...)

// models/product.js
class Product {
  constructor(title, price, description, imageUrl, id) {
    this.title = title;
    this.price = price;
    this.description = description;
    this.imageUrl = imageUrl;
    this._id = new mongodb.ObjectId(id);
  }

  save() {
    const db = getDb();
    let dbOp;
    if (this._id) {
      // Update the product
      dbOp = db
        .collection('products')
        .updateOne({_id: this._id}, {$set: this});
(...)
```
* 생성자에서 ObjectId로 변환하도록 변경했다
* 컨트롤러와 Product의 save메서드의 updateOne에서의 중복이 제거됐다

---

### lecture 188. Deleting Products

상품을 삭제하는 로직 작성
```js
// models/product.js
(...)
static deleteById(id) {
    const db = getDb();
    return db.collection('products')
      .deleteOne({_id: new mongodb.ObjectId(id)})
      .then(_ => console.log('Deleted!'))
      .catch(err => console.log(err));
  }
(...)

// controllers/admins.js
(...)
exports.postDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  Product.deleteById(prodId)
    .then(_ => {
      res.redirect('/admin/products');
    })
    .catch(err => console.log(err));
};
```
* 다큐먼트 하나는 deleteOne, 여러 개는 deleteMany로 삭제할 수 있다

---

### lecture 189. Fixing the "Add Product" Functionality

Product의 생성자를 변경한 것 때문에 상품을 추가하는 로직이 작동하지 않는 것 수정하기
```js
// models/product.js
class Product {
  constructor(title, price, description, imageUrl, id) {
    this.title = title;
    this.price = price;
    this.description = description;
    this.imageUrl = imageUrl;
    this._id = id ? new mongodb.ObjectId(id) : null;
  }
(...)
```
* 객체 생성시 삼항식으로 id가 있는 경우만 _id필드를 ObjectId로 지정하도록 수정했다

---

### lecture 190. Creating New Users

시퀄라이즈로 작성된 User모델을 mongodb코드로 수정하기
```js
// models/User.js
const mongodb = require('mongodb');

const getDb = require('../util/database').getDb;
const ObjectId = mongodb.ObjectId;

class User {
  constructor(username, email) {
    this.name = username;
    this.email = email;
  }

  save() {
    const db = getDb();
    return db.collection('users').insertOne(this);
     
  }

  static findById(userId) {
    const db = getDb();
    return db.collection('users').findOne({ _id: new ObjectId(userId) });
  }
}

module.exports = User;
```

app.js에서 주석처리한 미들웨어 작동시키기
```js
// app.js
(...)
app.use((req, res, next) => {
  User.findById("5ccb9138872a202530466714")
    .then(user => {
      req.user = user;
      next();
    })
    .catch(err => console.log(err));
});
(...)
```
* 컴파스에서 users 컬렉션을 만들고 name과 email 형식으로된 다큐먼트를 하나 생성하자
* 자동으로 생성된 _id를 findById의 인자로 넘겨준다

---

### lecture 191. Storing the User in Our Database

Product에 User 정보 저장하기
* User 정보 중에 잘 변경되지 않는 정보를 Product에 저장하는 것이 좋다
  - ex. username, id
```js
// models/product.js
(...)
class Product {
  constructor(title, price, description, imageUrl, id, userId) {
    this.title = title;
    this.price = price;
    this.description = description;
    this.imageUrl = imageUrl;
    this._id = id ? new mongodb.ObjectId(id) : null;
    this.userId = userId;
  }
(...)
```

Product 추가시 userId를 넘겨주도록 컨트롤러 수정하기
```js
// controllers/admin.js
(...)
exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const imageUrl = req.body.imageUrl;
  const price = req.body.price;
  const description = req.body.description;
  const product = new Product(
    title, 
    price, 
    description, 
    imageUrl, 
    null, 
    req.user._id
  );

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

---

### lecture 192. Working on Cart Items & Orders

Cart 모델
* User는 Cart 하나를 가진다
* Cart는 여러 Product들을 가진다
* mongodb는 이런 관계를 표현할 때 embedded documents를 사용할 수 있다
* Cart와 CartItem 모델을 삭제하고 User 내부의 다큐먼트화 할 것이다

```js
// models/user.js
(...)
class User {
  constructor(username, email, cart, id) {
    this.name = username;
    this.email = email;
    this.cart = cart; // {items: []}
    this._id = id;
  }
(...)
  addToCart(product) {
      // const cartProduct = this.cart.items.findIndex(cp => {
      //   return cp._id === product._id;
      // });
      const updatedCart = { items: [{...product, quantity: 1}] };
      const db = getDb();
      return db.collection('users').updateOne(
        { _id: new ObjectId(this._id) },
        { $set: {cart: updatedCart} }
      );
  
    }
(...)
```
* cart 필드를 추가했다
* cart는 { items : [] } 형태로 되어있다
* 새로 추가되는 상품인지 기존에 추가된 상품의 양을 늘리는 것인지를 처리하는 로직은 이후에 처리한다

---

### lecture 193. Adding the "Add to Cart" Functionality

Add to Cart 버튼이 동작하도록 컨트롤러 수정하기
```js
// controllers/shop.js
(...)
exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then(product => {
      return req.user.addToCart(product);
    })
    .then(result => {
      console.log(result);
    })
    .catch(err => console.log(err));
}
(...)
```

add-to-cart.ejs에서 id를 _id로 수정하기
```html
<form action="/cart" method="post">
    <button class="btn" type="submit">Add to Cart</button>
    <input type="hidden" name="productId" value="<%= product._id %>">
</form>
```

User 모델의 addToCart에서 product의 모든 상품 정보를 기입하지 않고 id만 저장하기
```js
// models/user.js
(...)
addToCart(product) {
    // const cartProduct = this.cart.items.findIndex(cp => {
    //   return cp._id === product._id;
    // });
    const updatedCart = { items: [{ productId: new ObjectId(product._id), quantity: 1}] };
    const db = getDb();
    return db.collection('users').updateOne(
      { _id: new ObjectId(this._id) },
      { $set: {cart: updatedCart} }
    );
  }
(...)
```

---

### lecture 194. Storing Multiple Products in the Cart

지금까지 작성한 addToCart의 문제점
* 정상적으로 데이터가 추가되긴 하지만 덮어쓰는 형식으로만 작동하고 있다
* 기존에 있는 데이터인 경우 quantity만 추가되도록 로직을 분기해야 한다

```js
// models/user.js
(...)
addToCart(product) {
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
        productId: new ObjectId(product._id), 
        quantity: newQuantity
      });
    }

    const updatedCart = { 
      items: updatedCartItems 
    };
    const db = getDb();
    return db.collection('users').updateOne(
      { _id: new ObjectId(this._id) },
      { $set: {cart: updatedCart} }
    );

  }
(...)
```

---

### lecture 195. Displaying the Cart Items

User모델에서 getCart메서드 작성하기
```js
// models/user.js
(...)
getCart() {
    const db = getDb();
    const productIds = this.cart.items.map(i => i.productId);
    return db
      .collection('products')
      .find({_id: {$in: productIds}})
      .toArray()
      .then(products => {
        return products.map(p => {
          return {...p, quantity: this.cart.items.find(i => {
            return i.productId.toString() === p._id.toString();
            }).quantity 
          };
        });
      });
  }
(...)
```
* $in을 사용하면 배열로 넘어간 다수의 요소에 맞는 다큐먼트들을 찾아준다

getCart로 받아온 product 다큐먼트들을 렌더링하기
```js
// controllers/shop.js
(...)
exports.getCart = (req, res, next) => {
  req.user
    .getCart()
    .then(products => {
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

cart 뷰페이지를 변경된 컨트롤러에 맞게 수정하기
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
                            <h1><%= p.title %></h1>
                            <h2>Quantity: <%= p.quantity %></h2>
                            <form action="/cart-delete-item" method="POST">
                                <input type="hidden" value="<%= p._id %>" name="productId">
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
* p.cartItem.quantity를 p.quantity로 변경했다
* id를 _id로 변경했다

---

### lecture 196. Fixing a Bug

Add to Cart 버튼을 눌렀을 때 카트에 추가는 되지만 Cart페이지로 리다이렉트되지 않는 버그수정
```js
// controllers/shop.js
(...)
exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then(product => {
      return req.user.addToCart(product);
    })
    .then(result => {
      console.log(result);
      res.redirect('/cart');
    })
    .catch(err => console.log(err));
}
(...)
```

---

### lecture 197. Deleting Cart Items

User모델에 삭제 메서드 추가
```js
// models/user.js
(...)
deleteItemFromCart(prodId) {
    const updatedCartItems = this.cart.items.filter(i => {
      return i.productId.toString() !== prodId.toString();
    });

    const db = getDb();
    return db
      .collection('users')
      .updateOne(
        {_id: new ObjectId(this._id)}, 
        {$set: 
          {cart: 
            {items: updatedCartItems}
          }
        }
      );
  }
(...)
```

컨트롤러에서 삭제 후 리다이렉트 설정
```js
// controllers/shop.js
(...)
exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .deleteItemFromCart(prodId)
    .then(_ => {
      res.redirect('/cart');
    })
    .catch(err => console.log(err));
};
(...)
```

---

### lecture 198. Adding an Order

Order 기능만 구현하면 SQL을 이용해서 쇼핑몰을 구현했을 때 작동했던 모든 기능이 똑같이 동작한다
* controller/shop.js의 postOrder부터 작동하도록 수정해보자

```js
// controller/shop.js
exports.postOrder = (req, res, next) => {
  req.user
    .addOrder()
    .then(result => {
      res.redirect('/orders');
    })
    .catch(err => console.log(err));
};
```
* user 모델에 addOrder라는 메서드를 만들어 cart에 담긴 상품들을 주문하는 로직을 작성할 것이다

```js
// models/user.js
(...)
addOrder() {
    const db = getDb();
    return db
      .collection('orders')
      .insertOne(this.cart)
      .then(result => {
        this.cart = { items: [] };
        return db
          .collection('users')
          .updateOne(
            { _id: new ObjectId(this._id) },
            { $set: { cart : { items : [] } } }
          )
      })
  }
(...)
```
* orders 컬렉션에 현재 카트의 items 프로퍼티들을 추가한다
* 그런 다음 users 컬렉션에 현재 유저의 cart를 빈배열을 가진 items프로퍼티로 수정한다
* 저장한 뒤 카트에서 order now 버튼을 누르고 compass에서 확인해보자
  - orders 컬렉션에 카트에 담겨있던 items가 잘 추가되었다
  - 그런데 /orders 경로로 리다이렉트되는 로직은 실행되지 않는다(404)
  - getOrder는 다음 강의에서 완성한다

---

### lecture 199. Adding Relational Order Data

앞서 작성한 User 모델의 addOrder 메서드에 있는 문제점
* orders 컬렉션에 카트에 담겨있던 상품들은 잘 전달하고 있다
* 그러나 어떤 유저가 주문한 것인지에 대한 정보를 누락하고 있는 문제가 있다
* 이를 먼저 수정하자

```js
// models/user.js
(...)
addOrder() {
    const db = getDb();
    return this.getCart()
      .then(products => {
        const order = {
          items : products,
          user : {
            id : new ObjectId(this._id),
            name : this.name
          }
        }
        return db.collection('orders').insertOne(order);
      })
      .then(result => {
        this.cart = { items: [] };
        return db
          .collection('users')
          .updateOne(
            { _id: new ObjectId(this._id) },
            { $set: { cart : { items : [] } } }
          )
      });
  }
(...)
```

---

### lecture 200. Getting Orders

orders 탭을 활성화하기
* shop 컨트롤러의 getOrders가 동작하도록 코드를 작성하자
* 먼저 User 클래스에 getOrders 메서드를 만들어 user의 orders컬렉션에 있는 다큐먼트들을 가져온다
* 가져온 다큐먼트들을 렌더링하기 위해 orders.ejs를 수정한다

```js
// models/user.js
(...)
getOrders() {
    const db = getDb();
    return db.collection('orders').find({ 'user._id' : new ObjectId(this._id) }).toArray();
  }
(...)
```

```js
// controllers/shop.js
(...)
exports.getOrders = (req, res, next) => {
  req.user
    .getOrders()
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

```html
<!-- views/shop/orders.ejs -->
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
                                <% order.items.forEach(product => { %>
                                    <li class="orders__products-item"><%= product.title %> (<%= product.quantity %>)</li>
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