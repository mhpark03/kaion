package com.edutest.repository;

import com.edutest.entity.StudentQuestionAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface StudentQuestionAttemptRepository extends JpaRepository<StudentQuestionAttempt, Long> {

    List<StudentQuestionAttempt> findByStudentIdOrderByAttemptedAtDesc(Long studentId);

    List<StudentQuestionAttempt> findByQuestionIdOrderByAttemptedAtDesc(Long questionId);

    // Real-time statistics calculation from attempts
    @Query("SELECT COUNT(sqa), SUM(CASE WHEN sqa.isCorrect = true THEN 1 ELSE 0 END) " +
           "FROM StudentQuestionAttempt sqa " +
           "WHERE sqa.student.id = :studentId")
    Object[] getOverallStats(@Param("studentId") Long studentId);

    @Query("SELECT COUNT(sqa), SUM(CASE WHEN sqa.isCorrect = true THEN 1 ELSE 0 END) " +
           "FROM StudentQuestionAttempt sqa " +
           "WHERE sqa.student.id = :studentId AND sqa.conceptId = :conceptId")
    Object[] getConceptStats(@Param("studentId") Long studentId, @Param("conceptId") Long conceptId);

    @Query("SELECT COUNT(sqa), SUM(CASE WHEN sqa.isCorrect = true THEN 1 ELSE 0 END) " +
           "FROM StudentQuestionAttempt sqa " +
           "WHERE sqa.student.id = :studentId AND sqa.subUnitId = :subUnitId")
    Object[] getSubUnitStats(@Param("studentId") Long studentId, @Param("subUnitId") Long subUnitId);

    @Query("SELECT COUNT(sqa), SUM(CASE WHEN sqa.isCorrect = true THEN 1 ELSE 0 END) " +
           "FROM StudentQuestionAttempt sqa " +
           "WHERE sqa.student.id = :studentId AND sqa.unitId = :unitId")
    Object[] getUnitStats(@Param("studentId") Long studentId, @Param("unitId") Long unitId);

    @Query("SELECT COUNT(sqa), SUM(CASE WHEN sqa.isCorrect = true THEN 1 ELSE 0 END) " +
           "FROM StudentQuestionAttempt sqa " +
           "WHERE sqa.student.id = :studentId AND sqa.gradeId = :gradeId")
    Object[] getGradeStats(@Param("studentId") Long studentId, @Param("gradeId") Long gradeId);

    // Recent attempts
    List<StudentQuestionAttempt> findTop10ByStudentIdOrderByAttemptedAtDesc(Long studentId);

    // Attempts within date range
    List<StudentQuestionAttempt> findByStudentIdAndAttemptedAtBetween(
        Long studentId, LocalDateTime startDate, LocalDateTime endDate
    );
}
