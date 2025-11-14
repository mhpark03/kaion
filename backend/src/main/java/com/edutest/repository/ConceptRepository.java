package com.edutest.repository;

import com.edutest.entity.Concept;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConceptRepository extends JpaRepository<Concept, Long> {

    Optional<Concept> findByName(String name);

    Boolean existsByName(String name);

    List<Concept> findBySubUnitIdOrderByOrderIndexAsc(Long subUnitId);

    List<Concept> findBySubUnitIsNullOrderByOrderIndexAsc();
}
