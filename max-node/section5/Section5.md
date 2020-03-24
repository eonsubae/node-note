# Section5. Working with Express.js

앞서 작성한 코드들
* 비즈니스 로직과 관계없는 작업들(nitty-gritty work)을 지나치게 많이 작성해야 하는 문제가 있었다
* Express를 사용하면 라우팅이나 요청을 통해 들어오는 데이터 등을 쉽게 처리할 수 있다

---

### lecture 59. Adding Middleware

익스프레스 설치
* nodemon과 달리 express는 배포시에도 사용하므로 --save로 다운로드한다
```terminal
$ npm i --save express
```

익스프레스 사용을 위한 기본 코드
```js
const http = require('http');
const express = require('express');

const app = express();

const server = http.createServer(app);

server.listen(3000);
```
* http 서버를 생성해서 익스프레스 패키지 함수를 실행시킨 변수를 인자로 넘겨준다
  - 이 작업을 통해 이후 많은 기능들을 쉽게 작성할 수 있는 것을 알게될 것이다

미들웨어
* 익스프레스는 미들웨어라고 전부라고 해도 과언이 아닐 정도로 중요하다
* 미들웨어란?
  - 입력으로 들어오는 요청들이 자동적으로 통과하는 함수다발이라고 할 수 있다
  - 실제 서버는 요청을 받으면 응답을 하기까지 다양한 작업을 수행하는 함수들이 있을 것이다
  - 다양한 작업을 수행하는 함수들을 작성하는 과정에서 하나의 거대한 함수가 아닌 여러 블록으로 나뉜 코드들이 생길 것이다
  - 익스프레스는 이렇게 여러 기능함수들을 연결시켜주는 플러그인 같은 역할을 한다
* use
  - use 메서드를 사용하면 새로운 미들웨어 함수를 사용할 수 있다
  - use 메서드는 req, res, next 세 개의 인자를 가진다
  - req, res는 앞서 다뤘던 요청과 응답을 다루는 기능을 가지고 있다
  - next는 다음 미들웨어를 실행하도록 만드는 함수다
```js
const http = require('http');
const express = require('express');

const app = express();

app.use((req, res, next) => {
  console.log("In the middleware!");
});

app.use((req, res, next) => {
  console.log("In another middleware!");
});

const server = http.createServer(app);

server.listen(3000);
```
* 두 개의 미들웨어가 있지만 첫 번째 미들웨어에서 next함수를 실행시키지 않았기 때문에 In the middleware!만 출력된다
* 다음처럼 코드를 변경하면 다음 미들웨어까지 실행된다

```js
const http = require('http');
const express = require('express');

const app = express();

app.use((req, res, next) => {
  console.log("In the middleware!");
  next();
});

app.use((req, res, next) => {
  console.log("In another middleware!");
});

const server = http.createServer(app);

server.listen(3000);
```

---

### lecture 60. How Middleware Works

미들웨어의 특징
* next 함수를 호출하지 않으면 다음 미들웨어를 사용하지 않는다
* 자동적으로 응답해주지 않는다
* 앞서 express를 사용하기 전처럼 응답을 위해 setHeader나 write를 사용하지 않아도 send를 이용해 편리하게 처리할 수 있다
  - send는 어떤 형식의 메시지를 인자로 보내면 그에 맞게 응답을 보낸다

```js
const http = require('http');
const express = require('express');

const app = express();

app.use((req, res, next) => {
  console.log("In the middleware!");
  next();
});

app.use((req, res, next) => {
  console.log("In another middleware!");
  res.send('<h1>Hello Express.js</h1>');
});

const server = http.createServer(app);

server.listen(3000);
```
* 브라우저에서 접속해보면 html로 응답하는 것을 확인할 수 있다(문자열을 보내면 text/html형식을 헤더에 기본값으로 등록해줌)

---

### lecture 61. Express.js - Looking Behind the Scenes

github 페이지에서 소스 들여다보기
* 앞서 send 함수를 문자열을 인자로 호출하면 html 형식으로 응답하는 것을 확인했다
  - 어떻게 이런 일이 가능할까?
  - github 페이지에 가면 lib/response.js 파일에서 구현 코드를 확인할 수 있다

```js
res.send = function send(body) {
  var chunk = body;
  var encoding;
  var req = this.req;
  var type;

// (...)

  switch (typeof chunk) {
    // string defaulting to html
    case 'string':
      if (!this.get('Content-Type')) {
        this.type('html');
      }
      break;
    case 'boolean':
    case 'number':
    case 'object':
      if (chunk === null) {
        chunk = '';
      } else if (Buffer.isBuffer(chunk)) {
        if (!this.get('Content-Type')) {
          this.type('bin');
        }
      } else {
        return this.json(chunk);
      }
      break;
  }
```
* 스위치 문의 첫번째 케이스에서 왜 그렇게 동작했는지를 확인할 수 있다

app.listen 으로 코드를 간결하게 만들기
* 앞서 http 모듈을 이용해 서버를 익스프레스를 인자로 넘겨 생성하고 요청을 대기하는 코드를 작성했었다
  - 익스프레스의 listen 메서드를 사용하면 보다 코드를 간결하게 만들 수 있다

```js
// const http = require('http');
const express = require('express');

const app = express();
// const server = http.createServer(app);

app.use((req, res, next) => {
  console.log("In the middleware!");
  next();
});

app.use((req, res, next) => {
  console.log("In another middleware!");
  res.send('<h1>Hello Express.js</h1>');
});

// server.listen(3000);
app.listen(3000);
```
* 이렇게 간결해질 수 있는 이유를 실제 코드로 깃허브에서 확인해보자

```js
// lib/application.js

app.listen = function listen() {
  var server = http.createServer(this);
  return server.listen.apply(server, arguments);
};
```
* 앞서 직접 작성했던 작업을 묶어서 처리해주는 것을 확인할 수 있다

---

### lecture62. Handling Different Routes

익스프레스를 이용한 라우팅
* 앞서 use 메서드에 콜백 함수만을 넘겨서 처리했다
  - 그런데 use는 옵션으로 경로를 지정할 수도 있다
  - express docs에는 use의 사용방법을 다음처럼 설명하고 있다

```js
app.use([path,] callback [, callback...])

Mounts the specified middleware function or functions at the specified path: the middleware function is executed when the base of the requested path matches path.
```
* 첫번째 인자로 경로를 지정하면 해당 경로에 대한 접근시 작성한 콜백함수를 매칭시켜준다

```js
const express = require('express');

const app = express();

app.use('/', (req, res, next) => {
  console.log("In another middleware!");
  res.send('<h1>Hello Express.js</h1>');
});

app.listen(3000);
```
* 이제 / 경로로 접속하면 두 번째 인자로 넘긴 콜백함수에 의해 응답이 처리된다
* 그런데 /add-product 같은 경로로 접속해도 /가 매칭되어 실행되는 문제가 있다
  - full path가 아니기 때문
* 따라서 / 외에 경로를 추가할 때는 보다 구체적인 경로를 상위에 작성해줘야 한다

```js
const express = require('express');

const app = express();

app.use('/add-product', (req, res, next) => {
  console.log("In another middleware!");
  res.send('<h1>The Add Product Page</h1>');
});

app.use('/', (req, res, next) => {
  console.log("In another middleware!");
  res.send('<h1>Hello Express.js</h1>');
});

app.listen(3000);
```
---

### lecture 63. Parsing Incoming Requests

Express식으로 다른 경로에서 넘어오는 데이터를 받아오기
* body-parser라는 서드파티 패키지를 사용하는 것이 편리하다

```terminal
$ npm i --save body-parser
```

```js
const express = require('express');
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.urlencoded({extended: false}));
app.use('/add-product', (req, res, next) => {
  res.send('<form action="/product" method="POST"><input type="text" name="title"/><button type="submit">Add Product</button></form>');
});

app.use('/product', (req, res, next) => {
  console.log(req.body);
  res.redirect('/');
});

app.use('/', (req, res, next) => {
  res.send('<h1>Hello Express.js</h1>');
});

app.listen(3000);
```
* body-parser를 use를 호출해 사용하면 req.body를 이용해 입력 데이터를 다룰 수 있다
  - /add-product에 접속해 임의값을 입력하고 제출해보자
  - 자바스크립트 object 형으로 name : 입력값 형태로 반환되는 것을 확인할 수 있다

---

### lecture 64. Limiting Middleware Execution to POST Requests

앞서 작성한 코드의 문제점
* HTTP 메서드(GET이나 POST etc)에 무관하게 실행되고 있어 Logical Error가 발생할 수 있다
* 따라서 메서드에 맞게 로직을 분기할 필요가 있다
* app.use가 아닌 app.get 혹은 app.post 같은 메서드를 사용하면 알맞게 처리할 수 있다

```js
(...)
app.post('/product', (req, res, next) => {
  console.log(req.body);
  res.redirect('/');
});
(...)
```

---

### lecture 65. Using Express Router

지금까지 작성한 코드들 돌아보기
* express의 핵심적인 기능들을 대략적이지만 다뤄봤다
* 그런데 지금처럼 여러 경로에 대한 처리를 하나의 파일(app.js)에만 두면 프로젝트가 커짐에 따라 관리가 힘들어진다
* 일반적으로 routes라는 폴더를 만들어 관련있는 라우터 미들웨어끼리 분리해 관리하는 것이 컨벤션이다
* 온라인 숍을 만든다고 가정하고 라우터를 분기해보자

admin.js
* 상품을 추가하는 등 운영자가 해야할 일들에 대한 라우터를 추가할 것이다
* 앞서 작성한 코드에서는 /add-product와 /product가 해당한다

shop.js
* 일반 사용자가 사용할 라우터들을 추가할 것이다
* 앞서 작성한 코드에서는 /가 해당한다

express.Router
* Router 함수는 일종의 미니 express 앱으로 다른 익스프레스 앱과 연결해주는 플러그 같은 역할을 한다
* 라우팅과 관련된 기능들을 제공한다

```js
// admin.js

const express = require('express');

const router = express.Router();

router.get('/add-product', (req, res, next) => {
  res.send('<form action="/product" method="POST"><input type="text" name="title"/><button type="submit">Add Product</button></form>');
});

router.post('/product', (req, res, next) => {
  console.log(req.body);
  res.redirect('/');
});

module.exports = router;
```
* 앞서 작성한 코드를 Router와 연결해주고 exports한다
* 그 다음 app.js 파일에서 import 해주면 라우터를 파일별로 나눠서 관리할 수 있다
  - 아래 코드를 보자

```js
// app.js

const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const adminRoutes = require('./routes/admin');

app.use(bodyParser.urlencoded({extended: false}));
app.use(adminRoutes);

app.listen(3000);
```
* 파일의 경로로 require하고 use메서드의 인자로 넘겨서 연결해준다

shop.js도 똑같이 연결해주고 app.js에서 사용하자
```js
// shop.js
const express = require('express');

const router = express.Router();

router.get('/', (req, res, next) => {
  res.send('<h1>Hello Express.js</h1>');
});

module.exports = router;

// app.js
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');

app.use(bodyParser.urlencoded({extended: false}));
app.use(adminRoutes);
app.use(shopRoutes);

app.listen(3000);
```
* 코드가 훨씬 관리하기 편해졌고 이전과 동일하게 작동하는 것을 확인할 수 있다

exact matching
* 앞서 use를 사용할 때는 HTTP method와 관계없이 라우터가 작동해서 정확한 매칭이 불가능했다
* 그러나 위 코드처럼 get, post 등을 명시해주면 앞서 했던 것처럼 순서관리에 신경쓸 필요가 없다
  - /rmqpwer 같은 임의의 경로로 접근해보자 이전과 다르게 해당 경로를 가져올 수 없다고 뜨는 것을 확인할 수 있다
* 가능하면 HTTP method를 명시해서 라우팅을 하자

---

### lecture 66. Adding a 404 Error Page

경로를 찾을 수 없을 때 404 페이지를 띄워주기
* app.use를 이용해 콜백함수로 처리하기
* 다른 미들웨어를 거쳐도 알맞은 결과를 찾을 수 없을 때 실행되도록 미들웨어 중 가장 마지막에 위치시켜주자

```js
// app.js

const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');

app.use(bodyParser.urlencoded({extended: false}));
app.use(adminRoutes);
app.use(shopRoutes);

app.use((req, res, next) => {
  res.status(404).send('<h1>Page not found</h1>');
});

app.listen(3000);
```

---

### lecture 67. Filtering Paths

만약 앞서 작성한 admin 파일에 있는 라우터들의 기본 경로를 /admin으로 하고 싶다면?
* app.js 파일에서 admin 파일을 미들웨어로 등록할 때 첫번째 인자로 기본 경로값을 넘겨주면 된다

```js
// app.js
(...)
app.use('/admin', adminRoutes);
(...)

// admin.js
const express = require('express');

const router = express.Router();

router.get('/add-product', (req, res, next) => {
  res.send('<form action="/admin/add-product" method="POST"><input type="text" name="title"/><button type="submit">Add Product</button></form>');
});

router.post('/add-product', (req, res, next) => {
  console.log(req.body);
  res.redirect('/');
});

module.exports = router;
```
* 이제 /add-product에 접근할 때 /admin/add-product로 접근해야 한다
* 위 코드처럼 admin.js파일에 있는 form의 action에 /admin을 앞에 붙여줘야 원하는 대로 동작한다

---

### lecture 68. Creating HTML Pages

정적 HTML 파일들을 만들어 응답하기
* 정적 HTML 파일들은 views라는 폴더를 만들어 관리하는 것이 컨벤션이다
* 다음과 같은 코드들을 작성하자

```html
<!-- views/add-product.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>Add Product</title>
</head>
<body>
  <header>
    <nav>
      <ul>
        <li><a href="/">Shop</a></li>
        <li><a href="/admin/add-product">Add Product</a></li>
      </ul>
    </nav>
  </header>

  <main>
    <form action="/admin/add-product" method="POST">
      <input type="text" name="title" />
      <button type="submit">Add Product</button>
    </form>
  </main>
</body>
</html>
```

```html
<!-- views/shop.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>Add Product</title>
</head>
<body>
  <header>
    <nav>
      <ul>
        <li><a href="/">Shop</a></li>
        <li><a href="/admin/add-product">Add Product</a></li>
      </ul>
    </nav>
  </header>

  <main>
    <h1>My Products</h1>
    <p>List of all the products...</p>
  </main>
</body>
</html>
```

---

### lecture 69. Serving HTML Pages

앞서 작성한 HTML 페이지들을 서빙하기
* sendFile 메서드를 이용한다
* 상대 경로를 사용하기 위해서는 path 모듈을 사용해야 한다
* path.join은 인자로 넘긴 문자열을 연결시켜준다
* __dirname은 os에서 해당 프로젝트의 절대경로를 지시해주는 글로벌 변수다

```js
// routes/admin.js
const express = require('express');
const path = require('path');

const router = express.Router();

router.get('/add-product', (req, res, next) => {
  res.sendFile(path.join(__dirname, '../', 'views', 'add-product.html'));
});

router.post('/add-product', (req, res, next) => {
  console.log(req.body);
  res.redirect('/');
});

module.exports = router;

// routes/shop.js
const express = require('express');
const path = require('path');

const router = express.Router();

router.get('/', (req, res, next) => {
  res.sendFile(path.join(__dirname, '../', 'views', 'shop.html'));
});

module.exports = router;
```
* 라우터들의 절대경로는 routes 폴더이기 때문에 한 단계 위로 가서 views 폴더에 접근하고 있다

404 페이지를 만들어 띄우기

```html
<!-- views/404.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>Page Not Found</title>
</head>
<body>
  <h1>Page Not Found!</h1>
</body>
</html>
```

```js
// app.js
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');

app.use(bodyParser.urlencoded({extended: false}));
app.use('/admin', adminRoutes);
app.use(shopRoutes);

app.use((req, res, next) => {
  res.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
});

app.listen(3000);
```

---

### lecture 71. Using a Helper Function for Navigation

앞서 path.join을 이용했을 때 불편한 점
* 라우터의 계층이 깊어지면 ..를 중복해서 추가해줘야한다
* os별로 경로를 표기하는 방식이 달라서 생길 수 있는 문제도 예방할 수 있다
* 메인모듈인 app.js 파일을 루트디렉토리로 지정해주는 유틸리티 파일을 만들면 중복을 없앨 수 있다

```js
// util/path.js
const path = require('path');

module.exports = path.dirname(process.mainModule.filename);
```
* 전역 변수인 process에는 서버를 실행하는 모듈을 가리키는 mainModule 프로퍼티가 있다
  - 이 모듈의 filename 프로퍼티는 서버 실행 모듈이 있는 파일을 가리킨다
* 이 유틸리티 파일을 이용해 라우터들의 중복을 없애보자

```js
// routes/admin.js
const express = require('express');
const path = require('path');

const rootDir = require('../util/path');
const router = express.Router();

router.get('/add-product', (req, res, next) => {
  res.sendFile(path.join(rootDir, 'views', 'add-product.html'));
});

router.post('/add-product', (req, res, next) => {
  console.log(req.body);
  res.redirect('/');
});

module.exports = router;

// routes/shop.js
const express = require('express');
const path = require('path');

const rootDir = require('../util/path');
const router = express.Router();

router.get('/', (req, res, next) => {
  res.sendFile(path.join(rootDir, 'views', 'shop.html'));
});

module.exports = router;
```

---

### lecture 72. Styling our Pages

지금까지 작성한 html 파일들을 꾸미기
* 별도의 css 파일을 작성하지 않고 추가해보자
* bem 방법론을 사용한다

```html
<!-- views/shop.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>Add Product</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: sans-serif;
    }

    main {
      padding: 1rem;
    }

    .main-header {
      width: 100%;
      height: 3.5rem;
      background-color: #dbc441;
      padding: 0 1.5rem;
    }

    .main-header__nav {
      height: 100%;
    }

    .main-header__item-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
    }

    .main-header__item {
      margin: 0 1rem;
      padding: 0;
    }

    .main-header__item a {
      text-decoration: none;
      color: black;
    }

    .main-header__item a:hover,
    .main-header__item a:active,
    .main-header__item a.active {
      color: #6200ff;
    }
  </style>
</head>
<body>
  <header class="main-header">
    <nav class="main-header__nav">
      <ul class="main-header__item-list">
        <li class="main-header__item"><a class="active" href="/">Shop</a></li>
        <li class="main-header__item"><a href="/admin/add-product">Add Product</a></li>
      </ul>
    </nav>
  </header>

  <main>
    <h1>My Products</h1>
    <p>List of all the products...</p>
  </main>
</body>
</html>
```

```html
<!-- views/add-product.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>Add Product</title>
  <style>
      body {
        margin: 0;
        padding: 0;
        font-family: sans-serif;
      }
  
      main {
        padding: 1rem;
      }
  
      .main-header {
        width: 100%;
        height: 3.5rem;
        background-color: #dbc441;
        padding: 0 1.5rem;
      }
  
      .main-header__nav {
        height: 100%;
      }
  
      .main-header__item-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
      }
  
      .main-header__item {
        margin: 0 1rem;
        padding: 0;
      }
  
      .main-header__item a {
        text-decoration: none;
        color: black;
      }
  
      .main-header__item a:hover,
      .main-header__item a:active,
      .main-header__item a.active {
        color: #3e00a1;
      }

      .product-form {
        width: 20rem;
        max-width: 90%;
        margin: auto;
      }

      .form-control {
        margin: 1rem 0;
      }

      .form-control label,
      .form-control input {
        display: block;
        width: 100%;
      }

      .form-control input {
        border: 1px solid #dbc441;
        font: inherit;
        border-radius: 2px;
      }

      button {
        font: inherit;
        border: 1px solid #3e00a1;
        color: #3e00a1;
        background:white;
        border-radius: 3px;
        cursor: pointer;
      }

      button:hover,
      button:active {
        background-color: #3e00a1;
        color: white;
      }
    </style>
</head>
<body>
  <header class="main-header">
    <nav class="main-header__nav">
      <ul class="main-header__item-list">
        <li class="main-header__item"><a href="/">Shop</a></li>
        <li class="main-header__item"><a class="active" href="/admin/add-product">Add Product</a></li>
      </ul>
    </nav>
  </header>

  <main>
    <form class="product-form" action="/admin/add-product" method="POST">
      <div class="form-control">
        <label for="title">Title</label>
        <input type="text" name="title" id="title" />
      </div>
      <button type="submit">Add Product</button>
    </form>
  </main>
</body>
</html>
```

```html
<!-- 404.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>Page Not Found</title>
  <style>
      body {
        margin: 0;
        padding: 0;
        font-family: sans-serif;
      }
  
      main {
        padding: 1rem;
      }
  
      .main-header {
        width: 100%;
        height: 3.5rem;
        background-color: #dbc441;
        padding: 0 1.5rem;
      }
  
      .main-header__nav {
        height: 100%;
      }
  
      .main-header__item-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
      }
  
      .main-header__item {
        margin: 0 1rem;
        padding: 0;
      }
  
      .main-header__item a {
        text-decoration: none;
        color: black;
      }
  
      .main-header__item a:hover,
      .main-header__item a:active,
      .main-header__item a.active {
        color: #6200ff;
      }
    </style>
</head>
<body>
  <header class="main-header">
    <nav class="main-header__nav">
      <ul class="main-header__item-list">
        <li class="main-header__item"><a class="active" href="/">Shop</a></li>
        <li class="main-header__item"><a href="/admin/add-product">Add Product</a></li>
      </ul>
    </nav>
  </header>
  
  <h1>Page Not Found!</h1>
</body>
</html>
```

---

### lecture 73. Serving Files Statically

앞서 작성한 css 코드를 별도의 정적 파일에 저장해서 불러오기
* 별도의 폴더에 css파일을 생성하는 것은 쉽다
  - 그러나 express앱은 기본적으로 파일경로에 직접 접속하는 권한을 주지 않는다
* express가 제공하는 정적파일 서빙 기능을 사용하면 편리하게 구현할 수 있다
  - express.static 함수에 인자로 넘긴 폴더명에서는 정적 파일을 불러올 권한을 준다

```js
// app.js
(...)
app.use(express.static(path.join(__dirname, 'public')));
(...)
```
* 이제 public 폴더에는 접근할 수 있는 권한이 생겼다

중복 없애기
* 공통적인 header 부분을 꾸미는 코드를 main.css파일을 만들어 분리한다
* form 부분을 꾸미는 코드를 product.css 파일을 만들어 분리한다
* 모든 html 파일에 main.css 파일을 링크해준다

```css
/* main.css */
body {
  margin: 0;
  padding: 0;
  font-family: sans-serif;
}

main {
  padding: 1rem;
}

.main-header {
  width: 100%;
  height: 3.5rem;
  background-color: #dbc441;
  padding: 0 1.5rem;
}

.main-header__nav {
  height: 100%;
}

.main-header__item-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
}

.main-header__item {
  margin: 0 1rem;
  padding: 0;
}

.main-header__item a {
  text-decoration: none;
  color: black;
}

.main-header__item a:hover,
.main-header__item a:active,
.main-header__item a.active {
  color: #6200ff;
}

/* product.css */
.product-form {
  width: 20rem;
  max-width: 90%;
  margin: auto;
}

.form-control {
  margin: 1rem 0;
}

.form-control label,
.form-control input {
  display: block;
  width: 100%;
}

.form-control input {
  border: 1px solid #dbc441;
  font: inherit;
  border-radius: 2px;
}

button {
  font: inherit;
  border: 1px solid #3e00a1;
  color: #3e00a1;
  background:white;
  border-radius: 3px;
  cursor: pointer;
}

button:hover,
button:active {
  background-color: #3e00a1;
  color: white;
}
```

```html
<!-- 404.html -->
(...)
<title>Page Not Found</title>
<link rel="stylesheet" href="/css/main.css">
(...)

<!-- add-product.html -->
(...)
<title>Add Product</title>
<link rel="stylesheet" href="/css/main.css">
<link rel="stylesheet" href="/css/product.css">
(...)

<!-- shop.html -->
(...)
<title>Shop</title>
<link rel="stylesheet" href="/css/main.css">
(...)
```

---