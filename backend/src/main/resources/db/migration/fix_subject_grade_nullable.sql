-- Migration script to make subjects.grade_id nullable
-- This allows creating subjects without a specific grade (e.g., default "Science" subject)

ALTER TABLE subjects MODIFY COLUMN grade_id BIGINT NULL;
