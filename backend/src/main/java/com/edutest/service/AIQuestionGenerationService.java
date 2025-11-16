package com.edutest.service;

import com.edutest.dto.AIQuestionGenerationRequest;
import com.edutest.dto.AIQuestionGenerationResponse;
import com.edutest.entity.*;
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
    private final SecretService secretService;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${ai.openai.api-key}")
    private String openaiApiKey;

    @Value("${ai.openai.chat-url}")
    private String openaiChatUrl;

    @Value("${ai.openai.chat-model}")
    private String openaiChatModel;

    @Value("${ai.openai.image-generation-url}")
    private String openaiImageUrl;

    @Value("${ai.openai.image-model}")
    private String openaiImageModel;

    @Value("${file.upload-dir}")
    private String uploadDir;

    public AIQuestionGenerationResponse generateQuestion(
            AIQuestionGenerationRequest request,
            MultipartFile referenceImage,
            MultipartFile referenceDocument
    ) throws IOException {
        // Get concept information with full hierarchy (Level → Grade → Subject → Unit → SubUnit → Concept)
        Concept concept = conceptRepository.findByIdWithFullHierarchy(request.getConceptId())
                .orElseThrow(() -> new IllegalArgumentException("Concept not found"));

        // Build the prompt for OpenAI (includes grade information from hierarchy)
        String systemPrompt = buildSystemPrompt(concept, request);
        String userPrompt = buildUserPrompt(request, referenceDocument);

        // Prepare user message content with image and document if provided
        List<Map<String, Object>> userContentParts = new ArrayList<>();

        // Add text prompt
        Map<String, Object> textContent = new HashMap<>();
        textContent.put("type", "text");
        textContent.put("text", userPrompt);
        userContentParts.add(textContent);

        // Add image if provided
        if (referenceImage != null && !referenceImage.isEmpty()) {
            String base64Image = encodeImageToBase64(referenceImage);
            String mediaType = referenceImage.getContentType();

            Map<String, Object> imageContent = new HashMap<>();
            imageContent.put("type", "image_url");
            Map<String, Object> imageUrl = new HashMap<>();
            imageUrl.put("url", "data:" + mediaType + ";base64," + base64Image);
            imageContent.put("image_url", imageUrl);
            userContentParts.add(imageContent);
        }

        // Call OpenAI API
        String openaiResponse = callOpenAIAPI(systemPrompt, userContentParts);

        // Parse response
        AIQuestionGenerationResponse response = parseOpenAIResponse(openaiResponse);

        // Generate image if requested
        if (request.isGenerateImage()) {
            try {
                String imageUrl = generateQuestionImage(response.getQuestionText(), concept);
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

        // Extract grade and educational hierarchy information
        String gradeInfo = extractGradeInfo(concept);
        String hierarchyInfo = extractHierarchyInfo(concept);

        StringBuilder promptBuilder = new StringBuilder();
        promptBuilder.append("당신은 과학 교육 전문가입니다. 다음 정보를 바탕으로 교육용 문제를 생성해주세요:\n\n");

        // Add grade and hierarchy information
        if (!gradeInfo.isEmpty()) {
            promptBuilder.append("### 교육 대상\n");
            promptBuilder.append(gradeInfo).append("\n");
        }

        if (!hierarchyInfo.isEmpty()) {
            promptBuilder.append("### 교육 과정 위치\n");
            promptBuilder.append(hierarchyInfo).append("\n");
        }

        // Add concept information
        promptBuilder.append("### 핵심 개념\n");
        promptBuilder.append("- 개념명: ").append(concept.getName()).append("\n");
        if (concept.getDescription() != null && !concept.getDescription().isEmpty()) {
            promptBuilder.append("- 개념 설명: ").append(concept.getDescription()).append("\n");
        }
        promptBuilder.append("\n");

        // Add question requirements
        promptBuilder.append("### 문제 요구사항\n");
        promptBuilder.append("- 난이도: ").append(difficultyKorean).append("\n");
        promptBuilder.append("- 문제 유형: ").append(questionTypeKorean).append("\n\n");

        // Add JSON format instruction based on question type
        promptBuilder.append("다음 JSON 형식으로 응답해주세요:\n");
        promptBuilder.append("{\n");
        promptBuilder.append("  \"questionText\": \"문제 본문 (보기는 제외하고 질문만 작성)\",\n");

        // Add options field for multiple choice and true/false questions
        if ("객관식".equals(questionTypeKorean)) {
            promptBuilder.append("  \"options\": [\"선택지1\", \"선택지2\", \"선택지3\", \"선택지4\", \"선택지5\"],\n");
        } else if ("O/X".equals(questionTypeKorean)) {
            promptBuilder.append("  \"options\": [\"O (맞다)\", \"X (틀리다)\"],\n");
        }

        promptBuilder.append("  \"correctAnswer\": \"정답\",\n");
        promptBuilder.append("  \"explanation\": \"상세한 해설\"\n");
        promptBuilder.append("}\n\n");

        promptBuilder.append("**중요 지침:**\n");
        if ("객관식".equals(questionTypeKorean)) {
            promptBuilder.append("1. questionText에는 보기(선택지)를 포함하지 말고, 질문 본문만 작성하세요.\n");
            promptBuilder.append("2. options 배열에 4-5개의 선택지를 작성하세요. 각 선택지는 명확하고 간결하게 작성하세요.\n");
            promptBuilder.append("3. correctAnswer는 options 배열에 있는 선택지 중 하나와 정확히 일치해야 합니다.\n");
            promptBuilder.append("4. 오답 선택지는 그럴듯하지만 명확히 틀린 내용이어야 합니다.\n");
        } else if ("O/X".equals(questionTypeKorean)) {
            promptBuilder.append("1. questionText에는 O/X로 판단할 수 있는 명제를 작성하세요.\n");
            promptBuilder.append("2. options는 항상 [\"O (맞다)\", \"X (틀리다)\"]로 고정됩니다.\n");
            promptBuilder.append("3. correctAnswer는 \"O (맞다)\" 또는 \"X (틀리다)\" 중 하나여야 합니다.\n");
        } else {
            promptBuilder.append("1. questionText에는 학생이 답을 서술하거나 작성할 수 있는 질문을 작성하세요.\n");
            promptBuilder.append("2. correctAnswer에는 모범 답안을 작성하세요.\n");
        }
        promptBuilder.append("\n문제는 해당 학년 수준에 맞게, 학생들이 개념을 깊이 이해할 수 있도록 구성해주세요.");

        return promptBuilder.toString();
    }

    private String extractGradeInfo(Concept concept) {
        StringBuilder gradeInfo = new StringBuilder();

        if (concept.getSubUnit() != null) {
            SubUnit subUnit = concept.getSubUnit();
            if (subUnit.getUnit() != null) {
                Unit unit = subUnit.getUnit();
                if (unit.getGrade() != null) {
                    Grade grade = unit.getGrade();
                    gradeInfo.append("- 학년: ").append(grade.getDisplayName()).append(" (").append(grade.getName()).append(")\n");

                    if (grade.getLevel() != null) {
                        Level level = grade.getLevel();
                        gradeInfo.append("- 교육 과정: ").append(level.getDisplayName()).append("\n");
                    }
                }

                if (unit.getSubject() != null) {
                    Subject subject = unit.getSubject();
                    gradeInfo.append("- 과목: ").append(subject.getDisplayName()).append("\n");
                }
            }
        }

        return gradeInfo.toString();
    }

    private String extractHierarchyInfo(Concept concept) {
        StringBuilder hierarchyInfo = new StringBuilder();

        if (concept.getSubUnit() != null) {
            SubUnit subUnit = concept.getSubUnit();
            hierarchyInfo.append("- 중단원: ").append(subUnit.getDisplayName()).append("\n");

            if (subUnit.getUnit() != null) {
                Unit unit = subUnit.getUnit();
                hierarchyInfo.append("- 대단원: ").append(unit.getDisplayName()).append("\n");
            }
        }

        return hierarchyInfo.toString();
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

    private String callOpenAIAPI(String systemPrompt, List<Map<String, Object>> userContentParts) {
        try {
            // Try to get API key from S3 first, fallback to environment variable
            String apiKey = getOpenAIApiKey();
            if (apiKey == null || apiKey.trim().isEmpty()) {
                throw new RuntimeException("OpenAI API key not configured. Please set OPENAI_API_KEY environment variable or store in S3.");
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", openaiChatModel);
            requestBody.put("max_completion_tokens", 16384);  // GPT-5 mini uses more reasoning tokens for complex educational content
            // GPT-5 reasoning models only support temperature = 1 (default), so we omit it

            List<Map<String, Object>> messages = new ArrayList<>();

            // System message
            Map<String, Object> systemMessage = new HashMap<>();
            systemMessage.put("role", "system");
            systemMessage.put("content", systemPrompt);
            messages.add(systemMessage);

            // User message with content (text + optional image)
            Map<String, Object> userMessage = new HashMap<>();
            userMessage.put("role", "user");
            userMessage.put("content", userContentParts);
            messages.add(userMessage);

            requestBody.put("messages", messages);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            log.info("Calling OpenAI GPT-5 nano API...");
            ResponseEntity<String> response = restTemplate.exchange(
                openaiChatUrl,
                HttpMethod.POST,
                entity,
                String.class
            );

            return response.getBody();
        } catch (Exception e) {
            log.error("Error calling OpenAI API", e);
            throw new RuntimeException("Failed to generate question with AI: " + e.getMessage());
        }
    }

    private AIQuestionGenerationResponse parseOpenAIResponse(String responseJson) {
        try {
            log.info("OpenAI Raw Response: {}", responseJson);
            JsonNode root = objectMapper.readTree(responseJson);
            JsonNode messageContent = root.path("choices").get(0).path("message").path("content");
            String textResponse = messageContent.asText();
            log.info("OpenAI Message Content: {}", textResponse);

            // Extract JSON from response
            int jsonStart = textResponse.indexOf("{");
            int jsonEnd = textResponse.lastIndexOf("}") + 1;
            if (jsonStart >= 0 && jsonEnd > jsonStart) {
                String jsonString = textResponse.substring(jsonStart, jsonEnd);
                log.info("Extracted JSON: {}", jsonString);
                JsonNode questionData = objectMapper.readTree(jsonString);

                // Parse options if present
                List<String> options = new ArrayList<>();
                if (questionData.has("options") && questionData.get("options").isArray()) {
                    for (JsonNode optionNode : questionData.get("options")) {
                        options.add(optionNode.asText());
                    }
                }

                return AIQuestionGenerationResponse.builder()
                        .questionText(questionData.path("questionText").asText())
                        .options(options.isEmpty() ? null : options)
                        .correctAnswer(questionData.path("correctAnswer").asText())
                        .explanation(questionData.path("explanation").asText())
                        .build();
            } else {
                log.error("No JSON found in response. Text response: {}", textResponse);
                throw new RuntimeException("Invalid JSON response from OpenAI");
            }
        } catch (Exception e) {
            log.error("Error parsing OpenAI response", e);
            throw new RuntimeException("Failed to parse AI response: " + e.getMessage());
        }
    }

    private String generateQuestionImage(String questionText, Concept concept) {
        try {
            // Get API key with fallback logic
            String apiKey = getOpenAIApiKey();
            if (apiKey == null || apiKey.trim().isEmpty()) {
                throw new RuntimeException("OpenAI API key not configured");
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            String imagePrompt = String.format(
                "한국 과학 교육용 삽화. 주제: '%s'. " +
                "스타일: 깔끔하고 단순한 교육용 다이어그램. " +
                "내용: %s. " +
                "중요 지침: 이미지에 포함되는 모든 텍스트, 라벨, 설명은 반드시 한글로 작성하세요. 영어를 사용하지 마세요.",
                concept.getDisplayName(),
                questionText.substring(0, Math.min(questionText.length(), 200))
            );

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", openaiImageModel);
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
            String imageUrl = root.path("data").get(0).path("url").asText();

            // Extract SubUnit ID for folder organization
            Long subUnitId = null;
            if (concept.getSubUnit() != null) {
                subUnitId = concept.getSubUnit().getId();
            }

            // Download the image from OpenAI and save it to S3 (organized by SubUnit)
            log.info("Downloading generated image from OpenAI and uploading to S3...");
            String savedImagePath = downloadAndSaveImage(imageUrl, subUnitId);

            return savedImagePath;
        } catch (Exception e) {
            log.error("Error generating image with DALL-E", e);
            throw new RuntimeException("Failed to generate image: " + e.getMessage());
        }
    }

    /**
     * Download image from OpenAI URL and save to S3
     * Images are organized by SubUnit for better file management
     *
     * @param imageUrl The OpenAI image URL to download
     * @param subUnitId The SubUnit ID for folder organization (null if not available)
     * @return The relative path that can be accessed via the backend API
     */
    private String downloadAndSaveImage(String imageUrl, Long subUnitId) throws IOException {
        try {
            // Download image from OpenAI URL
            ResponseEntity<byte[]> imageResponse = restTemplate.getForEntity(imageUrl, byte[].class);
            byte[] imageBytes = imageResponse.getBody();

            if (imageBytes == null || imageBytes.length == 0) {
                throw new IOException("Failed to download image from OpenAI");
            }

            // Generate unique filename
            String filename = "dalle_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString() + ".png";

            // Build S3 path with SubUnit folder structure
            String subUnitFolder = (subUnitId != null) ? "subunit-" + subUnitId : "no-subunit";
            String s3Key = "question-images/ai-generated/" + subUnitFolder + "/" + filename;

            // Upload to S3
            secretService.uploadImage(s3Key, imageBytes, "image/png");

            log.info("Image uploaded successfully to S3: {} (SubUnit: {})", s3Key, subUnitId);

            // Return relative path that can be accessed via API
            return "/api/questions/images/ai-generated/" + subUnitFolder + "/" + filename;
        } catch (Exception e) {
            log.error("Failed to download and save image to S3: {}", e.getMessage(), e);
            throw new IOException("Failed to save generated image: " + e.getMessage(), e);
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

    /**
     * Get OpenAI API key from S3 or fallback to environment variable
     * Priority: S3 > Environment Variable
     */
    private String getOpenAIApiKey() {
        // First, try to get from environment variable
        if (openaiApiKey != null && !openaiApiKey.trim().isEmpty() &&
            !openaiApiKey.equals("your-openai-api-key-here")) {
            log.debug("Using OpenAI API key from environment variable");
            return openaiApiKey.trim();
        }

        // Fallback to S3
        try {
            String s3ApiKey = secretService.retrieveSecret("openai-api-key");
            if (s3ApiKey != null && !s3ApiKey.trim().isEmpty()) {
                log.debug("Using OpenAI API key from S3");
                return s3ApiKey.trim();
            }
        } catch (Exception e) {
            log.warn("Failed to retrieve API key from S3: {}", e.getMessage());
        }

        return null;
    }

    /**
     * Store OpenAI API key to S3 for cross-PC access
     * @param apiKey The OpenAI API key to store
     */
    public void storeOpenAIApiKey(String apiKey) {
        secretService.storeSecret("openai-api-key", apiKey);
        log.info("OpenAI API key stored to S3 successfully");
    }
}
