# Student Statistics Architecture

## Overview

This document describes the architecture for managing student learning statistics and progress tracking in the EduTest system.

## Design Goals

1. **Separation of Concerns**: Separate student-specific data from general User entity
2. **Scalability**: Support for hierarchical statistics at multiple levels
3. **Performance**: Optimize for both real-time and pre-calculated statistics
4. **Flexibility**: Allow choice between real-time calculation vs. cached statistics

## Entity Design

### 1. StudentProfile
**Purpose**: Manages student-specific learning preferences and settings

**Fields**:
- `user` (OneToOne): Link to User entity
- `level`, `grade`, `subject`, `unit`, `subUnit`, `concept`: Learning path preferences
- `proficiencyLevel`: Preferred difficulty level
- `totalAttempts`, `totalCorrect`, `overallCorrectRate`: Summary statistics

**Use Case**: Student profile page, personalized content filtering

### 2. StudentQuestionAttempt
**Purpose**: Records every question attempt by students (source of truth)

**Fields**:
- `student`: User who attempted
- `question`: Question attempted
- `isCorrect`: Whether answer was correct
- `userAnswer`: Student's answer
- `timeSpentSeconds`: Time taken (optional)
- `attemptedAt`: Timestamp
- **Denormalized fields** for faster querying:
  - `conceptId`, `subUnitId`, `unitId`, `gradeId`, `levelId`, `difficulty`

**Use Case**:
- Source data for all statistics
- Student progress tracking
- Real-time statistics calculation

**Indexes**:
- `(student_id, question_id)`: Check if student answered a question
- `(student_id, attempted_at)`: Recent attempts timeline
- `(question_id, attempted_at)`: Question popularity/difficulty analysis

### 3. StudentStats
**Purpose**: Pre-calculated aggregated statistics for performance optimization

**Fields**:
- `student`: User
- `statsType`: Type of statistics (CONCEPT, SUB_UNIT, UNIT, GRADE, LEVEL, OVERALL)
- `entityId`: ID of the entity (concept ID, unit ID, etc.)
- `attemptCount`, `correctCount`, `correctRate`: Aggregated metrics
- `lastUpdated`: When stats were last updated

**StatsType Enum**:
- `CONCEPT`: Statistics for a specific concept (핵심개념별)
- `SUB_UNIT`: Statistics for a sub-unit (소단원별)
- `UNIT`: Statistics for a unit (대단원별)
- `GRADE`: Statistics for a grade (학년별)
- `LEVEL`: Statistics for a level (교육과정별)
- `OVERALL`: Overall statistics (전체)

**Use Case**: Fast dashboard queries, leaderboards, progress reports

**Unique Constraint**: `(student_id, stats_type, entity_id)` - one stat record per combination

## Two Approaches for Statistics

### Approach 1: Real-Time Calculation (실시간 추출)

**How it works**:
- Query `StudentQuestionAttempt` table with GROUP BY
- Calculate statistics on-the-fly

**Pros**:
- Always up-to-date
- No data redundancy
- Simpler maintenance

**Cons**:
- Slower queries as data grows
- More database load
- Complex JOIN queries for hierarchical stats

**Example Query**:
```sql
SELECT concept_id,
       COUNT(*) as attempt_count,
       SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_count,
       AVG(CASE WHEN is_correct THEN 100.0 ELSE 0.0 END) as correct_rate
FROM student_question_attempts
WHERE student_id = ?
GROUP BY concept_id
```

**When to use**:
- Small to medium datasets (< 100K attempts)
- Real-time accuracy is critical
- Infrequent queries

### Approach 2: Pre-Calculated Statistics (통계 데이터 저장)

**How it works**:
- Update `StudentStats` table when student answers a question
- Query `StudentStats` for fast retrieval

**Pros**:
- Very fast queries (simple SELECT)
- Good for dashboards and leaderboards
- Scalable to millions of records

**Cons**:
- Data redundancy
- Synchronization complexity
- Possible inconsistency if updates fail

**Update Strategy**:
```java
@Transactional
public void recordAttempt(StudentQuestionAttempt attempt) {
    // 1. Save attempt record
    attemptRepository.save(attempt);

    // 2. Update stats at all levels
    updateStats(attempt.getStudentId(), StatsType.CONCEPT, attempt.getConceptId(), attempt.isCorrect());
    updateStats(attempt.getStudentId(), StatsType.SUB_UNIT, attempt.getSubUnitId(), attempt.isCorrect());
    updateStats(attempt.getStudentId(), StatsType.UNIT, attempt.getUnitId(), attempt.isCorrect());
    updateStats(attempt.getStudentId(), StatsType.GRADE, attempt.getGradeId(), attempt.isCorrect());
    updateStats(attempt.getStudentId(), StatsType.OVERALL, null, attempt.isCorrect());
}
```

**When to use**:
- Large datasets (> 100K attempts)
- Frequent dashboard queries
- Performance is critical

### Hybrid Approach (Recommended)

**Combine both approaches**:
- Use `StudentStats` for dashboard and list views (fast)
- Use `StudentQuestionAttempt` for detailed analysis (accurate)
- Background job to rebuild `StudentStats` if inconsistency detected

## Migration from User Entity

### Current State (Legacy)
Student learning data is stored directly in `User` entity:
- `level_id`, `grade_id`, `subject_id`, `unit_id`, `sub_unit_id`, `concept_id`
- `proficiency_level`

### Target State
Student learning data moved to `StudentProfile` entity:
- User entity: Authentication, authorization, basic info
- StudentProfile entity: Learning preferences, statistics

### Migration Strategy

**Phase 1: Create new entities (Current)**
- ✅ `StudentProfile` entity created
- ✅ `StudentQuestionAttempt` entity created
- ✅ `StudentStats` entity created
- ✅ Repositories created

**Phase 2: Dual-write (Next)**
- Update both User and StudentProfile when student updates preferences
- Maintain backward compatibility

**Phase 3: Migration (Future)**
- Create StudentProfile for all existing students
- Copy data from User to StudentProfile
- Update frontend to use StudentProfile API

**Phase 4: Deprecation (Future)**
- Mark User fields as deprecated (✅ Done)
- Remove dual-write
- Use only StudentProfile

## API Design

### Profile Management
```
GET  /api/students/{userId}/profile       # Get student profile
PUT  /api/students/{userId}/profile       # Update student profile
```

### Statistics
```
GET  /api/students/{userId}/stats                        # Overall stats
GET  /api/students/{userId}/stats/concept/{conceptId}   # Concept stats
GET  /api/students/{userId}/stats/unit/{unitId}         # Unit stats
GET  /api/students/{userId}/stats/grade/{gradeId}       # Grade stats
```

### Attempt History
```
GET  /api/students/{userId}/attempts                     # Recent attempts
GET  /api/students/{userId}/attempts?conceptId=1         # Concept-specific
POST /api/students/{userId}/attempts                     # Record new attempt
```

## Performance Considerations

### Indexing Strategy
1. **StudentQuestionAttempt**: Index on (student_id, concept_id, attempted_at)
2. **StudentStats**: Unique index on (student_id, stats_type, entity_id)

### Caching
- Cache StudentProfile (rarely changes)
- Cache StudentStats for dashboard (TTL: 5 minutes)
- No caching for StudentQuestionAttempt (real-time data)

### Partitioning (Future)
- Partition StudentQuestionAttempt by `attempted_at` (monthly)
- Archive old attempts (> 1 year)

## Database Schema

```sql
-- Student profile
CREATE TABLE student_profiles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL UNIQUE,
    level_id BIGINT,
    grade_id BIGINT,
    subject_id BIGINT,
    unit_id BIGINT,
    sub_unit_id BIGINT,
    concept_id BIGINT,
    proficiency_level VARCHAR(20),
    total_attempts INT DEFAULT 0,
    total_correct INT DEFAULT 0,
    overall_correct_rate DOUBLE DEFAULT 0.0,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Question attempts
CREATE TABLE student_question_attempts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    student_id BIGINT NOT NULL,
    question_id BIGINT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    user_answer TEXT,
    time_spent_seconds INT,
    attempted_at TIMESTAMP NOT NULL,
    -- Denormalized for fast querying
    concept_id BIGINT,
    sub_unit_id BIGINT,
    unit_id BIGINT,
    grade_id BIGINT,
    level_id BIGINT,
    difficulty VARCHAR(20),
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (question_id) REFERENCES questions(id),
    INDEX idx_student_question (student_id, question_id),
    INDEX idx_student_attempted (student_id, attempted_at),
    INDEX idx_question_attempted (question_id, attempted_at)
);

-- Aggregated statistics
CREATE TABLE student_stats (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    student_id BIGINT NOT NULL,
    stats_type VARCHAR(20) NOT NULL,
    entity_id BIGINT,
    attempt_count INT DEFAULT 0,
    correct_count INT DEFAULT 0,
    correct_rate DOUBLE DEFAULT 0.0,
    last_updated TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id),
    UNIQUE KEY unique_student_stats (student_id, stats_type, entity_id),
    INDEX idx_student_stats_type (student_id, stats_type),
    INDEX idx_stats_type_entity (stats_type, entity_id)
);
```

## Future Enhancements

1. **Learning Analytics**
   - Time-series analysis of student progress
   - Difficulty prediction based on performance
   - Personalized question recommendations

2. **Comparative Statistics**
   - Class average vs. student performance
   - Percentile rankings
   - Peer comparison

3. **Badge/Achievement System**
   - Unlock badges for milestones
   - Streak tracking
   - Leaderboards

4. **Study Patterns**
   - Best study time analysis
   - Topic mastery tracking
   - Weak area identification

## Testing Strategy

1. **Unit Tests**: Repository queries
2. **Integration Tests**: Statistics calculation accuracy
3. **Performance Tests**: Query performance with large datasets
4. **Load Tests**: Concurrent attempt recording

## Monitoring

1. **Metrics to Track**:
   - Average query time for statistics
   - Statistics update latency
   - Data inconsistency rate (if using cached stats)
   - Storage growth rate

2. **Alerts**:
   - Statistics update failures
   - Query performance degradation
   - Data inconsistency detected
