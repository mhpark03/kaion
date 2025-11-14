# EduTest Backend

Spring Boot 기반 교육 컨텐츠 관리 시스템 백엔드

## 기술 스택

- Java 17
- Spring Boot 3.2.0
- Spring Security + JWT
- JPA (Hibernate)
- MySQL 8.0+
- Gradle

## 시작하기

### 사전 요구사항

- JDK 17 이상
- MySQL 8.0 이상
- Gradle (또는 포함된 Gradle Wrapper 사용)

### 데이터베이스 설정

1. MySQL에 접속하여 데이터베이스 생성:
```sql
CREATE DATABASE edutest CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. 초기 스키마 및 데이터 삽입:
```bash
mysql -u root -p edutest < ../scripts/init-db.sql
```

### 환경 설정

`src/main/resources/application-dev.yml` 파일에서 데이터베이스 연결 정보를 확인/수정하세요:

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/edutest?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
    username: root
    password: root  # 본인의 MySQL 비밀번호로 변경
```

### 애플리케이션 실행

#### Gradle Wrapper 사용 (권장)

Windows:
```bash
gradlew.bat bootRun
```

Linux/Mac:
```bash
./gradlew bootRun
```

#### Gradle이 설치된 경우
```bash
gradle bootRun
```

애플리케이션은 `http://localhost:8081` 에서 실행됩니다.

### 테스트

API가 정상적으로 동작하는지 확인:

```bash
curl http://localhost:8081/api/test/hello
curl http://localhost:8081/api/test/health
```

## 프로젝트 구조

```
src/main/java/com/edutest/
├── config/              # 설정 클래스
│   ├── CorsConfig.java
│   └── SecurityConfig.java
├── controller/          # REST API 컨트롤러
│   └── TestController.java
├── dto/                 # Data Transfer Objects
├── entity/              # JPA 엔티티
│   ├── User.java
│   ├── Subject.java
│   ├── Level.java
│   ├── Question.java
│   ├── QuestionOption.java
│   ├── UserAttempt.java
│   └── UserAnswer.java
├── repository/          # JPA 리포지토리
│   ├── UserRepository.java
│   ├── SubjectRepository.java
│   ├── LevelRepository.java
│   ├── QuestionRepository.java
│   ├── QuestionOptionRepository.java
│   ├── UserAttemptRepository.java
│   └── UserAnswerRepository.java
├── security/            # 보안 관련
│   └── JwtTokenProvider.java
├── service/             # 비즈니스 로직
└── EduTestApplication.java
```

## API 엔드포인트

### 테스트 API
- `GET /api/test/hello` - Hello 메시지
- `GET /api/test/health` - 서버 상태 확인

### 인증 API (TODO)
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인

### 과목 API (TODO)
- `GET /api/subjects` - 전체 과목 조회
- `POST /api/subjects` - 과목 생성

### 문제 API (TODO)
- `GET /api/questions` - 문제 목록 조회
- `POST /api/questions` - 문제 생성

## 다음 단계

- [ ] 인증 시스템 구현 (AuthController, AuthService)
- [ ] 과목 관리 API
- [ ] 레벨 관리 API
- [ ] 문제 관리 API
- [ ] 문제 풀이 API
- [ ] 결과 관리 API

## 개발 팁

### Gradle Build
```bash
./gradlew clean build
```

### 테스트 실행
```bash
./gradlew test
```

### 패키지 생성
```bash
./gradlew bootJar
```

생성된 JAR 파일은 `build/libs/` 디렉토리에 있습니다.

## 문제 해결

### 포트 충돌
다른 애플리케이션이 8081 포트를 사용 중인 경우, `application.yml`에서 포트 변경:
```yaml
server:
  port: 8082
```

### 데이터베이스 연결 실패
- MySQL 서버가 실행 중인지 확인
- 데이터베이스 이름, 사용자명, 비밀번호 확인
- 방화벽 설정 확인
