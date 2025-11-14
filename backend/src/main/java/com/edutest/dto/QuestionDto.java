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
    private Long subUnitId;
    private String subUnitName;
    private String difficulty; // E (쉬움), M (보통), H (어려움)
    private String evalDomain; // 적용/계산, 이해/개념, 분석/추론 등
    private String questionText;
    private String questionType; // MULTIPLE_CHOICE, TRUE_FALSE, SHORT_ANSWER, ESSAY
    private String correctAnswer;
    private Integer points;
    private List<QuestionOptionDto> options;
    private List<ConceptDto> concepts;
}
