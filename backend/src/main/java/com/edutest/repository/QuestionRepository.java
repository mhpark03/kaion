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

    Long countByConceptId(Long conceptId);

    Long countByConceptIdAndDifficulty(Long conceptId, String difficulty);

    // Optimized query to get all question counts grouped by concept and difficulty in a single query
    // This replaces N+1 queries (6 queries per concept) with a single query
    @Query("SELECT c.id, q.difficulty, COUNT(q) " +
           "FROM Question q " +
           "JOIN q.concept c " +
           "WHERE c.id IN :conceptIds " +
           "GROUP BY c.id, q.difficulty")
    List<Object[]> countQuestionsGroupedByConceptAndDifficulty(@Param("conceptIds") List<Long> conceptIds);
}
