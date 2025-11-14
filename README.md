# 교육 컨텐츠 관리 시스템 (EduTest)

과목별/레벨별 문제를 관리하고 학습자의 풀이 결과를 추적하는 교육용 웹 서비스

## 프로젝트 개요

이 시스템은 다음 기능을 제공합니다:
- 📚 과목 및 난이도 레벨 관리
- ✏️ 문제 생성 및 관리 (객관식, O/X, 주관식, 서술형)
- 🎯 과목/레벨 선택 후 문제 풀이
- 📊 개인별 풀이 결과 저장 및 통계 분석
- 👥 역할 기반 접근 제어 (학생, 선생님, 관리자)

## 기술 스택

### Backend
- Spring Boot 3.x (Java 17+)
- MySQL 8.0+
- Spring Security + JWT
- JPA (Hibernate)

### Frontend
- React 18
- Vite
- Axios
- React Router

## 프로젝트 구조

```
edutest/
├── backend/          # Spring Boot 백엔드
├── frontend/         # React 프론트엔드
├── docs/             # 문서
└── scripts/          # 유틸리티 스크립트
```

## 시작하기

### 사전 요구사항

- Java 17 이상
- Node.js 18 이상
- MySQL 8.0 이상
- Gradle

### 데이터베이스 설정

1. MySQL에서 데이터베이스 생성:
```sql
CREATE DATABASE edutest CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. 스키마 생성:
```bash
mysql -u root -p edutest < scripts/init-db.sql
```

### 백엔드 실행

```bash
cd backend
./gradlew bootRun
```

백엔드 서버: http://localhost:8081

### 프론트엔드 실행

```bash
cd frontend
npm install
npm run dev
```

프론트엔드 서버: http://localhost:5174

## 주요 기능

### 1. 사용자 관리
- 회원가입/로그인
- 역할: 학생, 선생님, 관리자

### 2. 과목 및 레벨 관리
- 과목 CRUD (예: 수학, 영어, 과학, 국어)
- 레벨 CRUD (예: 초급, 중급, 고급)

### 3. 문제 관리
- 문제 유형: 객관식, O/X, 주관식, 서술형
- 과목 및 레벨별 분류
- 선택지 관리
- 배점 및 제한 시간 설정

### 4. 문제 풀이
- 과목 및 레벨 선택
- 문제 풀이
- 자동 채점 (객관식, O/X)
- 풀이 시간 측정

### 5. 결과 및 통계
- 개인별 풀이 결과 저장
- 점수 및 정답률 통계
- 과목별/레벨별 성적 분석
- 풀이 히스토리

## API 문서

API 엔드포인트 및 사용법은 [API_REFERENCE.md](docs/API_REFERENCE.md)를 참조하세요.

## 데이터베이스 스키마

자세한 데이터베이스 구조는 [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)를 참조하세요.

## 개발 로드맵

- [x] 프로젝트 구조 설계
- [x] 데이터베이스 스키마 설계
- [ ] 백엔드 초기 설정
- [ ] 프론트엔드 초기 설정
- [ ] 인증 시스템 구현
- [ ] 과목/레벨 관리 기능
- [ ] 문제 관리 기능
- [ ] 문제 풀이 기능
- [ ] 결과 관리 및 통계
- [ ] UI/UX 개선
- [ ] 배포

## 라이선스

MIT License

## 문의

프로젝트 관련 문의사항은 이슈를 등록해주세요.
