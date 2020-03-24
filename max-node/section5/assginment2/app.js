const express = require('express');
const path = require('path');

const app = express();
const usersRoutes = require('./routes/users');
const indexRoutes = require('./routes/index');

/*
1. 새로운 npm project를 생성하고 express를 설치한다(노드몬도 필요하다면 설치)
2. express로 새 앱을 만들고 /와 /users 경로로 접속시 각각의 html파일을 서빙해야한다.
3. .js 혹은 .css 파일을 서빙해야 하는 html 파일당 최소 하나씩 포함시키자
*/
app.use(express.static(path.join(__dirname, 'public')));
app.use(usersRoutes);
app.use(indexRoutes);

app.listen(3000);