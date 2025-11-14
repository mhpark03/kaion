package com.edutest.repository;

import com.edutest.entity.UserAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserAttemptRepository extends JpaRepository<UserAttempt, Long> {

    List<UserAttempt> findByUserId(Long userId);

    List<UserAttempt> findByUserIdOrderByStartedAtDesc(Long userId);

    @Query("SELECT ua FROM UserAttempt ua WHERE ua.user.id = :userId AND ua.subject.id = :subjectId")
    List<UserAttempt> findByUserIdAndSubjectId(@Param("userId") Long userId, @Param("subjectId") Long subjectId);

    @Query("SELECT ua FROM UserAttempt ua WHERE ua.user.id = :userId AND ua.level.id = :levelId")
    List<UserAttempt> findByUserIdAndLevelId(@Param("userId") Long userId, @Param("levelId") Long levelId);

    @Query("SELECT ua FROM UserAttempt ua WHERE ua.user.id = :userId AND ua.subject.id = :subjectId AND ua.level.id = :levelId")
    List<UserAttempt> findByUserIdAndSubjectIdAndLevelId(
        @Param("userId") Long userId,
        @Param("subjectId") Long subjectId,
        @Param("levelId") Long levelId
    );

    Long countByUserId(Long userId);

    Long countByUserIdAndCompletedAtIsNotNull(Long userId);
}
