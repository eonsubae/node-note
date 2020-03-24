const express = require('express');
const app = express();

/*
1. 새로운 npm project를 생성하고 express를 설치한다(노드몬도 필요하다면 설치)
2. express로 새 앱을 만들고 2 개의 미들웨어를 만드는데, 미들웨어는 무언가를 콘솔에 로그로 남기고 하나의 응답을 리턴해야 한다
3. '/'와 '/users' 경로로 접속시 각각 하나의 미들웨어와 매칭되어야 한다
*/

app.use('/users', (req, res, next) => {
  console.log('users!');
  res.send('<h1>Users!!</h1>');
});

app.use('/', (req, res, next) => {
  console.log('main!');
  res.send('<h1>Main page!!</h1>');
});

app.listen(3000);