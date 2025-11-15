package com.edutest.repository;

import com.edutest.entity.UserAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserAnswerRepository extends JpaRepository<UserAnswer, Long> {

    List<UserAnswer> findByAttemptId(Long attemptId);

    List<UserAnswer> findByQuestionId(Long questionId);

    void deleteByAttemptId(Long attemptId);

    // Count distinct users who attempted this question
    @Query("SELECT COUNT(DISTINCT ua.attempt.user.id) FROM UserAnswer ua WHERE ua.question.id = :questionId")
    Long countDistinctUsersByQuestionId(@Param("questionId") Long questionId);

    // Count distinct users who answered correctly
    @Query("SELECT COUNT(DISTINCT ua.attempt.user.id) FROM UserAnswer ua WHERE ua.question.id = :questionId AND ua.isCorrect = true")
    Long countCorrectUsersByQuestionId(@Param("questionId") Long questionId);
}
