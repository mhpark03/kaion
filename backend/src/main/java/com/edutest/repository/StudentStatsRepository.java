package com.edutest.repository;

import com.edutest.entity.StudentStats;
import com.edutest.entity.StudentStats.StatsType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentStatsRepository extends JpaRepository<StudentStats, Long> {

    Optional<StudentStats> findByStudentIdAndStatsTypeAndEntityId(
        Long studentId, StatsType statsType, Long entityId
    );

    List<StudentStats> findByStudentId(Long studentId);

    List<StudentStats> findByStudentIdAndStatsType(Long studentId, StatsType statsType);

    // Get all concept stats for a student
    List<StudentStats> findByStudentIdAndStatsTypeOrderByCorrectRateDesc(
        Long studentId, StatsType statsType
    );

    // Find students' stats for a specific entity (e.g., all students' stats for a concept)
    List<StudentStats> findByStatsTypeAndEntityId(StatsType statsType, Long entityId);
}
