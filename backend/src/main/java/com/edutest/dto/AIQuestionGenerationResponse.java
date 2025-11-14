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
public class AIQuestionGenerationResponse {
    private String questionText; // AI가 생성한 문제 텍스트 (보기 제외)
    private List<String> options; // AI가 생성한 선택지 목록 (객관식/O/X용)
    private String correctAnswer; // AI가 생성한 정답
    private String explanation; // AI가 생성한 해설
    private String generatedImageUrl; // DALL-E로 생성된 이미지 URL (선택)
}
