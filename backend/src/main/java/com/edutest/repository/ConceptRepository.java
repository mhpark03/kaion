package com.edutest.repository;

import com.edutest.entity.Concept;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConceptRepository extends JpaRepository<Concept, Long> {

    Optional<Concept> findByName(String name);

    Boolean existsByName(String name);

    List<Concept> findBySubUnitIdOrderByOrderIndexAsc(Long subUnitId);

    List<Concept> findBySubUnitIsNullOrderByOrderIndexAsc();

    // For AI Question Generation: fetch entire hierarchy for context
    @Query("SELECT c FROM Concept c " +
           "LEFT JOIN FETCH c.subUnit su " +
           "LEFT JOIN FETCH su.unit u " +
           "LEFT JOIN FETCH u.grade g " +
           "LEFT JOIN FETCH g.level l " +
           "LEFT JOIN FETCH u.subject s " +
           "WHERE c.id = :id")
    Optional<Concept> findByIdWithFullHierarchy(@Param("id") Long id);
}
