package com.edutest.repository;

import com.edutest.entity.Grade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GradeRepository extends JpaRepository<Grade, Long> {

    Optional<Grade> findByName(String name);

    Boolean existsByName(String name);

    List<Grade> findByLevelIdOrderByOrderIndexAsc(Long levelId);
}
