# Section 30. Testing Node.js Applications

### lecture 460. What is Testing?

매뉴얼 테스팅
* 지금까지 애플리케이션을 만들면서 기능이 올바로 작동하는 것을 어떻게 확인해왔을까?
* 우선 코드를 작성하고 실제 사용자처럼 직접 앱을 실행해서 기획대로 기능이 잘 작동하는지를 확인했다
* 이 작업은 실제로 앱이 작동하는지를 확인하는 것이기 때문에 매우 중요하다
* 그러나 수정이 있을 때마다 기존에 작성한 코드의 세부적인 기능들이 여전히 올바르게 작동하는지 꼼꼼하게 체크하기는 어렵다

자동화된 테스팅
* 코드를 테스트하는 코드를 만들어 수정사항이 생기면 자동으로 코드를 테스트한다
* 세부 기능이 코드에 의해 자동으로 테스트되므로 실수를 줄일 수 있다
* 그러나 테스팅 자동화 역시 테스트 작성자가 찾아낸 부분만 테스트하게되는 경향이 있다
* 그리고 UI의 경우 테스트가 매우 어렵다

---

### lecture 461. Why & How

왜 테스트를 작성하는가?
* 테스트를 작성하면 모든 코드가 수정된 뒤에 자동으로 모든 코드를 테스트한다
* 이 자동테스트 덕분에 수정에 따른 기대하지 않는 변화를 감지해낼 수 있다
* 테스트 과정을 통해 예측가능하고 분명하

어떻게 테스트를 작성할 것인가?
* 테스트들을 실행시키기
  - 작성한 테스트 코드를 효율적으로 테스트가 가능하도록 특정 환경에서 실행해야 한다
  - 일반적으로 Mocha라는 라이브러리를 많이 사용한다
* 결과 검증
  - 테스트 결과를 검증한다
  - 일반적으로 Chai라는 라이브러리를 많이 사용한다
* 부작용 및 외부 의존성 관리
  - Sinon이라는 라이브러리를 사용한다

---

### lecture 462. Setup and Writing a First Test

프로젝트를 다운받고 mocha와 chai를 설치해주자
```terminal
$ npm i --save-dev mocha chai
```

package.json에 test script 수정하기
```json
{
  // (...)
  "scripts": {
    "test": "mocha",
    "start": "nodemon app.js"
  },
  // (...)
}
```
* 아무 옵션 없이 mocha만 실행하면 package.json파일과 같은 계층에 있는 test폴더 안의 모든 파일들을 테스트한다

test 폴더 생성하기
```terminal
$ mkdir test
```

간단하게 테스트를 어떻게 작성하는지를 알기 위한 더미 테스트
```js
// test/start.js
const { expect } = require('chai');

it('should add numbers correctly', function() {
  const num1 = 2;
  const num2 = 3;

  expect(num1 + num2).to.equal(5);
});

it('should not give a result of 6', function() {
  const num1 = 2;
  const num2 = 3;

  expect(num1 + num2).not.to.equal(6);
});
```
* test 폴더에 start.js라는 파일을 생성했다
* it은 테스트에 대한 설명과 실제 테스트할 함수를 인자로 받는다
* 실제로 비교를 수행하는 것은 chai의 기능을 이용한다
* 물론 위 코드와 같이 간단한 내용은 테스트의 의미가 없다
  - 지금은 단지 어떤 방식으로 테스트가 이루어지는지만 확인하자

---