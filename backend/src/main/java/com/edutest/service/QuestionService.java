package com.edutest.service;

import com.edutest.dto.QuestionCreateRequest;
import com.edutest.dto.QuestionDto;
import com.edutest.dto.QuestionOptionDto;
import com.edutest.entity.Level;
import com.edutest.entity.Question;
import com.edutest.entity.QuestionOption;
import com.edutest.entity.Subject;
import com.edutest.repository.LevelRepository;
import com.edutest.repository.QuestionOptionRepository;
import com.edutest.repository.QuestionRepository;
import com.edutest.repository.SubjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuestionService {

    private final QuestionRepository questionRepository;
    private final QuestionOptionRepository questionOptionRepository;
    private final SubjectRepository subjectRepository;
    private final LevelRepository levelRepository;

    @Transactional(readOnly = true)
    public List<QuestionDto> getAllQuestions() {
        return questionRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<QuestionDto> getQuestionsBySubject(Long subjectId) {
        return questionRepository.findBySubjectId(subjectId).stream()
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
    public List<QuestionDto> getQuestionsBySubjectAndLevel(Long subjectId, Long levelId) {
        return questionRepository.findBySubjectIdAndLevelId(subjectId, levelId).stream()
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
        Subject subject = subjectRepository.findById(request.getSubjectId())
                .orElseThrow(() -> new IllegalArgumentException("Subject not found with id: " + request.getSubjectId()));

        Level level = levelRepository.findById(request.getLevelId())
                .orElseThrow(() -> new IllegalArgumentException("Level not found with id: " + request.getLevelId()));

        Question question = Question.builder()
                .subject(subject)
                .level(level)
                .questionText(request.getQuestionText())
                .questionType(request.getQuestionType())
                .correctAnswer(request.getCorrectAnswer())
                .points(request.getPoints())
                .build();

        Question savedQuestion = questionRepository.save(question);

        // Save options if provided
        if (request.getOptions() != null && !request.getOptions().isEmpty()) {
            for (QuestionOptionDto optionDto : request.getOptions()) {
                QuestionOption option = QuestionOption.builder()
                        .question(savedQuestion)
                        .optionText(optionDto.getOptionText())
                        .optionOrder(optionDto.getOptionOrder())
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

        Subject subject = subjectRepository.findById(request.getSubjectId())
                .orElseThrow(() -> new IllegalArgumentException("Subject not found with id: " + request.getSubjectId()));

        Level level = levelRepository.findById(request.getLevelId())
                .orElseThrow(() -> new IllegalArgumentException("Level not found with id: " + request.getLevelId()));

        question.setSubject(subject);
        question.setLevel(level);
        question.setQuestionText(request.getQuestionText());
        question.setQuestionType(request.getQuestionType());
        question.setCorrectAnswer(request.getCorrectAnswer());
        question.setPoints(request.getPoints());

        Question updatedQuestion = questionRepository.save(question);

        // Delete existing options and create new ones
        questionOptionRepository.deleteByQuestionId(id);

        if (request.getOptions() != null && !request.getOptions().isEmpty()) {
            for (QuestionOptionDto optionDto : request.getOptions()) {
                QuestionOption option = QuestionOption.builder()
                        .question(updatedQuestion)
                        .optionText(optionDto.getOptionText())
                        .optionOrder(optionDto.getOptionOrder())
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
        List<QuestionOptionDto> options = questionOptionRepository.findByQuestionIdOrderByOptionOrder(question.getId())
                .stream()
                .map(option -> QuestionOptionDto.builder()
                        .id(option.getId())
                        .optionText(option.getOptionText())
                        .optionOrder(option.getOptionOrder())
                        .build())
                .collect(Collectors.toList());

        return QuestionDto.builder()
                .id(question.getId())
                .subjectId(question.getSubject().getId())
                .subjectName(question.getSubject().getName())
                .levelId(question.getLevel().getId())
                .levelName(question.getLevel().getName())
                .questionText(question.getQuestionText())
                .questionType(question.getQuestionType())
                .correctAnswer(question.getCorrectAnswer())
                .points(question.getPoints())
                .options(options)
                .build();
    }
}
