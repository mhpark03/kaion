package com.edutest.service;

import com.edutest.dto.GradeDto;
import com.edutest.entity.Grade;
import com.edutest.entity.Level;
import com.edutest.repository.GradeRepository;
import com.edutest.repository.LevelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GradeService {

    private final GradeRepository gradeRepository;
    private final LevelRepository levelRepository;

    @Transactional(readOnly = true)
    public List<GradeDto> getAllGrades() {
        return gradeRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<GradeDto> getGradesByLevel(Long levelId) {
        return gradeRepository.findByLevelIdOrderByOrderIndexAsc(levelId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public GradeDto getGradeById(Long id) {
        Grade grade = gradeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Grade not found with id: " + id));
        return convertToDto(grade);
    }

    @Transactional
    public GradeDto createGrade(GradeDto dto) {
        if (gradeRepository.findByName(dto.getName()).isPresent()) {
            throw new IllegalArgumentException("Grade with name '" + dto.getName() + "' already exists");
        }

        Level level = levelRepository.findById(dto.getLevelId())
                .orElseThrow(() -> new IllegalArgumentException("Level not found with id: " + dto.getLevelId()));

        Grade grade = Grade.builder()
                .level(level)
                .name(dto.getName())
                .displayName(dto.getDisplayName() != null ? dto.getDisplayName() : dto.getName())
                .description(dto.getDescription())
                .orderIndex(dto.getOrderIndex() != null ? dto.getOrderIndex() : 0)
                .build();

        Grade saved = gradeRepository.save(grade);
        return convertToDto(saved);
    }

    @Transactional
    public GradeDto updateGrade(Long id, GradeDto dto) {
        Grade grade = gradeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Grade not found with id: " + id));

        gradeRepository.findByName(dto.getName()).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new IllegalArgumentException("Grade with name '" + dto.getName() + "' already exists");
            }
        });

        if (dto.getLevelId() != null) {
            Level level = levelRepository.findById(dto.getLevelId())
                    .orElseThrow(() -> new IllegalArgumentException("Level not found with id: " + dto.getLevelId()));
            grade.setLevel(level);
        }

        grade.setName(dto.getName());
        grade.setDisplayName(dto.getDisplayName() != null ? dto.getDisplayName() : dto.getName());
        grade.setDescription(dto.getDescription());
        if (dto.getOrderIndex() != null) {
            grade.setOrderIndex(dto.getOrderIndex());
        }

        Grade updated = gradeRepository.save(grade);
        return convertToDto(updated);
    }

    @Transactional
    public void deleteGrade(Long id) {
        if (!gradeRepository.existsById(id)) {
            throw new IllegalArgumentException("Grade not found with id: " + id);
        }
        gradeRepository.deleteById(id);
    }

    @Transactional
    public void reorderGrade(Long id, String direction) {
        Grade currentGrade = gradeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Grade not found with id: " + id));

        List<Grade> gradesInLevel = gradeRepository.findByLevelIdOrderByOrderIndexAsc(currentGrade.getLevel().getId());
        int currentIndex = -1;

        for (int i = 0; i < gradesInLevel.size(); i++) {
            if (gradesInLevel.get(i).getId().equals(id)) {
                currentIndex = i;
                break;
            }
        }

        if (currentIndex == -1) {
            throw new IllegalArgumentException("Grade not found in ordered list");
        }

        Grade swapGrade = null;
        if ("up".equals(direction) && currentIndex > 0) {
            swapGrade = gradesInLevel.get(currentIndex - 1);
        } else if ("down".equals(direction) && currentIndex < gradesInLevel.size() - 1) {
            swapGrade = gradesInLevel.get(currentIndex + 1);
        }

        if (swapGrade != null) {
            Integer tempOrder = currentGrade.getOrderIndex();
            currentGrade.setOrderIndex(swapGrade.getOrderIndex());
            swapGrade.setOrderIndex(tempOrder);

            gradeRepository.save(currentGrade);
            gradeRepository.save(swapGrade);
        }
    }

    private GradeDto convertToDto(Grade grade) {
        return GradeDto.builder()
                .id(grade.getId())
                .levelId(grade.getLevel().getId())
                .levelName(grade.getLevel().getName())
                .name(grade.getName())
                .displayName(grade.getDisplayName())
                .description(grade.getDescription())
                .orderIndex(grade.getOrderIndex())
                .build();
    }
}
