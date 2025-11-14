import { useState, useEffect } from 'react';
import { gradeService } from '../services/gradeService';
import { levelService } from '../services/levelService';
import Navbar from './Navbar';
import './Management.css';

const GradeManagement = () => {
  const [grades, setGrades] = useState([]);
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGrade, setEditingGrade] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    levelId: '',
    orderIndex: 0
  });
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [gradesRes, levelsRes] = await Promise.all([
        gradeService.getAll(),
        levelService.getAll()
      ]);
      setGrades(gradesRes.data);
      setLevels(levelsRes.data);
    } catch (error) {
      setError('데이터를 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editingGrade) {
        await gradeService.update(editingGrade.id, formData);
      } else {
        await gradeService.create(formData);
      }
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      setError(error.response?.data || '저장에 실패했습니다');
    }
  };

  const handleEdit = (grade) => {
    setEditingGrade(grade);
    setFormData({
      name: grade.name,
      displayName: grade.displayName,
      description: grade.description,
      levelId: grade.levelId,
      orderIndex: grade.orderIndex
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    try {
      await gradeService.delete(id);
      loadData();
    } catch (error) {
      setError(error.response?.data || '삭제에 실패했습니다');
    }
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingGrade(null);
    setFormData({
      name: '',
      displayName: '',
      description: '',
      levelId: '',
      orderIndex: 0
    });
  };

  if (loading) return <div className="loading">로딩 중...</div>;

  return (
    <div className="management-container">
      <Navbar />

      <div className="management-content">
        <div className="management-header">
          <h1>학년 관리</h1>
          <button onClick={openCreateModal} className="btn-create">
            + 새 학년
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="items-grid">
          {grades.map((grade) => (
            <div key={grade.id} className="item-card">
              <h3>{grade.displayName || grade.name}</h3>
              <p className="item-meta">코드: {grade.name}</p>
              <p className="item-meta">교육과정: {grade.levelName}</p>
              <p className="item-meta">순서: {grade.orderIndex}</p>
              <p>{grade.description}</p>
              <div className="item-actions">
                <button onClick={() => handleEdit(grade)} className="btn-edit">
                  수정
                </button>
                <button onClick={() => handleDelete(grade.id)} className="btn-delete">
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingGrade ? '학년 수정' : '새 학년 추가'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>교육과정</label>
                <select
                  value={formData.levelId}
                  onChange={(e) => setFormData({ ...formData, levelId: e.target.value })}
                  required
                >
                  <option value="">선택하세요</option>
                  {levels.map((level) => (
                    <option key={level.id} value={level.id}>
                      {level.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>코드 (예: H1, M2)</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>표시 이름 (예: 고등학교 1학년)</label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>순서</label>
                <input
                  type="number"
                  value={formData.orderIndex}
                  onChange={(e) => setFormData({ ...formData, orderIndex: parseInt(e.target.value) })}
                  required
                />
              </div>

              <div className="form-group">
                <label>설명</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn-cancel">
                  취소
                </button>
                <button type="submit" className="btn-submit">
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GradeManagement;
