package com.edutest.dto;

import lombok.Data;
import java.util.List;

@Data
public class QuestionCreateRequest {
    private Long subjectId;
    private Long levelId;
    private String questionText;
    private String questionType; // MULTIPLE_CHOICE, TRUE_FALSE, SHORT_ANSWER, ESSAY
    private String correctAnswer;
    private Integer points;
    private List<QuestionOptionDto> options;
}
