package com.edutest.controller;

import com.edutest.dto.GradeDto;
import com.edutest.service.GradeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/grades")
@RequiredArgsConstructor
public class GradeController {

    private final GradeService gradeService;

    @GetMapping
    public ResponseEntity<List<GradeDto>> getAllGrades() {
        return ResponseEntity.ok(gradeService.getAllGrades());
    }

    @GetMapping("/by-level/{levelId}")
    public ResponseEntity<List<GradeDto>> getGradesByLevel(@PathVariable Long levelId) {
        return ResponseEntity.ok(gradeService.getGradesByLevel(levelId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getGradeById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(gradeService.getGradeById(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping
    public ResponseEntity<?> createGrade(@RequestBody GradeDto dto) {
        try {
            return ResponseEntity.ok(gradeService.createGrade(dto));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateGrade(@PathVariable Long id, @RequestBody GradeDto dto) {
        try {
            return ResponseEntity.ok(gradeService.updateGrade(id, dto));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteGrade(@PathVariable Long id) {
        try {
            gradeService.deleteGrade(id);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}/reorder")
    public ResponseEntity<?> reorderGrade(@PathVariable Long id, @RequestParam String direction) {
        try {
            gradeService.reorderGrade(id, direction);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
