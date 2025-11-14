package com.edutest.service;

import com.edutest.dto.AIQuestionGenerationRequest;
import com.edutest.dto.AIQuestionGenerationResponse;
import com.edutest.entity.Concept;
import com.edutest.repository.ConceptRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AIQuestionGenerationService {

    private final ConceptRepository conceptRepository;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${ai.anthropic.api-key}")
    private String anthropicApiKey;

    @Value("${ai.anthropic.api-url}")
    private String anthropicApiUrl;

    @Value("${ai.anthropic.model}")
    private String anthropicModel;

    @Value("${ai.openai.api-key}")
    private String openaiApiKey;

    @Value("${ai.openai.image-generation-url}")
    private String openaiImageUrl;

    @Value("${ai.openai.model}")
    private String openaiModel;

    @Value("${file.upload-dir}")
    private String uploadDir;

    public AIQuestionGenerationResponse generateQuestion(
            AIQuestionGenerationRequest request,
            MultipartFile referenceImage,
            MultipartFile referenceDocument
    ) throws IOException {
        // Get concept information
        Concept concept = conceptRepository.findById(request.getConceptId())
                .orElseThrow(() -> new IllegalArgumentException("Concept not found"));

        // Build the prompt for Claude
        String systemPrompt = buildSystemPrompt(concept, request);

        // Prepare content with image and document if provided
        List<Map<String, Object>> contentParts = new ArrayList<>();

        // Add text prompt
        Map<String, Object> textContent = new HashMap<>();
        textContent.put("type", "text");
        textContent.put("text", buildUserPrompt(request, referenceDocument));
        contentParts.add(textContent);

        // Add image if provided
        if (referenceImage != null && !referenceImage.isEmpty()) {
            String base64Image = encodeImageToBase64(referenceImage);
            String mediaType = referenceImage.getContentType();

            Map<String, Object> imageContent = new HashMap<>();
            imageContent.put("type", "image");
            Map<String, Object> imageSource = new HashMap<>();
            imageSource.put("type", "base64");
            imageSource.put("media_type", mediaType);
            imageSource.put("data", base64Image);
            imageContent.put("source", imageSource);
            contentParts.add(imageContent);
        }

        // Call Claude API
        String claudeResponse = callClaudeAPI(systemPrompt, contentParts);

        // Parse response
        AIQuestionGenerationResponse response = parseClaudeResponse(claudeResponse);

        // Generate image if requested
        if (request.isGenerateImage()) {
            try {
                String imageUrl = generateQuestionImage(response.getQuestionText(), concept.getName());
                response.setGeneratedImageUrl(imageUrl);
            } catch (Exception e) {
                log.error("Failed to generate image with DALL-E", e);
                // Continue without image if generation fails
            }
        }

        return response;
    }

    private String buildSystemPrompt(Concept concept, AIQuestionGenerationRequest request) {
        String difficultyKorean = mapDifficultyToKorean(request.getDifficulty());
        String questionTypeKorean = mapQuestionTypeToKorean(request.getQuestionType());

        return String.format(
            "당신은 과학 교육 전문가입니다. 다음 정보를 바탕으로 교육용 문제를 생성해주세요:\n\n" +
            "- 핵심개념: %s\n" +
            "- 개념 설명: %s\n" +
            "- 난이도: %s\n" +
            "- 문제 유형: %s\n\n" +
            "다음 JSON 형식으로 응답해주세요:\n" +
            "{\n" +
            "  \"questionText\": \"생성된 문제 텍스트\",\n" +
            "  \"correctAnswer\": \"정답\",\n" +
            "  \"explanation\": \"상세한 해설\"\n" +
            "}\n\n" +
            "문제는 학생들이 개념을 깊이 이해할 수 있도록 구성해주세요.",
            concept.getName(),
            concept.getDescription() != null ? concept.getDescription() : "설명 없음",
            difficultyKorean,
            questionTypeKorean
        );
    }

    private String buildUserPrompt(AIQuestionGenerationRequest request, MultipartFile document) throws IOException {
        StringBuilder prompt = new StringBuilder();

        if (StringUtils.hasText(request.getUserPrompt())) {
            prompt.append("사용자 요청사항: ").append(request.getUserPrompt()).append("\n\n");
        }

        if (request.getCorrectAnswer() != null && !request.getCorrectAnswer().isEmpty()) {
            prompt.append("정답 힌트: ").append(request.getCorrectAnswer()).append("\n\n");
        }

        if (document != null && !document.isEmpty()) {
            String documentText = extractTextFromDocument(document);
            if (StringUtils.hasText(documentText)) {
                prompt.append("참조 문서 내용:\n").append(documentText).append("\n\n");
            }
        }

        if (prompt.length() == 0) {
            prompt.append("위 개념에 맞는 교육용 문제를 생성해주세요.");
        }

        return prompt.toString();
    }

    private String callClaudeAPI(String systemPrompt, List<Map<String, Object>> contentParts) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("x-api-key", anthropicApiKey);
            headers.set("anthropic-version", "2023-06-01");

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", anthropicModel);
            requestBody.put("max_tokens", 2048);
            requestBody.put("system", systemPrompt);

            List<Map<String, Object>> messages = new ArrayList<>();
            Map<String, Object> userMessage = new HashMap<>();
            userMessage.put("role", "user");
            userMessage.put("content", contentParts);
            messages.add(userMessage);

            requestBody.put("messages", messages);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            log.info("Calling Claude API...");
            ResponseEntity<String> response = restTemplate.exchange(
                anthropicApiUrl,
                HttpMethod.POST,
                entity,
                String.class
            );

            return response.getBody();
        } catch (Exception e) {
            log.error("Error calling Claude API", e);
            throw new RuntimeException("Failed to generate question with AI: " + e.getMessage());
        }
    }

    private AIQuestionGenerationResponse parseClaudeResponse(String responseJson) {
        try {
            JsonNode root = objectMapper.readTree(responseJson);
            JsonNode content = root.path("content").get(0).path("text");
            String textResponse = content.asText();

            // Extract JSON from response
            int jsonStart = textResponse.indexOf("{");
            int jsonEnd = textResponse.lastIndexOf("}") + 1;
            if (jsonStart >= 0 && jsonEnd > jsonStart) {
                String jsonString = textResponse.substring(jsonStart, jsonEnd);
                JsonNode questionData = objectMapper.readTree(jsonString);

                return AIQuestionGenerationResponse.builder()
                        .questionText(questionData.path("questionText").asText())
                        .correctAnswer(questionData.path("correctAnswer").asText())
                        .explanation(questionData.path("explanation").asText())
                        .build();
            } else {
                throw new RuntimeException("Invalid JSON response from Claude");
            }
        } catch (Exception e) {
            log.error("Error parsing Claude response", e);
            throw new RuntimeException("Failed to parse AI response: " + e.getMessage());
        }
    }

    private String generateQuestionImage(String questionText, String conceptName) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(openaiApiKey);

            String imagePrompt = String.format(
                "Educational illustration for a science question about '%s'. " +
                "Style: clean, simple, educational diagram. " +
                "Content related to: %s",
                conceptName,
                questionText.substring(0, Math.min(questionText.length(), 200))
            );

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", openaiModel);
            requestBody.put("prompt", imagePrompt);
            requestBody.put("n", 1);
            requestBody.put("size", "1024x1024");

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            log.info("Calling DALL-E API for image generation...");
            ResponseEntity<String> response = restTemplate.exchange(
                openaiImageUrl,
                HttpMethod.POST,
                entity,
                String.class
            );

            JsonNode root = objectMapper.readTree(response.getBody());
            return root.path("data").get(0).path("url").asText();
        } catch (Exception e) {
            log.error("Error generating image with DALL-E", e);
            throw new RuntimeException("Failed to generate image: " + e.getMessage());
        }
    }

    private String encodeImageToBase64(MultipartFile image) throws IOException {
        byte[] imageBytes = image.getBytes();
        return Base64.getEncoder().encodeToString(imageBytes);
    }

    private String extractTextFromDocument(MultipartFile document) throws IOException {
        // Simple text extraction - for .txt files
        // For PDF/DOC files, you would need libraries like Apache PDFBox or Apache POI
        String filename = document.getOriginalFilename();
        if (filename != null && filename.toLowerCase().endsWith(".txt")) {
            return new String(document.getBytes());
        }
        // For other formats, return empty or implement proper extraction
        return "";
    }

    private String mapDifficultyToKorean(String difficulty) {
        switch (difficulty) {
            case "VERY_EASY": return "매우 쉬움";
            case "EASY": return "쉬움";
            case "MEDIUM": return "보통";
            case "HARD": return "어려움";
            case "VERY_HARD": return "매우 어려움";
            default: return "보통";
        }
    }

    private String mapQuestionTypeToKorean(String questionType) {
        switch (questionType) {
            case "MULTIPLE_CHOICE": return "객관식";
            case "TRUE_FALSE": return "O/X";
            case "SHORT_ANSWER": return "주관식";
            case "ESSAY": return "서술형";
            default: return "객관식";
        }
    }
}
