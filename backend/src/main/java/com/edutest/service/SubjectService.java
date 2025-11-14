package com.edutest.service;

import com.edutest.dto.SubjectDto;
import com.edutest.entity.Grade;
import com.edutest.entity.Subject;
import com.edutest.repository.GradeRepository;
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
    private final GradeRepository gradeRepository;

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
        Grade grade = gradeRepository.findById(dto.getGradeId())
                .orElseThrow(() -> new IllegalArgumentException("Grade not found with id: " + dto.getGradeId()));

        Subject subject = Subject.builder()
                .grade(grade)
                .name(dto.getName())
                .displayName(dto.getDisplayName() != null ? dto.getDisplayName() : dto.getName())
                .description(dto.getDescription())
                .color(dto.getColor())
                .iconUrl(dto.getIconUrl())
                .build();

        Subject saved = subjectRepository.save(subject);
        return convertToDto(saved);
    }

    @Transactional
    public SubjectDto updateSubject(Long id, SubjectDto dto) {
        Subject subject = subjectRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Subject not found with id: " + id));

        if (dto.getGradeId() != null) {
            Grade grade = gradeRepository.findById(dto.getGradeId())
                    .orElseThrow(() -> new IllegalArgumentException("Grade not found with id: " + dto.getGradeId()));
            subject.setGrade(grade);
        }

        subject.setName(dto.getName());
        subject.setDisplayName(dto.getDisplayName() != null ? dto.getDisplayName() : dto.getName());
        subject.setDescription(dto.getDescription());
        subject.setColor(dto.getColor());
        subject.setIconUrl(dto.getIconUrl());

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
                .gradeId(subject.getGrade().getId())
                .gradeName(subject.getGrade().getName())
                .name(subject.getName())
                .displayName(subject.getDisplayName())
                .description(subject.getDescription())
                .color(subject.getColor())
                .iconUrl(subject.getIconUrl())
                .build();
    }
}
