# Section 27. Understanding Websockets & Socket.io

### lecture 403. Websocket Overview - An Overview

Websocket
* 채팅과 같은 리얼타임 통신을 위해 HTTP 핸드쉐이크로 업그레이드된 프로토콜
* HTTP는 클라이언트와 서버 간의 요청과 응답 구조로 되어있다
* 웹소켓은 서버가 클라이언트에게 데이터를 푸쉬하는 구조다
* 물론 HTTP 방식의 통신과 웹소켓 방식의 통신을 같은 앱에서 모두 사용할 수 있다

---

### lecture 404. Setting up Socket.io on the Server

Socket.io
* 웹소켓을 편리하게 사용할 수 있는 기능들을 내장하고 있는 라이브러리
* 설치하기
```terminal
$ npm i --save socket.io
```

기본설정
```js
// app.js
(...)
mongoose.connect(MONGODB_URI, { useNewUrlParser: true })
  .then(_ => {
    const server = app.listen(8080);
    const io = require('socket.io')(server);
    io.on('connection', socket => {
      console.log('Client connected.');
    });
  })
  .catch(err => console.log(err));
```
* 서버를 특정 포트에 대기시키는 listen메서드를 적용한 코드를 변수로 캐싱한다
* 그 다음 socket.io라이브러리를 불러와 함수의 인자로 넘겨준다
* 이렇게 설정된 socket.io 객체는 on 메서드를 통해 웹소켓 연결을 대기한다
* 물론 아직 클라이언트 사이드 코드가 없으므로 웹소켓이 작동하지 않은 상태다

---

### lecture 405. Establishing a Connection From the Client

클라이언트 사이드에 socket.io클라이언트 라이브러리 적용하기
* 설치
```terminal
$ npm i --save socket.io-client
```
* 서버와 연결하기
```js
// pages/Feed/Feed.js
import openSocket from 'socket.io-client';
(...)
componentDidMount() {
    (...)
    this.loadPosts();
    openSocket('http://localhost:8080');
}
(...)
```
* socket.io-client에서 가져온 함수의 인자로 서버의 uri를 입력한다
* 그러면 서버측의 socket.io가 대기하고 있으면 앞서 설명했던 바와 같이 내부적으로 핸드쉐이크를 통해 프로토콜을 업그레이드 한다

---

### lecture 407. Sharing the IO Instance Across Files

앞서 작성한 서버측 소켓IO코드의 문제점
* 다른 컨트롤러에서 app.js에서 설정한 소켓io객체를 가져다 쓰기 어렵다
* 외부 파일로 소켓IO객체를 빼내서 여러 곳에서 해당파일만 참조하는 것으로 변경하는 것이 효율적이다

```js
// socket.js
let io;

module.exports = {
  init: httpServer => {
    io = require('socket.io')(httpServer);
    return io;
  },
  getIO: _ => {
    if (!io) {
      throw new Error('Socket.io not initialized!');
    }
    return io;
  }
}
```

```js
// app.js
(...)
mongoose.connect(MONGODB_URI, { useNewUrlParser: true })
  .then(_ => {
    const server = app.listen(8080);
    const io = require('./socket')(server);
    io.on('connection', socket => {
      console.log('Client connected.');
    });
  })
  .catch(err => console.log(err));
```

---

### lecture 408. Synchronizing POST Additions

소켓IO를 POST요청 도중에 사용하기
```js
// controllers/feed.js
(...)
const io = require('../socket');
(...)
exports.createPost = async (req, res, next) => {
  (...)
  try {
    await post.save();
    const user = await User.findById(req.userId);

    creator = user;
    user.posts.push(thePost);
    await user.save();
    io.getIO.emit('posts', {
      action: 'create',
      post: post
    });

    res.status(201).json({
      message: 'Post created successfully!',
      post,
      creator: {
        _id: creator._id,
        name: creator.name
      }
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    throw err;
  }
};
(...)
```
* emit은 첫번째 인자로 보낸 소켓에 대기중인 클라이언트에 메시지를 보낸다
  - broadcast는 요청을 보낸 클라이언트 이외의 사람들에게만 메시지를 전송한다
* 두번째 인자로 자바스크립트 객체를 사용해 보내고자하는 데이터를 전송한다

클라이언트에서 서버의 응답을 받기
```js
// pages/Feed/Feed.js
(...)
componentDidMount() {
    fetch('http://localhost:8080/auth/status', {
      headers: {
        Authorization: 'Bearer ' + this.props.token;
      }
    })
      .then(res => {
        if (res.status !== 200) {
          throw new Error('Failed to fetch user status.');
        }
        return res.json();
      })
      .then(resData => {
        this.setState({ status: resData.status });
      })
      .catch(this.catchError);

    this.loadPosts();
    const socket = openSocket('http://localhost:8080');
    socket.on('posts', data => {
      if (data.action === 'create') {
        this.addPost(data.post);
      }
    });
  }

addPost = post => {
    this.setState(prevState => {
      const updatedPosts = [...prevState.posts];
      if (prevState.postPage === 1) {
        updatedPosts.pop();
        updatedPosts.unshift(post);
      }
      return {
        posts: updatedPosts,
        totalPosts: prevState.totalPosts + 1
      };
    })
  }
(...)
```
* 서버와 같이 on메서드를 이용해 첫번째 인자로 이벤트 이름을 입력해 대기한다
* addPost로 posts를 갱신해 어떤 사람이 포스트를 생성하면 다른 사람의 페이지에서도 생성된 포스트가 갱신되도록 한다

---