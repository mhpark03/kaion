-- Step 1: Add concept_id column to questions table
ALTER TABLE questions ADD COLUMN concept_id BIGINT;

-- Step 2: Add foreign key constraint
ALTER TABLE questions ADD CONSTRAINT fk_question_concept
    FOREIGN KEY (concept_id) REFERENCES concepts(id);

-- Step 3: Migrate data from question_concepts to questions.concept_id
-- (Copy the first concept_id for each question)
UPDATE questions q
SET concept_id = (
    SELECT concept_id
    FROM question_concepts qc
    WHERE qc.question_id = q.id
    LIMIT 1
)
WHERE EXISTS (
    SELECT 1
    FROM question_concepts qc
    WHERE qc.question_id = q.id
);

-- Step 4: (Optional) Drop the old question_concepts table after verification
-- DROP TABLE question_concepts;
