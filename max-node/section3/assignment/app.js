const http = require('http');

/*
1. 포트 3000번에 서버를 생성
2. '/', '/users 두 개의 라우터를 설정한다
  - '/' 라우터로 접속하면 임의의 환영 인사(some greeting text)를 보여준다
  - '/users' 라우터로 접속하면 더미 유저 리스트를 보여준다(ex.<ul><li>User 1</li></ul>)
3. '/' 라우터로 접속했을 때 username을 입력하는 input 태그를 만든다. 제출하면 POST 메소드로 '/create-user'로 요청을 보낸다
4. '/create-user' 라우터를 설정하고 외부에서 들어오는 데이터를 파싱해서 간단한 로그를 출력한다
  - 이후 '/'이나 '/users' 라우터로 리다이렉팅한다
*/

const server = http.createServer((req, res) => {
  const url = req.url;

  if (url === '/') {
    res.setHeader('Content-Type', 'text/html');
    res.write('<html>');
    res.write('<head><title>Section3 Assignment</title></head>');
    res.write('<body>');
    res.write('<h1>Hello Section3 Assignment</h1>');
    res.write('<form action="/create-user" method="POST"><input type="text" name="username" /><input type="submit" /></form>');
    res.write('</body>');
    res.write('</html>');
    return res.end();
  }
  else if (url === '/users') {
    res.setHeader('Content-Type', 'text/html');
    res.write('<html>');
    res.write('<head><title>Section3 Assignment</title></head>');
    res.write('<body>');
    res.write('<ul><li>User 1</li><li>User 2</li><li>User 3</li></ul>');
    res.write('</body>');
    res.write('</html>');
    return res.end();
  }
  else if (url === '/create-user') {
    let username;
    req.on('data', chunk => {
      username = `${chunk}`.split('=')[1];
    });
    return req.on('end', _ => {
      console.log(`Welcome, ${username}`);
      res.statusCode = 302;
      res.setHeader('Location', '/');
      res.end();
    })
  }
});

server.listen(3000);