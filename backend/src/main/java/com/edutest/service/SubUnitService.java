package com.edutest.service;

import com.edutest.dto.SubUnitDto;
import com.edutest.entity.SubUnit;
import com.edutest.entity.Unit;
import com.edutest.repository.SubUnitRepository;
import com.edutest.repository.UnitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SubUnitService {

    private final SubUnitRepository subUnitRepository;
    private final UnitRepository unitRepository;

    @Transactional(readOnly = true)
    public List<SubUnitDto> getAllSubUnits() {
        return subUnitRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SubUnitDto> getSubUnitsByUnit(Long unitId) {
        return subUnitRepository.findByUnitIdOrderByOrderIndexAsc(unitId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SubUnitDto getSubUnitById(Long id) {
        SubUnit subUnit = subUnitRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("SubUnit not found with id: " + id));
        return convertToDto(subUnit);
    }

    @Transactional
    public SubUnitDto createSubUnit(SubUnitDto dto) {
        Unit unit = unitRepository.findById(dto.getUnitId())
                .orElseThrow(() -> new IllegalArgumentException("Unit not found with id: " + dto.getUnitId()));

        SubUnit subUnit = SubUnit.builder()
                .unit(unit)
                .name(dto.getName())
                .displayName(dto.getDisplayName() != null ? dto.getDisplayName() : dto.getName())
                .description(dto.getDescription())
                .orderIndex(dto.getOrderIndex() != null ? dto.getOrderIndex() : 0)
                .build();

        SubUnit saved = subUnitRepository.save(subUnit);
        return convertToDto(saved);
    }

    @Transactional
    public SubUnitDto updateSubUnit(Long id, SubUnitDto dto) {
        SubUnit subUnit = subUnitRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("SubUnit not found with id: " + id));

        if (dto.getUnitId() != null) {
            Unit unit = unitRepository.findById(dto.getUnitId())
                    .orElseThrow(() -> new IllegalArgumentException("Unit not found with id: " + dto.getUnitId()));
            subUnit.setUnit(unit);
        }

        subUnit.setName(dto.getName());
        subUnit.setDisplayName(dto.getDisplayName() != null ? dto.getDisplayName() : dto.getName());
        subUnit.setDescription(dto.getDescription());
        if (dto.getOrderIndex() != null) {
            subUnit.setOrderIndex(dto.getOrderIndex());
        }

        SubUnit updated = subUnitRepository.save(subUnit);
        return convertToDto(updated);
    }

    @Transactional
    public void deleteSubUnit(Long id) {
        if (!subUnitRepository.existsById(id)) {
            throw new IllegalArgumentException("SubUnit not found with id: " + id);
        }
        subUnitRepository.deleteById(id);
    }

    @Transactional
    public void reorderSubUnit(Long id, String direction) {
        SubUnit currentSubUnit = subUnitRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("SubUnit not found with id: " + id));

        List<SubUnit> subUnitsInUnit = subUnitRepository.findByUnitIdOrderByOrderIndexAsc(currentSubUnit.getUnit().getId());
        int currentIndex = -1;

        for (int i = 0; i < subUnitsInUnit.size(); i++) {
            if (subUnitsInUnit.get(i).getId().equals(id)) {
                currentIndex = i;
                break;
            }
        }

        if (currentIndex == -1) {
            throw new IllegalArgumentException("SubUnit not found in ordered list");
        }

        SubUnit swapSubUnit = null;
        if ("up".equals(direction) && currentIndex > 0) {
            swapSubUnit = subUnitsInUnit.get(currentIndex - 1);
        } else if ("down".equals(direction) && currentIndex < subUnitsInUnit.size() - 1) {
            swapSubUnit = subUnitsInUnit.get(currentIndex + 1);
        }

        if (swapSubUnit != null) {
            Integer tempOrder = currentSubUnit.getOrderIndex();
            currentSubUnit.setOrderIndex(swapSubUnit.getOrderIndex());
            swapSubUnit.setOrderIndex(tempOrder);

            subUnitRepository.save(currentSubUnit);
            subUnitRepository.save(swapSubUnit);
        }
    }

    private SubUnitDto convertToDto(SubUnit subUnit) {
        return SubUnitDto.builder()
                .id(subUnit.getId())
                .unitId(subUnit.getUnit().getId())
                .unitName(subUnit.getUnit().getName())
                .name(subUnit.getName())
                .displayName(subUnit.getDisplayName())
                .description(subUnit.getDescription())
                .orderIndex(subUnit.getOrderIndex())
                .build();
    }
}
