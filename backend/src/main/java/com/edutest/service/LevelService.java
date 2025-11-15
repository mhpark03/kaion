package com.edutest.service;

import com.edutest.dto.LevelDto;
import com.edutest.entity.Level;
import com.edutest.repository.LevelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LevelService {

    private final LevelRepository levelRepository;

    @Transactional(readOnly = true)
    public List<LevelDto> getAllLevels() {
        return levelRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public LevelDto getLevelById(Long id) {
        Level level = levelRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Level not found with id: " + id));
        return convertToDto(level);
    }

    @Transactional
    public LevelDto createLevel(LevelDto dto) {
        // Check if level with same name exists
        if (levelRepository.findByName(dto.getName()).isPresent()) {
            throw new IllegalArgumentException("Level with name '" + dto.getName() + "' already exists");
        }

        Level level = Level.builder()
                .name(dto.getName())
                .displayName(dto.getName())
                .description(dto.getDescription())
                .orderIndex(dto.getDifficultyRank())
                .build();

        Level saved = levelRepository.save(level);
        return convertToDto(saved);
    }

    @Transactional
    public LevelDto updateLevel(Long id, LevelDto dto) {
        Level level = levelRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Level not found with id: " + id));

        // Check if another level with same name exists
        levelRepository.findByName(dto.getName()).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new IllegalArgumentException("Level with name '" + dto.getName() + "' already exists");
            }
        });

        level.setName(dto.getName());
        level.setDisplayName(dto.getName());
        level.setDescription(dto.getDescription());
        level.setOrderIndex(dto.getDifficultyRank());

        Level updated = levelRepository.save(level);
        return convertToDto(updated);
    }

    @Transactional
    public void deleteLevel(Long id) {
        if (!levelRepository.existsById(id)) {
            throw new IllegalArgumentException("Level not found with id: " + id);
        }
        levelRepository.deleteById(id);
    }

    @Transactional
    public void reorderLevel(Long id, String direction) {
        Level currentLevel = levelRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Level not found with id: " + id));

        List<Level> allLevels = levelRepository.findAllByOrderByOrderIndexAsc();
        int currentIndex = -1;

        for (int i = 0; i < allLevels.size(); i++) {
            if (allLevels.get(i).getId().equals(id)) {
                currentIndex = i;
                break;
            }
        }

        if (currentIndex == -1) {
            throw new IllegalArgumentException("Level not found in ordered list");
        }

        Level swapLevel = null;
        if ("up".equals(direction) && currentIndex > 0) {
            swapLevel = allLevels.get(currentIndex - 1);
        } else if ("down".equals(direction) && currentIndex < allLevels.size() - 1) {
            swapLevel = allLevels.get(currentIndex + 1);
        }

        if (swapLevel != null) {
            Integer tempOrder = currentLevel.getOrderIndex();
            currentLevel.setOrderIndex(swapLevel.getOrderIndex());
            swapLevel.setOrderIndex(tempOrder);

            levelRepository.save(currentLevel);
            levelRepository.save(swapLevel);
        }
    }

    private LevelDto convertToDto(Level level) {
        return LevelDto.builder()
                .id(level.getId())
                .name(level.getName())
                .displayName(level.getDisplayName() != null ? level.getDisplayName() : level.getName())
                .description(level.getDescription())
                .difficultyRank(level.getOrderIndex())
                .build();
    }
}
