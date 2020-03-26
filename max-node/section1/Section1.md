# Section 1 - Introduction

### lecture 2. What is Node.js?

Nodejs란?
* Javascript Runtime이다
  - 이 말은 정확히 무엇을 의미하는가?
  - 과거 자바스크립트는 브라우저에서 구동되는 언어로 인식됐다
  - 구체적으로 자바스크립트는 브라우저의 DOM을 조작하는데 사용됐다(팝업, 모달 등 다양한 이펙트 구현)
  - Nodejs는 브라우저 단에서만 돌던 자바스크립트의 다른 버전이라고 할 수 있다
  - Nodejs를 사용하면 자바스크립트를 이용해 일반적인 프로그램이나 서버 코드를 작성할 수 있다
  - Nodejs는 서버와 각종 유틸리티 툴을 만드는데 자주 사용된다

어떻게 브라우저 바깥에서 자바스크립트를 사용할 수 있게 되었는가?
* Nodejs는 V8이라는 구글에서 만든 엔진을 사용한다
  - V8은 크롬 브라우저에서 사용되는 엔진이기도 하다
  - V8은 자바스크립트로 작성된 코드를 기계어로 컴파일해준다
  - Nodejs는 V8엔진에 더해 브라우저에서는 사용할 수 없었던 파일 시스템 등의 기능을 C++코드로 작성된 모듈을 가지고 사용한다
  - 한 마디로 Nodejs는 Extended V8을 사용한다고 할 수 있다