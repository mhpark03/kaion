package com.edutest.controller;

import com.edutest.dto.SubUnitDto;
import com.edutest.service.SubUnitService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sub-units")
@RequiredArgsConstructor
public class SubUnitController {

    private final SubUnitService subUnitService;

    @GetMapping
    public ResponseEntity<List<SubUnitDto>> getAllSubUnits() {
        return ResponseEntity.ok(subUnitService.getAllSubUnits());
    }

    @GetMapping("/by-unit/{unitId}")
    public ResponseEntity<List<SubUnitDto>> getSubUnitsByUnit(@PathVariable Long unitId) {
        return ResponseEntity.ok(subUnitService.getSubUnitsByUnit(unitId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getSubUnitById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(subUnitService.getSubUnitById(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping
    public ResponseEntity<?> createSubUnit(@RequestBody SubUnitDto dto) {
        try {
            return ResponseEntity.ok(subUnitService.createSubUnit(dto));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateSubUnit(@PathVariable Long id, @RequestBody SubUnitDto dto) {
        try {
            return ResponseEntity.ok(subUnitService.updateSubUnit(id, dto));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSubUnit(@PathVariable Long id) {
        try {
            subUnitService.deleteSubUnit(id);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}/reorder")
    public ResponseEntity<?> reorderSubUnit(@PathVariable Long id, @RequestParam String direction) {
        try {
            subUnitService.reorderSubUnit(id, direction);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
