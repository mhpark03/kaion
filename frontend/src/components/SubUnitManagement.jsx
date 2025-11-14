import { useState, useEffect } from 'react';
import { subUnitService } from '../services/subUnitService';
import { unitService } from '../services/unitService';
import Navbar from './Navbar';
import './Management.css';

const SubUnitManagement = () => {
  const [subUnits, setSubUnits] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSubUnit, setEditingSubUnit] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    unitId: '',
    orderIndex: 0
  });
  const [error, setError] = useState('');
  const [filterUnit, setFilterUnit] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (filterUnit) {
      loadSubUnitsByUnit(filterUnit);
    } else {
      loadSubUnits();
    }
  }, [filterUnit]);

  const loadData = async () => {
    try {
      const [subUnitsRes, unitsRes] = await Promise.all([
        subUnitService.getAll(),
        unitService.getAll()
      ]);
      setSubUnits(subUnitsRes.data);
      setUnits(unitsRes.data);
    } catch (error) {
      setError('데이터를 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const loadSubUnits = async () => {
    try {
      const response = await subUnitService.getAll();
      setSubUnits(response.data);
    } catch (error) {
      setError('소단원 목록을 불러오는데 실패했습니다');
    }
  };

  const loadSubUnitsByUnit = async (unitId) => {
    try {
      const response = await subUnitService.getByUnit(unitId);
      setSubUnits(response.data);
    } catch (error) {
      setError('소단원 목록을 불러오는데 실패했습니다');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editingSubUnit) {
        await subUnitService.update(editingSubUnit.id, formData);
      } else {
        await subUnitService.create(formData);
      }
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      setError(error.response?.data || '저장에 실패했습니다');
    }
  };

  const handleEdit = (subUnit) => {
    setEditingSubUnit(subUnit);
    setFormData({
      name: subUnit.name,
      displayName: subUnit.displayName,
      description: subUnit.description,
      unitId: subUnit.unitId,
      orderIndex: subUnit.orderIndex
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    try {
      await subUnitService.delete(id);
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
    setEditingSubUnit(null);
    setFormData({
      name: '',
      displayName: '',
      description: '',
      unitId: '',
      orderIndex: 0
    });
  };

  if (loading) return <div className="loading">로딩 중...</div>;

  return (
    <div className="management-container">
      <Navbar />

      <div className="management-content">
        <div className="management-header">
          <h1>소단원 관리</h1>
          <button onClick={openCreateModal} className="btn-create">
            + 새 소단원
          </button>
        </div>

        <div className="filters">
          <select value={filterUnit} onChange={(e) => setFilterUnit(e.target.value)}>
            <option value="">전체 대단원</option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.name}
              </option>
            ))}
          </select>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="items-grid">
          {subUnits.map((subUnit) => (
            <div key={subUnit.id} className="item-card">
              <h3>{subUnit.displayName || subUnit.name}</h3>
              <p className="item-meta">코드: {subUnit.name}</p>
              <p className="item-meta">대단원: {subUnit.unitName}</p>
              <p className="item-meta">순서: {subUnit.orderIndex}</p>
              <p>{subUnit.description}</p>
              <div className="item-actions">
                <button onClick={() => handleEdit(subUnit)} className="btn-edit">
                  수정
                </button>
                <button onClick={() => handleDelete(subUnit.id)} className="btn-delete">
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
            <h2>{editingSubUnit ? '소단원 수정' : '새 소단원 추가'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>대단원</label>
                <select
                  value={formData.unitId}
                  onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                  required
                >
                  <option value="">선택하세요</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name}
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
                  placeholder="예: 뉴턴 법칙과 힘"
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

export default SubUnitManagement;
