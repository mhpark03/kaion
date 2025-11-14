# EduTest 시작 가이드

교육 컨텐츠 관리 시스템을 로컬 환경에서 실행하는 방법입니다.

## 사전 요구사항

다음 소프트웨어가 설치되어 있어야 합니다:

- **JDK 17 이상** - [다운로드](https://adoptium.net/)
- **Node.js 18 이상** - [다운로드](https://nodejs.org/)
- **MySQL 8.0 이상** - [다운로드](https://dev.mysql.com/downloads/mysql/)
- **Git** - [다운로드](https://git-scm.com/)

## 1단계: 데이터베이스 설정

### MySQL 데이터베이스 생성

1. MySQL에 접속:
```bash
mysql -u root -p
```

2. 데이터베이스 생성:
```sql
CREATE DATABASE edutest CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

3. 종료:
```sql
exit;
```

### 초기 스키마 및 데이터 삽입

```bash
mysql -u root -p edutest < scripts/init-db.sql
```

## 2단계: 백엔드 설정

### 환경 설정

`backend/src/main/resources/application-dev.yml` 파일을 열어서 MySQL 연결 정보를 확인하고 필요시 수정하세요:

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/edutest?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
    username: root
    password: root  # 본인의 MySQL 비밀번호로 변경
```

### 백엔드 실행

#### Windows:
```bash
cd backend
gradlew.bat bootRun
```

#### Linux/Mac:
```bash
cd backend
./gradlew bootRun
```

백엔드가 성공적으로 시작되면 http://localhost:8081 에서 실행됩니다.

### 백엔드 테스트

새 터미널을 열어서 다음 명령어로 API가 정상 작동하는지 확인:

```bash
curl http://localhost:8081/api/test/hello
curl http://localhost:8081/api/test/health
```

또는 브라우저에서:
- http://localhost:8081/api/test/hello
- http://localhost:8081/api/test/health

## 3단계: 프론트엔드 설정

### 의존성 설치

새 터미널을 열어서:

```bash
cd frontend
npm install
```

### 프론트엔드 실행

```bash
npm run dev
```

프론트엔드가 성공적으로 시작되면 http://localhost:5174 에서 실행됩니다.

## 4단계: 애플리케이션 확인

1. 브라우저에서 http://localhost:5174 를 열어주세요
2. 메인 페이지가 표시되고 백엔드 연결 테스트 결과가 나타나면 성공입니다!

## 초기 계정 정보

데이터베이스 초기화 스크립트로 생성된 테스트 계정:

| 역할 | 아이디 | 비밀번호 | 이메일 |
|------|--------|----------|--------|
| 관리자 | admin | admin123 | admin@edutest.com |
| 선생님 | teacher | teacher123 | teacher@edutest.com |
| 학생 | student | student123 | student@edutest.com |

> ⚠️ 주의: 실제 운영 환경에서는 반드시 비밀번호를 변경하세요!

## 문제 해결

### 백엔드 실행 오류

**문제**: `Could not resolve all dependencies`
```bash
# Gradle 캐시 정리
cd backend
gradlew.bat clean build --refresh-dependencies
```

**문제**: `Access denied for user`
- `application-dev.yml`에서 MySQL 사용자명과 비밀번호 확인
- MySQL 서버가 실행 중인지 확인

**문제**: `Communications link failure`
- MySQL 서버가 3306 포트에서 실행 중인지 확인
- 방화벽 설정 확인

### 프론트엔드 실행 오류

**문제**: `EADDRINUSE: address already in use`
- 5174 포트가 이미 사용 중입니다
- `vite.config.js`에서 다른 포트로 변경

**문제**: API 호출 실패
- 백엔드가 실행 중인지 확인 (http://localhost:8081/api/test/hello)
- 브라우저 개발자 도구의 Console과 Network 탭 확인

### 데이터베이스 오류

**문제**: `Table doesn't exist`
```bash
# 데이터베이스 재생성
mysql -u root -p
DROP DATABASE edutest;
CREATE DATABASE edutest CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit;

# 스키마 다시 실행
mysql -u root -p edutest < scripts/init-db.sql
```

## 다음 단계

프로젝트가 정상적으로 실행되면:

1. **인증 시스템 구현**: 로그인/회원가입 기능 개발
2. **과목 관리**: 과목 CRUD 기능 구현
3. **문제 관리**: 문제 생성 및 관리 기능
4. **문제 풀이**: 학생용 문제 풀이 인터페이스
5. **결과 분석**: 통계 및 성적 관리 기능

자세한 개발 계획은 `PROJECT_STRUCTURE.md`를 참조하세요.

## 도움이 필요하신가요?

- 📖 [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) - 데이터베이스 구조
- 📖 [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) - 프로젝트 구조 및 기능
- 📖 [backend/README.md](backend/README.md) - 백엔드 상세 가이드
- 📖 [frontend/README.md](frontend/README.md) - 프론트엔드 상세 가이드

## 포트 요약

| 서비스 | 포트 | URL |
|--------|------|-----|
| 백엔드 | 8081 | http://localhost:8081 |
| 프론트엔드 | 5174 | http://localhost:5174 |
| MySQL | 3306 | localhost:3306 |
