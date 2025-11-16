package com.edutest.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Records every question attempt by students
 * This is the source of truth for calculating statistics
 */
@Entity
@Table(name = "student_question_attempts", indexes = {
    @Index(name = "idx_student_question", columnList = "student_id,question_id"),
    @Index(name = "idx_student_attempted", columnList = "student_id,attempted_at"),
    @Index(name = "idx_question_attempted", columnList = "question_id,attempted_at")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentQuestionAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(name = "is_correct", nullable = false)
    private Boolean isCorrect;

    @Column(name = "user_answer", columnDefinition = "TEXT")
    private String userAnswer;

    @Column(name = "time_spent_seconds")
    private Integer timeSpentSeconds;  // Time taken to answer (optional)

    @CreationTimestamp
    @Column(name = "attempted_at", nullable = false)
    private LocalDateTime attemptedAt;

    // Denormalized fields for faster querying (optional - can also JOIN)
    @Column(name = "concept_id")
    private Long conceptId;

    @Column(name = "sub_unit_id")
    private Long subUnitId;

    @Column(name = "unit_id")
    private Long unitId;

    @Column(name = "grade_id")
    private Long gradeId;

    @Column(name = "level_id")
    private Long levelId;

    @Column(name = "difficulty", length = 20)
    private String difficulty;
}
