package com.edutest.dto;

import lombok.Data;

@Data
public class AIQuestionGenerationRequest {
    private Long conceptId;
    private String difficulty;
    private String questionType;
    private String userPrompt; // 사용자가 입력한 프롬프트
    private String correctAnswer; // 사용자가 입력한 정답 (선택)
    private boolean generateImage; // 이미지 생성 여부
}
