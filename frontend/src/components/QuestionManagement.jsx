import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { questionService } from '../services/questionService';
import { levelService } from '../services/levelService';
import Navbar from './Navbar';
import './Management.css';

const QuestionManagement = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [questions, setQuestions] = useState([]);
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [error, setError] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const [formData, setFormData] = useState({
    levelId: '',
    questionText: '',
    questionType: 'MULTIPLE_CHOICE',
    correctAnswer: '',
    points: 10,
    options: [],
    conceptId: '',
    explanation: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Check if conceptId is in URL query params
    const conceptId = searchParams.get('conceptId');
    if (conceptId && !showModal) {
      // Auto-open create modal with conceptId
      setFormData(prev => ({ ...prev, conceptId }));
      setShowModal(true);
      // Remove conceptId from URL to prevent reopening
      setSearchParams({});
    }
  }, [searchParams, showModal, setSearchParams]);

  useEffect(() => {
    loadQuestions();
  }, [filterLevel]);

  const loadData = async () => {
    try {
      const levelsRes = await levelService.getAll();
      setLevels(levelsRes.data);
      await loadQuestions();
    } catch (error) {
      setError('데이터를 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const loadQuestions = async () => {
    try {
      const params = {};
      if (filterLevel) params.levelId = filterLevel;
      const response = await questionService.getAll(params);
      setQuestions(response.data);
    } catch (error) {
      setError('문제 목록을 불러오는데 실패했습니다');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editingQuestion) {
        await questionService.update(editingQuestion.id, formData);
      } else {
        await questionService.create(formData);
      }
      setShowModal(false);
      resetForm();
      loadQuestions();
    } catch (error) {
      setError(error.response?.data || '저장에 실패했습니다');
    }
  };

  const handleEdit = (question) => {
    setEditingQuestion(question);
    setFormData({
      levelId: question.levelId,
      questionText: question.questionText,
      questionType: question.questionType,
      correctAnswer: question.correctAnswer,
      points: question.points,
      options: question.options || [],
      explanation: question.explanation || ''
    });
    // Load existing image if available
    if (question.referenceImage) {
      setImagePreview(question.referenceImage);
    }
    setShowModal(true);
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
    setImagePreview('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    try {
      await questionService.delete(id);
      loadQuestions();
    } catch (error) {
      setError(error.response?.data || '삭제에 실패했습니다');
    }
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingQuestion(null);
    setImageFile(null);
    setImagePreview('');
    setFormData({
      levelId: '',
      questionText: '',
      questionType: 'MULTIPLE_CHOICE',
      correctAnswer: '',
      points: 10,
      options: [],
      conceptId: '',
      explanation: ''
    });
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

  const getQuestionTypeLabel = (type) => {
    const types = {
      MULTIPLE_CHOICE: '객관식',
      TRUE_FALSE: 'O/X',
      SHORT_ANSWER: '주관식',
      ESSAY: '서술형'
    };
    return types[type] || type;
  };

  if (loading) return <div className="loading">로딩 중...</div>;

  return (
    <div className="management-container">
      <Navbar />

      <div className="management-content">
        <div className="management-header">
          <h1>문제 관리</h1>
          <button onClick={() => navigate('/question-create')} className="btn-create">
            + 새 문제
          </button>
        </div>

        <div className="filters">
          <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)}>
            <option value="">전체 난이도</option>
            {levels.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="questions-list">
          {questions.map((question) => (
            <div key={question.id} className="question-card">
              <div className="question-header">
                <span className="badge">{question.levelName}</span>
                <span className="badge">{getQuestionTypeLabel(question.questionType)}</span>
                <span className="points">{question.points}점</span>
              </div>
              <p className="question-text">{question.questionText}</p>
              {question.options && question.options.length > 0 && (
                <ul className="options-list">
                  {question.options.map((opt, idx) => (
                    <li key={opt.id}>{idx + 1}. {opt.optionText}</li>
                  ))}
                </ul>
              )}
              <p className="correct-answer">정답: {question.correctAnswer}</p>
              <div className="item-actions">
                <button onClick={() => handleEdit(question)} className="btn-edit">
                  수정
                </button>
                <button onClick={() => handleDelete(question.id)} className="btn-delete">
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingQuestion ? '문제 수정' : '새 문제 추가'}</h2>
              <button className="btn-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                {/* 그림 섹션 */}
                <div className="preview-section">
                  <h3>📷 그림</h3>
                  {imagePreview ? (
                    <div className="preview-image">
                      <img src={imagePreview} alt="문제 이미지" />
                      <button type="button" onClick={removeImage} className="btn-remove-image">
                        이미지 제거
                      </button>
                    </div>
                  ) : (
                    <div className="image-upload">
                      <label className="upload-label">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="file-input"
                        />
                        <span>+ 이미지 업로드</span>
                      </label>
                    </div>
                  )}
                </div>

                {/* 문제 섹션 */}
                <div className="preview-section">
                  <h3>📝 문제</h3>
                  <div className="form-group">
                    <textarea
                      value={formData.questionText}
                      onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
                      rows="4"
                      required
                      placeholder="문제를 입력하세요"
                      className="edit-textarea"
                    />
                  </div>
                </div>

                {/* 보기 섹션 */}
                {(formData.questionType === 'MULTIPLE_CHOICE' || formData.questionType === 'TRUE_FALSE') && (
                  <div className="preview-section">
                    <h3>📋 보기</h3>
                    <div className="form-group">
                      {formData.options.map((option, idx) => (
                        <div key={idx} className="option-input">
                          <span className="option-number">{idx + 1}.</span>
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
                  </div>
                )}

                {/* 정답 섹션 */}
                <div className="preview-section">
                  <h3>✅ 정답</h3>
                  <div className="form-group">
                    <input
                      type="text"
                      value={formData.correctAnswer}
                      onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
                      required
                      placeholder="정답을 입력하세요"
                      className="edit-input answer"
                    />
                  </div>
                </div>

                {/* 해설 섹션 */}
                <div className="preview-section">
                  <h3>💡 해설</h3>
                  <div className="form-group">
                    <textarea
                      value={formData.explanation}
                      onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                      rows="3"
                      placeholder="해설을 입력하세요 (선택사항)"
                      className="edit-textarea"
                    />
                  </div>
                </div>

                {/* 설정 섹션 */}
                <div className="preview-section">
                  <h3>⚙️ 설정</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>난이도</label>
                      <select
                        value={formData.levelId}
                        onChange={(e) => setFormData({ ...formData, levelId: e.target.value })}
                        required
                      >
                        <option value="">선택하세요</option>
                        {levels.map((l) => (
                          <option key={l.id} value={l.id}>{l.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>문제 유형</label>
                      <select
                        value={formData.questionType}
                        onChange={(e) => setFormData({ ...formData, questionType: e.target.value })}
                      >
                        <option value="MULTIPLE_CHOICE">객관식</option>
                        <option value="TRUE_FALSE">O/X</option>
                        <option value="SHORT_ANSWER">주관식</option>
                        <option value="ESSAY">서술형</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>배점</label>
                      <input
                        type="number"
                        value={formData.points}
                        onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
                        required
                        min="1"
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                    취소
                  </button>
                  <button type="submit" className="btn-primary">
                    저장
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionManagement;
