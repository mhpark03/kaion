package com.edutest.dto;

import lombok.Data;
import java.util.List;

@Data
public class QuestionCreateRequest {
    private Long levelId;
    private Long subUnitId;
    private String difficulty; // E (쉬움), M (보통), H (어려움)
    private String evalDomain; // 적용/계산, 이해/개념, 분석/추론 등
    private String questionText;
    private String questionType; // MULTIPLE_CHOICE, TRUE_FALSE, SHORT_ANSWER, ESSAY
    private String correctAnswer;
    private Integer points;
    private String referenceImage; // 참조 이미지 파일 경로
    private String referenceDocument; // 참조 문서 파일 경로
    private List<QuestionOptionDto> options;
    private List<Long> conceptIds; // Concept IDs to associate with this question
}
