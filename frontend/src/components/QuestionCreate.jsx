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
    userPrompt: ''
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [documentFile, setDocumentFile] = useState(null);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [generateImage, setGenerateImage] = useState(false);

  // AI Preview State
  const [aiPreview, setAiPreview] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

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
    const conceptId = searchParams.get('conceptId');
    if (conceptId) {
      setFormData(prev => ({ ...prev, conceptId }));
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

  const handleGenerateQuestion = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.conceptId) {
      setError('핵심개념을 선택해주세요');
      return;
    }

    setAiGenerating(true);

    try {
      const aiRequestData = {
        conceptId: parseInt(formData.conceptId),
        difficulty: formData.difficulty,
        questionType: formData.questionType,
        userPrompt: formData.userPrompt || '',
        correctAnswer: formData.correctAnswer || '',
        generateImage: generateImage
      };

      const formDataToSend = new FormData();
      formDataToSend.append('request', new Blob([JSON.stringify(aiRequestData)], { type: 'application/json' }));

      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }

      if (documentFile) {
        formDataToSend.append('document', documentFile);
      }

      const response = await questionService.generateWithAI(formDataToSend);

      // Store AI result for preview
      setAiPreview({
        ...response.data,
        generatedImageFile: null
      });

      // If AI generated an image, download it
      if (response.data.generatedImageUrl) {
        try {
          const imageResponse = await fetch(response.data.generatedImageUrl);
          const imageBlob = await imageResponse.blob();
          const imageFile = new File([imageBlob], 'ai-generated-image.png', { type: 'image/png' });

          setAiPreview(prev => ({
            ...prev,
            generatedImageFile: imageFile,
            generatedImagePreview: URL.createObjectURL(imageBlob)
          }));
        } catch (imgError) {
          console.error('Failed to download AI-generated image', imgError);
        }
      }

      // Show preview modal
      setShowPreview(true);

    } catch (error) {
      setError(error.response?.data || 'AI 문제 생성에 실패했습니다');
      console.error('AI generation error:', error);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSaveQuestion = async () => {
    if (!aiPreview) return;

    setError('');
    setLoading(true);

    try {
      const concept = concepts.find(c => c.id === parseInt(formData.conceptId));
      const subUnit = subUnits.find(su => su.id === concept.subUnitId);
      const unit = units.find(u => u.id === subUnit.unitId);
      const grade = grades.find(g => g.id === unit.gradeId);

      const requestData = {
        conceptIds: [parseInt(formData.conceptId)],
        levelId: grade.levelId,
        subUnitId: subUnit.id,
        difficulty: formData.difficulty,
        evalDomain: '이해/개념',  // Default evaluation domain
        questionText: aiPreview.questionText,
        questionType: formData.questionType,
        correctAnswer: aiPreview.correctAnswer,
        points: 10
      };

      const formDataToSend = new FormData();
      formDataToSend.append('request', new Blob([JSON.stringify(requestData)], { type: 'application/json' }));

      // Include original reference files if provided
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      } else if (aiPreview.generatedImageFile) {
        // Use AI-generated image if no reference image
        formDataToSend.append('image', aiPreview.generatedImageFile);
      }

      if (documentFile) {
        formDataToSend.append('document', documentFile);
      }

      await questionService.createWithImage(formDataToSend);
      navigate('/questions');
    } catch (error) {
      setError(error.response?.data || '문제 저장에 실패했습니다');
      setLoading(false);
    }
  };

  const handleClosePreview = () => {
    setShowPreview(false);
  };

  const handleEditAndSave = () => {
    // Fill form with AI data and close preview
    setFormData(prev => ({
      ...prev,
      questionText: aiPreview.questionText,
      correctAnswer: aiPreview.correctAnswer
    }));

    if (aiPreview.generatedImageFile && !imageFile) {
      setImageFile(aiPreview.generatedImageFile);
      setImagePreview(aiPreview.generatedImagePreview);
    }

    setShowPreview(false);
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleDocumentChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setDocumentFile(file);
    }
  };

  const removeDocument = () => {
    setDocumentFile(null);
  };

  if (loading) return <div className="loading">로딩 중...</div>;

  return (
    <div className="question-create-container">
      <Navbar />

      <div className="question-create-content">
        <div className="page-header">
          <h1>AI 문제 생성</h1>
          <button onClick={() => navigate(-1)} className="btn-back">
            목록으로
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleGenerateQuestion} className="question-form">
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
                      {level.displayName}
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
                      {grade.displayName}
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
                      {unit.displayName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>중단원</label>
                <select
                  value={selectedSubUnit}
                  onChange={(e) => handleSubUnitChange(e.target.value)}
                  required
                  disabled={!selectedUnit}
                >
                  <option value="">선택하세요</option>
                  {filteredSubUnits.map(subUnit => (
                    <option key={subUnit.id} value={subUnit.id}>
                      {subUnit.displayName}
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
                      {concept.displayName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Question Configuration Section */}
          <div className="form-section">
            <h2>문제 설정</h2>

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
            </div>

            <div className="ai-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={generateImage}
                  onChange={(e) => setGenerateImage(e.target.checked)}
                  disabled={aiGenerating}
                />
                <span>문제 관련 이미지도 함께 생성 (DALL-E 3)</span>
              </label>
            </div>
          </div>

          {/* Optional Reference Materials */}
          <div className="form-section">
            <h2>참조 자료 (선택사항)</h2>

            <div className="form-group">
              <label>사용자 프롬프트</label>
              <textarea
                value={formData.userPrompt}
                onChange={(e) => setFormData({ ...formData, userPrompt: e.target.value })}
                rows="4"
                placeholder="AI에게 추가 요청사항을 입력하세요 (예: 실생활 예시 포함, 그래프 설명 포함 등)"
              />
            </div>

            <div className="form-group">
              <label>정답 힌트</label>
              <input
                type="text"
                value={formData.correctAnswer}
                onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
                placeholder="정답 가이드를 입력하세요"
              />
            </div>

            <div className="form-group">
              <label>참조 이미지</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="file-input"
              />
              {imagePreview && (
                <div className="image-preview">
                  <img src={imagePreview} alt="Preview" />
                  <button type="button" onClick={removeImage} className="btn-remove-image">
                    이미지 제거
                  </button>
                </div>
              )}
            </div>

            <div className="form-group">
              <label>참조 문서</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.hwp,.txt"
                onChange={handleDocumentChange}
                className="file-input"
              />
              {documentFile && (
                <div className="document-info">
                  <span className="file-name">{documentFile.name}</span>
                  <button type="button" onClick={removeDocument} className="btn-remove-document">
                    문서 제거
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => navigate(-1)} className="btn-cancel">
              취소
            </button>
            <button type="submit" disabled={!formData.conceptId || aiGenerating} className="btn-generate">
              {aiGenerating ? '🤖 AI 생성 중...' : '🤖 AI 문제 생성'}
            </button>
          </div>
        </form>
      </div>

      {/* AI Preview Modal */}
      {showPreview && aiPreview && (
        <div className="modal-overlay" onClick={handleClosePreview}>
          <div className="modal-content preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>AI 생성 결과 미리보기</h2>
              <button className="btn-close" onClick={handleClosePreview}>×</button>
            </div>

            <div className="modal-body">
              <div className="preview-section">
                <h3>문제</h3>
                <div className="preview-content">
                  {aiPreview.questionText}
                </div>
              </div>

              <div className="preview-section">
                <h3>정답</h3>
                <div className="preview-content answer">
                  {aiPreview.correctAnswer}
                </div>
              </div>

              {aiPreview.explanation && (
                <div className="preview-section">
                  <h3>해설</h3>
                  <div className="preview-content explanation">
                    {aiPreview.explanation}
                  </div>
                </div>
              )}

              {aiPreview.generatedImagePreview && (
                <div className="preview-section">
                  <h3>AI 생성 이미지</h3>
                  <div className="preview-image">
                    <img src={aiPreview.generatedImagePreview} alt="AI Generated" />
                  </div>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={handleEditAndSave}>
                수정 후 저장
              </button>
              <button className="btn-primary" onClick={handleSaveQuestion} disabled={loading}>
                {loading ? '저장 중...' : '바로 저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionCreate;
