# EduTest AWS 배포 가이드

GitHub를 통한 AWS Elastic Beanstalk 배포 - 단계별 가이드입니다.

## 사전 준비

1. **AWS 계정** 및 무료 사용 기간 확인
2. **GitHub 저장소**: https://github.com/mhpark03/kaion.git
3. **AWS CLI** 설치 (선택사항)
   ```bash
   # Windows
   winget install Amazon.AWSCLI

   # 설정
   aws configure
   ```

---

## 단계 1: RDS 데이터베이스 생성 (5분)

1. AWS Console → RDS → "데이터베이스 생성"
2. 설정:
   - **엔진**: MySQL 8.0
   - **템플릿**: 프리 티어
   - **DB 인스턴스 식별자**: `edutest-db`
   - **마스터 사용자**: `admin`
   - **비밀번호**: 안전한 비밀번호 설정 (기록 필수!)
   - **퍼블릭 액세스**: **예**
   - **초기 데이터베이스 이름**: `edutest`
   - **추가 구성** → 데이터베이스 옵션:
     * 문자 집합: `utf8mb4`
     * 정렬: `utf8mb4_unicode_ci`

3. 생성 후 **엔드포인트** 기록
   - 예: `edutest-db.xxxx.ap-northeast-2.rds.amazonaws.com`

---

## 단계 2: Backend 빌드 및 배포 (10분)

### 2.1 로컬에서 빌드

```bash
cd C:\edutest\backend
./gradlew clean build
```

빌드된 JAR 파일 위치:
```
C:\edutest\backend\build\libs\backend-0.0.1-SNAPSHOT.jar
```

### 2.2 Elastic Beanstalk 생성

1. AWS Console → Elastic Beanstalk → "애플리케이션 생성"

2. 기본 정보:
   - **애플리케이션 이름**: `edutest-backend`
   - **플랫폼**: Java
   - **플랫폼 브랜치**: Corretto 17
   - **애플리케이션 코드**: 로컬 파일 업로드
     * 위에서 빌드한 JAR 파일 선택

3. "추가 옵션 구성" 클릭

4. **소프트웨어** 섹션 편집 - 환경 속성 추가:

   ```
   SPRING_PROFILES_ACTIVE = prod
   DB_URL = jdbc:mysql://edutest-db.xxxx.ap-northeast-2.rds.amazonaws.com:3306/edutest?characterEncoding=UTF-8&serverTimezone=Asia/Seoul&useSSL=false
   DB_USERNAME = admin
   DB_PASSWORD = [RDS 비밀번호]
   JWT_SECRET = edutest2025!SecretKey#ForJWT@Production$Deployment%Server&Security
   CORS_ALLOWED_ORIGINS = http://edutest-frontend.s3-website.ap-northeast-2.amazonaws.com
   AWS_ACCESS_KEY_ID = [AWS Access Key]
   AWS_SECRET_ACCESS_KEY = [AWS Secret Key]
   AWS_S3_BUCKET_NAME = edutest-secrets-bucket
   ```

   **중요**:
   - `JWT_SECRET`: 최소 32자 이상 (256비트 보안)
   - `DB_URL`에 `characterEncoding=UTF-8` 포함 (한글 지원)

5. **인스턴스** 섹션:
   - EC2 인스턴스 유형: `t2.micro` (프리 티어) 또는 `t3.small` (더 나은 성능)

6. **용량** 섹션:
   - 환경 유형: **단일 인스턴스** (비용 절감)

7. "생성" 클릭 (5-10분 소요)

### 2.3 보안 그룹 설정

1. EC2 → 보안 그룹 → Elastic Beanstalk 보안 그룹 찾기
   - 이름에 `elasticbeanstalk` 포함
   - 보안 그룹 ID 복사 (예: `sg-0123456789abcdef`)

2. RDS 보안 그룹 편집:
   - RDS → 데이터베이스 → `edutest-db` 선택
   - VPC 보안 그룹 클릭
   - 인바운드 규칙 편집
   - 규칙 추가:
     * 유형: **MySQL/Aurora**
     * 포트: **3306**
     * 소스: 위에서 복사한 EB 보안 그룹 ID 붙여넣기
   - "규칙 저장"

### 2.4 배포 확인

Elastic Beanstalk 환경 URL에서 헬스체크:
```
https://edutest-backend-env.xxxxxxxxxx.ap-northeast-2.elasticbeanstalk.com/actuator/health
```

정상 응답:
```json
{"status":"UP"}
```

---

## 단계 3: S3 Secrets 버킷 생성 (OpenAI API Key 저장용)

1. AWS Console → S3 → "버킷 만들기"
2. 설정:
   - **버킷 이름**: `edutest-secrets-bucket`
   - **리전**: ap-northeast-2 (서울)
   - **퍼블릭 액세스 차단**: 모두 활성화 (보안)
   - **버킷 버전 관리**: 비활성화 (선택사항)
   - **서버 측 암호화**: AES-256 활성화
3. "버킷 만들기"

---

## 단계 4: Frontend 빌드 및 배포 (10분)

### 4.1 API URL 설정

`C:\edutest\frontend\.env.production` 파일 생성 또는 수정:
```env
VITE_API_URL=https://edutest-backend-env.xxxxxxxxxx.ap-northeast-2.elasticbeanstalk.com
```

**중요**: EB 환경 URL을 정확히 입력하세요!

### 4.2 Frontend 빌드

```bash
cd C:\edutest\frontend
npm install
npm run build
```

빌드 결과: `C:\edutest\frontend\dist\`

### 4.3 S3 버킷 생성 (Frontend 호스팅용)

1. AWS Console → S3 → "버킷 만들기"
2. 설정:
   - **버킷 이름**: `edutest-frontend`
   - **리전**: ap-northeast-2
   - **퍼블릭 액세스 차단**: **모두 해제** (체크 해제)
   - "버킷 만들기"

3. 버킷 → 속성 → "정적 웹 사이트 호스팅" 편집:
   - **활성화** 선택
   - **인덱스 문서**: `index.html`
   - **오류 문서**: `index.html` (React Router 지원)
   - "변경 사항 저장"

4. 버킷 → 권한 → "버킷 정책" 편집:

   아래 JSON 붙여넣기:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::edutest-frontend/*"
       }
     ]
   }
   ```
   - "변경 사항 저장"

### 4.4 파일 업로드

**방법 1: AWS Console 사용**
1. S3 버킷 → "업로드"
2. `C:\edutest\frontend\dist\` 폴더 열기
3. **모든 파일과 폴더** 선택 (Ctrl+A)
4. 드래그 앤 드롭 또는 "파일 추가"
5. "업로드" 클릭

**방법 2: AWS CLI 사용 (더 빠름)**
```bash
cd C:\edutest\frontend
aws s3 sync dist/ s3://edutest-frontend --delete
```

### 4.5 웹사이트 URL 확인

S3 버킷 → 속성 → "정적 웹 사이트 호스팅" 섹션에서 엔드포인트 확인:
```
http://edutest-frontend.s3-website.ap-northeast-2.amazonaws.com
```

이 URL을 브라우저에서 열어 테스트하세요!

---

## 단계 5: CORS 설정 업데이트

Backend의 CORS 설정에 Frontend S3 URL 추가:

Elastic Beanstalk → 환경 → 구성 → 소프트웨어 → 편집:

```
CORS_ALLOWED_ORIGINS = http://localhost:5174,http://edutest-frontend.s3-website.ap-northeast-2.amazonaws.com
```

**적용** 클릭 (환경 재시작됨, 2-3분 소요)

---

## 단계 6: 데이터베이스 초기화

### 6.1 데이터베이스 연결 테스트 (선택사항)

로컬에서 RDS에 연결:
```bash
mysql -h edutest-db.xxxx.ap-northeast-2.rds.amazonaws.com -u admin -p
# 비밀번호 입력

# 데이터베이스 선택
USE edutest;

# 테이블 확인
SHOW TABLES;
```

### 6.2 초기 데이터

Spring Boot의 `DataInitializer`가 첫 실행 시 자동으로:
- Default admin 계정 생성
- 기본 과학 과목 생성
- 레벨/학년 체크

별도 SQL 스크립트 실행 불필요!

---

## 단계 7: OpenAI API Key 저장 (AI 기능 사용 시)

AI 문제 생성 기능을 사용하려면 OpenAI API Key를 S3에 저장:

### 7.1 Frontend에서 설정

1. Frontend URL 접속
2. ADMIN 계정으로 로그인:
   - Email: `mhpark@lguplus.co.kr`
   - Password: `test001!`
3. Settings 또는 Secrets 메뉴에서 API Key 입력

### 7.2 또는 curl로 직접 저장

```bash
# 1. 로그인해서 JWT 토큰 받기
curl -X POST https://edutest-backend-env.xxxx.elasticbeanstalk.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "mhpark@lguplus.co.kr",
    "password": "test001!"
  }'

# 응답에서 token 값을 복사

# 2. API Key 저장
curl -X POST https://edutest-backend-env.xxxx.elasticbeanstalk.com/api/secrets/openai-api-key \
  -H "Authorization: Bearer <위에서_받은_토큰>" \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "sk-proj-..."
  }'
```

---

## 단계 8: 테스트

### 8.1 Frontend 접속

S3 웹사이트 URL 브라우저에서 열기:
```
http://edutest-frontend.s3-website.ap-northeast-2.amazonaws.com
```

### 8.2 로그인

- **ADMIN**: mhpark@lguplus.co.kr / test001!
- 또는 회원가입으로 새 계정 생성

### 8.3 기능 테스트

1. **교육과정 관리** (Content Management):
   - Level 생성 (예: High School)
   - Grade 생성 (예: H1, H2)
   - Subject 생성 (예: 과학, 물리)
   - Unit → SubUnit → Concept 생성

2. **문제 관리** (Question Management):
   - 문제 목록 확인
   - 필터링 (학년, 난이도 등)
   - 페이지네이션

3. **AI 문제 생성** (Create Question):
   - Concept 선택
   - 난이도 선택
   - AI 생성 버튼 클릭
   - 생성된 문제 검토 및 저장

### 8.4 브라우저 개발자 도구 확인

F12 → Console 탭:
- CORS 오류 없는지 확인
- 401/403 인증 오류 없는지 확인

F12 → Network 탭:
- API 호출이 200 OK 응답하는지 확인
- `/api/questions`, `/api/concepts` 등

---

## 기존 EC2 서버 종료 (claudtest → edutest)

무료 사용 기간이므로 기존 서버를 내리고 edutest를 올리는 경우:

### 1. 기존 Elastic Beanstalk 환경 종료

1. Elastic Beanstalk Console → Applications
2. `kiosk-backend` 또는 기존 애플리케이션 선택
3. 환경 선택 → Actions → **Terminate environment**
4. 확인 입력 후 종료 (5분 소요)

### 2. 기존 RDS 백업 및 삭제

1. **스냅샷 생성** (백업):
   - RDS → Databases → `kiosk-db` 선택
   - Actions → **Take snapshot**
   - 스냅샷 식별자: `kiosk-db-final-backup-2025`
   - "스냅샷 생성" (5-10분)

2. **RDS 삭제**:
   - RDS → Databases → `kiosk-db` 선택
   - Actions → **Delete**
   - 옵션:
     * ☑ 최종 스냅샷 생성 (이름: `kiosk-db-before-delete`)
     * ☐ 자동 백업 보관 (선택사항)
   - 확인 문구 입력: `delete me`
   - "삭제"

### 3. S3 버킷 정리

1. **기존 Frontend 버킷 비우기**:
   - S3 → `kiosk-frontend` 버킷
   - "버킷 비우기" → 확인 문구 입력 → 비우기

2. **버킷 삭제**:
   - "버킷 삭제" → 버킷 이름 입력 → 삭제

3. **기타 S3 버킷**:
   - Elastic Beanstalk 자동 생성 버킷도 확인 후 삭제

### 4. CloudWatch Logs 정리 (선택사항)

1. CloudWatch → Logs → Log groups
2. `/aws/elasticbeanstalk/kiosk-backend-env/...` 삭제
3. 비용 절감

### 5. 불필요한 보안 그룹 정리

EC2 → Security Groups:
- 사용 중이지 않은 보안 그룹 삭제
- `elasticbeanstalk-...` 로 시작하는 것들 확인

---

## 선택사항: CloudFront 설정 (HTTPS + CDN)

S3만 사용하면 HTTP만 지원됩니다. HTTPS를 원하면 CloudFront 추가:

### 1. CloudFront 배포 생성

1. AWS Console → CloudFront → "배포 생성"

2. 설정:
   - **원본 도메인**: S3 **웹사이트 엔드포인트** 선택
     * `edutest-frontend.s3-website.ap-northeast-2.amazonaws.com`
     * 주의: S3 REST API 엔드포인트 아님!
   - **원본 경로**: 비워두기
   - **프로토콜**: HTTP only
   - **뷰어 프로토콜 정책**: **Redirect HTTP to HTTPS**
   - **허용된 HTTP 메서드**: GET, HEAD
   - **기본 루트 객체**: `index.html`

3. **사용자 지정 오류 응답** (React Router 지원):
   - "사용자 지정 오류 응답 생성"
   - **HTTP 오류 코드**: 403 Forbidden
   - **응답 페이지 경로**: `/index.html`
   - **HTTP 응답 코드**: 200 OK
   - "생성"

   - 동일하게 **404 Not Found**도 추가

4. "배포 생성" (10-15분 소요)

### 2. CloudFront URL 확인

배포 → Domain name:
```
https://d1234abcd5678.cloudfront.net
```

### 3. Backend CORS 업데이트

Elastic Beanstalk 환경 변수에 CloudFront URL 추가:
```
CORS_ALLOWED_ORIGINS = http://localhost:5174,https://d1234abcd5678.cloudfront.net
```

---

## GitHub Actions 자동 배포 (고급)

`.github/workflows/deploy.yml` 생성:

```yaml
name: Deploy EduTest to AWS

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
          distribution: 'corretto'

      - name: Build Backend
        run: |
          cd backend
          ./gradlew clean build -x test

      - name: Deploy to Elastic Beanstalk
        uses: einaregilsson/beanstalk-deploy@v21
        with:
          aws_access_key: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws_secret_key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          application_name: edutest-backend
          environment_name: edutest-backend-env
          region: ap-northeast-2
          version_label: ${{ github.sha }}
          deployment_package: backend/build/libs/backend-0.0.1-SNAPSHOT.jar

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Build Frontend
        run: |
          cd frontend
          npm ci
          npm run build
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}

      - name: Deploy to S3
        run: |
          aws s3 sync frontend/dist/ s3://edutest-frontend --delete
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_REGION: ap-northeast-2

      - name: Invalidate CloudFront (if using)
        run: |
          aws cloudfront create-invalidation --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} --paths "/*"
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

**GitHub Secrets 설정** (Settings → Secrets and variables → Actions):
```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
VITE_API_URL
CLOUDFRONT_DISTRIBUTION_ID (선택)
```

---

## 예상 비용

### 프리 티어 (첫 12개월):
- **거의 무료!** 약 $0-5/월
  - RDS: db.t2.micro 750시간/월 무료
  - EC2: t2.micro 750시간/월 무료
  - S3: 5GB 무료
  - 데이터 전송: 100GB/월 무료

### 프리 티어 이후:
- RDS db.t2.micro: $15-20/월
- EC2 t2.micro (EB): $8-10/월
- S3 + 데이터 전송: $1-3/월
- CloudFront (선택): $1-5/월
- **총: $25-38/월**

### 비용 절감 팁:
1. 개발/테스트 시간 외에는 EB 환경 종료
2. RDS 스냅샷 생성 후 인스턴스 삭제 (필요시 복원)
3. CloudWatch 로그 보존 기간 7일로 설정
4. 사용하지 않는 EBS 볼륨 삭제

---

## 문제 해결

### Backend 시작 실패

1. **CloudWatch Logs 확인**:
   - Elastic Beanstalk → 로그 → "마지막 100줄 요청"
   - 오류 메시지 확인

2. **흔한 문제**:
   - ❌ `DB_URL` 환경 변수 오타
   - ❌ RDS 보안 그룹 미설정
   - ❌ JWT_SECRET 길이 부족 (최소 256비트 = 32자)
   - ❌ MySQL 드라이버 버전 불일치

### Frontend API 호출 실패

1. **CORS 오류**:
   ```
   Access to XMLHttpRequest has been blocked by CORS policy
   ```
   - Backend `CORS_ALLOWED_ORIGINS`에 Frontend S3 URL 추가 확인
   - EB 환경 재시작 필요할 수 있음

2. **404 Not Found**:
   - `.env.production`의 `VITE_API_URL` 확인
   - `npm run build` 재실행 필요
   - S3에 재업로드

3. **401 Unauthorized**:
   - JWT 토큰 만료
   - 로그아웃 후 재로그인

### 한글 깨짐

1. **RDS 문자 집합 확인**:
   ```sql
   SHOW VARIABLES LIKE 'character_set%';
   -- 모두 utf8mb4여야 함
   ```

2. **DB_URL 파라미터 확인**:
   ```
   ?characterEncoding=UTF-8&serverTimezone=Asia/Seoul
   ```

3. **Frontend 파일 인코딩**:
   - VS Code에서 UTF-8로 저장되었는지 확인

### 배포 후 변경사항이 반영 안됨

1. **Backend**:
   - EB에 새 버전 업로드 필요
   - 환경 변수 변경 후 재시작

2. **Frontend**:
   - 브라우저 캐시 삭제 (Ctrl+Shift+R)
   - S3에 파일 재업로드
   - CloudFront 사용 시 Invalidation 생성

---

## 지원

문제 발생 시:
1. **CloudWatch Logs** 먼저 확인
2. **보안 그룹** 설정 재확인
3. **환경 변수** 오타 확인
4. GitHub Issues: https://github.com/mhpark03/kaion/issues

배포 성공을 기원합니다! 🚀
