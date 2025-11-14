package com.edutest.repository;

import com.edutest.entity.UserAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserAnswerRepository extends JpaRepository<UserAnswer, Long> {

    List<UserAnswer> findByAttemptId(Long attemptId);

    List<UserAnswer> findByQuestionId(Long questionId);

    void deleteByAttemptId(Long attemptId);
}
