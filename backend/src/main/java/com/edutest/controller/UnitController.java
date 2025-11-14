package com.edutest.controller;

import com.edutest.dto.UnitDto;
import com.edutest.service.UnitService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/units")
@RequiredArgsConstructor
public class UnitController {

    private final UnitService unitService;

    @GetMapping
    public ResponseEntity<List<UnitDto>> getAllUnits() {
        return ResponseEntity.ok(unitService.getAllUnits());
    }

    @GetMapping("/by-subject/{subjectId}")
    public ResponseEntity<List<UnitDto>> getUnitsBySubject(@PathVariable Long subjectId) {
        return ResponseEntity.ok(unitService.getUnitsBySubject(subjectId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUnitById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(unitService.getUnitById(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping
    public ResponseEntity<?> createUnit(@RequestBody UnitDto dto) {
        try {
            return ResponseEntity.ok(unitService.createUnit(dto));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUnit(@PathVariable Long id, @RequestBody UnitDto dto) {
        try {
            return ResponseEntity.ok(unitService.updateUnit(id, dto));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUnit(@PathVariable Long id) {
        try {
            unitService.deleteUnit(id);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
