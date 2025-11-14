import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { levelService } from '../services/levelService';
import './Management.css';

const LevelManagement = () => {
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLevel, setEditingLevel] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', difficultyRank: 1 });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadLevels();
  }, []);

  const loadLevels = async () => {
    try {
      const response = await levelService.getAll();
      setLevels(response.data);
    } catch (error) {
      setError('난이도 목록을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editingLevel) {
        await levelService.update(editingLevel.id, formData);
      } else {
        await levelService.create(formData);
      }
      setShowModal(false);
      setFormData({ name: '', description: '', difficultyRank: 1 });
      setEditingLevel(null);
      loadLevels();
    } catch (error) {
      setError(error.response?.data || '저장에 실패했습니다');
    }
  };

  const handleEdit = (level) => {
    setEditingLevel(level);
    setFormData({
      name: level.name,
      description: level.description,
      difficultyRank: level.difficultyRank
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    try {
      await levelService.delete(id);
      loadLevels();
    } catch (error) {
      setError(error.response?.data || '삭제에 실패했습니다');
    }
  };

  const openCreateModal = () => {
    setEditingLevel(null);
    setFormData({ name: '', description: '', difficultyRank: 1 });
    setShowModal(true);
  };

  if (loading) return <div className="loading">로딩 중...</div>;

  return (
    <div className="management-container">
      <div className="management-header">
        <button onClick={() => navigate('/dashboard')} className="btn-back">
          ← 대시보드로
        </button>
        <h1>난이도 관리</h1>
        <button onClick={openCreateModal} className="btn-create">
          + 새 난이도
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="items-grid">
        {levels.map((level) => (
          <div key={level.id} className="item-card">
            <h3>{level.name}</h3>
            <p className="difficulty-rank">난이도: {level.difficultyRank}</p>
            <p>{level.description}</p>
            <div className="item-actions">
              <button onClick={() => handleEdit(level)} className="btn-edit">
                수정
              </button>
              <button onClick={() => handleDelete(level.id)} className="btn-delete">
                삭제
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingLevel ? '난이도 수정' : '새 난이도 추가'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>난이도명</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>난이도 순위 (1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.difficultyRank}
                  onChange={(e) => setFormData({ ...formData, difficultyRank: parseInt(e.target.value) })}
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

export default LevelManagement;
