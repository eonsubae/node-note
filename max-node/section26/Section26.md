# Section 26. Understanding Async Await in Node.js

### lecture 396. What is Async Await All About?

Async/Await
* 비동기적 요청을 동기적 방식으로 다루기 위한 자바스크립트의 기능
  - 모습이 동기적인 코드처럼 보일뿐 비동기로 작동한다
* Promise의 then/catch를 async/await로 대체할 수 있다

앞서 포스트 리스트를 제공하는 컨트롤러를 async/await로 수정하기
```js
// controller/feed.js
(...)
exports.getPosts = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 2;

  try {
    const totalItems = await Post.find().countDocuments()
    const posts = await Post.find()
      .skip((currentPage - 1) * perPage)
      .limit(perPage);
      
    res.status(200).json({
      message: 'Fetched posts successfully.',
      posts,
      totalItems
    })
  } catch (err) {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
  };
};
(...)
```

---