package com.edutest.repository;

import com.edutest.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {

    List<Question> findBySubjectId(Long subjectId);

    List<Question> findByLevelId(Long levelId);

    @Query("SELECT q FROM Question q WHERE q.subject.id = :subjectId AND q.level.id = :levelId")
    List<Question> findBySubjectIdAndLevelId(@Param("subjectId") Long subjectId, @Param("levelId") Long levelId);

    @Query("SELECT q FROM Question q LEFT JOIN FETCH q.options WHERE q.id = :id")
    Question findByIdWithOptions(@Param("id") Long id);

    Long countBySubjectId(Long subjectId);

    Long countByLevelId(Long levelId);

    Long countBySubjectIdAndLevelId(Long subjectId, Long levelId);
}
