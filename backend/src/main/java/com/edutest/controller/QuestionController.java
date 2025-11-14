package com.edutest.controller;

import com.edutest.dto.QuestionCreateRequest;
import com.edutest.dto.QuestionDto;
import com.edutest.service.FileStorageService;
import com.edutest.service.QuestionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/questions")
@RequiredArgsConstructor
public class QuestionController {

    private final QuestionService questionService;
    private final FileStorageService fileStorageService;
    private final ObjectMapper objectMapper;

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
            @RequestPart(value = "image", required = false) MultipartFile image) {
        try {
            QuestionCreateRequest request = objectMapper.readValue(requestJson, QuestionCreateRequest.class);

            // Store image if provided
            if (image != null && !image.isEmpty()) {
                String filename = fileStorageService.storeFile(image);
                request.setReferenceImage(filename);
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
            @RequestPart(value = "image", required = false) MultipartFile image) {
        try {
            QuestionCreateRequest request = objectMapper.readValue(requestJson, QuestionCreateRequest.class);

            // Store image if provided
            if (image != null && !image.isEmpty()) {
                String filename = fileStorageService.storeFile(image);
                request.setReferenceImage(filename);
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
}
