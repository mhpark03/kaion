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

import java.util.ArrayList;
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
    private final SubjectRepository subjectRepository;
    private final SubUnitRepository subUnitRepository;
    private final ConceptRepository conceptRepository;
    private final UserAnswerRepository userAnswerRepository;

    @Transactional(readOnly = true)
    public List<QuestionDto> getAllQuestions() {
        return questionRepository.findAllWithConcepts().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<QuestionDto> getQuestionsByLevel(Long levelId) {
        return questionRepository.findByLevelIdWithConcepts(levelId).stream()
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
        Subject subject = null;
        if (request.getSubUnitId() != null) {
            subUnit = subUnitRepository.findById(request.getSubUnitId())
                    .orElseThrow(() -> new IllegalArgumentException("SubUnit not found with id: " + request.getSubUnitId()));

            // Get subject from unit hierarchy
            if (subUnit.getUnit() != null) {
                subject = subUnit.getUnit().getSubject();
            }
        }

        // If subject is still null, try to get it from concept
        if (subject == null && request.getConceptIds() != null && !request.getConceptIds().isEmpty()) {
            Concept concept = conceptRepository.findById(request.getConceptIds().get(0))
                    .orElseThrow(() -> new IllegalArgumentException("Concept not found"));
            if (concept.getSubUnit() != null && concept.getSubUnit().getUnit() != null) {
                subject = concept.getSubUnit().getUnit().getSubject();
            }
        }

        if (subject == null) {
            throw new IllegalArgumentException("Cannot determine subject for question. Please provide valid subUnitId or conceptId.");
        }

        // Load concept (single concept instead of multiple)
        Concept concept = null;
        if (request.getConceptIds() != null && !request.getConceptIds().isEmpty()) {
            Long conceptId = request.getConceptIds().get(0); // Use first concept ID
            concept = conceptRepository.findById(conceptId)
                    .orElseThrow(() -> new IllegalArgumentException("Concept not found with id: " + conceptId));
        }

        Question question = Question.builder()
                .level(level)
                .subject(subject)
                .subUnit(subUnit)
                .difficulty(request.getDifficulty())
                .evalDomain(request.getEvalDomain())
                .title("Question")
                .content(request.getQuestionText())
                .questionType(Question.QuestionType.valueOf(request.getQuestionType()))
                .points(request.getPoints())
                .referenceImage(request.getReferenceImage())
                .referenceDocument(request.getReferenceDocument())
                .correctAnswer(request.getCorrectAnswer())
                .concept(concept)
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

        // Reload question with concepts using FETCH JOIN
        final Long questionId = savedQuestion.getId();
        List<Question> questions = questionRepository.findByLevelIdWithConcepts(savedQuestion.getLevel().getId());
        savedQuestion = questions.stream()
                .filter(q -> q.getId().equals(questionId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Question not found after save"));
        return convertToDto(savedQuestion);
    }

    @Transactional
    public QuestionDto updateQuestion(Long id, QuestionCreateRequest request) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Question not found with id: " + id));

        Level level = levelRepository.findById(request.getLevelId())
                .orElseThrow(() -> new IllegalArgumentException("Level not found with id: " + request.getLevelId()));

        SubUnit subUnit = null;
        Subject subject = null;
        if (request.getSubUnitId() != null) {
            subUnit = subUnitRepository.findById(request.getSubUnitId())
                    .orElseThrow(() -> new IllegalArgumentException("SubUnit not found with id: " + request.getSubUnitId()));

            // Get subject from unit hierarchy
            if (subUnit.getUnit() != null) {
                subject = subUnit.getUnit().getSubject();
            }
        }

        // If subject is still null, try to get it from concept
        if (subject == null && request.getConceptIds() != null && !request.getConceptIds().isEmpty()) {
            Concept concept = conceptRepository.findById(request.getConceptIds().get(0))
                    .orElseThrow(() -> new IllegalArgumentException("Concept not found"));
            if (concept.getSubUnit() != null && concept.getSubUnit().getUnit() != null) {
                subject = concept.getSubUnit().getUnit().getSubject();
            }
        }

        if (subject == null) {
            throw new IllegalArgumentException("Cannot determine subject for question. Please provide valid subUnitId or conceptId.");
        }

        // Load concept (single concept instead of multiple)
        Concept concept = null;
        if (request.getConceptIds() != null && !request.getConceptIds().isEmpty()) {
            Long conceptId = request.getConceptIds().get(0); // Use first concept ID
            concept = conceptRepository.findById(conceptId)
                    .orElseThrow(() -> new IllegalArgumentException("Concept not found with id: " + conceptId));
        }

        question.setLevel(level);
        question.setSubject(subject);
        question.setSubUnit(subUnit);
        question.setDifficulty(request.getDifficulty());
        question.setEvalDomain(request.getEvalDomain());
        question.setTitle("Question");
        question.setContent(request.getQuestionText());
        question.setQuestionType(Question.QuestionType.valueOf(request.getQuestionType()));
        question.setPoints(request.getPoints());
        question.setReferenceImage(request.getReferenceImage());
        question.setReferenceDocument(request.getReferenceDocument());
        question.setCorrectAnswer(request.getCorrectAnswer());
        question.setConcept(concept);

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

        // Reload question with concepts using FETCH JOIN
        List<Question> questions = questionRepository.findByLevelIdWithConcepts(updatedQuestion.getLevel().getId());
        updatedQuestion = questions.stream()
                .filter(q -> q.getId().equals(id))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Question not found after update"));
        return convertToDto(updatedQuestion);
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

        // Find correct answer from options or question entity
        String correctAnswer = "";

        // For multiple choice/true-false, find from options
        if (question.getQuestionType() == Question.QuestionType.MULTIPLE_CHOICE ||
            question.getQuestionType() == Question.QuestionType.TRUE_FALSE) {
            correctAnswer = questionOptionRepository.findByQuestionIdOrderByOptionOrderAsc(question.getId())
                    .stream()
                    .filter(option -> option.getIsCorrect() != null && option.getIsCorrect())
                    .map(QuestionOption::getOptionText)
                    .findFirst()
                    .orElse(question.getCorrectAnswer() != null ? question.getCorrectAnswer() : "");
        } else {
            // For short answer/essay, get from question entity
            correctAnswer = question.getCorrectAnswer() != null ? question.getCorrectAnswer() : "";
        }

        // Convert concept to DTO (single concept)
        List<ConceptDto> conceptDtos = new ArrayList<>();
        if (question.getConcept() != null) {
            conceptDtos.add(ConceptDto.builder()
                    .id(question.getConcept().getId())
                    .name(question.getConcept().getName())
                    .displayName(question.getConcept().getDisplayName())
                    .description(question.getConcept().getDescription())
                    .build());
        }

        // Calculate statistics
        Long attemptCount = userAnswerRepository.countDistinctUsersByQuestionId(question.getId());
        Long correctCount = userAnswerRepository.countCorrectUsersByQuestionId(question.getId());
        Double correctRate = attemptCount > 0 ? (correctCount * 100.0 / attemptCount) : 0.0;

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
                .attemptCount(attemptCount.intValue())
                .correctCount(correctCount.intValue())
                .correctRate(correctRate)
                .build();
    }
}
