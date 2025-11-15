-- Add level_id, grade_id, and proficiency_level columns to users table
-- Migration script for adding educational level, grade, and proficiency level to user registration

USE edutest;

-- Add level_id column
ALTER TABLE users
ADD COLUMN level_id BIGINT NULL AFTER role,
ADD CONSTRAINT fk_users_level FOREIGN KEY (level_id) REFERENCES levels(id) ON DELETE SET NULL;

-- Add grade_id column
ALTER TABLE users
ADD COLUMN grade_id BIGINT NULL AFTER level_id,
ADD CONSTRAINT fk_users_grade FOREIGN KEY (grade_id) REFERENCES grades(id) ON DELETE SET NULL;

-- Add proficiency_level column
ALTER TABLE users
ADD COLUMN proficiency_level VARCHAR(20) NULL AFTER grade_id
COMMENT 'User proficiency level: VERY_EASY, EASY, MEDIUM, HARD, VERY_HARD';

-- Add index for better query performance
CREATE INDEX idx_users_level_id ON users(level_id);
CREATE INDEX idx_users_grade_id ON users(grade_id);
CREATE INDEX idx_users_proficiency_level ON users(proficiency_level);

COMMIT;
