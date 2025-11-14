import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { questionService } from '../services/questionService';
import { conceptService } from '../services/conceptService';
import { levelService } from '../services/levelService';
import { gradeService } from '../services/gradeService';
import { unitService } from '../services/unitService';
import { subUnitService } from '../services/subUnitService';
import Navbar from './Navbar';
import './QuestionCreate.css';

const QuestionCreate = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Hierarchy data
  const [levels, setLevels] = useState([]);
  const [grades, setGrades] = useState([]);
  const [units, setUnits] = useState([]);
  const [subUnits, setSubUnits] = useState([]);
  const [concepts, setConcepts] = useState([]);

  // Filter states for cascading selects
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [selectedSubUnit, setSelectedSubUnit] = useState('');

  const [formData, setFormData] = useState({
    conceptId: '',
    difficulty: 'MEDIUM',
    questionText: '',
    questionType: 'MULTIPLE_CHOICE',
    correctAnswer: '',
    points: 10,
    options: []
  });

  const difficultyLevels = [
    { value: 'VERY_EASY', label: '매우 쉬움' },
    { value: 'EASY', label: '쉬움' },
    { value: 'MEDIUM', label: '보통' },
    { value: 'HARD', label: '어려움' },
    { value: 'VERY_HARD', label: '매우 어려움' }
  ];

  useEffect(() => {
    loadHierarchyData();
  }, []);

  useEffect(() => {
    // Check if conceptId is passed from ContentManagement
    const conceptId = searchParams.get('conceptId');
    if (conceptId) {
      setFormData(prev => ({ ...prev, conceptId }));
      // Find and set the hierarchy for this concept
      findConceptHierarchy(conceptId);
    }
  }, [searchParams, concepts, subUnits, units, grades, levels]);

  const loadHierarchyData = async () => {
    setLoading(true);
    try {
      const [levelsRes, gradesRes, unitsRes, subUnitsRes, conceptsRes] = await Promise.all([
        levelService.getAll(),
        gradeService.getAll(),
        unitService.getAll(),
        subUnitService.getAll(),
        conceptService.getAll()
      ]);
      setLevels(levelsRes.data);
      setGrades(gradesRes.data);
      setUnits(unitsRes.data);
      setSubUnits(subUnitsRes.data);
      setConcepts(conceptsRes.data);
    } catch (error) {
      setError('데이터를 불러오는데 실패했습니다');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const findConceptHierarchy = (conceptId) => {
    const concept = concepts.find(c => c.id === parseInt(conceptId));
    if (!concept) return;

    const subUnit = subUnits.find(su => su.id === concept.subUnitId);
    if (!subUnit) return;

    const unit = units.find(u => u.id === subUnit.unitId);
    if (!unit) return;

    const grade = grades.find(g => g.id === unit.gradeId);
    if (!grade) return;

    setSelectedLevel(grade.levelId.toString());
    setSelectedGrade(grade.id.toString());
    setSelectedUnit(unit.id.toString());
    setSelectedSubUnit(subUnit.id.toString());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.conceptId) {
      setError('핵심개념을 선택해주세요');
      return;
    }

    try {
      await questionService.create(formData);
      navigate('/questions');
    } catch (error) {
      setError(error.response?.data || '문제 생성에 실패했습니다');
    }
  };

  const addOption = () => {
    setFormData({
      ...formData,
      options: [...formData.options, { optionText: '', optionOrder: formData.options.length + 1 }]
    });
  };

  const removeOption = (index) => {
    const newOptions = formData.options.filter((_, i) => i !== index);
    setFormData({ ...formData, options: newOptions });
  };

  const updateOption = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index].optionText = value;
    setFormData({ ...formData, options: newOptions });
  };

  // Filter data based on selections
  const filteredGrades = selectedLevel
    ? grades.filter(g => g.levelId === parseInt(selectedLevel))
    : [];

  const filteredUnits = selectedGrade
    ? units.filter(u => u.gradeId === parseInt(selectedGrade))
    : [];

  const filteredSubUnits = selectedUnit
    ? subUnits.filter(su => su.unitId === parseInt(selectedUnit))
    : [];

  const filteredConcepts = selectedSubUnit
    ? concepts.filter(c => c.subUnitId === parseInt(selectedSubUnit))
    : [];

  const handleLevelChange = (levelId) => {
    setSelectedLevel(levelId);
    setSelectedGrade('');
    setSelectedUnit('');
    setSelectedSubUnit('');
    setFormData(prev => ({ ...prev, conceptId: '' }));
  };

  const handleGradeChange = (gradeId) => {
    setSelectedGrade(gradeId);
    setSelectedUnit('');
    setSelectedSubUnit('');
    setFormData(prev => ({ ...prev, conceptId: '' }));
  };

  const handleUnitChange = (unitId) => {
    setSelectedUnit(unitId);
    setSelectedSubUnit('');
    setFormData(prev => ({ ...prev, conceptId: '' }));
  };

  const handleSubUnitChange = (subUnitId) => {
    setSelectedSubUnit(subUnitId);
    setFormData(prev => ({ ...prev, conceptId: '' }));
  };

  if (loading) return <div className="loading">로딩 중...</div>;

  return (
    <div className="question-create-container">
      <Navbar />

      <div className="question-create-content">
        <div className="page-header">
          <h1>문제 생성</h1>
          <button onClick={() => navigate(-1)} className="btn-back">
            목록으로
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="question-form">
          {/* Concept Selection Section */}
          <div className="form-section">
            <h2>핵심개념 선택</h2>
            <div className="concept-selectors">
              <div className="form-group">
                <label>교육과정</label>
                <select
                  value={selectedLevel}
                  onChange={(e) => handleLevelChange(e.target.value)}
                  required
                >
                  <option value="">선택하세요</option>
                  {levels.map(level => (
                    <option key={level.id} value={level.id}>
                      {level.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>학년</label>
                <select
                  value={selectedGrade}
                  onChange={(e) => handleGradeChange(e.target.value)}
                  required
                  disabled={!selectedLevel}
                >
                  <option value="">선택하세요</option>
                  {filteredGrades.map(grade => (
                    <option key={grade.id} value={grade.id}>
                      {grade.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>대단원</label>
                <select
                  value={selectedUnit}
                  onChange={(e) => handleUnitChange(e.target.value)}
                  required
                  disabled={!selectedGrade}
                >
                  <option value="">선택하세요</option>
                  {filteredUnits.map(unit => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>소단원</label>
                <select
                  value={selectedSubUnit}
                  onChange={(e) => handleSubUnitChange(e.target.value)}
                  required
                  disabled={!selectedUnit}
                >
                  <option value="">선택하세요</option>
                  {filteredSubUnits.map(subUnit => (
                    <option key={subUnit.id} value={subUnit.id}>
                      {subUnit.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>핵심개념 *</label>
                <select
                  value={formData.conceptId}
                  onChange={(e) => setFormData({ ...formData, conceptId: e.target.value })}
                  required
                  disabled={!selectedSubUnit}
                >
                  <option value="">선택하세요</option>
                  {filteredConcepts.map(concept => (
                    <option key={concept.id} value={concept.id}>
                      {concept.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Question Details Section */}
          <div className="form-section">
            <h2>문제 정보</h2>
            <div className="form-row">
              <div className="form-group">
                <label>난이도 *</label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                  required
                >
                  {difficultyLevels.map(level => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>문제 유형 *</label>
                <select
                  value={formData.questionType}
                  onChange={(e) => setFormData({ ...formData, questionType: e.target.value })}
                  required
                >
                  <option value="MULTIPLE_CHOICE">객관식</option>
                  <option value="TRUE_FALSE">O/X</option>
                  <option value="SHORT_ANSWER">주관식</option>
                  <option value="ESSAY">서술형</option>
                </select>
              </div>

              <div className="form-group">
                <label>배점 *</label>
                <input
                  type="number"
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
                  required
                  min="1"
                />
              </div>
            </div>

            <div className="form-group">
              <label>문제 *</label>
              <textarea
                value={formData.questionText}
                onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
                rows="5"
                required
                placeholder="문제를 입력하세요"
              />
            </div>

            {(formData.questionType === 'MULTIPLE_CHOICE' || formData.questionType === 'TRUE_FALSE') && (
              <div className="form-group">
                <label>선택지</label>
                {formData.options.map((option, idx) => (
                  <div key={idx} className="option-input">
                    <input
                      type="text"
                      value={option.optionText}
                      onChange={(e) => updateOption(idx, e.target.value)}
                      placeholder={`선택지 ${idx + 1}`}
                      required
                    />
                    <button type="button" onClick={() => removeOption(idx)} className="btn-remove">
                      ×
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addOption} className="btn-add-option">
                  + 선택지 추가
                </button>
              </div>
            )}

            <div className="form-group">
              <label>정답 *</label>
              <input
                type="text"
                value={formData.correctAnswer}
                onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
                required
                placeholder="정답을 입력하세요"
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => navigate(-1)} className="btn-cancel">
              취소
            </button>
            <button type="submit" className="btn-submit">
              문제 생성
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuestionCreate;
