# Section 29. Deploying our App

### lecture 444. Deploying Different Kinds of Apps

서로 다른 종류의 앱을 배포하기
* HTML 혹은 EJS같은 템플릿 엔진으로 만든 뷰를 렌더링하는 Server-side Rendered Views앱과
* REST API 혹은 GraphQL로 데이터를 반환하는 앱이 있다면 어떻게 배포해야 할까?
* 이 두가지 앱이 같은 로직 안에 있다면, 하나의 노드 서버를 통해 동일한 호스팅 요구사항을 적용하면 된다

---

### lecture 445. Deployment Preparations

실제로 프로덕션에 코드를 배포하기 위한 준비
* 환경 변수 사용하기
  - 하드코딩된 값들을 피하기 위해 사용한다
  - API Keys, Port, Password, etc..
* Production API Keys
  - 서드파티 서비스를 사용한다면 Developemnt Key가 아닌 Production Key를 사용해야 한다
  - ex. Stripe는 개발용으로 Test Key를 제공하는데 이걸 프로덕션에서도 그대로 사용하면 안된다
* Reduce Error Output Details
  - 에러와 관련된 민감한 정보를 유저에게 보여줘선 안된다
  - 따라서 에러가 발생했을때 혹은 각종 로그에 대한 민감한 내용을 유저에게 감춰야 한다
* Secure Response Header 설정하기
  - 차후 베스트 프랙티스를 설명할 것이다
* Asset Compression
  - 응답 시간을 줄여 사용자가 빠르게 데이터를 받을 수 있도록 압축하기
* Configure Logging
  - 사용자들이 앱을 사용하면서 일어나는 일들을 기록하기
* SSL/TLS
  - 데이터 전송 과정을 암호화하기

---

### lecture 446. Using Environment Variables

환경 변수 설정하기
* 하드코딩된 값이 아니라 노드 앱이 시작할 때 환경 변수들을 주입할 것이다
* 어떤 것이 환경변수가 되어야 하고 어떻게 설정하는지를 배운다
* 개발 모드와 프로덕션 모드를 분리해 다룬다

```js
// app.js
(...)
const MONGODB_URI =
  `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0-ntrwp.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}`;
(...)
mongoose
  .connect(MONGODB_URI)
  .then(result => {
    app.listen(process.env.PORT || 3000);
  })
  .catch(err => {
    console.log(err);
  });

// controllers/shop.js
(...)
const stripe = require('stripe')(process.env.STRIPE_KEY);
(...)
```
* process.env는 노드 자체에 환경변수들을 저장하는 글로벌 프로퍼티다
* 호스팅 제공자에 의해 환경변수를 주입받은 노드앱이 각 변수들을 주입해줄 것이다
* 이렇게 하면 직접 하드코딩된 코드를 수정해 재배포하지 않아도 되며 비밀번호 같은 민감한 정보를 협업자에게 노출하지 않을 수 있다

nodemon.json파일에 환경변수 목록 작성하기
```json
// nodemon.json
{
  "env": {
    "MONGO_USER" : "eonsu-1",
    "MONGO_PASSWORD" : "SJE6LQ5Ym2Si97l9",
    "MONGO_DEFAULT_DATABASE": "shop",
    "STRIPE_KEY": "pk_test_6IeRsE2fRff4tKxW43jvYWLH00jdPkscwg"
  }
}
```
* nodemon app.js로 앱을 실행해보면 nodemon이 nodemon.json파일의 환경변수들을 읽어 주입해주는 것을 확인할 수 있다

package.json으로 환경변수 전달하기
```json
{
// (...)
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "start": "MONGO_USER=eonsu-1 MONGO_PASSWORD=SJE6LQ5Ym2Si97l9 MONGO_DEFAULT_DATABASE=shop STRIPE_KEY=pk_test_6IeRsE2fRff4tKxW43jvYWLH00jdPkscwg node app.js",
    "start-server": "node app.js",
    "start:dev": "nodemon app.js"
  },
// (...)
}
```
* start에 보이는 것처럼 key=value 형식으로 환경변수를 넘겨줄수도 있다

---

### lecture 448. Setting Secure Response Headers with Helmet

Helmet
* Secure Header를 제공해주는 서드파티 라이브러리
* 헬멧 설치하기
```terminal
$ npm i --save helmet
```
* 헬멧을 앱에 적용하기
```js
// app.js
(...)
const helmet = require('helmet');
(...)
app.use(helmet());
(...)
```
* 헤더목록 확인하기
```txt
// 헬멧을 적용한 응답 헤더들
Connection: keep-alive
Date: Sun, 02 Jun 2019 11:01:08 GMT
ETag: W/"71e-ng+hvVQZwOJeE93qI+5bT+RF1/4"
Strict-Transport-Security: max-age=15552000; includeSubDomains
X-Content-Type-Options: nosniff
X-DNS-Prefetch-Control: off
X-Download-Options: noopen
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 1; mode=block

// 헬멧 미적용 응답 헤더들
Connection: keep-alive
Date: Sun, 02 Jun 2019 11:02:15 GMT
ETag: W/"71e-ng+hvVQZwOJeE93qI+5bT+RF1/4"
X-Powered-By: Express
```

---

### lecture 449. Compressing Assets

응답 속도 최적화를 위해 압축하기
* expressjs/compression 라이브러리 설치하기
```terminal
$ npm i --save compression
```
* 압축 적용하기
```js
// app.js
(...)
const compression = require('compression');
(...)
app.use(compression());
(...)
```

---

### lecture 450. Setting Up Request Logging

요청에 대한 로그를 작성하기
* 로깅을 도와주는 라이브러리 설치
```terminal
$ npm i --save morgan
```
* 앱에 morgan 적용하기
```js
// app.js
(...)
const morgan = require('morgan');
(...)
app.use(morgan('combined'));
(...)
```
* 앱을 실행하고 특정 엔드포인트에 접속해보면 콘솔에 로그가 찍히는 것을 볼 수 있다

파일에 로그 목록 저장하기
```js
// app.js
(...)
const fs = require('fs');
(...)
const accessLogStream = fs.createWriteStream(
  path.join(__dirname, 'access.log'),
  { flags: 'a' }
);

app.use(morgan('combined', { stream: accessLogStream }));
(...)
```
* 다시 앱에 접속해보면 access.log 파일에 로그목록이 저장된다

Node앱에 로그 적용하는 방법을 깊게 알아보기
* https://blog.risingstack.com/node-js-logging-tutorial/

---

### lecture 452. Setting Up a SSL Server

SSL/TLS 사용하기
* SSL을 적용하지 않은 HTTP 트랜잭션
  - Client <- Data -> Server
  - 악의적인 의도를 가진 해커가 데이터를 쉽게 도청할 수 있다
* SSL을 적용한 HTTP 트랜잭션
  - 데이터를 도청하더라도 암호화되어있어 서버에 저장된 Private Key가 없으면 해석이 어렵다
* Public Key, Private Key
  - Public Key는 SSL Certificate에 인증하기 위해 바인딩되는 키다
  - SSL은 서버에서 받은 Public Key를 Client에 보내준다
  - Public Key를 받은 Client가 서버에 요청을 보내면 암호화된 데이터와 이를 해독할 수 있는 Private Key를 보낸다

이후의 내용들
* openssl로 직접 SSL설정을 하는 내용이다
* 필요할 때 다시 찾아보자

---

### lecture 453 ~ 455. 헤로쿠에 배포하는 내용들

프로덕션용으로 헤로쿠는 잘 사용하지 않는다
* 굳이 정리할 필요가 없어보인다
* 혹시라도 필요해질 때 다시 보자

다른 서비스 프로바이더
* AWS
  - https://aws.amazon.com/getting-started/projects/deploy-nodejs-web-app/

SPA 배포 팁
* https://medium.com/@baphemot/understanding-react-deployment-5a717d4378fd

---