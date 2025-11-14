import { useState, useEffect } from 'react';
import { subjectService } from '../services/subjectService';
import Navbar from './Navbar';
import './Management.css';

const SubjectManagement = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      const response = await subjectService.getAll();
      setSubjects(response.data);
    } catch (error) {
      setError('과목 목록을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editingSubject) {
        await subjectService.update(editingSubject.id, formData);
      } else {
        await subjectService.create(formData);
      }
      setShowModal(false);
      setFormData({ name: '', description: '' });
      setEditingSubject(null);
      loadSubjects();
    } catch (error) {
      setError(error.response?.data || '저장에 실패했습니다');
    }
  };

  const handleEdit = (subject) => {
    setEditingSubject(subject);
    setFormData({ name: subject.name, description: subject.description });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    try {
      await subjectService.delete(id);
      loadSubjects();
    } catch (error) {
      setError(error.response?.data || '삭제에 실패했습니다');
    }
  };

  const openCreateModal = () => {
    setEditingSubject(null);
    setFormData({ name: '', description: '' });
    setShowModal(true);
  };

  if (loading) return <div className="loading">로딩 중...</div>;

  return (
    <div className="management-container">
      <Navbar />

      <div className="management-content">
        <div className="management-header">
          <h1>과목 관리</h1>
          <button onClick={openCreateModal} className="btn-create">
            + 새 과목
          </button>
        </div>

      {error && <div className="error-message">{error}</div>}

      <div className="items-grid">
        {subjects.map((subject) => (
          <div key={subject.id} className="item-card">
            <h3>{subject.name}</h3>
            <p>{subject.description}</p>
            <div className="item-actions">
              <button onClick={() => handleEdit(subject)} className="btn-edit">
                수정
              </button>
              <button onClick={() => handleDelete(subject.id)} className="btn-delete">
                삭제
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingSubject ? '과목 수정' : '새 과목 추가'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>과목명</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
    </div>
  );
};

export default SubjectManagement;
