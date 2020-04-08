# Section 16. Sending Emails

### lecture 267. How Does Sending Emails Work?

메일 보내는 작업에 대해 흔히 하는 착각
* Node 혹은 Express 코드를 통해 메일 서비스를 작성하는 것이라고 생각
  - 노드 서버에 작성된 코드로 유저에 직접 메일을 보내는 것이라고 착각한다
* 그러나 메일 서비스는 수천 이상의 작업을 동시에 처리하는 복잡한 작업이다
* 따라서 현실적으로는 메일 서버를 만들지 않고 서드파티 라이브러리를 활용한다
  - 유명한 서비스들(강의를 제공하는 유데미도 마찬가지)도 대부분 AWS 같은 곳에서 제공하는 메일 서비스를 이용한다

---

### lecture 268. Using SendGrid

SendGrid
* 이메일 서비스를 하루에 100통까지는 무료로 제공해준다
* SendGrid 외에도 MailChimp, AWS SES, Google for Node Mailing 등을 많이 사용한다

센드그리드용 서드파티 패키지 설치하기
```terminal
$ npm i --save nodemailer nodemailer-sendgrid-transport
```

---

### lecture 269. Using Nodemailer to Send an Email

메일 보내는 로직을 작성하기 위한 설정
```js
// controllers/auth.js
(...)
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');

const transporter = nodemailer.createTransport(sendgridTransport({
  auth: {
    api_key: 'your api key'
  }
}));
(...)
```

api_key를 sendgrid 홈페이지에서 생성하기
* 로그인 한 뒤 대쉬보드에서 Setting -> API Keys -> 생성
* 생성한 API Key는 두번다시 보여주지 않으므로 잘 저장해둬야 한다
  
회원가입 후 완료메시지를 보내기
```js
// controllers/auth.js
(...)
exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;

  User.findOne({ email : email })
      .then(userDoc => {
        if (userDoc) {
          return res.redirect('/');
        }
        return bcrypt
          .hash(password, 12)
          .then(hashedPassword => {
            const user = new User({
              email: email,
              password: hashedPassword,
              cart: { items: [] }
            });
            return user.save();
          });
        })
        .then(result => {
          res.redirect('/login');
          return transporter.sendMail({
            to: email,
            from: 'shop@node-complete.com',
            subject: 'Signup succeedd!',
            html: '<h1>You successfully signed up!</h1>'
          });
        })
        .catch(err => console.log(err));
};
(...)
```

---