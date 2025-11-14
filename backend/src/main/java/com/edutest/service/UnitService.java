package com.edutest.service;

import com.edutest.dto.UnitDto;
import com.edutest.entity.Grade;
import com.edutest.entity.Subject;
import com.edutest.entity.Unit;
import com.edutest.repository.GradeRepository;
import com.edutest.repository.SubjectRepository;
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
    private final SubjectRepository subjectRepository;

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

        // Get default "Science" subject
        Subject subject = subjectRepository.findByName("Science")
                .orElseThrow(() -> new IllegalArgumentException("Default subject 'Science' not found"));

        Unit unit = Unit.builder()
                .grade(grade)
                .subject(subject)
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

    @Transactional
    public void reorderUnit(Long id, String direction) {
        Unit currentUnit = unitRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Unit not found with id: " + id));

        List<Unit> unitsInGrade = unitRepository.findByGradeIdOrderByOrderIndexAsc(currentUnit.getGrade().getId());
        int currentIndex = -1;

        for (int i = 0; i < unitsInGrade.size(); i++) {
            if (unitsInGrade.get(i).getId().equals(id)) {
                currentIndex = i;
                break;
            }
        }

        if (currentIndex == -1) {
            throw new IllegalArgumentException("Unit not found in ordered list");
        }

        Unit swapUnit = null;
        if ("up".equals(direction) && currentIndex > 0) {
            swapUnit = unitsInGrade.get(currentIndex - 1);
        } else if ("down".equals(direction) && currentIndex < unitsInGrade.size() - 1) {
            swapUnit = unitsInGrade.get(currentIndex + 1);
        }

        if (swapUnit != null) {
            Integer tempOrder = currentUnit.getOrderIndex();
            currentUnit.setOrderIndex(swapUnit.getOrderIndex());
            swapUnit.setOrderIndex(tempOrder);

            unitRepository.save(currentUnit);
            unitRepository.save(swapUnit);
        }
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
