# Section 14. Sessions & Cookies

### lecture 227. What is Cookie?

지금까지 데이터를 다루기 위해 배운것들
* 파일, 데이터베이스 등을 이용해 데이터를 다뤘다
  - 모두 백단에서 처리하는 방식이다
* 세션과 쿠키는 클라이언트 사이드를 이용해 데이터를 다루는 방식이다

쿠키란 무엇인가?
* 인증 기능을 구현한다고 가정해보자
* 특정 뷰 페이지를 통해 일정한 정보를 담아 서버에 로그인 요청을 보낸다
* 그러면 서버는 헤더에 로그인과 관련된 정보를 포함해 응답을 보낼 것이다
  - 이 때 쿠키를 이용해 클라이언트 사이드에 로그인 관련 정보를 저장한다
  - 아직까지는 추상적으로 들릴 것이다. 실제 코드를 통해 살펴보자
* lecture 228~229는 login 폼을 만들고 폼을 렌더링할 라우터와 컨트롤러를 추가하는 강의다
  - 정리의 필요성은 못느껴서 생략한다

---

### lecture 230. Adding the Request Driven Login Solution

간단한 인증로직을 추가해보기
* 모든 렌더콜(res.render호출)에 isAuthenticated 키를 req.isLoggedIn값으로 지정한다
* /login 페이지에서 폼을 제출하면 req.isLoggedIn 값을 true로 지정하고 / 경로로 리다이렉트한다

```js
// controllers/admin.js, error.js, shop.js, auth.js
exports.getAddProduct = (req, res, next) => {
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false,
    isAuthenticated: req.isLoggedIn
  });
};
(...)

exports.get404 = (req, res, next) => {
  res.status(404).render('404', { 
    pageTitle: 'Page Not Found', 
    path: '/404', 
    isAuthenticated: req.isLoggedIn
  });
};
(...)

exports.getIndex = (req, res, next) => {
  Product.find()
    .then(products => {
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/',
        isAuthenticated: req.isLoggedIn
      });
    })
    .catch(err => {
      console.log(err);
    });
};
(...)

exports.getLogin = (req, res, next) => {
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    isAuthenticated: req.isLoggedIn
  });
};

exports.postLogin = (req, res, next) => {
  req.isLoggedIn = true;
  res.redirect('/');
};
```
* login탭에 들어가서 폼을 제출해보자

폼이 제출되어도 admin관련 네비게이션이 작동하지 않는 이유
* auth 컨트롤러의 postLogin 로직
  - postLogin에 연관된 라우터로 요청이 들어오면 해당 요청에 대해서 isLoggedIn 값을 true로 지정한다
  - 하지만 바로 밑에 줄에 있는 리다이렉트가 실행되는 순간 위에서 설정한 값은 없어진다
  - 그리고 / 경로에 GET 메서드로 지정된 shop 컨트롤러의 getIndex가 실행되면서 새로운 요청에 대한 응답이 이루어진다
  - 결국 리다이렉트된 / 경로의 페이지에서는 이전 요청의 isLoggedIn 값을 읽어올 수 없다
  - 따라서 navigation.ejs에서 isAuthenticated값은 falsable한 값으로 읽힌다

위 문제를 해결하는 방법
* 앞선 강의들에서 했던 것처럼 미들웨어를 이용해 매 요청마다 인증상태를 지정할 수 있다
  - 하지만 효율적인 방법은 아니다
* 쿠키를 사용하면 문제를 더 나은 방식으로 해결할 수 있다

---

### lecture 231. Setting a Cookie

쿠키를 사용하기
* res.setHeader('Set-Cookie', value)를 통해 쿠키를 설정할 수 있다
* 이렇게 서버에 설정되어 클라이언트에 보내진 쿠키는 이후의 요청마다 Cookie헤더에 포함되어 서버로 보내진다
* 설정된 쿠키는 브라우저 개발자도구의 애플리케이션 탭에서 확인할 수 있다
* req.get('Cookie')를 통해 설정한 쿠키값을 가져올 수 있다

```js
// controllers/auth.js
exports.getLogin = (req, res, next) => {
  const isLoggedIn = req
    .get('Cookie')
    .split('=')[1] === 'true';
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    isAuthenticated: isLoggedIn
  });
};

exports.postLogin = (req, res, next) => {
  res.setHeader('Set-Cookie', 'loggedIn=true');
  res.redirect('/');
};
```
* login폼을 제출하면 loggedIn을 true로 지정한 쿠키를 설정한다
* 위의 getLogin처럼 req.get('Cookie')로 쿠키값들을 가져와서 loggedIn 값을 추려낸다
* 렌더링 콜에 해당 값을 보내 로그인 여부를 확인한다

---

### lecture 232. Manipulating Cookies

앞서 설정한 쿠키의 문제점
* 브라우저의 개발자 도구로 들어가서 어플리케이션 탭에 쿠키목록을 연다
* loggedIn 쿠키의 값을 false로 변경해보자
* 그리고 다시 로그인 폼에 접속해보면 쿠키값이 변경되어 admin관련 탭들이 보이지 않는 것을 확인할 수 있다
* 이처럼 쿠키는 사용자가 임의로 값을 변경할 수 있다
* 따라서 인증과 같은 민감한 정보는 쿠키를 이용하지 않는 것이 바람직하다

---

### lecture 233. Configuring Cookies

세미콜론을 이용하면 여러 쿠키값을 지정하거나 추가적인 설정을 해줄 수 있다
```js
res.setHeader('Set-Cookie', 'loggedIn=true;');
```

Max-Age를 사용하면 쿠키의 만료시간을 지정할 수 있다
```js
res.setHeader('Set-Cookie', 'loggedIn=true; Max-Age=1000');
```
* 쿠키는 1초 후 만료된다

Secure는 https에만 이 쿠키가 적용되도록 만든다
```js
res.setHeader('Set-Cookie', 'loggedIn=true; Secure');
```
* 로컬 서버는 http를 사용하므로 loggedIn 쿠키가 true로 설정되지 않는다
* 반대로 HttpOnly는 http에만 쿠키가 설정되도록 만든다

---

### lecture 234. What is Session?

데이터의 저장위치
* 앞서 본 쿠키는 클라이언트 사이드의 브라우저에 데이터를 저장했다
* 반대로 쿠키는 서버 측에 데이터를 저장한다
* 유저마다 다른 세션을 부여하기 위해 세션아이디를 만든다
  
세션 아이디를 유저는 어떻게 알 수 있나?
* 인증처리가 성공하면 서버는 해당 유저의 세션을 만들고 쿠키에 세션 아이디 값을 설정한다
* 그런데 이 때 쿠키에 설정된 세션 아이디값은 서버만 확인할 수 있도록 해시화된 값이다
* 따라서 앞서 쿠키로만 설정했던 것과는 달리 유저가 자의적으로 값을 변경할 수 없어 보안이 우수하다

---

### lecture 235. Installing the Session Middleware

세션 처리를 편리하게 해주는 미들웨어 설치하기
```terminal
$ npm i --save express-session
```

앱에 미들웨어 적용하기
```js
// app.js
(...)
const session = require('express-session');

(...)
app.use(
  session({ secret: 'my secret', resave: false, saveUninitialized: false})
);
```
* session에 인자로 자바스크립트 오브젝트를 넘겨 세션관련 설정을 한다
* secret은 해싱작업을 위한 문자열을 지정하는 것으로 실제 서비스에서는 매우 긴 문자열 값을 지정한다
  - 여기서는 편의를 위해 쉽게 작성했다
* resave는 모든 요청에 대해 세션을 재저장할 것인지 여부를 설정한다
  - false로 지정하면 변경된 사항이 있을때만 세션을 재저장한다. 성능상 이점이 있다
* saveUninitialized를 false로 설정하면 세션에 변경이 없을 때 초기화되지 않은 값을 저장하지 않게끔 만든다
* 그 외에 cookie를 자바스크립트 오브젝트로 Max-Age 등을 설정할 수 있다

---

### lecture 236. Using the Session Middleware

세션 미들웨어 사용법
```js
// controllers/auth.js
(...)
exports.postLogin = (req, res, next) => {
  req.session.isLoggedIn = true;
  res.redirect('/');
};
```
* req.session.key = value 형식으로 세션을 등록할 수 있다
* 로그인 페이지에 접속해서 폼을 제출하고 개발자도구 어플리케이션 탭에서 쿠키를 확인해보자
* connect.sid에 해싱된 세션 아이디값이 저장되어 있음을 확인할 수 있다
  - 이 세션 쿠키는 브라우저가 닫히면 사라진다
  - 다른 브라우저로 접속해도 세션 쿠키가 공유되지 않는다

로그인 페이지에서 로그를 확인해보기
```js
// controllers/auth.js
exports.getLogin = (req, res, next) => {
  console.log(req.session.isLoggedIn);
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    isAuthenticated: false
  });
};
(...)
```
* 저장한 뒤 다시 로그인폼을 제출하고 로그인 페이지로 접속해보자
* true가 출력되며, 다른 탭에 접속했다가 다시 로그인 페이지로 접속해도 true가 출력된다
* 이는 세션을 사용해 메모리에 해당 값을 저장해놨기 때문이다(아직 데이터베이스에는 세션값을 저장하지 않았다)
* 이렇게 세션 아이디 값을 저장한 쿠키를 이용해 서버의 세션에 저장된 값을 사용하는 것이 고전적인 인증의 기초다

---

### lecture 237. Using MongoDB to Store Sessions

앞서 세션을 저장한 방식의 문제점
* 세션 데이터를 메모리에 저장했는데, 메모리는 영구적인 자원이 아니다
  - 개발시 테스트용으로는 메모리도 충분하나 프로덕션 용으로는 큰 문제를 일으킬 수 있다
  - 천명 혹은 십만명 이상의 유저가 동시에 메모리에 세션 데이터를 저장한다고 생각해보자
  - 서버 메모리는 순식간에 오버플로우 될 것이다

몽고DB용 세션 커넥터 라이브러리 설치하기
```terminal
$ npm i --save connect-mongodb-session
```

세션 라이브러리와 커넥터 연결하기
```js
// app.js
(...)
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);

const MONGODB_URI = 'mongodb+srv://eonsu-1:SJE6LQ5Ym2Si97l9@cluster0-iqzdk.mongodb.net/shop';

const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: 'sessions'
});

app.use(
  session({ 
    secret: 'my secret', 
    resave: false, 
    saveUninitialized: false, 
    store: store 
  })
);
(...)
```
* 커넥터를 불러오는 동시에 실행하면서 앞서 사용했던 세션 처리 라이브러리를 인자로 넘겨준다
* 생성자를 호출하는데, 저장할 몽고 디비 uri와 세션 데이터를 저장할 컬렉션 이름을 넘겨줘야 한다
* 그리고 세션 처리 라이브러리의 설정에 store를 추가해준다
* 수정사항을 저장하고 다시 로그인페이지에서 폼을 제출한 뒤 컴파스에서 세션 컬렉션을 확인해보자
* 이제 보안적으로나 성능적으로나 메모리에 저장하는 것보다 우수하면서 요청 마다, 유저 마다 데이터를 공유할 수있는 방법을 알게 되었다

---

### lecture 239. Deleting a Cookie

앞서 세션을 삭제할 때 사용했던 방법
* 브라우저 개발자도구에서 세션 쿠키를 지우는 방식으로 세션을 없앴다
* 그러나 몇번 같은 방법으로 세션을 만들고 삭제해본 뒤 데이터베이스를 확인해보면 여러 개의 세션 데이터가 그대로 저장되어 있음을 확인할 수 있다
* 앞서 사용했던 세션 라이브러리는 실제로 세션 데이터를 없애는 destroy메서드를 제공하고 있다

```html
<!-- views/includes/navigation.ejs -->
(...)
<ul class="main-header__item-list">
    <li class="main-header__item">
        <a class="<%= path === '/login' ? 'active' : '' %>" href="/login">Login</a>
    </li>
    <li class="main-header__item">
        <form action="/logout" method="POST">
          <button type="submit">Logout</button>
        </form>
    </li>
</ul>
```

```js
// routes/auth.js
(...)
router.post('/logout', authController.postLogout);

// controllers/auth.js
(...)
exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    console.log(err);
    res.redirect('/');
  });
};
```
* 이제 로그아웃 버튼을 누르면 실제로 데이터베이스에 저장된 세션이 제거되는 것을 확인할 수 있다

---

### lecture 240. Fixing Some Minor Bugs

인증 상태일 때만 cart, orders, add product, admin products 탭이 보이도록 수정하기
* 추가로 인증 상태에 따라 Login, Logout탭을 보이거나 보이지 않게 만들자
* 상품 리스트의 Add to Cart도 인증상태일때만 보이도록 만들자

```html
<!-- views/includes/navigation.ejs -->
<div class="backdrop"></div>
<header class="main-header">
    <button id="side-menu-toggle">Menu</button>
    <nav class="main-header__nav">
        <ul class="main-header__item-list">
            <li class="main-header__item">
                <a class="<%= path === '/' ? 'active' : '' %>" href="/">Shop</a>
            </li>
            <li class="main-header__item">
                <a class="<%= path === '/products' ? 'active' : '' %>" href="/products">Products</a>
            </li>
            <% if (isAuthenticated) { %>
                <li class="main-header__item">
                  <a class="<%= path === '/cart' ? 'active' : '' %>" href="/cart">Cart</a>
              </li>
              <li class="main-header__item">
                  <a class="<%= path === '/orders' ? 'active' : '' %>" href="/orders">Orders</a>
              </li>
              <li class="main-header__item">
                  <a class="<%= path === '/admin/add-product' ? 'active' : '' %>" href="/admin/add-product">Add Product
                  </a>
              </li>
              <li class="main-header__item">
                  <a class="<%= path === '/admin/products' ? 'active' : '' %>" href="/admin/products">Admin Products
                  </a>
              </li>
            <% } %>
        </ul>
        <ul class="main-header__item-list">
            <% if (!isAuthenticated) { %>
              <li class="main-header__item">
                  <a class="<%= path === '/login' ? 'active' : '' %>" href="/login">Login</a>
              </li>
            <% } else { %>
              <li class="main-header__item">
                  <form action="/logout" method="POST">
                    <button type="submit">Logout</button>
                  </form>
              </li>
            <% } %>
        </ul>
    </nav>
</header>
```

```html
<!-- views/includes/add-to-cart-ejs -->
<% if (isAuthenticated) { %>
  <form action="/cart" method="post">
      <button class="btn" type="submit">Add to Cart</button>
      <input type="hidden" name="productId" value="<%= product._id %>">
  </form>
<% } %>
```

---

