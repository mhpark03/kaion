package com.edutest.repository;

import com.edutest.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    Boolean existsByUsername(String username);

    Boolean existsByEmail(String email);

    @Query("SELECT u FROM User u " +
           "LEFT JOIN FETCH u.level " +
           "LEFT JOIN FETCH u.grade " +
           "LEFT JOIN FETCH u.subject " +
           "LEFT JOIN FETCH u.unit " +
           "LEFT JOIN FETCH u.subUnit " +
           "WHERE u.username = :username")
    Optional<User> findByUsernameWithProfile(@Param("username") String username);
}
