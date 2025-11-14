# AWS 배포 가이드

## 환경 변수 설정

### 백엔드 (Spring Boot)

AWS Elastic Beanstalk, EC2, 또는 ECS에서 다음 환경 변수를 설정하세요:

```bash
# Database
DB_URL=jdbc:mysql://your-rds-endpoint:3306/edutest
DB_USERNAME=your-db-username
DB_PASSWORD=your-db-password

# JWT
JWT_SECRET=your-production-secret-key-minimum-256-bits-please-change-this
JWT_EXPIRATION=86400000
JWT_REFRESH_EXPIRATION=604800000

# CORS
CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com,https://www.your-frontend-domain.com

# Server
PORT=8080

# Spring Profile
SPRING_PROFILES_ACTIVE=prod
```

### 프론트엔드 (React + Vite)

#### 로컬 개발 환경
`.env.local` 파일 사용 (이미 생성됨):
```
VITE_API_BASE_URL=http://localhost:8081/api
```

#### AWS 프로덕션 환경
`.env.production` 파일 수정:
```
VITE_API_BASE_URL=https://your-api-domain.com/api
```

또는 빌드 시 환경 변수로 전달:
```bash
VITE_API_BASE_URL=https://your-api-domain.com/api npm run build
```

## AWS 배포 옵션

### 1. AWS Elastic Beanstalk (권장)

#### 백엔드
```bash
cd backend
./gradlew clean build
eb init
eb create edutest-backend-prod
eb setenv DB_URL=... DB_USERNAME=... DB_PASSWORD=... JWT_SECRET=... CORS_ALLOWED_ORIGINS=...
eb deploy
```

#### 프론트엔드
```bash
cd frontend
npm run build
# S3 + CloudFront로 배포
aws s3 sync dist/ s3://your-frontend-bucket/
```

### 2. AWS EC2

#### 백엔드
1. EC2 인스턴스 생성 (Amazon Linux 2 또는 Ubuntu)
2. Java 17 설치
3. MySQL RDS 인스턴스 생성 및 연결
4. 환경 변수를 `/etc/environment` 또는 systemd service 파일에 설정
5. JAR 파일 배포 및 실행:
```bash
java -jar edutest-backend.jar --spring.profiles.active=prod
```

#### 프론트엔드
1. S3 버킷 생성 (정적 웹사이트 호스팅 활성화)
2. CloudFront 배포 생성
3. 빌드 및 업로드:
```bash
npm run build
aws s3 sync dist/ s3://your-frontend-bucket/
```

### 3. AWS ECS (컨테이너)

#### Dockerfile 예시 (백엔드)
```dockerfile
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY build/libs/*.jar app.jar
ENV SPRING_PROFILES_ACTIVE=prod
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

#### Dockerfile 예시 (프론트엔드)
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 보안 고려사항

1. **JWT Secret**: 프로덕션에서는 반드시 강력한 시크릿 키 사용
2. **HTTPS**: 프로덕션에서는 반드시 HTTPS 사용 (ACM 인증서 + ALB/CloudFront)
3. **환경 변수**: 민감한 정보는 AWS Systems Manager Parameter Store 또는 Secrets Manager 사용 권장
4. **데이터베이스**: RDS 사용 시 VPC 내에 배치하고 보안 그룹 적절히 설정
5. **CORS**: 프로덕션 도메인만 허용하도록 설정

## 데이터베이스 마이그레이션

프로덕션 환경에서는 `ddl-auto: validate`를 사용하고, 데이터베이스 스키마 변경은 Flyway 또는 Liquibase 같은 마이그레이션 도구를 사용하는 것을 권장합니다.

## 모니터링 및 로깅

- CloudWatch를 사용하여 애플리케이션 로그 수집
- CloudWatch Alarms로 오류 모니터링
- X-Ray를 사용한 분산 추적 (선택사항)

## CI/CD 파이프라인

GitHub Actions, AWS CodePipeline, 또는 Jenkins를 사용하여 자동 배포 파이프라인을 구성할 수 있습니다.

### GitHub Actions 예시
`.github/workflows/deploy.yml` 파일 생성:
```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up JDK 17
        uses: actions/setup-java@v3
        with:
          java-version: '17'
      - name: Build with Gradle
        run: cd backend && ./gradlew clean build
      - name: Deploy to Elastic Beanstalk
        # EB CLI 또는 AWS CLI 사용

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Build
        run: cd frontend && npm ci && npm run build
        env:
          VITE_API_BASE_URL: ${{ secrets.API_BASE_URL }}
      - name: Deploy to S3
        run: aws s3 sync frontend/dist/ s3://your-bucket/
```

## 비용 최적화

- 개발/테스트 환경은 작은 인스턴스 타입 사용 (t3.micro, t3.small)
- Auto Scaling 그룹 설정으로 트래픽에 따라 자동 확장/축소
- S3 + CloudFront는 비용 효율적인 프론트엔드 호스팅 방법
- RDS는 필요한 경우에만 Multi-AZ 활성화
