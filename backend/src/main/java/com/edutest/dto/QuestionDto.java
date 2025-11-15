package com.edutest.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionDto {
    private Long id;
    private Long levelId;
    private String levelName;
    private Long gradeId;
    private String gradeName;
    private Long subUnitId;
    private String subUnitName;
    private String difficulty; // E (쉬움), M (보통), H (어려움)
    private String evalDomain; // 적용/계산, 이해/개념, 분석/추론 등
    private String questionText;
    private String questionType; // MULTIPLE_CHOICE, TRUE_FALSE, SHORT_ANSWER, ESSAY
    private String correctAnswer;
    private Integer points;
    private String referenceImage; // 참조 이미지 파일 경로
    private String referenceDocument; // 참조 문서 파일 경로
    private List<QuestionOptionDto> options;
    private List<ConceptDto> concepts;

    // Statistics fields
    private Integer attemptCount; // 시도한 학생 수
    private Integer correctCount; // 정답자 수
    private Double correctRate; // 정답 비율 (0.0 ~ 100.0)
}
