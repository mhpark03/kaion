import { useState, useEffect, useMemo } from 'react';
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
  const [filterConcept, setFilterConcept] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    levelId: '',
    questionText: '',
    questionType: 'MULTIPLE_CHOICE',
    correctAnswer: '',
    difficulty: 'MEDIUM',
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
    setCurrentPage(1); // Reset to first page when filter changes
  }, [filterLevel, filterConcept, filterType, filterDifficulty]);

  // Apply filters using useMemo
  const filteredQuestions = useMemo(() => {
    return questions.filter(question => {
      if (filterLevel && question.levelId !== parseInt(filterLevel)) return false;
      if (filterConcept && !(question.concepts && question.concepts.some(c =>
        (c.displayName || c.name).toLowerCase().includes(filterConcept.toLowerCase())
      ))) return false;
      if (filterType && question.questionType !== filterType) return false;
      if (filterDifficulty && question.difficulty !== filterDifficulty) return false;
      return true;
    });
  }, [questions, filterLevel, filterConcept, filterType, filterDifficulty]);

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
      const response = await questionService.getAll();
      setQuestions(response.data);
    } catch (error) {
      setError('문제 목록을 불러오는데 실패했습니다');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Convert conceptId to conceptIds array for backend
      const conceptIds = formData.conceptId && !isNaN(parseInt(formData.conceptId))
        ? [parseInt(formData.conceptId)]
        : [];

      const requestData = {
        levelId: formData.levelId,
        subUnitId: editingQuestion?.subUnitId,
        difficulty: formData.difficulty,
        evalDomain: editingQuestion?.evalDomain || '이해/개념',
        questionText: formData.questionText,
        questionType: formData.questionType,
        correctAnswer: formData.correctAnswer,
        points: editingQuestion?.points || 10,
        options: formData.options,
        conceptIds: conceptIds
      };

      if (editingQuestion) {
        // Use FormData for multipart/form-data upload
        const formDataToSend = new FormData();
        formDataToSend.append('request', new Blob([JSON.stringify(requestData)], { type: 'application/json' }));

        // Include image if exists
        if (imageFile) {
          formDataToSend.append('image', imageFile);
        }

        await questionService.updateWithImage(editingQuestion.id, formDataToSend);
      } else {
        await questionService.create(requestData);
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

    // Extract conceptId from concepts array (use first concept if multiple)
    const conceptId = question.concepts && question.concepts.length > 0
      ? question.concepts[0].id.toString()
      : '';

    setFormData({
      levelId: question.levelId,
      questionText: question.questionText,
      questionType: question.questionType,
      correctAnswer: question.correctAnswer,
      difficulty: question.difficulty || 'MEDIUM',
      options: question.options || [],
      conceptId: conceptId,
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
      difficulty: 'MEDIUM',
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
      TRUE_FALSE: 'O/X'
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
            <option value="">전체 학년</option>
            {levels.map((l) => (
              <option key={l.id} value={l.id}>{l.displayName || l.name}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="핵심개념 검색..."
            value={filterConcept}
            onChange={(e) => setFilterConcept(e.target.value)}
            className="filter-input"
          />

          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="">전체 유형</option>
            <option value="MULTIPLE_CHOICE">객관식</option>
            <option value="TRUE_FALSE">O/X</option>
          </select>

          <select value={filterDifficulty} onChange={(e) => setFilterDifficulty(e.target.value)}>
            <option value="">전체 난이도</option>
            <option value="VERY_EASY">매우 쉬움</option>
            <option value="EASY">쉬움</option>
            <option value="MEDIUM">보통</option>
            <option value="HARD">어려움</option>
            <option value="VERY_HARD">매우 어려움</option>
          </select>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="questions-table-container">
          <table className="questions-table">
            <thead>
              <tr>
                <th>학년</th>
                <th>핵심개념</th>
                <th>유형</th>
                <th>난이도</th>
                <th>문제</th>
                <th>시도</th>
                <th>정답률</th>
                <th>동작</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const indexOfLastItem = currentPage * itemsPerPage;
                const indexOfFirstItem = indexOfLastItem - itemsPerPage;
                const currentItems = filteredQuestions.slice(indexOfFirstItem, indexOfLastItem);

                const getDifficultyLabel = (difficulty) => {
                  const difficultyMap = {
                    'VERY_EASY': '매우 쉬움',
                    'EASY': '쉬움',
                    'MEDIUM': '보통',
                    'HARD': '어려움',
                    'VERY_HARD': '매우 어려움'
                  };
                  return difficultyMap[difficulty] || '보통';
                };

                return currentItems.map((question) => (
                  <tr key={question.id}>
                    <td className="level-cell">
                      <span className="badge level-badge">{question.levelName}</span>
                    </td>
                    <td className="concept-cell">
                      <div className="concept-info">
                        {question.concepts && question.concepts.length > 0 ? (
                          question.concepts.map((concept, idx) => (
                            <span key={concept.id} className="concept-tag">
                              {concept.displayName || concept.name}
                              {idx < question.concepts.length - 1 && ', '}
                            </span>
                          ))
                        ) : (
                          <span className="no-concept">-</span>
                        )}
                      </div>
                    </td>
                    <td className="type-cell">
                      <span className="badge type-badge">{getQuestionTypeLabel(question.questionType)}</span>
                    </td>
                    <td className="difficulty-cell">
                      <span className="difficulty-badge">{getDifficultyLabel(question.difficulty)}</span>
                    </td>
                    <td className="question-cell">
                      <div className="question-preview" title={question.questionText}>
                        {question.questionText}
                      </div>
                    </td>
                    <td className="attempt-cell">
                      <span className="attempt-count">{question.attemptCount || 0}명</span>
                    </td>
                    <td className="rate-cell">
                      <span className="correct-rate">
                        {question.correctRate != null ? question.correctRate.toFixed(1) : '0.0'}%
                      </span>
                    </td>
                    <td className="actions-cell">
                      <button onClick={() => handleEdit(question)} className="btn-table-edit">
                        수정
                      </button>
                      <button onClick={() => handleDelete(question.id)} className="btn-table-delete">
                        삭제
                      </button>
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>

          {/* Pagination */}
          {filteredQuestions.length > itemsPerPage && (
            <div className="pagination">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                이전
              </button>

              {Array.from({ length: Math.ceil(filteredQuestions.length / itemsPerPage) }, (_, i) => i + 1).map(pageNum => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredQuestions.length / itemsPerPage)))}
                disabled={currentPage === Math.ceil(filteredQuestions.length / itemsPerPage)}
                className="pagination-btn"
              >
                다음
              </button>
            </div>
          )}
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

                {/* 통계 섹션 - 수정 모달에서만 전체 통계 표시 */}
                {editingQuestion && (
                  <div className="preview-section">
                    <h3>📊 통계</h3>
                    <div className="modal-stats">
                      <div className="modal-stat-item">
                        <span className="modal-stat-label">시도한 학생 수</span>
                        <span className="modal-stat-value">{editingQuestion.attemptCount || 0}명</span>
                      </div>
                      <div className="modal-stat-item">
                        <span className="modal-stat-label">정답자 수</span>
                        <span className="modal-stat-value">{editingQuestion.correctCount || 0}명</span>
                      </div>
                      <div className="modal-stat-item">
                        <span className="modal-stat-label">정답률</span>
                        <span className="modal-stat-value modal-stat-rate">
                          {editingQuestion.correctRate != null ? editingQuestion.correctRate.toFixed(1) : '0.0'}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 설정 섹션 */}
                <div className="preview-section">
                  <h3>⚙️ 설정</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>난이도</label>
                      <select
                        value={formData.difficulty || 'MEDIUM'}
                        onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                        required
                      >
                        <option value="VERY_EASY">매우 쉬움</option>
                        <option value="EASY">쉬움</option>
                        <option value="MEDIUM">보통</option>
                        <option value="HARD">어려움</option>
                        <option value="VERY_HARD">매우 어려움</option>
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
                      </select>
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
