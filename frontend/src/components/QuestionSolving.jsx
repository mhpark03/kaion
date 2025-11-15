import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { questionService } from '../services/questionService';
import { levelService } from '../services/levelService';
import { gradeService } from '../services/gradeService';
import { subjectService } from '../services/subjectService';
import { DIFFICULTY_LEVELS, getDifficultyLabel } from '../constants/difficulty';
import Navbar from './Navbar';
import './QuestionSolving.css';

const QuestionSolving = () => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [levels, setLevels] = useState([]);
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filters
  const [filterLevel, setFilterLevel] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');

  // Current question and answer
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState(new Set());

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [questionsRes, levelsRes, gradesRes, subjectsRes] = await Promise.all([
        questionService.getAll(),
        levelService.getAll(),
        gradeService.getAll(),
        subjectService.getAll()
      ]);
      setQuestions(questionsRes.data);
      setLevels(levelsRes.data);
      setGrades(gradesRes.data);
      setSubjects(subjectsRes.data);

      // Set default filters based on user profile
      if (user?.levelId) setFilterLevel(user.levelId.toString());
      if (user?.gradeId) setFilterGrade(user.gradeId.toString());
      if (user?.proficiencyLevel) setFilterDifficulty(user.proficiencyLevel);
    } catch (err) {
      setError('데이터를 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      if (filterLevel && q.levelId !== parseInt(filterLevel)) return false;
      if (filterGrade && q.gradeId !== parseInt(filterGrade)) return false;
      if (filterSubject && q.subjectId !== parseInt(filterSubject)) return false;
      if (filterDifficulty && q.difficulty !== filterDifficulty) return false;
      return true;
    });
  }, [questions, filterLevel, filterGrade, filterSubject, filterDifficulty]);

  const currentQuestion = filteredQuestions[currentQuestionIndex];

  const handleSubmitAnswer = () => {
    if (!userAnswer.trim()) {
      alert('답을 입력해주세요.');
      return;
    }
    setShowResult(true);
    setAnsweredQuestions(prev => new Set([...prev, currentQuestion.id]));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < filteredQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setUserAnswer('');
      setShowResult(false);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setUserAnswer('');
      setShowResult(false);
    }
  };

  const handleOptionSelect = (optionText) => {
    setUserAnswer(optionText);
  };

  const isCorrect = () => {
    if (!currentQuestion) return false;

    if (currentQuestion.questionType === 'MULTIPLE_CHOICE') {
      const correctOption = currentQuestion.options?.find(opt => opt.correct);
      return userAnswer === correctOption?.optionText;
    } else {
      return userAnswer.trim().toLowerCase() === currentQuestion.correctAnswer?.trim().toLowerCase();
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="question-solving-container">
          <div className="loading">데이터를 불러오는 중...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="question-solving-container">
        <div className="page-header">
          <h1>문제 풀기</h1>
          <p>나에게 맞는 문제를 선택하여 풀어보세요</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Filters */}
        <div className="filters-section">
          <div className="filter-group">
            <label>교육과정</label>
            <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)}>
              <option value="">전체</option>
              {levels.map(level => (
                <option key={level.id} value={level.id}>{level.displayName}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>학년</label>
            <select value={filterGrade} onChange={(e) => setFilterGrade(e.target.value)}>
              <option value="">전체</option>
              {grades.map(grade => (
                <option key={grade.id} value={grade.id}>{grade.displayName}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>과목</label>
            <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}>
              <option value="">전체</option>
              {subjects.map(subject => (
                <option key={subject.id} value={subject.id}>{subject.displayName}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>난이도</label>
            <select value={filterDifficulty} onChange={(e) => setFilterDifficulty(e.target.value)}>
              <option value="">전체</option>
              {DIFFICULTY_LEVELS.map(level => (
                <option key={level.value} value={level.value}>{level.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="question-stats">
          <span>총 {filteredQuestions.length}개의 문제</span>
          <span>현재: {filteredQuestions.length > 0 ? currentQuestionIndex + 1 : 0} / {filteredQuestions.length}</span>
          <span>풀이 완료: {answeredQuestions.size}개</span>
        </div>

        {filteredQuestions.length === 0 ? (
          <div className="no-questions">
            <p>조건에 맞는 문제가 없습니다.</p>
            <p>필터를 조정해보세요.</p>
          </div>
        ) : (
          <div className="question-display">
            <div className="question-header">
              <div className="question-meta">
                <span className="question-number">문제 {currentQuestionIndex + 1}</span>
                <span className="question-difficulty">{getDifficultyLabel(currentQuestion.difficulty)}</span>
                <span className="question-type">{getQuestionTypeLabel(currentQuestion.questionType)}</span>
              </div>
              {currentQuestion.concepts && currentQuestion.concepts.length > 0 && (
                <div className="question-concepts">
                  개념: {currentQuestion.concepts.map(c => c.displayName).join(', ')}
                </div>
              )}
            </div>

            <div className="question-content">
              <div className="question-text">
                {currentQuestion.questionText}
              </div>

              {currentQuestion.referenceImage && (
                <div className="question-image">
                  <img src={currentQuestion.referenceImage} alt="문제 이미지" />
                </div>
              )}

              <div className="answer-section">
                {currentQuestion.questionType === 'MULTIPLE_CHOICE' && currentQuestion.options ? (
                  <div className="options-list">
                    {currentQuestion.options.map((option, idx) => (
                      <div
                        key={idx}
                        className={`option-item ${userAnswer === option.optionText ? 'selected' : ''} ${
                          showResult ? (option.correct ? 'correct' : userAnswer === option.optionText ? 'wrong' : '') : ''
                        }`}
                        onClick={() => !showResult && handleOptionSelect(option.optionText)}
                      >
                        <span className="option-number">{idx + 1}</span>
                        <span className="option-text">{option.optionText}</span>
                        {showResult && option.correct && <span className="correct-mark">✓</span>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-answer">
                    <textarea
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      placeholder="답을 입력하세요"
                      disabled={showResult}
                      rows={4}
                    />
                  </div>
                )}
              </div>

              {showResult && (
                <div className={`result-section ${isCorrect() ? 'correct' : 'incorrect'}`}>
                  <div className="result-header">
                    {isCorrect() ? '정답입니다! 🎉' : '틀렸습니다 😢'}
                  </div>
                  {!isCorrect() && currentQuestion.correctAnswer && (
                    <div className="correct-answer">
                      <strong>정답:</strong> {currentQuestion.correctAnswer}
                    </div>
                  )}
                  {currentQuestion.explanation && (
                    <div className="explanation">
                      <strong>해설:</strong> {currentQuestion.explanation}
                    </div>
                  )}
                </div>
              )}

              <div className="question-actions">
                <button
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                  className="btn-secondary"
                >
                  이전 문제
                </button>

                {!showResult ? (
                  <button onClick={handleSubmitAnswer} className="btn-primary">
                    정답 확인
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuestion}
                    disabled={currentQuestionIndex === filteredQuestions.length - 1}
                    className="btn-primary"
                  >
                    다음 문제
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

const getQuestionTypeLabel = (type) => {
  const typeMap = {
    'MULTIPLE_CHOICE': '객관식',
    'TRUE_FALSE': 'O/X',
    'SHORT_ANSWER': '단답형',
    'ESSAY': '서술형'
  };
  return typeMap[type] || type;
};

export default QuestionSolving;
