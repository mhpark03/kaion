package com.edutest.repository;

import com.edutest.entity.Level;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LevelRepository extends JpaRepository<Level, Long> {

    Optional<Level> findByName(String name);

    Boolean existsByName(String name);

    List<Level> findAllByOrderByOrderIndexAsc();
}
