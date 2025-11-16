package com.edutest.repository;

import com.edutest.entity.StudentProfile;
import com.edutest.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StudentProfileRepository extends JpaRepository<StudentProfile, Long> {

    Optional<StudentProfile> findByUser(User user);

    Optional<StudentProfile> findByUserId(Long userId);

    @Query("SELECT sp FROM StudentProfile sp " +
           "LEFT JOIN FETCH sp.level " +
           "LEFT JOIN FETCH sp.grade " +
           "LEFT JOIN FETCH sp.subject " +
           "LEFT JOIN FETCH sp.unit " +
           "LEFT JOIN FETCH sp.subUnit " +
           "LEFT JOIN FETCH sp.concept " +
           "WHERE sp.user.id = :userId")
    Optional<StudentProfile> findByUserIdWithDetails(@Param("userId") Long userId);

    boolean existsByUserId(Long userId);
}
