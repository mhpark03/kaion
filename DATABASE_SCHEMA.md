# 교육 컨텐츠 관리 시스템 - 데이터베이스 스키마

## 테이블 구조

### 1. users (사용자)
```sql
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('STUDENT', 'TEACHER', 'ADMIN') NOT NULL DEFAULT 'STUDENT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 2. levels (레벨/난이도)
```sql
CREATE TABLE levels (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    order_index INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**예시 데이터:**
- 초급 (Beginner)
- 중급 (Intermediate)
- 고급 (Advanced)

### 3. subjects (과목)
```sql
CREATE TABLE subjects (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url VARCHAR(255),
    color VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**예시 데이터:**
- 수학 (Math)
- 영어 (English)
- 과학 (Science)
- 국어 (Korean)

### 4. questions (문제)
```sql
CREATE TABLE questions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    subject_id BIGINT NOT NULL,
    level_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    question_type ENUM('MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY') NOT NULL,
    points INT DEFAULT 10,
    time_limit INT,
    created_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (level_id) REFERENCES levels(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_subject_level (subject_id, level_id)
);
```

### 5. question_options (문제 선택지)
```sql
CREATE TABLE question_options (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    question_id BIGINT NOT NULL,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    option_order INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    INDEX idx_question (question_id)
);
```

### 6. user_attempts (사용자 풀이 시도)
```sql
CREATE TABLE user_attempts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    subject_id BIGINT NOT NULL,
    level_id BIGINT NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    total_questions INT DEFAULT 0,
    correct_answers INT DEFAULT 0,
    total_points INT DEFAULT 0,
    earned_points INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (level_id) REFERENCES levels(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_subject_level (subject_id, level_id)
);
```

### 7. user_answers (사용자 답변)
```sql
CREATE TABLE user_answers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    attempt_id BIGINT NOT NULL,
    question_id BIGINT NOT NULL,
    selected_option_id BIGINT,
    answer_text TEXT,
    is_correct BOOLEAN,
    points_earned INT DEFAULT 0,
    time_spent INT,
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (attempt_id) REFERENCES user_attempts(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    FOREIGN KEY (selected_option_id) REFERENCES question_options(id) ON DELETE SET NULL,
    INDEX idx_attempt (attempt_id),
    INDEX idx_question (question_id)
);
```

## ER 다이어그램 관계

```
users
  |
  |--- user_attempts (1:N)
         |
         |--- user_answers (1:N)
                |
                |--- questions (N:1)
                |      |
                |      |--- subjects (N:1)
                |      |--- levels (N:1)
                |
                |--- question_options (N:1)
```

## 인덱스 전략

1. **users**: username, email (유니크)
2. **questions**: (subject_id, level_id) 복합 인덱스
3. **user_attempts**: user_id, (subject_id, level_id) 인덱스
4. **user_answers**: attempt_id, question_id 인덱스

## 초기 데이터 스크립트

```sql
-- 레벨 데이터
INSERT INTO levels (name, display_name, description, order_index) VALUES
('beginner', '초급', '기초 수준의 문제', 1),
('intermediate', '중급', '중간 수준의 문제', 2),
('advanced', '고급', '심화 수준의 문제', 3);

-- 과목 데이터
INSERT INTO subjects (name, display_name, description, color) VALUES
('math', '수학', '수학 과목', '#4CAF50'),
('english', '영어', '영어 과목', '#2196F3'),
('science', '과학', '과학 과목', '#FF9800'),
('korean', '국어', '국어 과목', '#9C27B0');

-- 관리자 계정 (비밀번호: admin123 - BCrypt 해시 필요)
INSERT INTO users (username, email, password, role) VALUES
('admin', 'admin@edutest.com', '$2a$10$...', 'ADMIN');
```
