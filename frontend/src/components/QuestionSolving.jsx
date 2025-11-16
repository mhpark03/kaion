import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { questionService } from '../services/questionService';
import { levelService } from '../services/levelService';
import { gradeService } from '../services/gradeService';
import { subjectService } from '../services/subjectService';
import { unitService } from '../services/unitService';
import { subUnitService } from '../services/subUnitService';
import { conceptService } from '../services/conceptService';
import { DIFFICULTY_LEVELS, getDifficultyLabel } from '../constants/difficulty';
import Navbar from './Navbar';
import './QuestionSolving.css';

const QuestionSolving = () => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [levels, setLevels] = useState([]);
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [units, setUnits] = useState([]);
  const [subUnits, setSubUnits] = useState([]);
  const [concepts, setConcepts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if user is student
  const isStudent = user?.role === 'STUDENT';

  // Filters
  const [filterLevel, setFilterLevel] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterUnit, setFilterUnit] = useState('');
  const [filterSubUnit, setFilterSubUnit] = useState('');
  const [filterConcept, setFilterConcept] = useState('');
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
      const [questionsRes, levelsRes, gradesRes, subjectsRes, unitsRes, subUnitsRes, conceptsRes] = await Promise.all([
        questionService.getAll(),
        levelService.getAll(),
        gradeService.getAll(),
        subjectService.getAll(),
        unitService.getAll(),
        subUnitService.getAll(),
        conceptService.getAll()
      ]);
      setQuestions(questionsRes.data);
      setLevels(levelsRes.data);
      setGrades(gradesRes.data);
      setSubjects(subjectsRes.data);
      setUnits(unitsRes.data);
      setSubUnits(subUnitsRes.data);
      setConcepts(conceptsRes.data);

      // For students: Set filters based on user profile and make them readonly
      if (isStudent) {
        if (user?.levelId) setFilterLevel(user.levelId.toString());
        if (user?.gradeId) setFilterGrade(user.gradeId.toString());
        if (user?.subjectId) setFilterSubject(user.subjectId.toString());
        if (user?.unitId) setFilterUnit(user.unitId.toString());
        if (user?.subUnitId) setFilterSubUnit(user.subUnitId.toString());
        if (user?.proficiencyLevel) setFilterDifficulty(user.proficiencyLevel);
      }
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

      // Unit filter - check if question's subUnit belongs to selected unit
      if (filterUnit) {
        const questionSubUnit = subUnits.find(su => su.id === q.subUnitId);
        if (!questionSubUnit || questionSubUnit.unitId !== parseInt(filterUnit)) return false;
      }

      // SubUnit filter
      if (filterSubUnit && q.subUnitId !== parseInt(filterSubUnit)) return false;

      // Concept filter - check if question has the selected concept
      if (filterConcept) {
        const hasConcept = q.concepts && q.concepts.some(c => c.id === parseInt(filterConcept));
        if (!hasConcept) return false;
      }

      return true;
    });
  }, [questions, filterLevel, filterGrade, filterSubject, filterUnit, filterSubUnit, filterConcept, filterDifficulty, subUnits]);

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

    if (currentQuestion.questionType === 'MULTIPLE_CHOICE' || currentQuestion.questionType === 'TRUE_FALSE') {
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

        {/* Student: Show profile info, not editable filters */}
        {isStudent && (
          <div className="student-profile-info">
            <h3>내 학습 정보</h3>
            <div className="profile-info-grid">
              {filterLevel && <span><strong>교육과정:</strong> {levels.find(l => l.id === parseInt(filterLevel))?.displayName || '-'}</span>}
              {filterGrade && <span><strong>학년:</strong> {grades.find(g => g.id === parseInt(filterGrade))?.displayName || '-'}</span>}
              {filterSubject && <span><strong>과목:</strong> {subjects.find(s => s.id === parseInt(filterSubject))?.displayName || '-'}</span>}
              {filterUnit && <span><strong>대단원:</strong> {units.find(u => u.id === parseInt(filterUnit))?.displayName || '-'}</span>}
              {filterSubUnit && <span><strong>소단원:</strong> {subUnits.find(su => su.id === parseInt(filterSubUnit))?.displayName || '-'}</span>}
              {filterDifficulty && <span><strong>난이도:</strong> {DIFFICULTY_LEVELS.find(d => d.value === filterDifficulty)?.label || '-'}</span>}
            </div>
            <p className="profile-edit-hint">프로필 설정을 변경하려면 <a href="#/profile">프로필 페이지</a>에서 수정하세요.</p>
          </div>
        )}

        {/* Teacher/Admin: Show all filters */}
        {!isStudent && (
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
                {grades
                  .filter(grade => !filterLevel || grade.levelId === parseInt(filterLevel))
                  .map(grade => (
                    <option key={grade.id} value={grade.id}>{grade.displayName}</option>
                  ))}
              </select>
            </div>

            <div className="filter-group">
              <label>과목</label>
              <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}>
                <option value="">전체</option>
                {subjects
                  .filter(subject => !filterGrade || subject.gradeId === parseInt(filterGrade))
                  .map(subject => (
                    <option key={subject.id} value={subject.id}>{subject.displayName}</option>
                  ))}
              </select>
            </div>

            <div className="filter-group">
              <label>대단원</label>
              <select value={filterUnit} onChange={(e) => setFilterUnit(e.target.value)}>
                <option value="">전체</option>
                {units
                  .filter(unit => !filterGrade || unit.gradeId === parseInt(filterGrade))
                  .map(unit => (
                    <option key={unit.id} value={unit.id}>{unit.displayName}</option>
                  ))}
              </select>
            </div>

            <div className="filter-group">
              <label>소단원</label>
              <select value={filterSubUnit} onChange={(e) => setFilterSubUnit(e.target.value)}>
                <option value="">전체</option>
                {subUnits
                  .filter(subUnit => !filterUnit || subUnit.unitId === parseInt(filterUnit))
                  .map(subUnit => (
                    <option key={subUnit.id} value={subUnit.id}>{subUnit.displayName}</option>
                  ))}
              </select>
            </div>

            <div className="filter-group">
              <label>핵심개념</label>
              <select value={filterConcept} onChange={(e) => setFilterConcept(e.target.value)}>
                <option value="">전체</option>
                {concepts
                  .filter(concept => !filterSubUnit || concept.subUnitId === parseInt(filterSubUnit))
                  .map(concept => (
                    <option key={concept.id} value={concept.id}>{concept.displayName}</option>
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
        )}

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
                {(currentQuestion.questionType === 'MULTIPLE_CHOICE' || currentQuestion.questionType === 'TRUE_FALSE') && currentQuestion.options ? (
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
