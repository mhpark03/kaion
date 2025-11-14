import { useState, useEffect } from 'react';
import { conceptService } from '../services/conceptService';
import Navbar from './Navbar';
import './Management.css';

const ConceptManagement = () => {
  const [concepts, setConcepts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingConcept, setEditingConcept] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    loadConcepts();
  }, []);

  const loadConcepts = async () => {
    try {
      const response = await conceptService.getAll();
      setConcepts(response.data);
    } catch (error) {
      setError('핵심 개념 목록을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editingConcept) {
        await conceptService.update(editingConcept.id, formData);
      } else {
        await conceptService.create(formData);
      }
      setShowModal(false);
      resetForm();
      loadConcepts();
    } catch (error) {
      setError(error.response?.data || '저장에 실패했습니다');
    }
  };

  const handleEdit = (concept) => {
    setEditingConcept(concept);
    setFormData({
      name: concept.name,
      displayName: concept.displayName,
      description: concept.description
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    try {
      await conceptService.delete(id);
      loadConcepts();
    } catch (error) {
      setError(error.response?.data || '삭제에 실패했습니다');
    }
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingConcept(null);
    setFormData({
      name: '',
      displayName: '',
      description: ''
    });
  };

  if (loading) return <div className="loading">로딩 중...</div>;

  return (
    <div className="management-container">
      <Navbar />

      <div className="management-content">
        <div className="management-header">
          <h1>핵심 개념 관리</h1>
          <button onClick={openCreateModal} className="btn-create">
            + 새 개념
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="items-grid">
          {concepts.map((concept) => (
            <div key={concept.id} className="item-card">
              <h3>{concept.displayName || concept.name}</h3>
              <p className="item-meta">코드: {concept.name}</p>
              <p>{concept.description}</p>
              <div className="item-actions">
                <button onClick={() => handleEdit(concept)} className="btn-edit">
                  수정
                </button>
                <button onClick={() => handleDelete(concept.id)} className="btn-delete">
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
            <h2>{editingConcept ? '개념 수정' : '새 개념 추가'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>코드</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="예: 작용-반작용"
                />
              </div>

              <div className="form-group">
                <label>표시 이름</label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="예: 작용-반작용 법칙"
                />
              </div>

              <div className="form-group">
                <label>설명</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                  placeholder="이 개념에 대한 설명을 입력하세요"
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

export default ConceptManagement;
