package com.edutest.controller;

import com.edutest.dto.AIQuestionGenerationRequest;
import com.edutest.dto.AIQuestionGenerationResponse;
import com.edutest.dto.QuestionCreateRequest;
import com.edutest.dto.QuestionDto;
import com.edutest.service.AIQuestionGenerationService;
import com.edutest.service.FileStorageService;
import com.edutest.service.QuestionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@RestController
@RequestMapping("/api/questions")
@RequiredArgsConstructor
public class QuestionController {

    private final QuestionService questionService;
    private final FileStorageService fileStorageService;
    private final AIQuestionGenerationService aiQuestionGenerationService;
    private final ObjectMapper objectMapper;

    @Value("${file.upload-dir}")
    private String uploadDir;

    @GetMapping
    public ResponseEntity<List<QuestionDto>> getAllQuestions(
            @RequestParam(required = false) Long levelId) {

        if (levelId != null) {
            return ResponseEntity.ok(questionService.getQuestionsByLevel(levelId));
        } else {
            return ResponseEntity.ok(questionService.getAllQuestions());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getQuestionById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(questionService.getQuestionById(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<?> createQuestion(
            @RequestPart("request") String requestJson,
            @RequestPart(value = "image", required = false) MultipartFile image,
            @RequestPart(value = "document", required = false) MultipartFile document) {
        try {
            QuestionCreateRequest request = objectMapper.readValue(requestJson, QuestionCreateRequest.class);

            // Store image if provided
            if (image != null && !image.isEmpty()) {
                String filename = fileStorageService.storeFile(image);
                request.setReferenceImage(filename);
            }

            // Store document if provided
            if (document != null && !document.isEmpty()) {
                String filename = fileStorageService.storeFile(document);
                request.setReferenceDocument(filename);
            }

            return ResponseEntity.ok(questionService.createQuestion(request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to create question: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<?> updateQuestion(
            @PathVariable Long id,
            @RequestPart("request") String requestJson,
            @RequestPart(value = "image", required = false) MultipartFile image,
            @RequestPart(value = "document", required = false) MultipartFile document) {
        try {
            QuestionCreateRequest request = objectMapper.readValue(requestJson, QuestionCreateRequest.class);

            // Store image if provided
            if (image != null && !image.isEmpty()) {
                String filename = fileStorageService.storeFile(image);
                request.setReferenceImage(filename);
            }

            // Store document if provided
            if (document != null && !document.isEmpty()) {
                String filename = fileStorageService.storeFile(document);
                request.setReferenceDocument(filename);
            }

            return ResponseEntity.ok(questionService.updateQuestion(id, request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to update question: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<?> deleteQuestion(@PathVariable Long id) {
        try {
            questionService.deleteQuestion(id);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/generate-ai")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<?> generateQuestionWithAI(
            @RequestPart("request") String requestJson,
            @RequestPart(value = "image", required = false) MultipartFile referenceImage,
            @RequestPart(value = "document", required = false) MultipartFile referenceDocument) {
        try {
            AIQuestionGenerationRequest request = objectMapper.readValue(requestJson, AIQuestionGenerationRequest.class);
            AIQuestionGenerationResponse response = aiQuestionGenerationService.generateQuestion(
                    request,
                    referenceImage,
                    referenceDocument
            );
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to generate question with AI: " + e.getMessage());
        }
    }

    /**
     * Serve AI-generated images
     * This endpoint allows the frontend to access images downloaded from OpenAI
     */
    @GetMapping("/images/ai-generated/{filename:.+}")
    public ResponseEntity<Resource> serveAIGeneratedImage(@PathVariable String filename) {
        try {
            Path filePath = Paths.get(uploadDir, "ai-generated", filename);
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_PNG)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
