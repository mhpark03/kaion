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
    correctAnswer: ''
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [documentFile, setDocumentFile] = useState(null);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [generateImage, setGenerateImage] = useState(false);

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
      // Find the concept to get level and subunit info
      const concept = concepts.find(c => c.id === parseInt(formData.conceptId));
      const subUnit = subUnits.find(su => su.id === concept.subUnitId);
      const unit = units.find(u => u.id === subUnit.unitId);
      const grade = grades.find(g => g.id === unit.gradeId);

      const requestData = {
        ...formData,
        conceptIds: [parseInt(formData.conceptId)],
        levelId: grade.levelId,
        subUnitId: subUnit.id,
        points: 10 // Default points
      };

      const formDataToSend = new FormData();
      formDataToSend.append('request', new Blob([JSON.stringify(requestData)], { type: 'application/json' }));

      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }

      if (documentFile) {
        formDataToSend.append('document', documentFile);
      }

      await questionService.createWithImage(formDataToSend);
      navigate('/questions');
    } catch (error) {
      setError(error.response?.data || '문제 생성에 실패했습니다');
    }
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
      // Create preview
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

  const handleAIGenerate = async () => {
    if (!formData.conceptId) {
      setError('핵심개념을 먼저 선택해주세요');
      return;
    }

    setAiGenerating(true);
    setError('');

    try {
      const aiRequestData = {
        conceptId: parseInt(formData.conceptId),
        difficulty: formData.difficulty,
        questionType: formData.questionType,
        userPrompt: formData.questionText || '',
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

      // Fill the form with AI-generated content
      setFormData(prev => ({
        ...prev,
        questionText: response.data.questionText || prev.questionText,
        correctAnswer: response.data.correctAnswer || prev.correctAnswer
      }));

      // If AI generated an image, download and set it
      if (response.data.generatedImageUrl) {
        try {
          const imageResponse = await fetch(response.data.generatedImageUrl);
          const imageBlob = await imageResponse.blob();
          const imageFile = new File([imageBlob], 'ai-generated-image.png', { type: 'image/png' });
          setImageFile(imageFile);

          // Create preview
          const reader = new FileReader();
          reader.onloadend = () => {
            setImagePreview(reader.result);
          };
          reader.readAsDataURL(imageFile);
        } catch (imgError) {
          console.error('Failed to download AI-generated image', imgError);
        }
      }

      // Show explanation if available (you might want to display this in a modal or alert)
      if (response.data.explanation) {
        alert('AI 해설:\n\n' + response.data.explanation);
      }

    } catch (error) {
      setError(error.response?.data || 'AI 문제 생성에 실패했습니다');
      console.error('AI generation error:', error);
    } finally {
      setAiGenerating(false);
    }
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
            <div className="section-header">
              <h2>문제 정보</h2>
              <button
                type="button"
                onClick={handleAIGenerate}
                disabled={!formData.conceptId || aiGenerating}
                className="btn-ai-generate"
              >
                {aiGenerating ? '🤖 AI 생성 중...' : '🤖 AI로 문제 생성'}
              </button>
            </div>

            <div className="ai-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={generateImage}
                  onChange={(e) => setGenerateImage(e.target.checked)}
                  disabled={aiGenerating}
                />
                <span>문제 관련 이미지도 함께 생성</span>
              </label>
            </div>

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

            <div className="form-group">
              <label>참조 이미지 (선택)</label>
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
              <label>참조 문서 (선택)</label>
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

            <div className="form-group">
              <label>프롬프트 (선택)</label>
              <textarea
                value={formData.questionText}
                onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
                rows="5"
                placeholder="프롬프트를 입력하세요"
              />
            </div>

            <div className="form-group">
              <label>정답 (선택)</label>
              <input
                type="text"
                value={formData.correctAnswer}
                onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
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
