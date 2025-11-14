# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EduTest is a hierarchical educational content management system for Korean science education. It uses a deep 5-level taxonomy (Level → Grade → Subject → Unit → SubUnit → Concept) to organize educational materials and questions, with AI-powered question generation via OpenAI GPT-5.

## Development Commands

### Backend (Spring Boot)
```bash
cd backend
./gradlew bootRun                    # Run dev server on port 8081
./gradlew build                      # Build JAR
./gradlew test                       # Run all tests
./gradlew clean build -x test       # Clean build without tests
```

### Frontend (React + Vite)
```bash
cd frontend
npm install                          # Install dependencies
npm run dev                          # Dev server on port 5174
npm run build                        # Production build
npm run preview                      # Preview production build
```

### Database
```bash
mysql -u root -p edutest < scripts/init-db.sql    # Initialize schema
```

## Architecture

### Content Hierarchy (5 Levels)

The system implements a strict hierarchical taxonomy for Korean science education:

```
Level (교육 과정)
  └─ Grade (학년)
      └─ Subject (과목)
          └─ Unit (대단원)
              └─ SubUnit (중단원)
                  └─ Concept (핵심개념)
                      └─ Question (문제)
```

**Key Relationships:**
- **Level**: Educational curriculum (e.g., "High School")
- **Grade**: Specific year within level (e.g., "H1" = 고등학교 1학년)
- **Subject**: Academic subject scoped to grade (e.g., "과학" for Grade H1)
- **Unit**: Major chapter/unit (e.g., "역학적 시스템" - Mechanical Systems)
- **SubUnit**: Sub-chapter (e.g., "뉴턴 법칙과 힘" - Newton's Laws and Forces)
- **Concept**: Core learning objective (e.g., "작용-반작용" - Action-Reaction)
- **Question**: Links to concepts via many-to-many relationship

**Important:** Questions are associated with Concepts (not SubUnits directly). A question can test multiple concepts.

### Entity Package Structure

Entities use **LAZY fetching** for all relationships to avoid N+1 queries. When querying:
- Always use `@EntityGraph` or explicit JOIN FETCH for related entities
- Never access lazy relationships in DTOs without initialization
- Controllers return DTOs, not entities directly

### JWT Authentication Flow

1. User logs in via `POST /api/auth/login` with username/email + password
2. `AuthController` validates credentials via `CustomUserDetailsService`
3. `JwtTokenProvider` generates access + refresh tokens
4. Client includes `Authorization: Bearer <token>` header
5. `JwtAuthenticationFilter` intercepts requests, validates tokens
6. Spring Security context populated with user details
7. `@PreAuthorize` annotations enforce role-based access (STUDENT, TEACHER, ADMIN)

**Default Admin:** mhpark@lguplus.co.kr / test001!

### AI Question Generation System

**Components:**
- `AIQuestionGenerationService`: Orchestrates AI question generation
- `SecretService`: Manages OpenAI API key storage in S3
- `SecretController`: ADMIN-only endpoints for secret management

**Flow:**
1. Teacher selects Concept + difficulty + question type
2. Optional: Uploads reference image/document
3. System builds Korean prompt with concept metadata
4. Calls OpenAI GPT-5 mini (reasoning model) via REST
5. Parses JSON response (questionText, correctAnswer, explanation)
6. Optional: Generates illustration with DALL-E 3
7. Returns AIQuestionGenerationResponse DTO

**Key Implementation Details:**
- **Model**: gpt-5-mini ($0.25/1M input, $2.00/1M output)
- **Tokens**: max_completion_tokens=16384 (reasoning models need more tokens)
- **Temperature**: Not configurable (GPT-5 reasoning models only support temperature=1)
- **API Key Source**: S3 (primary) → Environment variable (fallback)
  - S3 path: `s3://edutest-secrets-bucket/secrets/openai-api-key`
  - Encrypted with AES256 server-side encryption
  - Shared AWS credentials with claudtest project (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)

**Storing API Key:**
```bash
# Login as ADMIN
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"mhpark@lguplus.co.kr","password":"test001!"}'

# Store key in S3
curl -X POST http://localhost:8081/api/secrets/openai-api-key \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"apiKey":"sk-proj-..."}'
```

### S3 Secret Management

**Purpose:** Store OpenAI API keys in S3 for cross-PC access (no need to copy keys manually)

**Configuration:**
- Bucket: `edutest-secrets-bucket` (dedicated, encrypted)
- Region: ap-northeast-2
- Credentials: Shared with claudtest project via environment variables
- Encryption: AES256 server-side, private bucket with public access blocked

**Files:**
- `SecretService.java`: S3 client initialization, CRUD operations for secrets
- `SecretController.java`: REST endpoints (ADMIN-only)
- `AIQuestionGenerationService.getOpenAIApiKey()`: S3 retrieval with env var fallback

**Security:** Only ADMIN users can store/delete secrets. API key never exposed in logs (DEBUG level shows "Using OpenAI API key from S3").

## Configuration Files

### Backend Configuration Hierarchy
- `application.yml`: Base config (shared settings)
- `application-dev.yml`: Development profile (local MySQL, S3 bucket override)
- Active profile: Set via `SPRING_PROFILES_ACTIVE` env var or defaults to "dev"

**Never commit:**
- `application-dev.yml` with actual API keys (use S3 instead)
- `.env` files
- Any file with AWS credentials

### Frontend Environment
- `.env.development`: Dev API URL (http://localhost:8081)
- `.env.production`: Production API URL
- Vite exposes vars prefixed with `VITE_`

## Key API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - Login (returns JWT + refresh token)
- `POST /api/auth/refresh` - Refresh access token

### Hierarchy Management (permitAll in dev)
- `GET /api/levels` - List all levels
- `GET /api/grades` - List all grades (optionally filter by levelId)
- `GET /api/subjects` - List subjects (optionally filter by gradeId)
- `GET /api/units` - List units (requires gradeId + subjectId)
- `GET /api/sub-units` - List sub-units (requires unitId)
- `GET /api/concepts` - List concepts (optionally filter by subUnitId)

### Questions
- `POST /api/questions` - Create question (TEACHER, ADMIN)
- `POST /api/questions/generate-ai` - AI generate question (TEACHER, ADMIN)
  - Requires: conceptId, difficulty, questionType
  - Optional: userPrompt, referenceImage, referenceDocument, generateImage

### Secrets (ADMIN only)
- `POST /api/secrets/openai-api-key` - Store OpenAI key to S3
- `GET /api/secrets/openai-api-key/exists` - Check if key exists
- `DELETE /api/secrets/openai-api-key` - Delete key from S3

## Common Development Patterns

### Creating DTOs for Hierarchical Queries

When returning hierarchical data, build DTOs that include nested structures:

```java
// Example: SubjectDTO with nested units
public record SubjectDTO(
    Long id,
    String name,
    String displayName,
    List<UnitDTO> units  // Nested DTOs
) {}
```

Use `@EntityGraph` or JOIN FETCH to avoid N+1:

```java
@Query("SELECT DISTINCT s FROM Subject s " +
       "LEFT JOIN FETCH s.grade " +
       "WHERE s.id = :id")
Optional<Subject> findByIdWithGrade(@Param("id") Long id);
```

### Handling File Uploads

MultipartFile handling in Spring Boot:
- Max file size: 10MB (configured in `application.yml`)
- Image uploads: Base64 encode for OpenAI API
- Document uploads: Extract text for prompt context

### Error Handling

Controllers use ResponseEntity with appropriate HTTP status codes:
- 200 OK: Successful GET/PUT/DELETE
- 201 Created: Successful POST
- 400 Bad Request: Validation errors
- 401 Unauthorized: Missing/invalid JWT
- 403 Forbidden: Insufficient permissions
- 404 Not Found: Resource not found
- 500 Internal Server Error: Unexpected errors

## Testing Considerations

### Spring Boot DevTools

- Auto-restart on classpath changes (but sometimes needs manual restart)
- LiveReload on port 35729
- If changes not detected: `./gradlew clean build && ./gradlew bootRun`

### Manual Testing with curl

Example: Generate AI question
```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"mhpark@lguplus.co.kr","password":"test001!"}' \
  | jq -r '.token')

# 2. Generate question
curl -X POST http://localhost:8081/api/questions/generate-ai \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F 'request={"conceptId":1,"difficulty":"MEDIUM","questionType":"MULTIPLE_CHOICE","generateImage":false};type=application/json'
```

## Troubleshooting

### OpenAI API Errors

**429 Too Many Requests:** Add payment method to OpenAI account

**400 Bad Request (max_tokens):** Use `max_completion_tokens` for GPT-5 models, not `max_tokens`

**400 Bad Request (temperature):** GPT-5 reasoning models only support temperature=1 (default)

**Empty response with finish_reason="length":** Increase max_completion_tokens (reasoning models consume tokens for internal reasoning)

### JWT Authentication Issues

**403 Forbidden on authenticated endpoints:** Check that JwtAuthenticationFilter is properly registered in SecurityConfig and that the token is valid

**User not found:** Ensure CustomUserDetailsService loads user by username OR email (AuthService tries both)

### S3 Connection Issues

**"S3 is not configured":** Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables

**NoSuchKeyException:** Secret doesn't exist in S3, use POST /api/secrets/openai-api-key to store it

## Database Notes

- Charset: utf8mb4 (supports Korean characters and emojis)
- Collation: utf8mb4_unicode_ci
- Auto-increment primary keys on all tables
- Foreign keys use ON DELETE CASCADE where appropriate
- Timestamps: @CreationTimestamp and @UpdateTimestamp handle automatically

## Git Workflow

**Protected files (in .gitignore):**
- `application-dev.yml` (contains local config)
- `*.env`
- `node_modules/`
- `build/`, `target/`

**Commit message format:**
```
<type>: <description>

<body>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```
