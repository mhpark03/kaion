package com.edutest.service;

import com.edutest.dto.ConceptDto;
import com.edutest.entity.Concept;
import com.edutest.repository.ConceptRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConceptService {

    private final ConceptRepository conceptRepository;

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

        Concept concept = Concept.builder()
                .name(dto.getName())
                .displayName(dto.getDisplayName() != null ? dto.getDisplayName() : dto.getName())
                .description(dto.getDescription())
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

        concept.setName(dto.getName());
        concept.setDisplayName(dto.getDisplayName() != null ? dto.getDisplayName() : dto.getName());
        concept.setDescription(dto.getDescription());

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

    private ConceptDto convertToDto(Concept concept) {
        return ConceptDto.builder()
                .id(concept.getId())
                .name(concept.getName())
                .displayName(concept.getDisplayName())
                .description(concept.getDescription())
                .build();
    }
}
