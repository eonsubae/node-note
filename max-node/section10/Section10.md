# Section 10. SQL Introduction

### lecture 132. Choosing a Database

데이터를 저장하고 쉽게 접근하는 것이 목적일 때
* 데이터베이스를 사용하는 것이 가장 적합하다
* 이전 섹션처럼 파일을 사용하는 것은 성능 저하가 심하다
* 데이터베이스를 사용하면 작은 정보를 얻기 위해 전체 파일을 읽어오지 않아도 된다

데이터베이스 선택
* 데이터베이스는 크게 SQL과 NoSQL로 나뉜다

SQL
* SQL 데이터베이스는 테이블들의 조합으로 불린다
  - Users, Products, Orders etc...
* 각각의 테이블은 필드 혹은 컬럼을 가진다
  - Users(id, email, name), Products(id, title, price, description)
* SQL은 서로 다른 테이블을 연관짓는 것을 가능하게 해준다
  - Orders(id, user_id, product_id)

SQL 데이터베이스의 특징
* 데이터 스키마 정의가 중요하다
  - 각 테이블은 명확하게 데이터가 어떻게 정의되고 어떤 타입으로 각 필드가 지정되어야 하는지를 정해야한다
  - 강력한 스키마에 의해 테이블 안의 모든 데이터는 제한을 받는다
* 데이터 관계
  - 테이블과 다른 테이블 간의 관계를 이용해 데이터를 다룬다
  - one to one, one to many, many to many
* 쿼리문
```sql
SELECT * FROM users WHERE age > 28
```
* SELECT, FROM, WHERE은 SQL 키워드(문법)에 해당된다
* *, users, age > 28은 파라미터(데이터)에 해당된다
* 이렇게 SQL 문법과 파라미터(데이터)에 의해 SQL은 작동한다

---

### lecture 133. NoSQL Introduction

NoSQL의 특징
* SQL과 마찬가지로 데이터를 저장하는 데이터베이스를 가진다(ex. Shop)
* SQL에서는 Users, Orders 같은 테이블이 있다
* NoSQL에서는 SQL의 테이블을 Collection이라 부른다
* NoSQL에는 SQL 같은 고정된 스키마가 없다
* 대신 documents라고 부르는 자바스크립트 오브젝트와 유사한 데이터 구조가 있다
* 콜렉션 내부의 다수의 documents들은 서로 다른 구조를 가질 수 있다
  - ex. 첫 번째 유저 : { name: 'Max', age: 29 }
  - ex. 두 번째 유저 : { name: 'Manu' }
* NoSQL에서는 실제로 테이블 간의 관계는 존재하지 않는다
  - 대신 중복된 데이터를 사용한다
  - 따라서 한 컬렉션의 데이터가 바뀌면, 중복된 데이터를 저장한 다른 컬렉션의 데이터도 변경된다

간략하게 정리
1. NoSQL은 데이터 스키마가 없다
   - 특정 데이터 구조를 요구받지 않는다
2. NoSQL은 데이터 관계가 없다
   - documents들을 연관지을 수는 있지만 SQL의 join문 같은 복잡하고 긴 쿼리문을 요구하지 않는다

---

### lecture 134. Comparing SQL and NoSQL

수평 확장 vs 수직 확장
* 수평 확장은 추가로 서버의 갯수를 늘리는 것을 말한다
  - 필요시마다 서버를 구매해 서버들에 데이터를 분산시켜 저장하는 방법이다
  - 분산된 데이터를 효과적으로 병합하는 쿼리를 작성하는 작업이 어렵다
* 수직 확장은 현재 보유한 서버의 성능을 높이는 것을 말한다
  - 분산 저장, 병합을 위한 복잡한 작업 없이도 확장이 가능한 매우 쉬운 방법이다
  - 문제는 한 대의 서버를 무한정 업그레이드 할 수는 없다

SQL vs NoSQL
* SQL
  - 데이터는 스키마를 활용해 저장한다
  - 관계들이 중요하다
  - 데이터는 다수의 테이블에 분산되어 저장된다
  - 수평 확장이 매우 어렵거나 불가능하다. 수직 확장은 가능하다
  - 수 많은 데이터를 읽고 쓰는 쿼리를 작성하는 데 한계가 있다
* NoSQL
  - 스키마가 없다
  - 관계들이 없거나 매우 적다
  - 데이터를 일반적으로 컬렉션들에 중첩/병합시킨다
  - 수평과 수직 확장 모두 가능하다
  - 대량의 데이터를 저장하는 데 좋은 성능을 보인다
* 위 설명만 보면 SQL을 사용할 이유는 없어 보인다
  - 하지만 데이터베이스에 저장할 데이터의 종류에 따라 선택은 달라진다
  - 데이터 간의 관계가 매우 중요한 데이터를 저장할 때는 SQL이 더 적합하다
  - 또, 데이터가 자주 변경되지 않는 경우에도 SQL이 좋다

---

### lecture 136. Connecting our App to the SQL Database

mysql2 패키지 설치
```terminal
$ npm i --save mysql2
```

데이터베이스와 애플리케이션을 연결할 유틸 파일 작성하기
* util/database.js 파일을 생성하고 아래 코드를 입력한다
```js
const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    database: 'node-complete',
    password: 'your password'
});

module.exports = pool.promise();
```
* 데이터베이스 풀을 만들어서 연결하고 있다
* 쿼리문을 작성할 때마다 연결하는 비용을 줄이기 위해 미리 연결을 맺어두는 방식이다
* pool.promise()는 비동기적 작업을 처리할 때 콜백패턴이 아닌 프로미스를 사용하게 해준다

앱에 연결하기
```js
// app.js
(...)
const db = require('./util/database');
(...)

db.execute('SELECT * FROM products')
  .then(result => {
    console.log(result[0], result[1]);
  })
  .catch(err => {
    console.log(err);
  });
(...)
```
* db.execute()메서드를 사용해 쿼리문을 실행할 수 있다
* 위 쿼리문을 실행하려면 MySQL 워크벤치에서 products라는 테이블을 미리 만들어 놔야 한다
* 쿼리문의 결과는 배열 안에 두 개의 배열이 있는 형태로 반환된다
  - 첫 번째 중첩 배열에는 실제 데이터가 들어있고 두 번째 중첩 배열에는 메타 데이터가 들어 있다

---

### lecture 137. Basic SQL & Creating a Table

products 테이블 만들기
```sql
CREATE TABLE `node-complete`.`products` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `price` DOUBLE NOT NULL,
  `description` TEXT NOT NULL,
  `imageUrl` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `id_UNIQUE` (`id` ASC) VISIBLE);
```

---

### lecture 139. Fetching Products

파일로 저장했던 상품 데이터 코드를 데이터베이스를 사용하도록 변경하기
```js
// models/product.js
const db = require('../util/database');

const Cart = require('./cart');

module.exports = class Product {
  constructor(id, title, imageUrl, description, price) {
    this.id = id;
    this.title = title;
    this.imageUrl = imageUrl;
    this.description = description;
    this.price = price;
  }

  save() {
    
  }

  static deleteById(id) {
    
  }

  static fetchAll() {
    return db.execute('SELECT * FROM products');
  }

  static findById(id, cb) {
    
  }
};
```
* 조회 메서드(fetchAll)에서 products 테이블의 모든 데이터를 조회하는 쿼리문을 작성해서 반환했다
* 이렇게 반환된 메서드는 앞서 util/database.js에서 pool.promise()에 의해 프로미스로 작동한다

반환된 프로미스를 조작해 데이터 읽기
```js
// controllers/shop.js
exports.getProducts = (req, res, next) => {
  Product.fetchAll()
    .then(([rows, fieldData]) => {
      res.render('shop/product-list', {
        prods: rows,
        pageTitle: 'All Products',
        path: '/products'
      })
    })
    .catch(e => console.log(e));
};
(...)
exports.getIndex = (req, res, next) => {
  Product.fetchAll()
    .then(([rows, fieldData]) => {
      res.render('shop/index', {
        prods: rows,
        pageTitle: 'Shop',
        path: 'shop/index'
      });
    })
    .catch(e => console.log(e));
};
(...)
```
* 임의의 데이터를 테이블에 추가하고 Shop과 Products 네비게이션이 잘 작동하는지 확인해보자
 
---

### lecture 141. Inserting Data Into the Database

데이터베이스에 데이터를 추가하는 로직 작성하기
```js
// models/product.js
(...)
save() {
    return db.execute(
      'INSERT INTO products (title, price, imageUrl, description) VALUES(?, ?, ?, ?)',
      [this.title, this.price, this.imageUrl, this.description]
    );
}
(...)

// controllers/admin.js
(...)
exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const imageUrl = req.body.imageUrl;
  const price = req.body.price;
  const description = req.body.description;
  const product = new Product(null, title, imageUrl, description, price);
  product.save()
    .then(_ => res.redirect('/'))
    .catch(e => console.log(e));
};
(...)
```
* sql injection을 피하기 위해 value의 인자로 ?를 지정한다
* execute 메서드의 두 번째 인자로 ?에 들어갈 데이터를 순서대로 배열의 요소로 작성한다
* save를 리턴받고 대너블 체인에서 리다이렉트하도록 컨트롤러 로직을 변경해주고 있다
* 저장하고 Add Products에서 상품을 추가해보자

---

### lecture 142. Fetching a Single Product with the "where" Condition

where 절을 이용해 한 개의 상품을 조회하기
```js
// models/product.js
(...)
static findById(id) {
    return db.execute('SELECT * FROM products WHERE products.id = ?', [id]);
}
(...)

// controllers/shop.js
(...)
exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(([product]) => {
      res.render('shop/product-detail', {
        product: product[0],
        pageTitle: product[0].title,
        path: '/products'
      });
    })
    .catch(e => console.log);
};
(...)
```