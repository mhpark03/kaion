package com.edutest.controller;

import com.edutest.service.AIQuestionGenerationService;
import com.edutest.service.SecretService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/secrets")
@RequiredArgsConstructor
public class SecretController {

    private final AIQuestionGenerationService aiQuestionGenerationService;
    private final SecretService secretService;

    /**
     * Store OpenAI API key to S3
     * Only ADMIN users can store secrets
     */
    @PostMapping("/openai-api-key")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> storeOpenAIApiKey(@RequestBody Map<String, String> request) {
        try {
            String apiKey = request.get("apiKey");
            if (apiKey == null || apiKey.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "API key cannot be empty"));
            }

            aiQuestionGenerationService.storeOpenAIApiKey(apiKey);
            return ResponseEntity.ok(Map.of("message", "OpenAI API key stored to S3 successfully"));
        } catch (Exception e) {
            log.error("Failed to store OpenAI API key", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("message", "Failed to store API key: " + e.getMessage()));
        }
    }

    /**
     * Check if OpenAI API key exists in S3
     */
    @GetMapping("/openai-api-key/exists")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Boolean>> checkOpenAIApiKeyExists() {
        try {
            boolean exists = secretService.secretExists("openai-api-key");
            return ResponseEntity.ok(Map.of("exists", exists));
        } catch (Exception e) {
            log.error("Failed to check OpenAI API key existence", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("exists", false));
        }
    }

    /**
     * Delete OpenAI API key from S3
     * Only ADMIN users can delete secrets
     */
    @DeleteMapping("/openai-api-key")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> deleteOpenAIApiKey() {
        try {
            secretService.deleteSecret("openai-api-key");
            return ResponseEntity.ok(Map.of("message", "OpenAI API key deleted from S3 successfully"));
        } catch (Exception e) {
            log.error("Failed to delete OpenAI API key", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("message", "Failed to delete API key: " + e.getMessage()));
        }
    }
}
