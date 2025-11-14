package com.edutest.repository;

import com.edutest.entity.SubUnit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubUnitRepository extends JpaRepository<SubUnit, Long> {

    List<SubUnit> findByUnitIdOrderByOrderIndexAsc(Long unitId);
}
