package com.edutest.service;

import com.edutest.dto.ConceptDto;
import com.edutest.dto.QuestionCreateRequest;
import com.edutest.dto.QuestionDto;
import com.edutest.dto.QuestionOptionDto;
import com.edutest.entity.*;
import com.edutest.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuestionService {

    private final QuestionRepository questionRepository;
    private final QuestionOptionRepository questionOptionRepository;
    private final LevelRepository levelRepository;
    private final SubUnitRepository subUnitRepository;
    private final ConceptRepository conceptRepository;

    @Transactional(readOnly = true)
    public List<QuestionDto> getAllQuestions() {
        return questionRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<QuestionDto> getQuestionsByLevel(Long levelId) {
        return questionRepository.findByLevelId(levelId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public QuestionDto getQuestionById(Long id) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Question not found with id: " + id));
        return convertToDto(question);
    }

    @Transactional
    public QuestionDto createQuestion(QuestionCreateRequest request) {
        Level level = levelRepository.findById(request.getLevelId())
                .orElseThrow(() -> new IllegalArgumentException("Level not found with id: " + request.getLevelId()));

        SubUnit subUnit = null;
        if (request.getSubUnitId() != null) {
            subUnit = subUnitRepository.findById(request.getSubUnitId())
                    .orElseThrow(() -> new IllegalArgumentException("SubUnit not found with id: " + request.getSubUnitId()));
        }

        // Load concepts
        Set<Concept> concepts = new HashSet<>();
        if (request.getConceptIds() != null && !request.getConceptIds().isEmpty()) {
            concepts = request.getConceptIds().stream()
                    .map(id -> conceptRepository.findById(id)
                            .orElseThrow(() -> new IllegalArgumentException("Concept not found with id: " + id)))
                    .collect(Collectors.toSet());
        }

        Question question = Question.builder()
                .level(level)
                .subUnit(subUnit)
                .difficulty(request.getDifficulty())
                .evalDomain(request.getEvalDomain())
                .title("Question")
                .content(request.getQuestionText())
                .questionType(Question.QuestionType.valueOf(request.getQuestionType()))
                .points(request.getPoints())
                .referenceImage(request.getReferenceImage())
                .referenceDocument(request.getReferenceDocument())
                .concepts(concepts)
                .build();

        Question savedQuestion = questionRepository.save(question);

        // Save options if provided
        if (request.getOptions() != null && !request.getOptions().isEmpty()) {
            for (QuestionOptionDto optionDto : request.getOptions()) {
                boolean isCorrect = request.getCorrectAnswer() != null &&
                        optionDto.getOptionText().equals(request.getCorrectAnswer());
                QuestionOption option = QuestionOption.builder()
                        .question(savedQuestion)
                        .optionText(optionDto.getOptionText())
                        .optionOrder(optionDto.getOptionOrder())
                        .isCorrect(isCorrect)
                        .build();
                questionOptionRepository.save(option);
            }
        }

        return convertToDto(questionRepository.findById(savedQuestion.getId()).get());
    }

    @Transactional
    public QuestionDto updateQuestion(Long id, QuestionCreateRequest request) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Question not found with id: " + id));

        Level level = levelRepository.findById(request.getLevelId())
                .orElseThrow(() -> new IllegalArgumentException("Level not found with id: " + request.getLevelId()));

        SubUnit subUnit = null;
        if (request.getSubUnitId() != null) {
            subUnit = subUnitRepository.findById(request.getSubUnitId())
                    .orElseThrow(() -> new IllegalArgumentException("SubUnit not found with id: " + request.getSubUnitId()));
        }

        // Load concepts
        Set<Concept> concepts = new HashSet<>();
        if (request.getConceptIds() != null && !request.getConceptIds().isEmpty()) {
            concepts = request.getConceptIds().stream()
                    .map(cId -> conceptRepository.findById(cId)
                            .orElseThrow(() -> new IllegalArgumentException("Concept not found with id: " + cId)))
                    .collect(Collectors.toSet());
        }

        question.setLevel(level);
        question.setSubUnit(subUnit);
        question.setDifficulty(request.getDifficulty());
        question.setEvalDomain(request.getEvalDomain());
        question.setTitle("Question");
        question.setContent(request.getQuestionText());
        question.setQuestionType(Question.QuestionType.valueOf(request.getQuestionType()));
        question.setPoints(request.getPoints());
        question.setReferenceImage(request.getReferenceImage());
        question.setReferenceDocument(request.getReferenceDocument());

        // Clear and update concepts
        question.getConcepts().clear();
        question.getConcepts().addAll(concepts);

        Question updatedQuestion = questionRepository.save(question);

        // Delete existing options and create new ones
        questionOptionRepository.deleteByQuestionId(id);

        if (request.getOptions() != null && !request.getOptions().isEmpty()) {
            for (QuestionOptionDto optionDto : request.getOptions()) {
                boolean isCorrect = request.getCorrectAnswer() != null &&
                        optionDto.getOptionText().equals(request.getCorrectAnswer());
                QuestionOption option = QuestionOption.builder()
                        .question(updatedQuestion)
                        .optionText(optionDto.getOptionText())
                        .optionOrder(optionDto.getOptionOrder())
                        .isCorrect(isCorrect)
                        .build();
                questionOptionRepository.save(option);
            }
        }

        return convertToDto(questionRepository.findById(id).get());
    }

    @Transactional
    public void deleteQuestion(Long id) {
        if (!questionRepository.existsById(id)) {
            throw new IllegalArgumentException("Question not found with id: " + id);
        }
        questionOptionRepository.deleteByQuestionId(id);
        questionRepository.deleteById(id);
    }

    private QuestionDto convertToDto(Question question) {
        List<QuestionOptionDto> options = questionOptionRepository.findByQuestionIdOrderByOptionOrderAsc(question.getId())
                .stream()
                .map(option -> QuestionOptionDto.builder()
                        .id(option.getId())
                        .optionText(option.getOptionText())
                        .optionOrder(option.getOptionOrder())
                        .build())
                .collect(Collectors.toList());

        // Find correct answer from options
        String correctAnswer = questionOptionRepository.findByQuestionIdOrderByOptionOrderAsc(question.getId())
                .stream()
                .filter(option -> option.getIsCorrect() != null && option.getIsCorrect())
                .map(QuestionOption::getOptionText)
                .findFirst()
                .orElse("");

        // Convert concepts to DTOs
        List<ConceptDto> conceptDtos = question.getConcepts().stream()
                .map(concept -> ConceptDto.builder()
                        .id(concept.getId())
                        .name(concept.getName())
                        .displayName(concept.getDisplayName())
                        .description(concept.getDescription())
                        .build())
                .collect(Collectors.toList());

        return QuestionDto.builder()
                .id(question.getId())
                .levelId(question.getLevel().getId())
                .levelName(question.getLevel().getName())
                .subUnitId(question.getSubUnit() != null ? question.getSubUnit().getId() : null)
                .subUnitName(question.getSubUnit() != null ? question.getSubUnit().getName() : null)
                .difficulty(question.getDifficulty())
                .evalDomain(question.getEvalDomain())
                .questionText(question.getContent())
                .questionType(question.getQuestionType().name())
                .correctAnswer(correctAnswer)
                .points(question.getPoints())
                .referenceImage(question.getReferenceImage())
                .referenceDocument(question.getReferenceDocument())
                .options(options)
                .concepts(conceptDtos)
                .build();
    }
}
