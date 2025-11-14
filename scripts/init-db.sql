-- 교육 컨텐츠 관리 시스템 초기화 스크립트

-- 데이터베이스 생성 (이미 생성되어 있다면 주석 처리)
-- CREATE DATABASE edutest CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE edutest;

-- 기존 테이블 삭제 (순서 중요 - 외래키 제약 때문)
DROP TABLE IF EXISTS user_answers;
DROP TABLE IF EXISTS user_attempts;
DROP TABLE IF EXISTS question_options;
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS subjects;
DROP TABLE IF EXISTS levels;
DROP TABLE IF EXISTS users;

-- 1. 사용자 테이블
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('STUDENT', 'TEACHER', 'ADMIN') NOT NULL DEFAULT 'STUDENT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. 레벨 테이블
CREATE TABLE levels (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    order_index INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_order (order_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. 과목 테이블
CREATE TABLE subjects (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url VARCHAR(255),
    color VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. 문제 테이블
CREATE TABLE questions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    subject_id BIGINT NOT NULL,
    level_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    question_type ENUM('MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY') NOT NULL,
    points INT DEFAULT 10,
    time_limit INT COMMENT '제한 시간 (초)',
    created_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (level_id) REFERENCES levels(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_subject_level (subject_id, level_id),
    INDEX idx_type (question_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. 문제 선택지 테이블
CREATE TABLE question_options (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    question_id BIGINT NOT NULL,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    option_order INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    INDEX idx_question (question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. 사용자 풀이 시도 테이블
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
    INDEX idx_subject_level (subject_id, level_id),
    INDEX idx_completed (completed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. 사용자 답변 테이블
CREATE TABLE user_answers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    attempt_id BIGINT NOT NULL,
    question_id BIGINT NOT NULL,
    selected_option_id BIGINT,
    answer_text TEXT,
    is_correct BOOLEAN,
    points_earned INT DEFAULT 0,
    time_spent INT COMMENT '소요 시간 (초)',
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (attempt_id) REFERENCES user_attempts(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    FOREIGN KEY (selected_option_id) REFERENCES question_options(id) ON DELETE SET NULL,
    INDEX idx_attempt (attempt_id),
    INDEX idx_question (question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 초기 데이터 삽입

-- 레벨 데이터
INSERT INTO levels (name, display_name, description, order_index) VALUES
('beginner', '초급', '기초 수준의 문제입니다', 1),
('intermediate', '중급', '중간 수준의 문제입니다', 2),
('advanced', '고급', '심화 수준의 문제입니다', 3);

-- 과목 데이터
INSERT INTO subjects (name, display_name, description, color) VALUES
('math', '수학', '수학 과목', '#4CAF50'),
('english', '영어', '영어 과목', '#2196F3'),
('science', '과학', '과학 과목', '#FF9800'),
('korean', '국어', '국어 과목', '#9C27B0');

-- 관리자 계정
-- 비밀번호: admin123 (실제 사용 시 BCrypt로 해시 필요)
-- 임시로 평문 저장 (Spring Boot 시작 시 자동으로 BCrypt로 변환)
INSERT INTO users (username, email, password, role) VALUES
('admin', 'admin@edutest.com', 'admin123', 'ADMIN'),
('teacher', 'teacher@edutest.com', 'teacher123', 'TEACHER'),
('student', 'student@edutest.com', 'student123', 'STUDENT');

-- 샘플 문제 (수학 - 초급)
INSERT INTO questions (subject_id, level_id, title, content, question_type, points, created_by) VALUES
(1, 1, '덧셈 문제', '2 + 3 = ?', 'MULTIPLE_CHOICE', 10, 1);

-- 샘플 문제 선택지
INSERT INTO question_options (question_id, option_text, is_correct, option_order) VALUES
(1, '4', FALSE, 1),
(1, '5', TRUE, 2),
(1, '6', FALSE, 3),
(1, '7', FALSE, 4);

-- 완료 메시지
SELECT 'Database initialization completed successfully!' AS message;
