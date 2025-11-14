# 교육 컨텐츠 관리 시스템 - 프로젝트 구조

## 프로젝트 개요

교육용 컨텐츠를 관리하는 웹 서비스로, 과목별/레벨별 문제를 관리하고 학습자의 풀이 결과를 추적합니다.

## 기술 스택

### Backend
- **Framework**: Spring Boot 3.x
- **Language**: Java 17+
- **Database**: MySQL 8.0+
- **ORM**: JPA (Hibernate)
- **Security**: Spring Security + JWT
- **Build Tool**: Gradle

### Frontend
- **Framework**: React 18
- **Language**: JavaScript/JSX
- **Styling**: CSS3
- **HTTP Client**: Axios
- **Routing**: React Router
- **Build Tool**: Vite

## 디렉토리 구조

```
edutest/
├── backend/                    # Spring Boot 백엔드
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/edutest/
│   │   │   │   ├── config/           # 설정 클래스
│   │   │   │   │   ├── SecurityConfig.java
│   │   │   │   │   ├── CorsConfig.java
│   │   │   │   │   └── JwtConfig.java
│   │   │   │   ├── controller/       # REST API 컨트롤러
│   │   │   │   │   ├── AuthController.java
│   │   │   │   │   ├── SubjectController.java
│   │   │   │   │   ├── LevelController.java
│   │   │   │   │   ├── QuestionController.java
│   │   │   │   │   └── AttemptController.java
│   │   │   │   ├── dto/              # Data Transfer Objects
│   │   │   │   │   ├── LoginRequest.java
│   │   │   │   │   ├── QuestionDTO.java
│   │   │   │   │   ├── AttemptDTO.java
│   │   │   │   │   └── StatisticsDTO.java
│   │   │   │   ├── entity/           # JPA 엔티티
│   │   │   │   │   ├── User.java
│   │   │   │   │   ├── Subject.java
│   │   │   │   │   ├── Level.java
│   │   │   │   │   ├── Question.java
│   │   │   │   │   ├── QuestionOption.java
│   │   │   │   │   ├── UserAttempt.java
│   │   │   │   │   └── UserAnswer.java
│   │   │   │   ├── repository/       # JPA 리포지토리
│   │   │   │   │   ├── UserRepository.java
│   │   │   │   │   ├── SubjectRepository.java
│   │   │   │   │   ├── LevelRepository.java
│   │   │   │   │   ├── QuestionRepository.java
│   │   │   │   │   ├── QuestionOptionRepository.java
│   │   │   │   │   ├── UserAttemptRepository.java
│   │   │   │   │   └── UserAnswerRepository.java
│   │   │   │   ├── service/          # 비즈니스 로직
│   │   │   │   │   ├── AuthService.java
│   │   │   │   │   ├── UserService.java
│   │   │   │   │   ├── SubjectService.java
│   │   │   │   │   ├── LevelService.java
│   │   │   │   │   ├── QuestionService.java
│   │   │   │   │   └── AttemptService.java
│   │   │   │   ├── security/         # 보안 관련
│   │   │   │   │   ├── JwtTokenProvider.java
│   │   │   │   │   └── CustomUserDetailsService.java
│   │   │   │   └── EduTestApplication.java
│   │   │   └── resources/
│   │   │       ├── application.yml
│   │   │       ├── application-dev.yml
│   │   │       └── schema.sql
│   │   └── test/
│   ├── build.gradle
│   └── README.md
│
├── frontend/                   # React 프론트엔드
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/              # React 컴포넌트
│   │   │   ├── auth/
│   │   │   │   ├── Login.jsx
│   │   │   │   └── Register.jsx
│   │   │   ├── admin/
│   │   │   │   ├── SubjectManagement.jsx
│   │   │   │   ├── LevelManagement.jsx
│   │   │   │   ├── QuestionManagement.jsx
│   │   │   │   └── QuestionEditor.jsx
│   │   │   ├── student/
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── SubjectSelection.jsx
│   │   │   │   ├── QuestionSolver.jsx
│   │   │   │   ├── ResultView.jsx
│   │   │   │   └── MyHistory.jsx
│   │   │   └── common/
│   │   │       ├── Navbar.jsx
│   │   │       ├── Sidebar.jsx
│   │   │       └── Loading.jsx
│   │   ├── services/                # API 서비스
│   │   │   ├── authService.js
│   │   │   ├── subjectService.js
│   │   │   ├── levelService.js
│   │   │   ├── questionService.js
│   │   │   └── attemptService.js
│   │   ├── utils/                   # 유틸리티
│   │   │   ├── api.js
│   │   │   └── helpers.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   └── README.md
│
├── docs/                       # 문서
│   ├── API_REFERENCE.md
│   ├── DEPLOYMENT_GUIDE.md
│   └── USER_MANUAL.md
│
├── scripts/                    # 유틸리티 스크립트
│   └── init-db.sql
│
├── DATABASE_SCHEMA.md
├── PROJECT_STRUCTURE.md
└── README.md
```

## 주요 기능

### 1. 인증 및 권한 관리
- 회원가입/로그인 (JWT 기반)
- 역할 기반 접근 제어 (학생, 선생님, 관리자)

### 2. 과목 및 레벨 관리 (관리자/선생님)
- 과목 CRUD
- 레벨 CRUD
- 과목별 통계 조회

### 3. 문제 관리 (선생님/관리자)
- 문제 생성/수정/삭제
- 선택지 관리
- 문제 유형: 객관식, O/X, 주관식, 서술형
- 과목 및 레벨별 문제 필터링

### 4. 문제 풀이 (학생)
- 과목 및 레벨 선택
- 문제 목록 조회
- 문제 풀이
- 자동 채점 (객관식, O/X)
- 풀이 시간 측정

### 5. 결과 관리
- 개인별 풀이 결과 저장
- 점수 및 정답률 통계
- 풀이 히스토리 조회
- 과목별/레벨별 성적 분석

### 6. 대시보드
- 학생: 학습 진도, 최근 결과, 통계
- 선생님: 학생 현황, 문제 통계
- 관리자: 전체 시스템 통계

## API 엔드포인트 (예시)

### 인증
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `POST /api/auth/refresh` - 토큰 갱신

### 과목
- `GET /api/subjects` - 전체 과목 조회
- `POST /api/subjects` - 과목 생성
- `PUT /api/subjects/{id}` - 과목 수정
- `DELETE /api/subjects/{id}` - 과목 삭제

### 레벨
- `GET /api/levels` - 전체 레벨 조회
- `POST /api/levels` - 레벨 생성

### 문제
- `GET /api/questions?subjectId={id}&levelId={id}` - 문제 조회
- `POST /api/questions` - 문제 생성
- `PUT /api/questions/{id}` - 문제 수정
- `DELETE /api/questions/{id}` - 문제 삭제

### 풀이
- `POST /api/attempts/start` - 풀이 시작
- `POST /api/attempts/{id}/submit` - 답안 제출
- `GET /api/attempts/{id}/result` - 결과 조회
- `GET /api/attempts/my-history` - 내 풀이 기록

## 개발 단계

1. **Phase 1**: 프로젝트 초기 설정 및 인증 구현
2. **Phase 2**: 과목/레벨 관리 기능
3. **Phase 3**: 문제 관리 기능
4. **Phase 4**: 문제 풀이 기능
5. **Phase 5**: 결과 관리 및 통계
6. **Phase 6**: UI/UX 개선 및 테스트
7. **Phase 7**: 배포

## 다음 단계

1. Spring Boot 프로젝트 생성
2. React 프로젝트 생성
3. 데이터베이스 스키마 생성
4. 기본 엔티티 및 리포지토리 구현
5. 인증 시스템 구현
