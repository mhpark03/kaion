package com.edutest.service;

import com.edutest.dto.SubjectDto;
import com.edutest.entity.Subject;
import com.edutest.repository.SubjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SubjectService {

    private final SubjectRepository subjectRepository;

    @Transactional(readOnly = true)
    public List<SubjectDto> getAllSubjects() {
        return subjectRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SubjectDto getSubjectById(Long id) {
        Subject subject = subjectRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Subject not found with id: " + id));
        return convertToDto(subject);
    }

    @Transactional
    public SubjectDto createSubject(SubjectDto dto) {
        // Check if subject with same name exists
        if (subjectRepository.findByName(dto.getName()).isPresent()) {
            throw new IllegalArgumentException("Subject with name '" + dto.getName() + "' already exists");
        }

        Subject subject = Subject.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .build();

        Subject saved = subjectRepository.save(subject);
        return convertToDto(saved);
    }

    @Transactional
    public SubjectDto updateSubject(Long id, SubjectDto dto) {
        Subject subject = subjectRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Subject not found with id: " + id));

        // Check if another subject with same name exists
        subjectRepository.findByName(dto.getName()).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new IllegalArgumentException("Subject with name '" + dto.getName() + "' already exists");
            }
        });

        subject.setName(dto.getName());
        subject.setDescription(dto.getDescription());

        Subject updated = subjectRepository.save(subject);
        return convertToDto(updated);
    }

    @Transactional
    public void deleteSubject(Long id) {
        if (!subjectRepository.existsById(id)) {
            throw new IllegalArgumentException("Subject not found with id: " + id);
        }
        subjectRepository.deleteById(id);
    }

    private SubjectDto convertToDto(Subject subject) {
        return SubjectDto.builder()
                .id(subject.getId())
                .name(subject.getName())
                .description(subject.getDescription())
                .build();
    }
}
