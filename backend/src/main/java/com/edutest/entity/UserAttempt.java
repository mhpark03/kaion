package com.edutest.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "user_attempts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "level_id", nullable = false)
    private Level level;

    @CreationTimestamp
    @Column(name = "started_at", updatable = false)
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "total_questions")
    private Integer totalQuestions = 0;

    @Column(name = "correct_answers")
    private Integer correctAnswers = 0;

    @Column(name = "total_points")
    private Integer totalPoints = 0;

    @Column(name = "earned_points")
    private Integer earnedPoints = 0;

    @OneToMany(mappedBy = "attempt", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<UserAnswer> answers = new ArrayList<>();

    public void addAnswer(UserAnswer answer) {
        answers.add(answer);
        answer.setAttempt(this);
    }

    public void removeAnswer(UserAnswer answer) {
        answers.remove(answer);
        answer.setAttempt(null);
    }

    public void calculateResults() {
        this.totalQuestions = answers.size();
        this.correctAnswers = (int) answers.stream().filter(UserAnswer::getIsCorrect).count();
        this.totalPoints = answers.stream().mapToInt(a -> a.getQuestion().getPoints()).sum();
        this.earnedPoints = answers.stream().mapToInt(UserAnswer::getPointsEarned).sum();
    }
}
