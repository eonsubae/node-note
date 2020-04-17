### lecture 367. REST APIs & The Rest of The Course

지금까지 배운 Node.js 지식들과 REST API
![REST_NODE_BASIC](../img/rest_node.png)

---

### lecture 370. Fetching Lists of Posts

만들어진 리액트 프로젝트에 맞게 서버 구성하기
* feed들을 리스팅하는 컴포넌트에는 다음과 같은 메서드가 있다
```js
// pages/Feed/Feed.js
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
    fetch('http://localhost:8080/feed/posts')
      .then(res => {
        if (res.status !== 200) {
          throw new Error('Failed to fetch posts.');
        }
        return res.json();
      })
      .then(resData => {
        this.setState({
          posts: resData.posts,
          totalPosts: resData.totalItems,
          postsLoading: false
        });
      })
      .catch(this.catchError);
  };
(...)
```
* GET /feed/posts 엔드포인트에 요청을 보낸 뒤 state를 위와 같이 변경하고 있다
* 저장해보면 개별 피드에 해당하는 Post 컴포넌트의 name 프로퍼티가 존재하지 않는다고 나온다

feed 컨트롤러를 수정하기
```js
// controllers/feed.js
exports.getPosts = (req, res, next) => {
  res.status(200).json({
    posts: [
      {
        id: '1',
        title: 'First Post', 
        content: 'This is the first post!',
        imageUrl: 'images/bs1.jpg',
        creator: {
          name: 'boksun'
        },
        createdAt: new Date()
      }
    ]
  });
};
(...)
```
* Post 컴포넌트의 프로퍼티에 맞게 데이터를 제공해 화면이 정상적으로 출력되게 만들었다

---

### lecture 371. Adding a Create Post Endpoint

새 포스트 작성하기
```js
// pages/Feed/Feed.js
(...)
finishEditHandler = postData => {
    this.setState({
      editLoading: true
    });
    // Set up data (with image!)
    let url = 'http://localhost:8080/feed/post';
    let method = 'POST';
    if (this.state.editPost) {
      url = 'URL';
    }

    fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: postData.title,
        content: postData.content
      })
    })
      .then(res => {
        if (res.status !== 200 && res.status !== 201) {
          throw new Error('Creating or editing a post failed!');
        }
        return res.json();
      })
      .then(resData => {
        const post = {
          _id: resData.post._id,
          title: resData.post.title,
          content: resData.post.content,
          creator: resData.post.creator,
          createdAt: resData.post.createdAt
        };
        this.setState(prevState => {
          let updatedPosts = [...prevState.posts];
          if (prevState.editPost) {
            const postIndex = prevState.posts.findIndex(
              p => p._id === prevState.editPost._id
            );
            updatedPosts[postIndex] = post;
          } else if (prevState.posts.length < 2) {
            updatedPosts = prevState.posts.concat(post);
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
* 아직 이미지 업로드는 구현하지 않고 제목과 내용만 받아서 서버에 요청을 보낼 것이다
* 앞서 리스팅 때와 마찬가지로 Post 컴포넌트의 형식에 맞게 서버측 코드를 변경해야 에러가 없어진다

서버 코드 변경하기
* POST /feed/post
```js
// controllers/feed.js
(...)
exports.createPost = (req, res, next) => {
  const title = req.body.title;
  const content = req.body.content;

  // Create post in db
  res.status(201).json({
    message: 'Post created successfully!',
    post: { 
      _id: new Date().toISOString(), 
      title: title, 
      content: content, 
      creator: { 
        name: 'boksun' 
      },
      createdAt: new Date() 
    }
  })
};
```

---

### lecture 372. Adding Server Side Validation

서버에 검증로직 추가하기
```terminal
$ npm i --save express-validator
```
```js
// routes/feed.js
(...)
const { body } = require('express-validator/check');
(...)
router.post(
  '/post', 
  [
    body('title').trim().isLength({ min: 5 }),
    body('content').trim().isLength({ min: 5 })
  ], 
  feedController.createPost
);
(...)

// controllers/feed.js
const { validationResult } = require('express-validator/check');
(...)
exports.createPost = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: 'Validation failed, entered data is incorrect.',
      errors: errors.array()
    })
  }

  const title = req.body.title;
  const content = req.body.content;

  // Create post in db
  res.status(201).json({
    message: 'Post created successfully!',
    post: { 
      _id: new Date().toISOString(), 
      title: title, 
      content: content, 
      creator: { 
        name: 'boksun' 
      },
      createdAt: new Date() 
    }
  })
};
```
* title이나 content의 길이가 5보다 작으면 422 상태코드와 함께 요청을 반려한다

---

### lecture 373. Setting up a Post Model

데이터베이스 연결하기
```terminal
$ npm i --save mongoose
```
```js
// app.js
(...)
const mongoose = require('mongoose');
(...)
const MONGODB_URI =
'mongodb+srv://eonsu-1:SJE6LQ5Ym2Si97l9@cluster0-iqzdk.mongodb.net/messages?retryWrites=true';
(...)

mongoose.connect(MONGODB_URI, { useNewUrlParser: true })
  .then(_ => {
    app.listen(8080);
  })
  .catch(err => console.log(err));
```
* 데이터베이스는 messages 리소스에 접속한다

Post 스키마 정의하기
```js
// models/post.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  creator: {
    type: Object,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);
```
* 스키마의 두 번째 인자로 timestamps를 true로 지정한 객체를 넘겨주면 생성일자와 수정일자를 알아서 추가해준다

---

### lecture 374. Storing Posts in the Database

Post 스키마를 이용해 입력받은 데이터를 저장하기
```js
// controllers/feed.js
(...)
const Post = require('../models/post');
(...)
exports.createPost = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: 'Validation failed, entered data is incorrect.',
      errors: errors.array()
    })
  }

  const title = req.body.title;
  const content = req.body.content;
  const post = new Post({
    title,
    imageUrl: 'images/bs1.jpg',
    content,
    creator: {
      name: 'boksun'
    }
  });

  post.save()
    .then(post => {
      console.log(post);
      res.status(201).json({
        message: 'Post created successfully!',
        post
      });
    })
    .catch(err => console.log(err));
};
```

---

### lecture 375. Static Images & Error Handling

정적 이미지를 가져올 폴더 위치 지정하기
```js
// app.js
(...)
const path = require('path');
(...)
app.use('/images', express.static(path.join(__dirname, 'images')));
```

미들웨어로 에러 핸들링하기
```js
// controllers/feed.js
(...)
exports.createPost = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect.');
    error.statusCode = 422;
    throw error;
  }

  const title = req.body.title;
  const content = req.body.content;
  const post = new Post({
    title,
    imageUrl: 'images/bs1.jpg',
    content,
    creator: {
      name: 'boksun'
    }
  });

  post.save()
    .then(post => {
      console.log(post);
      res.status(201).json({
        message: 'Post created successfully!',
        post
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      throw err;
    });
}
```
* 하나의 컨트롤러에서 422와 500 에러를 중복처리하고 있다
* 두 에러 처리 모두 상태코드만 지정한 뒤 미들웨어에 위임할 것이다
* throw를 던지면 바로 에러 핸들링 미들웨어가 실행된다

에러 처리를 위한 미들웨어 작성
```js
// app.js
(...)
app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  res.status(status).json({message});
});
(...)
```

---

### lecture 376. Fetching a Single Post

라우터 설정
```js
// routes/feed.js
(...)
router.get('/post/:postId', feedController.getPost);
(...)
```

컨트롤러 작성하기
```js
// controllers/feed.js

exports.getPosts = (req, res, next) => {
  Post.find()
    .then(posts => {
      res.status(200).json({
        message: 'Fetched posts successfully.',
        posts
      })
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
(...)
exports.getPost = (req, res, next) => {
  const postId = req.params.postId;
  
  Post.findById(postId)
    .then(post => {
      if (!post) {
        const error = new Error('Could not find post.');
        error.statusCode = 404;
        throw error;
      }
      res.status(200).json({
        message: 'Post fetched',
        post
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
```
* 이전에 작성했던 getposts도 실제 데이터베이스에서 데이터를 가져오도록 수정했다

Post의 디테일 페이지에서 올바른 API를 호출하도록 URL 지정하기
```js
// pages/Feed/SinglePost/SinglePost.js
(...)
componentDidMount() {
    const postId = this.props.match.params.postId;
    fetch(`http://localhost:8080/feed/post/${postId}`)
      .then(res => {
        if (res.status !== 200) {
          throw new Error('Failed to fetch status');
        }
        return res.json();
      })
      .then(resData => {
        this.setState({
          title: resData.post.title,
          author: resData.post.creator.name,
          image: 'http://localhost:8080/' + resData.post.imageUrl,
          date: new Date(resData.post.createdAt).toLocaleDateString('en-US'),
          content: resData.post.content
        });
      })
      .catch(err => {
        console.log(err);
      });
  }
  (...)
}
```

---

### lecture 378. Uploading Images

multer다운로드 및 기본 설정
```terminal
$ npm i --save multer uuid
```
* uuid는 윈도우 운영체제인 경우 new Date().toISOString()이 파일명으로 작동하지 않는 현상을 해결하기 위한 패키지다
```js
// app.js
(...)
const multer = require('multer');
const uuidv4 = require('uuid');
(...)
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images');
  },
  filename: (req, file, cb) => {
    cb(null, uuidv4());
  }
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg' 
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
}
(...)
app.use(multer({ storage : fileStorage, fileFilter }).single('image'));
(...)
```
* 앞선 섹션에서 배웠던 설정과 동일하다

포스트를 생성할 때 이미지 업로드를 가능하게 만들기
* 지금까지는 서버에 미리 저장해놓은 정적 이미지만을 활용했다
* 실제로 업로드가 가능하게 컨트롤러를 수정해보자
```js
// controllers/feed.js
(...)
exports.createPost = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect.');
    error.statusCode = 422;
    throw error;
  }
  if (!req.file) {
    const error = new Error('No image provided');
    error.statusCode = 422;
    throw error;
  }

  const title = req.body.title;
  const content = req.body.content;
  const imageUrl = req.file.path.replace("\\" ,"/");
  const post = new Post({
    title,
    imageUrl,
    content,
    creator: {
      name: 'boksun'
    }
  });

  post.save()
    .then(post => {
      console.log(post);
      res.status(201).json({
        message: 'Post created successfully!',
        post
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      throw err;
    });
};
(...)
```
* 그러나 실제로 포스트를 추가해보면 서버만 수정해서는 원하는대로 동작하지 않음을 확인할 수 있다

클라이언트측 코드 수정하기
```js
// pages/Feed/Feed.js
(...)
finishEditHandler = postData => {
    this.setState({
      editLoading: true
    });

    const formData = new FormData();
    formData.append('title', postData.title);
    formData.append('content', postData.content);
    formData.append('image', postData.image);

    let url = 'http://localhost:8080/feed/post';
    let method = 'POST';
    if (this.state.editPost) {
      url = 'URL';
    }

    fetch(url, {
      method: method,
      body: formData
    })
      .then(res => {
        if (res.status !== 200 && res.status !== 201) {
          throw new Error('Creating or editing a post failed!');
        }
        return res.json();
      })
      .then(resData => {
        console.log(resData);
        const post = {
          _id: resData.post._id,
          title: resData.post.title,
          content: resData.post.content,
          creator: resData.post.creator,
          createdAt: resData.post.createdAt
        };
        this.setState(prevState => {
          let updatedPosts = [...prevState.posts];
          if (prevState.editPost) {
            const postIndex = prevState.posts.findIndex(
              p => p._id === prevState.editPost._id
            );
            updatedPosts[postIndex] = post;
          } else if (prevState.posts.length < 2) {
            updatedPosts = prevState.posts.concat(post);
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
* headers에 Content-Type을 application/json으로 지정하면 모든 데이터가 텍스트처럼 변해 이미지를 업로드할 수 없다
* headers를 지우고 FormData를 이용해 데이터를 서버로 전송한다

---

### lecture 379. Updating Posts

포스트 내용을 수정하기
```js
// routes/feed.js
(...)
router.put(
  '/post/:postId', 
  [
    body('title').trim().isLength({ min: 5 }),
    body('content').trim().isLength({ min: 5 })
  ], 
  feedController.updatePost
);
(...)

// controllers/feed.js
(...)
const path = require('path');

(...)
exports.updatePost = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect.');
    error.statusCode = 422;
    throw error;
  }

  const postId = req.params.postId;
  const title = req.body.title;
  const content = req.body.content;
  let imageUrl = req.body.image;
  if (req.file) {
    imageUrl = req.file.path.replace("\\" ,"/");
  }
  if (!imageUrl) {
    const error = new Error('No file picked.');
    error.statusCode = 422;
    throw error;
  }

  Post.findById(postId)
    .then(post => {
      if (!post) {
        const error = new Error('Could not find post.');
        error.statusCode = 404;
        throw error;
      }
      if (imageUrl !== post.imageUrl) {
        clearImage(post.imageUrl);
      }

      post.title = title;
      post.content = content;
      post.imageUrl = imageUrl;

      return post.save();
    })
    .then(result => {
      res.status(200).json({
        message: 'Post updated.',
        post: result
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    })
};

const clearImage = filePath => {
  filePath = path.join(__dirname, '..', filePath);
  fs.unlink(filePath, err => console.log(err));
};
```

프론트 코드 수정
```js
// components/Feed/FeedEdit/FeedEdit.js
(...)
componentDidUpdate(prevProps, prevState) {
    if (
      this.props.editing &&
      prevProps.editing !== this.props.editing &&
      prevProps.selectedPost !== this.props.selectedPost
    ) {
      const postForm = {
        title: {
          ...prevState.postForm.title,
          value: this.props.selectedPost.title,
          valid: true
        },
        image: {
          ...prevState.postForm.image,
          value: this.props.selectedPost.imagePath,
          valid: true
        },
        content: {
          ...prevState.postForm.content,
          value: this.props.selectedPost.content,
          valid: true
        }
      };
      this.setState({ postForm: postForm, formIsValid: true });
    }
}
(...)

// pages/Feed/Feed.js
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
    fetch('http://localhost:8080/feed/posts')
      .then(res => {
        if (res.status !== 200) {
          throw new Error('Failed to fetch posts.');
        }
        return res.json();
      })
      .then(resData => {
        this.setState({
          posts: resData.posts.map(post => {
            return {
              ...post,
              imagePath: post.imageUrl
            };
          }),
          totalPosts: resData.totalItems,
          postsLoading: false
        });
      })
      .catch(this.catchError);
};
(...)
finishEditHandler = postData => {
    this.setState({
      editLoading: true
    });

    const formData = new FormData();
    formData.append('title', postData.title);
    formData.append('content', postData.content);
    formData.append('image', postData.image);

    let url = 'http://localhost:8080/feed/post';
    let method = 'POST';
    if (this.state.editPost) {
      url = 'http://localhost:8080/feed/post/' + this.state.editPost._id;
      method = 'PUT';
    }
    (...)
}
(...)
```
* Feed의 loadPosts에서 posts 상태를 업데이트하기 전에 map으로 imagePath를 포함한 오브젝트로 변환한다
* 이는 FeedEdit의 componentDidUpdate에 있는 폼 형식에 맞추기 위함이다
* finishEditHandler에서 editPost가 true일때 url과 method를 제대로 지정하도록 수정한다

---

### lecture 380. Deleting Posts

Post를 삭제하는 로직 작성하기
```js
// routes/feed.js
(...)
router.delete('/post/:postId', feedController.deletePost);
(...)

// controllers/feed.js
(...)
exports.deletePost = (req, res, next) => {
  const postId = req.params.postId;

  Post.findById(postId)
    .then(post => {
      if (!post) {
        const error = new Error('Could not find post.');
        error.statusCode = 404;
        throw error;
      }
      // Check logged in user
      clearImage(post.imageUrl);
      return Post.findByIdAndRemove(postId);
    })
    .then(result => {
      console.log(result);
      res.status(200).json({
        message: 'Deleted Post.'
      })
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
```

프론트엔드에서 API 지정
```js
// pages/Feed/Feed.js
(...)
deletePostHandler = postId => {
    this.setState({ postsLoading: true });
    fetch('http://localhost:8080/feed/post/' + postId, {
      method: 'DELETE'
    })
      .then(res => {
        if (res.status !== 200 && res.status !== 201) {
          throw new Error('Deleting a post failed!');
        }
        return res.json();
      })
      .then(resData => {
        console.log(resData);
        this.setState(prevState => {
          const updatedPosts = prevState.posts.filter(p => p._id !== postId);
          return { posts: updatedPosts, postsLoading: false };
        });
      })
      .catch(err => {
        console.log(err);
        this.setState({ postsLoading: false });
      });
};
(...)
```

---

### lecture 382. Adding a user model

유저 스키마 정의하기
```js
// models/user.js
const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true
  },
  email: [{
    type: Schema.Types.ObjectId,
    ref: 'Post'
  }]
});

module.exports = mongoose.model('User', userSchema);
```

라우터 작성하기
```js
// routes/auth.js
const express = require('express');
const { body } = require('express-validator/check');

const router = express.Router();

const User = require('../models/user');
const authController = require('../controllers/auth');

router.put(
  '/signup', 
  [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email.')
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then(userDoc => {
          if (userDoc) {
            return Promise.reject('E-mail address already exists!');
          }
        })
      })
      .normalizeEmail(),
    body('password')
      .trim()
      .isLength({ min : 5 }),
    body('name')
      .trim()
      .not()
      .isEmpty()    
  ], 
  authController.signup
);

module.exports = router;

// app.js
(...)
const authRoutes = require('./routes/auth');
(...)
app.use('/auth', authRoutes);
(...)
```

컨트롤러 작성하기
```js
// controllers/auth.js
const { validationResult } = require('express-validator/check');
const bcrypt = require('bcryptjs');

const User = require('../models/user');

exports.signup = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed');
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }
  const email = req.body.email;
  const name = req.body.name;
  const password = req.body.password;
  bcrypt.hash(password, 12)
    .then(hashedPw => {
      const user = new User({
        email,
        password:hashedPw,
        name
      });
      return user.save();
    })
    .then(result => {
      res.status(201).json({
        message: 'User created!',
        userId: result._id
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    })
};
```

---

### lecture 385. How Does Authentication Work?

REST API에서의 인증 작동방식
* 클라이언트가 로그인을 시도하면 서버는 토큰을 반환한다
* 클라이언트는 브라우저의 스토리지에 토큰을 저장한다
* 인증이 필요한 요청마다 클라이언트는 저장된 토큰으로 요청을 시도한다

토큰
* 클라이언트 측에서 저장된 토큰을 수정하거나 생성하더라도 서버에 저장된 비밀키를 알지 못하면 소용이 없다
* 토큰은 JSON 데이터와 시그니처로 구성되어있다
  - 이런 구조로 만들어진 토큰을 JSON Web Token(JWT)라고 한다
  - 시그니처는 비밀키를 통해 오직 서버에서만 접근할 수 있다

---

### lecture 387. Logging in & Creating JSON Web Tokens(JWTs)

로그인 라우터 작성
```js
// routes/auth.js
(...)
router.post('/login', authController.login);
(...)
```

로그인 컨트롤러 작성
```terminal
$ npm i --save jsonwebtoken
```
* jwt 패키지를 먼저 설치한다
```js
// controllers/auth.js
(...)
const jwt = require('jsonwebtoken');
(...)
exports.login = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  let loadedUser;
  
  User.findOne({ email })
    .then(user => {
      if (!user) {
        const error = new Error('Email not found');
        error.statusCode = 401;
        throw error;
      }
      loadedUser = user;
      return bcrypt.compare(password, user.password)
    })
    .then(isEqual => {
      if (!isEqual) {
        const error = new Error('Wrong password!');
        error.statusCode = 401;
        throw error;
      }
      const token = jwt.sign(
        {
          email: loadedUser.email,
          userId: loadedUser._id.toString()
        },
        'somesupersecretsecret',
        { expiresIn: '1h' }
      );
      res.status(200).json({
        token,
        userId: loadedUser._id.toString()
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    })
};
```
* 토큰을 탈취당하더라도 만료 시간을 1시간으로 지정해 제한을 둔다

---

### lecture 388. Using & Validating the Token

프론트엔드에서 헤더에 토큰을 포함시키기
```js
// Feed.js
(...)
fetch('http://localhost:8080/feed/posts?page=' + page, {
      headers: {
        Authorization: 'Bearer ' + this.props.token
      }
    })
(...)
```
* Authorization에 'Bearer token'형식으로 토큰을 보내는 것이 컨벤션이다

미들웨어로 토큰 검증하기
```js
// middleware/is-auth.js
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
* jsonwebtoken의 verify메서드에 토큰과 비밀키를 인자로 보내면 토큰이 디코딩된다

로그인된 상태일때만 피드 목록을 받도록 라우터에 미들웨어 적용하기
```js
// routes/feed.js
const express = require('express');
const { body } = require('express-validator/check');

const isAuth = require('../middleware/is-auth');
const feedController = require('../controllers/feed');

const router = express.Router();

router.get('/posts', isAuth, feedController.getPosts);

router.post(
  '/post', 
  isAuth,
  [
    body('title').trim().isLength({ min: 5 }),
    body('content').trim().isLength({ min: 5 })
  ], 
  feedController.createPost
);

router.get('/post/:postId', isAuth, feedController.getPost);

router.put(
  '/post/:postId', 
  isAuth,
  [
    body('title').trim().isLength({ min: 5 }),
    body('content').trim().isLength({ min: 5 })
  ], 
  feedController.updatePost
);

router.delete('/post/:postId', isAuth, feedController.deletePost);

module.exports = router;
```

---

### lecture 390. Connecting Posts & Users

포스트와 유저를 연결하기
```js
// models/post.js
(...)
const postSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });
(...)

// models/user.js
(...)
posts: [{
    type: Schema.Types.ObjectId,
    ref: 'Post'
  }]
(...)
```
* creator의 타입을 ObjectId로 변경하고 User스키마를 참조하도록 변경했다
* User스키마도 Post스키마를 참조하고 있다

포스트를 생성할 때 유저 정보를 추가하기(동시에 유저 정보에도 포스트를 추가)
```js
// controllers/feed.js
(...)
exports.createPost = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect.');
    error.statusCode = 422;
    throw error;
  }
  if (!req.file) {
    const error = new Error('No image provided');
    error.statusCode = 422;
    throw error;
  }

  const title = req.body.title;
  const content = req.body.content;
  const imageUrl = req.file.path.replace("\\" ,"/");
  let creator;
  const post = new Post({
    title,
    imageUrl,
    content,
    creator : req.userId // 포스트에 유저 추가
  });

  post.save()
    .then(result => {
      return User.findById(req.userId);
    })
    .then(user => {
      creator = user;
      user.posts.push(post); // 유저에도 포스트 추가
      return user.save();
    })
    .then(result => {
      res.status(201).json({
        message: 'Post created successfully!',
        post,
        creator: {
          _id: creator._id,
          name: creator.name
        }
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      throw err;
    });
};
(...)
```

---

### lecture 391. Adding Authorization Checks

자기가 쓴 포스트만 수정&삭제가 가능하도록 변경하기
```js
// controllers/feed.js
(...)
exports.updatePost = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect.');
    error.statusCode = 422;
    throw error;
  }

  const postId = req.params.postId;
  const title = req.body.title;
  const content = req.body.content;
  let imageUrl = req.body.image;
  if (req.file) {
    imageUrl = req.file.path.replace("\\" ,"/");
  }
  if (!imageUrl) {
    const error = new Error('No file picked.');
    error.statusCode = 422;
    throw error;
  }

  Post.findById(postId)
    .then(post => {
      if (!post) {
        const error = new Error('Could not find post.');
        error.statusCode = 404;
        throw error;
      }
      if (post.creator.toString() !== req.userId) {
        const error = new Error('Not authorized!');
        error.statusCode = 403;
        throw error;
      }

      if (imageUrl !== post.imageUrl) {
        clearImage(post.imageUrl);
      }

      post.title = title;
      post.content = content;
      post.imageUrl = imageUrl;

      return post.save();
    })
    .then(result => {
      res.status(200).json({
        message: 'Post updated.',
        post: result
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    })
};

exports.deletePost = (req, res, next) => {
  const postId = req.params.postId;

  Post.findById(postId)
    .then(post => {
      if (!post) {
        const error = new Error('Could not find post.');
        error.statusCode = 404;
        throw error;
      }
      if (post.creator.toString() !== req.userId) {
        const error = new Error('Not authorized!');
        error.statusCode = 403;
        throw error;
      }
      // Check logged in user
      clearImage(post.imageUrl);
      return Post.findByIdAndRemove(postId);
    })
    .then(result => {
      console.log(result);
      res.status(200).json({
        message: 'Deleted Post.'
      })
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
```
* post.creator.toString()와 is-auth미들웨어에서 지정한 req.userId가 같은지를 체크해서 처리한다

---

### lecture 392. Clearing Post-User Relations

포스트를 삭제하면 해당 포스트와 연결된 유저의 포스트 정보도 삭제하기
```js
// controllers/feed.js
(...)
exports.deletePost = (req, res, next) => {
  const postId = req.params.postId;

  Post.findById(postId)
    .then(post => {
      if (!post) {
        const error = new Error('Could not find post.');
        error.statusCode = 404;
        throw error;
      }
      if (post.creator.toString() !== req.userId) {
        const error = new Error('Not authorized!');
        error.statusCode = 403;
        throw error;
      }
      // Check logged in user
      clearImage(post.imageUrl);
      return Post.findByIdAndRemove(postId);
    })
    .then(result => {
      return User.findById(req.userId);
    })
    .then(user => {
      user.posts.pull(postId);
      return user.save();
    })
    .then(result => {
      res.status(200).json({
        message: 'Deleted Post.'
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
```
* pull 메서드에 포스트의 _id값을 보내면 해당 요소를 제거한다

---

