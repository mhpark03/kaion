package com.edutest.controller;

import com.edutest.dto.QuestionCreateRequest;
import com.edutest.dto.QuestionDto;
import com.edutest.service.QuestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/questions")
@RequiredArgsConstructor
public class QuestionController {

    private final QuestionService questionService;

    @GetMapping
    public ResponseEntity<List<QuestionDto>> getAllQuestions(
            @RequestParam(required = false) Long subjectId,
            @RequestParam(required = false) Long levelId) {

        if (subjectId != null && levelId != null) {
            return ResponseEntity.ok(questionService.getQuestionsBySubjectAndLevel(subjectId, levelId));
        } else if (subjectId != null) {
            return ResponseEntity.ok(questionService.getQuestionsBySubject(subjectId));
        } else if (levelId != null) {
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
    public ResponseEntity<?> createQuestion(@RequestBody QuestionCreateRequest request) {
        try {
            return ResponseEntity.ok(questionService.createQuestion(request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<?> updateQuestion(@PathVariable Long id, @RequestBody QuestionCreateRequest request) {
        try {
            return ResponseEntity.ok(questionService.updateQuestion(id, request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
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
