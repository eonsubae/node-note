# Section 20. File Upload & Download

### lecture 316. Handling Form Data

상품을 추가할 때 사용자 컴퓨터에서 이미지를 선택하기
```html
(...)
<div class="form-control">
  <label for="image">Image URL</label>
  <input type="file" name="image" id="image" value="<% if (editing) { %><%= product.im%><% } %>">
</div>
(...)
```
* input 태그의 타입을 file로 변경했다

```js
(...)
exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const imageUrl = req.body.image;
  const price = req.body.price;
  const description = req.body.description;
  const product = new Product({
    title: title,
    price: price,
    description: description,
    imageUrl: imageUrl,
    userId: req.user
  });
  product
    .save()
    .then(result => {
      // console.log(result);
      console.log('Created Product');
      res.redirect('/admin/products');
    })
    .catch(err => {
      console.log(err);
    });
};
(...)
```
* input의 name에 맞게 req.body.imageUrl을 req.body.image로 변경해줬다
* 그러나 예상한 것과 달리 작동하지 않는다
* 이는 bodyParser가 body를 통해 데이터를 가져올 때 모두 text로 인코딩하기 때문이다
  - 응답헤더의 Content-Type이 application/x-www-form-urlencoded인 것에서 확인할 수 있다
  - 이는 폼으로 입력된 모든 데이터를 텍스트로 바꾼다는 것을 의미한다
  - 파일은 바이너리이므로 텍스트로는 아무 것도 입력되지 않는다

```js
(...)
app.use(bodyParser.urlencoded({ extended: false }));
```
* 지금까지 모든 폼 데이터는 bodyParser를 이용해 가져왔다
* 파일을 가져오기 위해서는 multer라는 서드파티 패키지를 사용한다

multer 설치하기
```terminal
$ npm i --save multer
```

file input 필드의 인코딩 타입 지정하기
```html
(...)
<div class="form-control">
  <label for="image">Image URL</label>
  <input 
    type="file" 
    name="image" 
    id="image" 
    value="<% if (editing) { %><%= product.im%><% } %>"
    enctype="multipart/form-data"
  />
</div>
(...)
```
* enctype의 디폴트 값은 application/x-www-form-urlencoded이다

---

### lecture 317. Handling File Uploads with Multer

multer 세팅하기
```js
// app.js
(...)
const multer = require('multer');
(...)
app.use(multer({ dest: 'images' }).single('image'));
(...)
```
* dest는 파일이 저장될 폴더명을 의미한다
* single은 인자에 명시된 이름의 파일 하나만 전달 받는다(앞서 input태그의 name을 image로 변경했었다)
  - 이 파일은 req.file로 조작할 수 있다

```js
// controllers/admin.js
(...)
exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const imageUrl = req.file;
  const price = req.body.price;
  const description = req.body.description;
  console.log(imageUrl);
  (...)
};
(...)
```
* req.file로 파일의 정보를 가져오고 있다

---

### lecture 318. Configuring Multer to Adjust Filename & FilePath

multer설정 수정하기
* 앞서 했던 설정은 파일이 저장될 폴더만을 지정했다
* 따라서 파일 이름을 어떻게 저장할 것인지 등은 기본값대로 처리되고 있었다

```js
// app.js
(...)
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images');
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString() + '-' + file.originalname);
  }
});
(...)
app.use(multer({ storage: fileStorage }).single('image'));
(...)
```
* dest가 아닌 storage로 저장소에 대한 보다 많은 옵션을 설정할 수 있다
* 멀터는 DiskStorage와 MemoryStorage를 탑재하고 있다
  - DiskStorage는 파일을 디스크에 저장하기 위한 모든 제어 기능을 제공한다
  - MemoryStrage는 파일을 메모리에 Buffer 객체로 저장하며 어떤 옵션도 제공하지 않는다
* DiskStorage
  - destination, filename 두 가지 옵션을 지정할 수 있다
  - 모두 파일을 어디에 저장할지 지정하는 옵션이다
  - filename이 주어지지 않으면 파일 확장자를 제외한 랜덤한 이름으로 지어진다
  - multer는 파일 확장자를 추가하지 않는다. 따라서 사용자 함수를 통해 파일 확장자를 포함한 완전한 파일명을 반환해야 한다
  - 위 코드에서는 file.originalname 프로퍼티를 이용해 원본 파일의 이름을 그대로 가져오고 있다
  - 동시에 같은 파일이름이 있을 때 덮어쓰지 않도록 날짜정보를 추가하고 있다

---

### lecture 319. Filtering Files by Mimetype

Mimetype을 검증해 검증된 파일만 저장하기
```js
// app.js
(...)
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
app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('image'));
(...)
```
* 이제 파일의 mimetype이 png, jpg, jpeg인 것들만 저장한다

---

### lecture 