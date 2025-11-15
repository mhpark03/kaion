package com.edutest.repository;

import com.edutest.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {

    List<Question> findByLevelId(Long levelId);

    @Query("SELECT q FROM Question q LEFT JOIN FETCH q.options WHERE q.id = :id")
    Question findByIdWithOptions(@Param("id") Long id);

    @Query("SELECT q FROM Question q LEFT JOIN FETCH q.concept LEFT JOIN FETCH q.level")
    List<Question> findAllWithConcepts();

    @Query("SELECT q FROM Question q LEFT JOIN FETCH q.concept LEFT JOIN FETCH q.level WHERE q.level.id = :levelId")
    List<Question> findByLevelIdWithConcepts(@Param("levelId") Long levelId);

    Long countByLevelId(Long levelId);
}
