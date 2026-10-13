# 오늘의 날씨

HTML, CSS, JavaScript와 Node.js 기본 모듈만 사용하는 날씨 웹앱입니다. 프레임워크나 별도 패키지 설치, API 키 설정이 필요하지 않습니다.

## 파일 구성

```text
weather-app/
├── frontend/
│   ├── index.html       # 검색 폼과 날씨 표시 화면
│   ├── styles.css       # 반응형 스타일
│   └── app.js           # 백엔드 요청과 화면 업데이트
├── backend/
│   └── server.js        # 정적 파일 제공 및 외부 API 호출
├── tests/
│   └── server.test.js   # 서버 동작 검증
├── package.json
└── README.md
```

## 실행 순서

1. Node.js 22 이상을 설치합니다. 터미널에서 `node --version`으로 확인합니다.
2. 프로젝트 폴더로 이동합니다.

   ```sh
   cd /Users/eileenyoon/Documents/weather-app
   ```

3. 서버를 시작합니다. 의존성이 없으므로 `npm install`은 필요하지 않습니다.

   ```sh
   npm start
   ```

4. 브라우저에서 **http://localhost:3000**에 접속합니다. HTML 파일을 직접 열지 말고 이 주소로 접속하세요.
5. `서울`, `부산`, `Tokyo`, `London`처럼 도시를 입력하고 **날씨 확인**을 누릅니다. Enter 키와 빠른 검색 버튼도 사용할 수 있습니다.
6. 종료하려면 서버 터미널에서 **Ctrl+C**를 누릅니다.

포트가 이미 사용 중이라면 `PORT=3001 npm start`로 실행하고 http://localhost:3001에 접속합니다. 외부 API를 호출하려면 인터넷 연결이 필요합니다.

## 동작 방식

브라우저 → `GET /api/weather?city=서울` → 백엔드에서 도시 좌표 검색 → 백엔드에서 현재 날씨 조회 → 브라우저에 결과 표시.

- [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api)로 도시 이름을 좌표로 변환합니다.
- [Open-Meteo Weather API](https://open-meteo.com/en/docs)로 기온, 체감 온도, 습도, 풍속, 날씨 상태를 조회합니다.
- [무료 API](https://open-meteo.com/en/pricing)는 비상업적 사용에 API 키 없이 이용할 수 있습니다. 상업적 사용에는 별도 이용 조건이 적용됩니다.
- 현재 날씨는 Open-Meteo의 기상 모델 기반 데이터이며, 표시 시간은 해당 도시의 현지 시간입니다.
- 동명 도시가 있으면 첫 번째 검색 결과를 표시합니다. 화면에 지역과 국가를 함께 표시하므로 확인할 수 있습니다. 원하는 도시가 나오지 않으면 영문 이름이나 `도시, 국가`로 검색해 보세요.
- 서울·부산 등 주요 한국 도시와 도쿄·런던은 한글 이름을 영문 검색어로 변환합니다. 다른 도시는 API의 검색 지원 범위에 따라 영문 이름이 필요할 수 있습니다.
- 빈 입력, 검색 결과 없음, 외부 API 오류, 연결 시간 초과를 처리합니다. 외부 요청마다 10초 제한을 둡니다.
- 로컬 학습용 서버로, `127.0.0.1`에서만 연결을 받습니다.

## 검증

```sh
npm test
```

테스트는 외부 API 응답을 대체하여 정상 조회, 잘못된 입력, 도시 없음, 외부 서비스 오류와 HTTP 응답을 검증합니다.
