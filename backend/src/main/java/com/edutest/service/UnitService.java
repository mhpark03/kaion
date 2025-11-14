package com.edutest.service;

import com.edutest.dto.UnitDto;
import com.edutest.entity.Subject;
import com.edutest.entity.Unit;
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
    private final SubjectRepository subjectRepository;

    @Transactional(readOnly = true)
    public List<UnitDto> getAllUnits() {
        return unitRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UnitDto> getUnitsBySubject(Long subjectId) {
        return unitRepository.findBySubjectIdOrderByOrderIndexAsc(subjectId).stream()
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
        Subject subject = subjectRepository.findById(dto.getSubjectId())
                .orElseThrow(() -> new IllegalArgumentException("Subject not found with id: " + dto.getSubjectId()));

        Unit unit = Unit.builder()
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

        if (dto.getSubjectId() != null) {
            Subject subject = subjectRepository.findById(dto.getSubjectId())
                    .orElseThrow(() -> new IllegalArgumentException("Subject not found with id: " + dto.getSubjectId()));
            unit.setSubject(subject);
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
                .subjectId(unit.getSubject().getId())
                .subjectName(unit.getSubject().getName())
                .name(unit.getName())
                .displayName(unit.getDisplayName())
                .description(unit.getDescription())
                .orderIndex(unit.getOrderIndex())
                .build();
    }
}
