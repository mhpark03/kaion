# GitHub Actions 자동 배포 설정 가이드

GitHub에서 main 브랜치에 푸시할 때마다 자동으로 AWS에 배포되도록 설정하는 방법입니다.

## 사전 준비

이 가이드는 **기존 `kiosk-backend-prod-v2` 환경을 edutest용으로 재사용**합니다.

이미 생성되어 있어야 하는 AWS 리소스:
- ✅ Elastic Beanstalk 애플리케이션: `kiosk-backend`
- ✅ Elastic Beanstalk 환경: `kiosk-backend-prod-v2`
- ✅ S3 버킷: 프론트엔드 호스팅용 (edutest-frontend 또는 기존 버킷)
- ✅ RDS 데이터베이스: MySQL 8.0+ (utf8mb4)

**중요**: 기존 kiosk 서비스를 edutest로 전환하는 경우, 먼저 RDS 데이터베이스를 백업하세요!

---

## 단계 1: GitHub Secrets 설정

GitHub 저장소에서 민감한 정보를 안전하게 저장합니다.

### 1.1 GitHub 저장소 페이지로 이동

https://github.com/mhpark03/kaion

### 1.2 Settings → Secrets and variables → Actions 클릭

### 1.3 "New repository secret" 클릭하여 아래 Secrets 추가

각 Secret을 하나씩 추가합니다:

#### **AWS_ACCESS_KEY_ID**
```
AWS IAM 사용자의 Access Key ID
예: AKIAIOSFODNN7EXAMPLE
```

**AWS Access Key 생성 방법:**
1. AWS Console → IAM → Users
2. 사용자 선택 또는 새로 생성
3. "Security credentials" 탭
4. "Create access key" 클릭
5. Use case: "Command Line Interface (CLI)"
6. Access key와 Secret access key 복사 (한 번만 표시됨!)

**필요한 권한:**
- AWSElasticBeanstalkFullAccess
- AmazonS3FullAccess
- CloudFrontFullAccess (CloudFront 사용 시)

---

#### **AWS_SECRET_ACCESS_KEY**
```
AWS IAM 사용자의 Secret Access Key
예: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

⚠️ **보안 주의**: 이 키는 절대 코드에 포함하거나 공개하지 마세요!

---

#### **VITE_API_URL**
```
https://kiosk-backend-prod-v2.xxxxxxxxxx.ap-northeast-2.elasticbeanstalk.com
```

기존 Elastic Beanstalk 환경의 URL입니다.

**확인 방법:**
1. AWS Console → Elastic Beanstalk
2. `kiosk-backend-prod-v2` 환경 선택
3. 상단의 URL 복사

**예시:**
```
https://kiosk-backend-prod-v2.ap-northeast-2.elasticbeanstalk.com
```

---

#### **S3_BUCKET_NAME**
```
edutest-frontend
```

Frontend를 호스팅하는 S3 버킷 이름입니다.

---

#### **CLOUDFRONT_DISTRIBUTION_ID** (선택사항)
```
E1234ABCD5678
```

CloudFront를 사용하는 경우에만 추가합니다.

**확인 방법:**
1. AWS Console → CloudFront
2. 배포 목록에서 ID 복사

CloudFront를 사용하지 않으면 이 Secret은 추가하지 않아도 됩니다.

---

### 1.4 설정 완료 확인

Settings → Secrets and variables → Actions에서 다음 Secrets가 보여야 합니다:
- ✅ AWS_ACCESS_KEY_ID
- ✅ AWS_SECRET_ACCESS_KEY
- ✅ VITE_API_URL
- ✅ S3_BUCKET_NAME
- ☐ CLOUDFRONT_DISTRIBUTION_ID (선택)

---

## 단계 2: GitHub Actions 워크플로우 확인

`.github/workflows/deploy.yml` 파일이 이미 생성되어 있습니다.

이 워크플로우는:
1. **Backend 배포**: Gradle 빌드 → Elastic Beanstalk에 배포
2. **Frontend 배포**: npm 빌드 → S3에 업로드 → CloudFront 캐시 무효화

---

## 단계 3: 자동 배포 테스트

### 3.1 코드 변경 및 푸시

간단한 변경을 만들어 테스트합니다:

```bash
cd C:\edutest

# 간단한 변경 (예: README 수정)
echo "# Test deployment" >> README.md

# Git 커밋 및 푸시
git add .
git commit -m "Test: GitHub Actions auto-deployment"
git push origin main
```

### 3.2 배포 진행 상황 확인

1. GitHub 저장소 페이지로 이동
2. **Actions** 탭 클릭
3. 최신 워크플로우 실행 확인
4. "Deploy EduTest to AWS" 클릭하여 로그 확인

**예상 시간:**
- Backend 빌드 및 배포: 3-5분
- Frontend 빌드 및 배포: 2-3분
- **총 소요 시간: 약 5-8분**

### 3.3 배포 성공 확인

#### Backend 확인
```
https://kiosk-backend-prod-v2.ap-northeast-2.elasticbeanstalk.com/actuator/health
```

응답:
```json
{"status":"UP"}
```

#### Frontend 확인
S3 버킷 이름에 따라 다름:
```
http://edutest-frontend.s3-website.ap-northeast-2.amazonaws.com
```
또는 기존 버킷:
```
http://kiosk-frontend.s3-website.ap-northeast-2.amazonaws.com
```

또는 CloudFront:
```
https://d1234abcd5678.cloudfront.net
```

로그인 페이지가 정상적으로 표시되어야 합니다.

---

## 단계 4: 수동 배포 실행 (선택사항)

코드 변경 없이 배포를 실행하려면:

1. GitHub 저장소 → **Actions** 탭
2. 왼쪽에서 "Deploy EduTest to AWS" 선택
3. 오른쪽 상단 **Run workflow** 클릭
4. Branch: **main** 선택
5. **Run workflow** 버튼 클릭

---

## 워크플로우 동작 방식

### 트리거 조건

```yaml
on:
  push:
    branches: [main]      # main 브랜치에 푸시할 때
  workflow_dispatch:      # 수동 실행 가능
```

### Backend 배포 과정

1. **체크아웃**: 코드 다운로드
2. **JDK 17 설정**: Java 환경 구성
3. **Gradle 빌드**:
   ```bash
   cd backend
   ./gradlew clean build -x test
   ```
4. **ZIP 패키징**: JAR 파일을 ZIP으로 압축
5. **Elastic Beanstalk 배포**:
   - 새 버전 업로드
   - 환경에 배포
   - 헬스체크 대기 (최대 5분)

### Frontend 배포 과정

1. **체크아웃**: 코드 다운로드
2. **Node.js 18 설정**: npm 환경 구성
3. **의존성 설치**: `npm ci`
4. **빌드**:
   ```bash
   cd frontend
   npm run build
   ```
   환경 변수 `VITE_API_URL` 주입
5. **S3 업로드**:
   ```bash
   aws s3 sync dist/ s3://edutest-frontend --delete
   ```
6. **CloudFront 무효화** (선택): 캐시 삭제

---

## 배포 실패 시 문제 해결

### 1. AWS 자격 증명 오류

**오류 메시지:**
```
Error: Unable to locate credentials
```

**해결 방법:**
- GitHub Secrets에 `AWS_ACCESS_KEY_ID`와 `AWS_SECRET_ACCESS_KEY`가 정확히 설정되었는지 확인
- IAM 사용자에게 필요한 권한이 있는지 확인

---

### 2. Elastic Beanstalk 배포 실패

**오류 메시지:**
```
Error: Environment kiosk-backend-prod-v2 is not Ready
```

**해결 방법:**
1. AWS Console → Elastic Beanstalk → `kiosk-backend-prod-v2` 확인
2. 환경이 "Green" 상태인지 확인
3. CloudWatch Logs에서 오류 확인
4. 필요시 환경 구성 재확인

**환경 변수 확인:**
kiosk-backend-prod-v2 환경에 edutest용 환경 변수가 설정되어 있는지 확인:
- `DB_URL` (edutest 데이터베이스)
- `CORS_ALLOWED_ORIGINS` (edutest 프론트엔드 URL 포함)
- `JWT_SECRET`
- `AWS_S3_BUCKET_NAME` (edutest-secrets-bucket)

---

### 3. Frontend 빌드 실패

**오류 메시지:**
```
Error: VITE_API_URL is not defined
```

**해결 방법:**
- GitHub Secrets에 `VITE_API_URL`이 설정되었는지 확인
- URL 형식 확인 (https:// 포함, 마지막 / 제외)

---

### 4. S3 업로드 권한 오류

**오류 메시지:**
```
Error: Access Denied
```

**해결 방법:**
- IAM 사용자에게 S3 쓰기 권한이 있는지 확인
- S3 버킷 이름이 정확한지 확인 (`S3_BUCKET_NAME` Secret)

---

### 5. Gradle 빌드 실패

**오류 메시지:**
```
Task :test FAILED
```

**해결 방법:**
- 로컬에서 테스트 실행: `./gradlew test`
- 실패한 테스트 수정
- 또는 워크플로우에서 `-x test` 플래그 사용 (이미 설정됨)

---

## 비용 최적화

### GitHub Actions 무료 한도

**Public 저장소**: 무제한 무료
**Private 저장소**: 월 2,000분 무료

현재 워크플로우 예상 시간: 약 8분/배포

### 배포 빈도 제한 (선택사항)

자주 배포하지 않으려면 워크플로우 트리거를 수정:

```yaml
on:
  push:
    branches: [main]
    paths:
      - 'backend/**'      # backend 폴더 변경 시만
      - 'frontend/**'     # frontend 폴더 변경 시만
  workflow_dispatch:
```

---

## 고급 설정

### 1. 환경별 배포 (개발/운영)

`.github/workflows/deploy-dev.yml` 추가:

```yaml
name: Deploy to Development

on:
  push:
    branches: [develop]

# ... edutest-backend-dev 환경에 배포
```

### 2. PR 빌드 테스트

`.github/workflows/test.yml` 추가:

```yaml
name: Test on PR

on:
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'corretto'
      - name: Run tests
        run: |
          cd backend
          ./gradlew test
```

### 3. Slack/Discord 알림

배포 완료 시 알림을 받으려면:

```yaml
- name: Notify deployment success
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: 'Deployment completed!'
    webhook_url: ${{ secrets.SLACK_WEBHOOK_URL }}
  if: always()
```

---

## 보안 체크리스트

배포 전 확인:

- ✅ AWS 자격 증명이 GitHub Secrets에만 저장됨
- ✅ `.env` 파일이 `.gitignore`에 포함됨
- ✅ `application-prod.yml`에 민감 정보 없음
- ✅ IAM 사용자가 최소 권한 원칙을 따름
- ✅ S3 버킷이 적절히 보호됨 (Secrets 버킷은 Private)

---

## 롤백 방법

배포 후 문제가 발생하면:

### Backend 롤백

1. Elastic Beanstalk Console → `edutest-backend-env`
2. **Application versions** 클릭
3. 이전 버전 선택
4. **Deploy** 클릭

### Frontend 롤백

1. 로컬에서 이전 커밋으로 체크아웃:
   ```bash
   git checkout <previous-commit-hash>
   ```

2. 수동 배포:
   ```bash
   cd frontend
   npm run build
   aws s3 sync dist/ s3://edutest-frontend --delete
   ```

---

## 다음 단계

배포 자동화 설정 완료 후:

1. ✅ **모니터링 설정**: CloudWatch 알람 추가
2. ✅ **백업 자동화**: RDS 스냅샷 스케줄
3. ✅ **성능 최적화**: CloudFront 캐싱 설정
4. ✅ **보안 강화**: WAF 규칙 추가
5. ✅ **로그 관리**: CloudWatch Logs 보존 기간 설정

---

## 지원

GitHub Actions 관련 문제:
1. **Actions** 탭에서 워크플로우 로그 확인
2. GitHub Secrets 설정 재확인
3. AWS 리소스 상태 확인
4. GitHub Issues: https://github.com/mhpark03/kaion/issues

성공적인 자동 배포를 기원합니다! 🚀
