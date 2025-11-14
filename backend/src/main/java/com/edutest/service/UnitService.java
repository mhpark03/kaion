package com.edutest.service;

import com.edutest.dto.UnitDto;
import com.edutest.entity.Grade;
import com.edutest.entity.Unit;
import com.edutest.repository.GradeRepository;
import com.edutest.repository.UnitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UnitService {

    private final UnitRepository unitRepository;
    private final GradeRepository gradeRepository;

    @Transactional(readOnly = true)
    public List<UnitDto> getAllUnits() {
        return unitRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UnitDto> getUnitsByGrade(Long gradeId) {
        return unitRepository.findByGradeIdOrderByOrderIndexAsc(gradeId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public UnitDto getUnitById(Long id) {
        Unit unit = unitRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Unit not found with id: " + id));
        return convertToDto(unit);
    }

    @Transactional
    public UnitDto createUnit(UnitDto dto) {
        Grade grade = gradeRepository.findById(dto.getGradeId())
                .orElseThrow(() -> new IllegalArgumentException("Grade not found with id: " + dto.getGradeId()));

        Unit unit = Unit.builder()
                .grade(grade)
                .name(dto.getName())
                .displayName(dto.getDisplayName() != null ? dto.getDisplayName() : dto.getName())
                .description(dto.getDescription())
                .orderIndex(dto.getOrderIndex() != null ? dto.getOrderIndex() : 0)
                .build();

        Unit saved = unitRepository.save(unit);
        return convertToDto(saved);
    }

    @Transactional
    public UnitDto updateUnit(Long id, UnitDto dto) {
        Unit unit = unitRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Unit not found with id: " + id));

        if (dto.getGradeId() != null) {
            Grade grade = gradeRepository.findById(dto.getGradeId())
                    .orElseThrow(() -> new IllegalArgumentException("Grade not found with id: " + dto.getGradeId()));
            unit.setGrade(grade);
        }

        unit.setName(dto.getName());
        unit.setDisplayName(dto.getDisplayName() != null ? dto.getDisplayName() : dto.getName());
        unit.setDescription(dto.getDescription());
        if (dto.getOrderIndex() != null) {
            unit.setOrderIndex(dto.getOrderIndex());
        }

        Unit updated = unitRepository.save(unit);
        return convertToDto(updated);
    }

    @Transactional
    public void deleteUnit(Long id) {
        if (!unitRepository.existsById(id)) {
            throw new IllegalArgumentException("Unit not found with id: " + id);
        }
        unitRepository.deleteById(id);
    }

    private UnitDto convertToDto(Unit unit) {
        return UnitDto.builder()
                .id(unit.getId())
                .gradeId(unit.getGrade().getId())
                .gradeName(unit.getGrade().getName())
                .name(unit.getName())
                .displayName(unit.getDisplayName())
                .description(unit.getDescription())
                .orderIndex(unit.getOrderIndex())
                .build();
    }
}
