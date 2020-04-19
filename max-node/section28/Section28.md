# Section 28. Working with GraphQL

### lecture 416. What is GraphQL?

REST API와 GraphQL의 공통점과 차이점
* 공통점
  - 상태가 없으면서(stateless) 클라이언트에 독립적인 데이터를 전송하는 API
* 차이점
  - GraphQL은 Higher Query Flexibility한 특성을 추가로 가지고 있다
  - 이게 무슨 말인지 이해하려면 REST API의 한계를 먼저 인지해야 한다

REST API의 한계
* GET /post 엔드포인트로 요청을 보냈다고 가정해보자
```json
{
  "id": "1",
  "title": "first post",
  "content": "...",
  "creator": "{...}"
}
```
* 위와 유사한 형식의 응답이 반환될 것이다
* 그런데 만약 위 응답에서 id와 title만 필요하고 다른 정보는 받고 싶지 않다면 어떻게 요청할 수 있을까?
  - 혹은 웹에서는 content까지만 필요하고 모바일에서는 creator까지 모두 필요하다면?
* 해결책 1
  - GET /post-slim 같은 엔드포인트를 추가로 만든다
  - 그러나 지나치게 엔드포인트가 많아지고 포스트 관련 로직에 수정이 필요할때마다 수정범위 또한 증가한다
* 해결책 2
  - GET /post?data=slim 같이 쿼리파라미터를 이용할 수 있다
  - 그러나 쿼리파라미터에 따른 분기가 많아져서 해당 엔드포인트를 이해하기 어려워진다
* 해결책 3
  - GraphQL을 사용하기
  - 클라이언트 측에서 특정한 쿼리를 포함한 요청을 하면 백엔드에서 요청에 알맞게 파싱한 데이터를 응답한다
  - 클라이언트 측에서 SQL과 같은 문법으로 쿼리를 작성해야 한다

GraphQL은 어떻게 작동하는가?
* 클라이언트는 오직 POST /graphql 엔드포인트로만 요청을 보낸다
* POST 요청의 body에 응답받고 싶은 데이터의 구조를 정의한 쿼리를 포함시킨다
* 쿼리문 예시
```js
{
  query {
    user {
      name
      age
    }
  }
}
```
* query는 오퍼레이션 타입으로 데이터를 받을 때 사용한다
  - 다른 타입으로는 mutation과 subscription이 있다
  - mutation은 생성, 수정 혹은 삭제와 관련된 작업을 할 때 사용한다
  - subscription은 웹소켓을 이용한 리얼타임 연결을 세팅할 때 사용한다
* user는 오퍼레이션 엔드포인트로 백엔드에서 찾아 실행하려는 대상을 지정한다
* name과 age는 요청 필드(Requested fields)로 받고자하는 데이터 필드들을 지정한다
* 서버에서는 요청의 body를 분석해 데이터를 반환한다
  - 이를 Resolver라고 부른다
  - 기존 Node.js서버의 구조로 치환하자면 GraphQL의 오퍼레이션 타입(query, mutation, subscription)이 라우터이고 서버의 Resolver가 컨트롤러에 해당한다고 볼 수 있다

---

### lecture 417. Understanding the Setup & Writing our First Query

GraphQL을 적용하기 위해 기존 프로젝트에서 수정할 것들
* socket.io와 관련된 로직을 전부 걷어내기
* auth, feed 라우터는 GraphQL엔드포인트를 사용하므로 더 이상 사용하지 않는다
  - routes 폴더를 삭제한다
  - app.js에서 라우터를 불러오는 라인들을 삭제한다

GraphQL 설치하기
```terminal
$ npm i --save graphql express-graphql
```
* graphql은 graphql 쿼리문의 스키마를 정의할 때 사용하는 라이브러리다
* express-graphql은 graphql요청을 받을 때 이를 해석하는 서버측 기능을 가진 라이브러리다

스키마 작성하기
```js
// graphql/schema.js
const { buildSchema } = require('graphql');

module.exports = buildSchema(`
  type TestData {
    text: String!
    views: Int!
  }

  type RootQuery {
    hello: TestData
  }

  schema {
    query: RootQuery
  }
`);
```
* graphql의 buildSchema 함수를 import한다
* buildSchema함수의 인자에 백틱(`)을 사용해 쿼리문을 작성한다
* type을 이용하면 여러 서브쿼리를 만들 수 있다
  - type 뒤에 서브쿼리의 이름을 지정하면 이를 변수처럼 다른 쿼리문에서 사용할 수 있다
* 특정 key에 타입을 지정하고 !를 뒤에 붙이면 해당 타입의 값으로 리턴하지 않을시 오류를 발생시킨다
* 위 쿼리를 정리하자면 다음과 같다
```js
{
  query {
    hello {
      text
      views
    }
  }
}
```

리졸버 작성하기
```js
// graphql/resolvers.js
module.exports = {
  hello() {
    return {
      text: 'Hello World',
      views: 1245
    }
  }
};
```

작성한 스키마와 리졸버를 노드앱에 적용하기
```js
// app.js
(...)
const graphqlHttp = require('express-graphql');
const graphqlSchema = require('./graphql/schema');
const graphqlResolver = require('./graphql/resolvers');
(...)
app.use(
  '/graphql', 
  graphqlHttp({
    schema: graphqlSchema,
    rootValue: graphqlResolver
  })
);
(...)
```
* express-graphql 패키지를 임포트한다
* 이 패키지는 자바스크립트 오브젝트를 인자로 받는데, 여기에 스키마에 해당하는 schema와 리졸버에 해당하는 rootValue를 지정한다

Postman으로 요청 보내기
* POST /graphql를 엔드포인트로 지정한다
* body에 raw형식으로 다음과 같은 쿼리문을 작성한다
```json
{
	"query": "{ hello { text } }"
}
```
* hello라는 오퍼레이션 엔드포인트에서 text라는 오퍼레이션 필드만 받는 쿼리문이다
* 다음과 같은 응답이 반환되는 것을 확인할 수 있다
```json
{
    "data": {
        "hello": {
            "text": "Hello World"
        }
    }
}
```
* 만약 views를 추가한 쿼리를 보낸다면
```json
{
	"query": "{ hello { text views } }"
}
```
* 다음과 같은 응답이 반환된다
```json
{
    "data": {
        "hello": {
            "text": "Hello World",
            "views": 1245
        }
    }
}
```

---

### lecture 418. Defining a Mutation Schema

기존 리액트 프론트엔드 페이지에서 graphql 요청하기
* 먼저 Feed.js에 있는 소켓io로직부터 걷어내자
* 그 다음 App.js에서 회원가입을 처리하는 signupHandler가 작동하도록 만들자

스키마 작성하기
```js
// graphql/schema.js
const { buildSchema } = require('graphql');

module.exports = buildSchema(`
  type Post {
    _id: ID!
    title: String!
    content: String!
    imageUrl: String!
    creator: User!
    createdAt: String!
    updatedAt: String!
  }

  type User {
    _id: ID!
    name: String!
    email: String!
    password: String
    status: String!
    posts: [Post!]!
  }

  input UserInputData {
    email: String!
    name: String!
    password: String!
  }

  type RootMutation {
    createUser(userInput: UserInputData): User!
  }  

  schema {
    mutation: RootMutation
  }
`);
```
* createUser에 email, name, password 형식으로 직접 인자를 지정해도 된다
* 그보다 input이라는 키워드를 사용해 처리하는 것이 가독성이 좋다
* ID는 graphql에서 제공하는 id를 위한 타입이다
* User type의 password는 필수로 반환받을 필요가 없으므로 타입 뒤에 !를 추가하지 않았다

---

### lecture 419. Adding a Mutation Resolver & GraphQL

회원가입용 리졸버 작성하기
```js
// graphql/resolvers.js
const bcrypt = require('bcryptjs');

const User = require('../models/user');

module.exports = {
  createUser: async function ({ userInput }, req) {
    const existingUser = await User.findOne({ email: userInput.email });
    if (existingUser) {
      const error = new Error('User exists already!');
      throw error;
    }
    const hashedPw = await bcrypt.hash(userInput.password, 12);
    const user = new User({
      email : userInput.email,
      name : userInput.name,
      password: hashedPw
    });
    const createdUser = await user.save();
    return { ...createdUser._doc, _id: createdUser._id.toString() };
  }
};
```

graphiql옵션을 설정해 브라우저에서 엔드포인트 목록을 확인하기
```js
// app.js
(...)
app.use(
  '/graphql', 
  graphqlHttp({
    schema: graphqlSchema,
    rootValue: graphqlResolver,
    graphiql: true
  })
);
(...)
```
* 브라우저에서 http://localhost:8080/graphql로 접속해보자
* 다음과 같은 응답이 우측 화면에 나올 것이다
```json

  "errors": [
    {
      "message": "Query root type must be provided.",
      "locations": [
        {
          "line": 31,
          "column": 3
        }
      ]
    }
  ]
}
```
* 루트 쿼리를 제공해야 에러가 사라진다

루트 쿼리 작성하기
```js
// graphql/schema.js
(...)(`
(...)
type RootQuery {
  hello: String!
}

(...)

schema {
    query: RootQuery
    mutation: RootMutation
  }
`);

// graphql/resolvers.js
(...)
module.exports = {
  hello() {
    return "Hello World!";
  },
  (...)
};
```
* 다시 http://localhost:8080/graphql에 접속하면 에러메시지가 사라지고 Documentation Explorer에 작성한 graphql엔드포인트 목록이 보일 것이다

왼쪽 쿼리문을 입력하는 창에 다음 쿼리문을 입력하고 ctrl + Enter 키를 눌러보자
```js
mutation {
  createUser(userInput: {email: "test1234@naver.com", name: "eonsu", password: "tester"}) {
    _id
    email 
  }
}
```
* 다음과 같은 응답이 반환될 것이다
```js
{
  "data": {
    "createUser": {
      "_id": "5cea10b573f50303443ebdec",
      "email": "test1234@naver.com"
    }
  }
}
```

---

### lecture 420. Adding Input Validation

앞서 작성했던 밸리데이션 코드들
* 라우터마다 직접 로직에 맞게 코드를 작성했었다
* 그러나 graphql은 라우터가 POST /graphql로 단일하므로 이전과 똑같이 밸리데이션을 작성할 수는 없다
* graphql은 밸리데이션 코드를 리졸버 로직에 추가해야 한다
* graphql을 위한 밸리데이션 라이브러리 설치하기
```terminal
$ npm i --save validator
```
* 앞서 사용해왔던 express-validator의 뒷단에서 사용하던 라이브러리로 기본 검증법은 같다

리졸버 코드에 밸리데이션 추가하기
```js
// graphql/resolvers.js
(...)
const validator = require('validator');
(...)

module.exports = {
  (...)
  createUser: async function ({ userInput }, req) {
    const existingUser = await User.findOne({ email: userInput.email });
    const errors = [];
    if (!validator.isEmail(userInput.email)) {
      errors.push({ message : 'E-mail is invalid.'});
    }
    if (
      validator.isEmpty(userInput.password) || 
      !validator.isLength(userInput.password, { min : 5 })
    ) {
      errors.push({ message: 'Password too short!' });
    }
    if (errors.length > 0) {
      const error = new Error('Invalid Input');
      throw error;
    }
    (...)
  }
};
```

---

### lecture 421. Handling Errors

앞서 작성한 밸리데이션 코드의 결과
* 잘못된 입력값을 보내면 다음과 같은 데이터가 반환된다
```json
{
  "errors": [
    {
      "message": "Invalid Input",
      "locations": [
        {
          "line": 31,
          "column": 3
        }
      ],
      "path": [
        "createUser"
      ]
    }
  ],
  "data": null
}
```
* 앞서 작성한 밸리데이션 코드에서 최후의 Error객체의 인자로 넘긴 문자열만 출력된다
* 그러나 보다 자세한 에러 메시지를 확인하고 싶은 때가 있다

formatError옵션을 추가해 자세한 에러 메시지 확인하기
* 우선 리졸버 코드의 에러 객체에 프로퍼티로 보다 자세한 에러정보들을 추가하기
```js
// graphql/resolvers.js
(...)
module.exports = {
  (...)
  createUser: async function ({ userInput }, req) {
    (...)
    if (errors.length > 0) {
      const error = new Error('Invalid Input');
      error.data = errors;
      error.code = 422;
      throw error;
    }
    (...)
  }
};
```
* data프로퍼티에 앞서 추가했던 에러 정보들을 담은 배열을 캐싱한다
* code프로퍼티에 잘못된 유저입력시 반환하는 코드인 422를 캐싱한다
* 이제 formatError옵션에 위에서 추가한 에러정보들을 사용하자
```js
// app.js
(...)
app.use(
  '/graphql', 
  graphqlHttp({
    schema: graphqlSchema,
    rootValue: graphqlResolver,
    graphiql: true,
    customFormatErrorFn(err) {
      if (!err.originalError) {
        throw err;
      }
      const data = err.originalError.data;
      const message = err.message || 'An error occurred.';
      const code = err.originalError.code || 500;
      return { message: message, status: code, data: data };
    }
  })
);
(...)
```
* 강의에서는 formatError함수를 사용했으나 이는 현재 deprecated됐다
* 앞으로는 customFormatErrorFn을 사용하자

다시 잘못된 입력값으로 요청을 보내면 다음과 같은 결과가 반환된다
```json
{
  "errors": [
    {
      "message": "Invalid Input",
      "status": 422,
      "data": [
        {
          "message": "Password too short!"
        }
      ]
    }
  ],
  "data": null
}
```

---

### lecture 422. Connecting the Frontend to the GraphQL API

리액트 프로젝트의 회원가입 요청 핸들러에 grapql 적용하기
```js
// App.js
(...)
signupHandler = (event, authData) => {
    event.preventDefault();
    this.setState({ authLoading: true });
    const grapqlQuery = {
      query: `
        mutation {
          createUser(userInput: { 
            email : "${authData.signupForm.email.value}" 
            password : "${authData.signupForm.password.value}"
            name: "${authData.signupForm.name.value}"
          }) {
            _id
            email
          }
        }
      `
    };
    fetch('http://localhost:8080/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(grapqlQuery)
    })
      .then(res => {
        return res.json();
      })
      .then(resData => {
        if (resData.errors && resData.errors[0].status === 422) {
          throw new Error(
            "Validation failed. Make sure the email address isn't used yet!"
          );
        }
        if (resData.errors) {
          throw new Error('User creation failed!');
        }
        console.log(resData);
        this.setState({ isAuth: false, authLoading: false });
        this.props.history.replace('/');
      })
      .catch(err => {
        console.log(err);
        this.setState({
          isAuth: false,
          authLoading: false,
          error: err
        });
      });
  };
(...)
```

브라우저가 POST 요청 이전에 OPTIONS 요청을 보낼 때 graphql이 발생시키는 에러를 방지하기
```js
// app.js
(...)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'OPTIONS, GET, POST, PUT, PATCH, DELETE'
  );
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { // 추가
    return res.sendStatus(200);
  }
  next();
});
(...)
```
* graphql은 GET, POST가 아니면 METHOD NOT ALLOWED(405) 에러를 발생시킨다
* 따라서 브라우저가 OPTIONS로 요청을 보내면 에러를 발생시키는데 이를 방지하기 위해 분기문을 추가했다

---

### lecture 423. Adding a Login Query & a Resolver

로그인 스키마 작성하기
```js
// graphql/schema.js
(...)`
  type AuthData {
    token: String!
    userId: String!
  }

  type RootQuery {
    login(email: String!, password: String!): AuthData!
  }

  schema {
    query: RootQuery
    mutation: RootMutation
  }
`
```

로그인 리졸버 작성하기
```js
// graphql/resolvers.js
(...)
const jwt = require('jsonwebtoken');
(...)
module.exports = {
  login: async function ({ email, password }) {
    const user = await User.findOne({ email });
    if (!user) {
      const error = new Error('User not found.');
      error.code = 401;
      throw error;
    }
    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      const error = new Error('Password is incorrect.');
      error.code = 401;
      throw error;
    }
    const token = jwt.sign({
      userId: user._id.toString(),
      email: user.email
    }, 'somesupersecretsecret', 
    { expiresIn: '1h' });
    return {
      token,
      userId: user._id.toString()
    }
  },
(...)
```

---

### lecture 424. Adding Login Functionality

리액트 프로젝트에서 로그인 핸들러 작성하기
```js
// App.js
(...)
loginHandler = (event, authData) => {
    event.preventDefault();
    this.setState({ authLoading: true });
    const graphqlQuery = {
      query: `
        {
          login (
            email : "${authData.email}"
            password : "${authData.password}"
          ) {
            token
            userId
          }
        }
      `
    };
    fetch('http://localhost:8080/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(graphqlQuery)
    })
      .then(res => {
        return res.json();
      })
      .then(resData => {
        if (resData.errors && resData.errors[0].status === 422) {
          throw new Error(
            "Validation failed. Make sure the email address or password!"
          );
        }
        if (resData.errors) {
          throw new Error('User login failed!');
        }
        console.log(resData);
        this.setState({
          isAuth: true,
          token: resData.data.login.token,
          authLoading: false,
          userId: resData.data.login.userId
        });
        localStorage.setItem('token', resData.data.login.token);
        localStorage.setItem('userId', resData.data.login.userId);
        const remainingMilliseconds = 60 * 60 * 1000;
        const expiryDate = new Date(
          new Date().getTime() + remainingMilliseconds
        );
        localStorage.setItem('expiryDate', expiryDate.toISOString());
        this.setAutoLogout(remainingMilliseconds);
      })
      .catch(err => {
        console.log(err);
        this.setState({
          isAuth: false,
          authLoading: false,
          error: err
        });
      });
  };
(...)
```

---

### lecture 425. Adding a Craete Post Mutation

Post를 생성하는 스키마 작성하기
```js
// graphql/schema.js
(...)`
  input PostInputData {
    title: String!
    content: String!
    imageUrl: String!
  }

  type RootMutation {
    createUser(userInput: UserInputData): User!
    createPost(postInput: PostInputData): Post!
  }  

  schema {
    query: RootQuery
    mutation: RootMutation
  }
`
```

작성한 스키마에 맞게 리졸버 작성하기
```js
// graphql/resolvers.js
(...)
createPost: async function ({ postInput }, req) {
    const errors = [];
    if (
      validator.isEmpty(postInput.title) || 
      !validator.isLength(postInput.title, { min : 5 })
    ) {
      errors.push({ message : 'Title is invalid' });
    }
    if (
      validator.isEmpty(postInput.content) || 
      !validator.isLength(postInput.content, { min : 5 })
    ) {
      errors.push({ message : 'Content is invalid' });
    }
    if (errors.length > 0) {
      const error = new Error('Invalid Input');
      error.data = errors;
      error.code = 422;
      throw error;
    }

    const post = new Post({
      title : postInput.title,
      content : postInput.content,
      imageUrl : postInput.imageUrl
    });
    const createdPost = await post.save();
    return {
      ...createdPost._doc, 
      _id : createdPost._id.toString(), 
      createdAt: createdPost.createdAt.toISOString(), 
      updatedAt: createdPost.updatedAt.toISOString()
    };
  }
(...)
```
* graphiql에서 다음과 같은 쿼리로 간단히 테스트해보자
```js
mutation {
  createPost(postInput : {
    title : "test title", 
    content: "test content", 
    imageUrl: "bs1.jpg"
  }) {
    _id,
    title 
    content
    imageUrl
    creator {
      password
    }
    createdAt
    updatedAt
  }
}
```
* 요청을 보내면 다음과 같은 에러메시지가 출력될 것이다

```json
{
  "errors": [
    {
      "message": "Post validation failed: creator: Path `creator` is required.",
      "status": 500
    }
  ],
  "data": null
}
```
* 포스트를 생성한 유저와 관련된 정보를 처리하고 있지 않기 때문에 에러가 발생하고 있다

---

### lecture 426. Extracting User Data From the Auth Token

REST API와 마찬가지로 Authorization 헤더에 추출한 토큰을 사용해 유저 정보를 얻어오기
* 우선 middleware/is-auth.js를 auth.js로 이름을 변경한다
* 원 코드를 다음처럼 변경하자
```js
// original code - middleware/is-auth.js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.get('Authorization');
  if (!authHeader) {
    const error = new Error('Not authenticated.');
    error.statusCode = 401;
    throw error;
  }
  const token = authHeader.split(' ')[1];
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, 'somesupersecretsecret');
  } catch (err) {
    err.statusCode = 500;
    throw err;
  }
  if (!decodedToken) {
    const error = new Error('Not authenticated.');
    error.statusCode = 401;
    throw error;
  }
  req.userId = decodedToken.userId;
  next();
};
```
```js
// updated code - middleware/auth.js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.get('Authorization');
  if (!authHeader) {
    req.isAuth = false;
    return next();
  }
  const token = authHeader.split(' ')[1];
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, 'somesupersecretsecret');
  } catch (err) {
    req.isAuth = false;
    throw next();
  }
  if (!decodedToken) {
    req.isAuth = false;
  }
  req.userId = decodedToken.userId;
  req.isAuth = true;
  next();
};
```
* 바로 에러를 발생시키지 않고 다른 미들웨어에서 추가적으로 인증관련 처리를 하도록 변경했다

```js
// app.js
(...)
const auth = require('./middleware/auth'); // 추가
(...)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'OPTIONS, GET, POST, PUT, PATCH, DELETE'
  );
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});
app.use(auth); // 추가

app.use(
  '/graphql', 
(...)
```

```js
// graphql/resolvers.js
(...)
createPost: async function ({ postInput }, req) {
    if (!req.isAuth) {
      const error = new Error('Authentication failed.');
      error.code = 401;
      throw error;
    }
    const errors = [];
    if (
      validator.isEmpty(postInput.title) || 
      !validator.isLength(postInput.title, { min : 5 })
    ) {
      errors.push({ message : 'Title is invalid' });
    }
    if (
      validator.isEmpty(postInput.content) || 
      !validator.isLength(postInput.content, { min : 5 })
    ) {
      errors.push({ message : 'Content is invalid' });
    }
    if (errors.length > 0) {
      const error = new Error('Invalid Input');
      error.data = errors;
      error.code = 422;
      throw error;
    }
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error('Invalid User');
      error.code = 401;
      throw error;
    }
    const post = new Post({
      title : postInput.title,
      content : postInput.content,
      imageUrl : postInput.imageUrl,
      creator: user
    });
    const createdPost = await post.save();
    user.posts.push(createdPost);
    await user.save();
    return {
      ...createdPost._doc, 
      _id : createdPost._id.toString(), 
      createdAt: createdPost.createdAt.toISOString(), 
      updatedAt: createdPost.updatedAt.toISOString()
    };
  }
(...)
```
* req.isAuth가 false이면 에러를 throw한다
* 앞서 auth.js 미들웨어에서 디코딩한 토큰을 이용해 req.userId로 지정했던 _id값으로 유저정보를 검색한다
* 유저가 없으면 에러를 발생시킨다
* 포스트를 생성할 때 creator 필드에 유저를 추가하고 포스트를 저장한 뒤 유저정보에도 저장된 포스트를 저장한다

---

### lecture 427. Sending the "Create Post" Query

Feed 컴포넌트에서 포스트를 생성하는 핸들러에 graphql 쿼리문 작성하기
```js
// Feed.js
(...)
finishEditHandler = postData => {
    this.setState({
      editLoading: true
    });
    const formData = new FormData();
    formData.append('title', postData.title);
    formData.append('content', postData.content);
    formData.append('image', postData.image);

    let graphqlQuery = {
      query: `
        mutation {
          createPost(postInput: {
            title: "${postData.title}"
            content: "${postData.content}"
            imageUrl: "some url"
          }) {
            _id 
            title 
            content 
            imageUrl 
            creator {
              name
            }
            createdAt 
            updatedAt 
          }
        }
      `
    };

    fetch('http://localhost:8080/graphql', {
      method: 'POST',
      body: JSON.stringify(graphqlQuery),
      headers: {
        Authorization: 'Bearer ' + this.props.token,
        'Content-Type': 'application/json'
      }
    })
      .then(res => {
        return res.json();
      })
      .then(resData => {
        if (resData.errors && resData.errors[0].status === 422) {
          throw new Error(
            "Validation failed. Make sure the email address or password!"
          );
        }
        if (resData.errors) {
          throw new Error('User login failed!');
        }
        console.log(resData);
        const post = {
          _id: resData.data.createPost._id,
          title: resData.data.createPost.title,
          content: resData.data.createPost.content,
          creator: resData.data.createPost.creator,
          createdAt: resData.data.createPost.createdAt
        };
        this.setState(prevState => {
          return {
            isEditing: false,
            editPost: null,
            editLoading: false
          };
        });
      })
      .catch(err => {
        console.log(err);
        this.setState({
          isEditing: false,
          editPost: null,
          editLoading: false,
          error: err
        });
      });
  };
(...)
```

---

### lecture 429. Adding a "Get Post" Query & Resolver

포스트 목록을 가져오는 스키마 작성하기
```js
// graphql/schema.js
(...)`
type PostData {
    posts: [Post!]!
    totalPosts: Int!
}
(...)
type RootQuery {
    login(email: String!, password: String!): AuthData!
    posts: PostData!
}
(...)
`
```

리졸버 작성하기
```js
// graphql/resolvers.js
(...)
  posts: async function(args, req) {
    if (!req.isAuth) {
      const error = new Error('Authentication failed.');
      error.code = 401;
      throw error;
    }
    const totalPosts = await Post.find().countDocuments();
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate('creator');
    return {
      posts: posts.map(p => {
        return {...p._doc,
          _id: p._id.toString,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString()
        };
      }),
      totalPosts
    };
  }
(...)
```

---

### lecture 430. Sending "Create Post" and "Get Post" Queries

리액트 프로젝트에서 포스트를 로딩하는 핸들러 수정하기
```js
// Feed.js
(...)
loadPosts = direction => {
    if (direction) {
      this.setState({ postsLoading: true, posts: [] });
    }
    let page = this.state.postPage;
    if (direction === 'next') {
      page++;
      this.setState({ postPage: page });
    }
    if (direction === 'previous') {
      page--;
      this.setState({ postPage: page });
    }
    const graphqlQuery = {
      query: `
        {
          posts {
            posts {
              _id
              title
              content
              creator {
                name
              }
              createdAt
            }
            totalPosts
          }
        }
      `
    };
    fetch('http://localhost:8080/graphql', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + this.props.token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(graphqlQuery)
    })
      .then(res => {
        return res.json();
      })
      .then(resData => {
        console.log(resData);
        if (resData.errors) {
          throw new Error('Fetching Post failed!');
        }
        this.setState({
          posts: resData.data.posts.posts.map(post => {
            return {
              ...post,
              imagePath: post.imageUrl
            };
          }),
          totalPosts: resData.data.posts.totalPosts,
          postsLoading: false
        });
      })
      .catch(this.catchError);
  };
(...)
```

포스트를 생성하거나 수정시 수정된 포스트 목록을 반영하도록 핸들러 수정하기
```js
// Feed.js
(...)
finishEditHandler = postData => {
    this.setState({
      editLoading: true
    });
    const formData = new FormData();
    formData.append('title', postData.title);
    formData.append('content', postData.content);
    formData.append('image', postData.image);

    let graphqlQuery = {
      query: `
        mutation {
          createPost(postInput: {
            title: "${postData.title}"
            content: "${postData.content}"
            imageUrl: "some url"
          }) {
            _id 
            title 
            content 
            imageUrl 
            creator {
              name
            }
            createdAt 
            updatedAt 
          }
        }
      `
    };

    fetch('http://localhost:8080/graphql', {
      method: 'POST',
      body: JSON.stringify(graphqlQuery),
      headers: {
        Authorization: 'Bearer ' + this.props.token,
        'Content-Type': 'application/json'
      }
    })
      .then(res => {
        return res.json();
      })
      .then(resData => {
        if (resData.errors && resData.errors[0].status === 422) {
          throw new Error(
            "Validation failed. Make sure the email address or password!"
          );
        }
        if (resData.errors) {
          throw new Error('User login failed!');
        }
        console.log(resData);
        const post = {
          _id: resData.data.createPost._id,
          title: resData.data.createPost.title,
          content: resData.data.createPost.content,
          creator: resData.data.createPost.creator,
          createdAt: resData.data.createPost.createdAt
        };
        this.setState(prevState => {
          let updatedPosts = [...prevState.posts];
          if (prevState.editPost) {
            const postIndex = prevState.posts.findIndex(
              p => p.id === prevState.editPost._id
            );
            updatedPosts[postIndex] = post;
          } else {
            updatedPosts.unshift(post);
          }
          return {
            posts: updatedPosts,
            isEditing: false,
            editPost: null,
            editLoading: false
          };
        });
      })
      .catch(err => {
        console.log(err);
        this.setState({
          isEditing: false,
          editPost: null,
          editLoading: false,
          error: err
        });
      });
  };
(...)
```

---

### lecture 431. Adding Pagination

GraphQL에서 페이지네이션 기능 추가하기
* 먼저 스키마에서 페이지네이션이 필요한 스키마를 찾는다
* 해당 스키마에 인자로 page를 넘겨주도록 수정한다
* 해당 스키마와 매칭되는 리졸버에 페이지네이션 로직을 작성한다
* 프론트엔드에서 쿼리문을 날릴 때 page를 인자로 넘기도록 수정한다
```js
// graphql/schema.js
(...)`
type RootQuery {
    login(email: String!, password: String!): AuthData!
    posts(page: Int!): PostData!
}`
(...)

// graphql/resolvers.js
(...)
posts: async function({ page }, req) {
    if (!req.isAuth) {
      const error = new Error('Authentication failed.');
      error.code = 401;
      throw error;
    }
    if (!page) {
      page = 1;
    }
    const perPage = 2;
    const totalPosts = await Post.find().countDocuments();
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage)
      .populate('creator');
    return {
      posts: posts.map(p => {
        return {...p._doc,
          _id: p._id.toString(),
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString()
        };
      }),
      totalPosts: totalPosts
    };
  }
(...)
```

```js
// Feed.js
loadPosts = direction => {
    (...)
    const graphqlQuery = {
      query: `
        {
          posts(page: ${page}) {
            posts {
              _id
              title
              content
              creator {
                name
              }
              createdAt
            }
            totalPosts
          }
        }
      `
    };
    (...)
}
```