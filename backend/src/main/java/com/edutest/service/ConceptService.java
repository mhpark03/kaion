package com.edutest.service;

import com.edutest.dto.ConceptDto;
import com.edutest.entity.Concept;
import com.edutest.entity.SubUnit;
import com.edutest.repository.ConceptRepository;
import com.edutest.repository.QuestionRepository;
import com.edutest.repository.SubUnitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConceptService {

    private final ConceptRepository conceptRepository;
    private final SubUnitRepository subUnitRepository;
    private final QuestionRepository questionRepository;

    @Transactional(readOnly = true)
    public List<ConceptDto> getAllConcepts() {
        return conceptRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ConceptDto getConceptById(Long id) {
        Concept concept = conceptRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Concept not found with id: " + id));
        return convertToDto(concept);
    }

    @Transactional
    public ConceptDto createConcept(ConceptDto dto) {
        if (conceptRepository.findByName(dto.getName()).isPresent()) {
            throw new IllegalArgumentException("Concept with name '" + dto.getName() + "' already exists");
        }

        SubUnit subUnit = null;
        if (dto.getSubUnitId() != null) {
            subUnit = subUnitRepository.findById(dto.getSubUnitId())
                    .orElseThrow(() -> new IllegalArgumentException("SubUnit not found with id: " + dto.getSubUnitId()));
        }

        Concept concept = Concept.builder()
                .subUnit(subUnit)
                .name(dto.getName())
                .displayName(dto.getDisplayName() != null ? dto.getDisplayName() : dto.getName())
                .description(dto.getDescription())
                .orderIndex(dto.getOrderIndex() != null ? dto.getOrderIndex() : 0)
                .build();

        Concept saved = conceptRepository.save(concept);
        return convertToDto(saved);
    }

    @Transactional
    public ConceptDto updateConcept(Long id, ConceptDto dto) {
        Concept concept = conceptRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Concept not found with id: " + id));

        conceptRepository.findByName(dto.getName()).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new IllegalArgumentException("Concept with name '" + dto.getName() + "' already exists");
            }
        });

        if (dto.getSubUnitId() != null) {
            SubUnit subUnit = subUnitRepository.findById(dto.getSubUnitId())
                    .orElseThrow(() -> new IllegalArgumentException("SubUnit not found with id: " + dto.getSubUnitId()));
            concept.setSubUnit(subUnit);
        }

        concept.setName(dto.getName());
        concept.setDisplayName(dto.getDisplayName() != null ? dto.getDisplayName() : dto.getName());
        concept.setDescription(dto.getDescription());
        if (dto.getOrderIndex() != null) {
            concept.setOrderIndex(dto.getOrderIndex());
        }

        Concept updated = conceptRepository.save(concept);
        return convertToDto(updated);
    }

    @Transactional
    public void deleteConcept(Long id) {
        if (!conceptRepository.existsById(id)) {
            throw new IllegalArgumentException("Concept not found with id: " + id);
        }
        conceptRepository.deleteById(id);
    }

    @Transactional
    public void reorderConcept(Long id, String direction) {
        Concept currentConcept = conceptRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Concept not found with id: " + id));

        List<Concept> conceptsInSubUnit;
        if (currentConcept.getSubUnit() != null) {
            conceptsInSubUnit = conceptRepository.findBySubUnitIdOrderByOrderIndexAsc(currentConcept.getSubUnit().getId());
        } else {
            conceptsInSubUnit = conceptRepository.findBySubUnitIsNullOrderByOrderIndexAsc();
        }

        int currentIndex = -1;

        for (int i = 0; i < conceptsInSubUnit.size(); i++) {
            if (conceptsInSubUnit.get(i).getId().equals(id)) {
                currentIndex = i;
                break;
            }
        }

        if (currentIndex == -1) {
            throw new IllegalArgumentException("Concept not found in ordered list");
        }

        Concept swapConcept = null;
        if ("up".equals(direction) && currentIndex > 0) {
            swapConcept = conceptsInSubUnit.get(currentIndex - 1);
        } else if ("down".equals(direction) && currentIndex < conceptsInSubUnit.size() - 1) {
            swapConcept = conceptsInSubUnit.get(currentIndex + 1);
        }

        if (swapConcept != null) {
            Integer tempOrder = currentConcept.getOrderIndex();
            currentConcept.setOrderIndex(swapConcept.getOrderIndex());
            swapConcept.setOrderIndex(tempOrder);

            conceptRepository.save(currentConcept);
            conceptRepository.save(swapConcept);
        }
    }

    private ConceptDto convertToDto(Concept concept) {
        Long questionCount = questionRepository.countByConceptId(concept.getId());
        Long veryEasyCount = questionRepository.countByConceptIdAndDifficulty(concept.getId(), "VERY_EASY");
        Long easyCount = questionRepository.countByConceptIdAndDifficulty(concept.getId(), "EASY");
        Long mediumCount = questionRepository.countByConceptIdAndDifficulty(concept.getId(), "MEDIUM");
        Long hardCount = questionRepository.countByConceptIdAndDifficulty(concept.getId(), "HARD");
        Long veryHardCount = questionRepository.countByConceptIdAndDifficulty(concept.getId(), "VERY_HARD");

        return ConceptDto.builder()
                .id(concept.getId())
                .subUnitId(concept.getSubUnit() != null ? concept.getSubUnit().getId() : null)
                .subUnitName(concept.getSubUnit() != null ? concept.getSubUnit().getName() : null)
                .name(concept.getName())
                .displayName(concept.getDisplayName())
                .description(concept.getDescription())
                .orderIndex(concept.getOrderIndex())
                .questionCount(questionCount)
                .veryEasyCount(veryEasyCount)
                .easyCount(easyCount)
                .mediumCount(mediumCount)
                .hardCount(hardCount)
                .veryHardCount(veryHardCount)
                .build();
    }
}
