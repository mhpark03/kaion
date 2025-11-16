package com.edutest.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Aggregated statistics for students at different hierarchy levels
 * This table is for performance optimization - statistics are pre-calculated
 *
 * Alternative: Calculate stats in real-time from StudentQuestionAttempt table
 */
@Entity
@Table(name = "student_stats",
    uniqueConstraints = @UniqueConstraint(columnNames = {"student_id", "stats_type", "entity_id"}),
    indexes = {
        @Index(name = "idx_student_stats_type", columnList = "student_id,stats_type"),
        @Index(name = "idx_stats_type_entity", columnList = "stats_type,entity_id")
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentStats {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @Enumerated(EnumType.STRING)
    @Column(name = "stats_type", nullable = false, length = 20)
    private StatsType statsType;

    /**
     * ID of the entity this stat is for:
     * - CONCEPT: concept_id
     * - SUB_UNIT: sub_unit_id
     * - UNIT: unit_id
     * - GRADE: grade_id
     * - LEVEL: level_id
     * - OVERALL: null (or 0)
     */
    @Column(name = "entity_id")
    private Long entityId;

    @Column(name = "attempt_count", nullable = false)
    @Builder.Default
    private Integer attemptCount = 0;

    @Column(name = "correct_count", nullable = false)
    @Builder.Default
    private Integer correctCount = 0;

    @Column(name = "correct_rate", nullable = false)
    @Builder.Default
    private Double correctRate = 0.0;

    @UpdateTimestamp
    @Column(name = "last_updated")
    private LocalDateTime lastUpdated;

    public enum StatsType {
        CONCEPT,    // 핵심개념별
        SUB_UNIT,   // 소단원별
        UNIT,       // 대단원별
        GRADE,      // 학년별
        LEVEL,      // 교육과정별
        OVERALL     // 전체
    }

    /**
     * Update stats with new attempt result
     */
    public void updateWithAttempt(boolean isCorrect) {
        this.attemptCount++;
        if (isCorrect) {
            this.correctCount++;
        }
        this.correctRate = (double) this.correctCount / this.attemptCount * 100.0;
    }
}
