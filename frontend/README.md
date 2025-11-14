# EduTest Frontend

React + Vite 기반 교육 컨텐츠 관리 시스템 프론트엔드

## 기술 스택

- React 18
- Vite
- React Router
- Axios
- CSS3

## 시작하기

### 사전 요구사항

- Node.js 18 이상
- npm 또는 yarn

### 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

애플리케이션은 `http://localhost:5174` 에서 실행됩니다.

### 빌드

```bash
npm run build
```

빌드된 파일은 `dist/` 디렉토리에 생성됩니다.

### 프리뷰

빌드된 애플리케이션을 미리 보기:

```bash
npm run preview
```

## 프로젝트 구조

```
src/
├── components/          # React 컴포넌트
│   ├── auth/           # 인증 관련
│   ├── admin/          # 관리자 페이지
│   ├── student/        # 학생 페이지
│   └── common/         # 공통 컴포넌트
├── services/           # API 서비스
├── utils/              # 유틸리티
│   └── api.js         # Axios 인스턴스
├── App.jsx            # 메인 앱 컴포넌트
├── main.jsx           # 엔트리 포인트
└── index.css          # 글로벌 스타일
```

## API 연동

백엔드 API는 Vite의 프록시를 통해 연결됩니다:
- 프론트엔드: `http://localhost:5174`
- 백엔드: `http://localhost:8081`
- API 호출: `/api/*` → 자동으로 `http://localhost:8081/api/*`로 프록시

## 개발 가이드

### 컴포넌트 생성

```jsx
// src/components/example/Example.jsx
import './Example.css';

function Example() {
  return (
    <div className="example">
      <h1>Example Component</h1>
    </div>
  );
}

export default Example;
```

### API 호출

```javascript
import api from '../utils/api';

// GET 요청
const fetchData = async () => {
  try {
    const response = await api.get('/subjects');
    return response.data;
  } catch (error) {
    console.error('Error:', error);
  }
};

// POST 요청
const createData = async (data) => {
  try {
    const response = await api.post('/subjects', data);
    return response.data;
  } catch (error) {
    console.error('Error:', error);
  }
};
```

## 다음 단계

- [ ] 라우팅 설정 (React Router)
- [ ] 로그인/회원가입 페이지
- [ ] 대시보드 구현
- [ ] 과목 관리 페이지
- [ ] 문제 관리 페이지
- [ ] 문제 풀이 페이지
- [ ] 결과 관리 페이지

## 문제 해결

### 포트 충돌

다른 애플리케이션이 5174 포트를 사용 중인 경우, `vite.config.js`에서 포트 변경:

```javascript
export default defineConfig({
  server: {
    port: 5175  // 원하는 포트로 변경
  }
})
```

### CORS 오류

백엔드에서 CORS 설정이 제대로 되어 있는지 확인하세요. 또는 Vite의 프록시 설정을 사용하세요 (이미 설정됨).
