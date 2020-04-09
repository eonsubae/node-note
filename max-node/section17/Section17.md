# Section 17. Advanced Authentication

### lecture 273. Resetting Passwords

패스워드 재설정을 위한 뷰 페이지 작성
```html
<!-- views/auth/reset.ejs -->
<%- include('../includes/head.ejs') %>
    <link rel="stylesheet" href="/css/forms.css">
    <link rel="stylesheet" href="/css/auth.css">
</head>

<body>
   <%- include('../includes/navigation.ejs') %>

    <main>
        <% if (errorMessage) { %>
            <div class="user-message user-message--error"><%= errorMessage %></div>
        <% } %>
        <form class="login-form" action="/login" method="POST">
            <div class="form-control">
                <label for="email">E-Mail</label>
                <input type="email" name="email" id="email">
            </div>
            <input type="hidden" name="_csrf" value="<%= csrfToken %>">
            <button class="btn" type="submit">Reset Password</button>
        </form>
    </main>
<%- include('../includes/end.ejs') %>
```

작성한 뷰 페이지를 렌더링할 컨트롤러 작성
```js
// controllers/auth.js
(...)
exports.getReset = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Reset Password',
    errorMessage: message
  });
};
```

라우터에 컨트롤러 등록
```js
// routes/auth.js
(...)
router.get('/reset', authController.getReset);
(...)
```

---

### lecture 274. Implementing the Token Logic

지금까지 한 일과 해야 할 일들
* 이메일을 입력하고 패스워드 재설정 버튼을 누르면 이메일로 패스워드를 변경할 수 있는 링크를 보내는 창까지 만들었다
* 이제 만료 시간을 가진 유니크한 토큰을 생성해야 한다
  - 토큰은 데이터베이스에 저장할 것이다
  - 토큰을 포함한 이메일이 있어야 유저는 패스워드를 변경할 수 있다
* 토큰은 유저 오브젝트에 저장한다
  - 토큰이 유저와 연관된 정보이기 때문이다
  - 따라서 User 모델부터 수정한다(토큰 관련 정보 추가)

```js
// models/user.js
(...)
const userSchema = new Schema({
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  resetToken: String,
  resetTokenExpiration: Date,
  cart: {
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          required: true
        },
        quantity: { type: Number, required: true }
      }
    ]
  }
});
(...)
```

패스워드 변경 요청시 토큰과 만료시간을 만들어 유저 정보에 저장하고 메일로 변경 링크 보내기
```js
// controllers/auth.js
(...)
exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect('/reset');
    }
    const token = buffer.toString('hex');
    User.findOne({ email: req.body.email })
      .then(user => {
        if (!user) {
          req.flash('error', 'No account with that email found.');
          return res.redirect('/reset');
        }
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000; // 토큰은 한 시간 뒤에 만료된다
        return user.save();
      })
      .then(_ => {
        res.redirect('/');
        transporter.sendMail({
          to: req.body.email,
          from: 'shop@node-complete.com',
          subject: 'Password reset!',
          html: `
            <p>You requested a password reset</p>
            <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new pass</p>
          `
        });
      })
      .catch(err => console.log(err));

  });
};
```

---

### lecture 276. Creating the Reset Password Form

패스워드를 재설정할 폼이 포함된 뷰 페이지 작성하기
```html
<!-- views/auth/new-password.ejs -->
<%- include('../includes/head.ejs') %>
    <link rel="stylesheet" href="/css/forms.css">
    <link rel="stylesheet" href="/css/auth.css">
</head>

<body>
   <%- include('../includes/navigation.ejs') %>

    <main>
        <% if (errorMessage) { %>
            <div class="user-message user-message--error"><%= errorMessage %></div>
        <% } %>
        <form class="login-form" action="/new-password" method="POST">
            <div class="form-control">
                <label for="password">Password</label>
                <input type="password" name="password" id="password">
            </div>
            <input type="hidden" name="userId" value="<%= userId %>">
            <input type="hidden" name="passwordToken" value="<%= passwordToken %>">
            <input type="hidden" name="_csrf" value="<%= csrfToken %>">
            <button class="btn" type="submit">Reset Password</button>
        </form>
    </main>
<%- include('../includes/end.ejs') %>
```

작성한 폼 페이지를 연결할 라우터와 컨트롤러 작성
```js
// routes/auth.js
(...)
router.get('/reset/:token', authController.getNewPassword);
```

```js
// controllers/auth.js
(...)
exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  User.findOne({ resetToken : token, resetTokenExpiration: {$gt: Date.now()} })
    .then(user => {
      let message = req.flash('error');
      if (message.length > 0) {
        message = message[0];
      } else {
        message = null;
      }
      res.render(`/auth/new-password`, {
        path: '/new-password',
        pageTitle: 'New Password',
        errorMessage: message,
        userId: user._id.toString(),
        passwordToken: token
      });
    })
    .catch(err => console.log(err));
};
```

---

### lecture 277. Adding Logic to Update the Password

변경할 패스워드를 채운 폼을 제출시 처리 로직 작성하기
```js
// routes/auth.js
(...)
router.post('/new-password', authController.postNewPassword);
```

```js
// controllers/auth.js
(...)
exports.postNewPassword = (req, res, next) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  let resetUser;
  
  User.findOne({ 
    resetToken: passwordToken, 
    resetTokenExpiration: {$gt: Date.now()},
    _id: userId 
  }).then(user => {
      resetUser = user;
      return bcrypt.hash(newPassword, 12)
    })
    .then(hashedPassword => {
      resetUser.password = hashedPassword;
      resetUser.resetToken = undefined;
      resetUser.resetTokenExpiration = undefined;
      return resetUser.save();
    })
    .then(_ => {
      res.redirect('/login');
    })
    .catch(err => console.log(err));
};
```

---

### lecture 278. Why We Need Authorization

권한 부여하기
* 권한은 인증된 유저별로 접근할 수 있는 리소스에 제한을 두는 것이다
* 지금까지 작성한 로직에서는 다른 유저가 만들거나 수정한 상품을 아무 유저나 수정, 삭제할 수 있다
  - 이처럼 의도하지 않은 동작을 방지하는 기능을 제공하는 것이 Authorization의 목적이다

---

### lecture 279. Adding Authorization

로그인 후 Admin Products 탭을 눌렀을 때 자신이 생성한 상품만 보이도록 만들기
```js
// controllers/admin.js
(...)
exports.getProducts = (req, res, next) => {
  Product.find({ userId: req.user._id })
    // .select('title price -_id')
    // .populate('userId', 'name')
    .then(products => {
      console.log(products);
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

### lecture 280. Adding Protection to Post Actions

앞서 작성한 권한 로직의 허점
* 실제로 자신이 생성한 상품이 아닌 리소스에 삭제를 시도했을 때 방어가 안되고 있다
* 절대 경로로 자신이 생성한 상품이 아닌 상품에 변경을 시도하는 것을 방지해야 한다

```js
// controllers/admin.js
(...)
exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const updatedImageUrl = req.body.imageUrl;
  const updatedDesc = req.body.description;

  Product.findById(prodId)
    .then(product => {
      if (product.userId.toString() !== req.user._id.toString()) {
        return res.redirect('/');
      }
      product.title = updatedTitle;
      product.price = updatedPrice;
      product.description = updatedDesc;
      product.imageUrl = updatedImageUrl;
      return product.save().then(result => {
        console.log('UPDATED PRODUCT!');
        res.redirect('/admin/products');
      });
    })
    .catch(err => console.log(err));
};
(...)
exports.postDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  Product.deleteOne({ _id: prodId, userId: req.user._id })
    .then(() => {
      console.log('DESTROYED PRODUCT');
      res.redirect('/admin/products');
    })
    .catch(err => console.log(err));
};
```

---