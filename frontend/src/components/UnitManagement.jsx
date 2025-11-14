import { useState, useEffect } from 'react';
import { unitService } from '../services/unitService';
import { gradeService } from '../services/gradeService';
import Navbar from './Navbar';
import './Management.css';

const UnitManagement = () => {
  const [units, setUnits] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    gradeId: '',
    orderIndex: 0
  });
  const [error, setError] = useState('');
  const [filterGrade, setFilterGrade] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (filterGrade) {
      loadUnitsByGrade(filterGrade);
    } else {
      loadUnits();
    }
  }, [filterGrade]);

  const loadData = async () => {
    try {
      const [unitsRes, gradesRes] = await Promise.all([
        unitService.getAll(),
        gradeService.getAll()
      ]);
      setUnits(unitsRes.data);
      setGrades(gradesRes.data);
    } catch (error) {
      setError('데이터를 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const loadUnits = async () => {
    try {
      const response = await unitService.getAll();
      setUnits(response.data);
    } catch (error) {
      setError('대단원 목록을 불러오는데 실패했습니다');
    }
  };

  const loadUnitsByGrade = async (gradeId) => {
    try {
      const response = await unitService.getByGrade(gradeId);
      setUnits(response.data);
    } catch (error) {
      setError('대단원 목록을 불러오는데 실패했습니다');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editingUnit) {
        await unitService.update(editingUnit.id, formData);
      } else {
        await unitService.create(formData);
      }
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      setError(error.response?.data || '저장에 실패했습니다');
    }
  };

  const handleEdit = (unit) => {
    setEditingUnit(unit);
    setFormData({
      name: unit.name,
      displayName: unit.displayName,
      description: unit.description,
      gradeId: unit.gradeId,
      orderIndex: unit.orderIndex
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    try {
      await unitService.delete(id);
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
    setEditingUnit(null);
    setFormData({
      name: '',
      displayName: '',
      description: '',
      gradeId: '',
      orderIndex: 0
    });
  };

  if (loading) return <div className="loading">로딩 중...</div>;

  return (
    <div className="management-container">
      <Navbar />

      <div className="management-content">
        <div className="management-header">
          <h1>대단원 관리</h1>
          <button onClick={openCreateModal} className="btn-create">
            + 새 대단원
          </button>
        </div>

        <div className="filters">
          <select value={filterGrade} onChange={(e) => setFilterGrade(e.target.value)}>
            <option value="">전체 학년</option>
            {grades.map((grade) => (
              <option key={grade.id} value={grade.id}>
                {grade.displayName || grade.name}
              </option>
            ))}
          </select>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="items-grid">
          {units.map((unit) => (
            <div key={unit.id} className="item-card">
              <h3>{unit.displayName || unit.name}</h3>
              <p className="item-meta">코드: {unit.name}</p>
              <p className="item-meta">학년: {unit.gradeName}</p>
              <p className="item-meta">순서: {unit.orderIndex}</p>
              <p>{unit.description}</p>
              <div className="item-actions">
                <button onClick={() => handleEdit(unit)} className="btn-edit">
                  수정
                </button>
                <button onClick={() => handleDelete(unit.id)} className="btn-delete">
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
            <h2>{editingUnit ? '대단원 수정' : '새 대단원 추가'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>학년</label>
                <select
                  value={formData.gradeId}
                  onChange={(e) => setFormData({ ...formData, gradeId: e.target.value })}
                  required
                >
                  <option value="">선택하세요</option>
                  {grades.map((grade) => (
                    <option key={grade.id} value={grade.id}>
                      {grade.displayName || grade.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>이름</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="예: 역학적 시스템"
                />
              </div>

              <div className="form-group">
                <label>표시 이름</label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="선택사항"
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

export default UnitManagement;
