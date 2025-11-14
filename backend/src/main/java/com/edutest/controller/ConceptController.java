package com.edutest.controller;

import com.edutest.dto.ConceptDto;
import com.edutest.service.ConceptService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/concepts")
@RequiredArgsConstructor
public class ConceptController {

    private final ConceptService conceptService;

    @GetMapping
    public ResponseEntity<List<ConceptDto>> getAllConcepts() {
        return ResponseEntity.ok(conceptService.getAllConcepts());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getConceptById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(conceptService.getConceptById(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping
    public ResponseEntity<?> createConcept(@RequestBody ConceptDto dto) {
        try {
            return ResponseEntity.ok(conceptService.createConcept(dto));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateConcept(@PathVariable Long id, @RequestBody ConceptDto dto) {
        try {
            return ResponseEntity.ok(conceptService.updateConcept(id, dto));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteConcept(@PathVariable Long id) {
        try {
            conceptService.deleteConcept(id);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}/reorder")
    public ResponseEntity<?> reorderConcept(@PathVariable Long id, @RequestParam String direction) {
        try {
            conceptService.reorderConcept(id, direction);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
