import { useState, useEffect } from 'react';
import { levelService } from '../services/levelService';
import { gradeService } from '../services/gradeService';
import { unitService } from '../services/unitService';
import { subUnitService } from '../services/subUnitService';
import { conceptService } from '../services/conceptService';
import Navbar from './Navbar';
import './ContentManagement.css';

const ContentManagement = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Data states
  const [levels, setLevels] = useState([]);
  const [grades, setGrades] = useState([]);
  const [units, setUnits] = useState([]);
  const [subUnits, setSubUnits] = useState([]);
  const [concepts, setConcepts] = useState([]);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [modalType, setModalType] = useState(''); // 'level', 'grade', 'unit', 'subunit', 'concept'
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    setError('');
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

  const openCreateModal = (type) => {
    setModalType(type);
    setEditingItem(null);
    setFormData({});
    setShowModal(true);
  };

  const handleEdit = (item, type) => {
    setModalType(type);
    setEditingItem(item);
    setFormData({ ...item });
    setShowModal(true);
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    try {
      switch (type) {
        case 'level':
          await levelService.delete(id);
          break;
        case 'grade':
          await gradeService.delete(id);
          break;
        case 'unit':
          await unitService.delete(id);
          break;
        case 'subunit':
          await subUnitService.delete(id);
          break;
        case 'concept':
          await conceptService.delete(id);
          break;
      }
      loadAllData();
    } catch (error) {
      setError(error.response?.data || '삭제에 실패했습니다');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editingItem) {
        switch (modalType) {
          case 'level':
            await levelService.update(editingItem.id, formData);
            break;
          case 'grade':
            await gradeService.update(editingItem.id, formData);
            break;
          case 'unit':
            await unitService.update(editingItem.id, formData);
            break;
          case 'subunit':
            await subUnitService.update(editingItem.id, formData);
            break;
          case 'concept':
            await conceptService.update(editingItem.id, formData);
            break;
        }
      } else {
        switch (modalType) {
          case 'level':
            await levelService.create(formData);
            break;
          case 'grade':
            await gradeService.create(formData);
            break;
          case 'unit':
            await unitService.create(formData);
            break;
          case 'subunit':
            await subUnitService.create(formData);
            break;
          case 'concept':
            await conceptService.create(formData);
            break;
        }
      }
      setShowModal(false);
      setFormData({});
      loadAllData();
    } catch (error) {
      setError(error.response?.data || '저장에 실패했습니다');
    }
  };

  const renderSection = (title, items, type) => {
    return (
      <div className="content-section">
        <div className="section-header">
          <h2>{title}</h2>
          <button onClick={() => openCreateModal(type)} className="btn-add-section">
            + {title} 추가
          </button>
        </div>
        {items.length === 0 ? (
          <div className="empty-section">등록된 {title}이(가) 없습니다</div>
        ) : (
          <div className="section-items">
            {items.map((item) => (
              <div key={item.id} className="section-item">
                <div className="item-info">
                  <h3>{item.displayName || item.name}</h3>
                  {item.description && <p className="item-description">{item.description}</p>}
                  <div className="item-meta">
                    {type === 'grade' && item.levelName && (
                      <span className="badge">{item.levelName}</span>
                    )}
                    {type === 'unit' && item.gradeName && (
                      <span className="badge">{item.gradeName}</span>
                    )}
                    {type === 'subunit' && item.unitName && (
                      <span className="badge">{item.unitName}</span>
                    )}
                    {type === 'concept' && item.subUnitName && (
                      <span className="badge">{item.subUnitName}</span>
                    )}
                    <span className="order-badge">순서: {item.orderIndex}</span>
                  </div>
                </div>
                <div className="item-actions">
                  <button onClick={() => handleEdit(item, type)} className="btn-edit">
                    수정
                  </button>
                  <button onClick={() => handleDelete(item.id, type)} className="btn-delete">
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderForm = () => {
    return (
      <form onSubmit={handleSubmit}>
        {modalType === 'grade' && (
          <div className="form-group">
            <label>교육과정</label>
            <select
              value={formData.levelId || ''}
              onChange={(e) => setFormData({ ...formData, levelId: e.target.value })}
              required
            >
              <option value="">선택하세요</option>
              {levels.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.displayName || level.name}
                </option>
              ))}
            </select>
          </div>
        )}
        {modalType === 'unit' && (
          <div className="form-group">
            <label>학년</label>
            <select
              value={formData.gradeId || ''}
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
        )}
        {modalType === 'subunit' && (
          <div className="form-group">
            <label>대단원</label>
            <select
              value={formData.unitId || ''}
              onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
              required
            >
              <option value="">선택하세요</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.displayName || unit.name}
                </option>
              ))}
            </select>
          </div>
        )}
        {modalType === 'concept' && (
          <div className="form-group">
            <label>소단원</label>
            <select
              value={formData.subUnitId || ''}
              onChange={(e) => setFormData({ ...formData, subUnitId: e.target.value })}
              required
            >
              <option value="">선택하세요</option>
              {subUnits.map((subUnit) => (
                <option key={subUnit.id} value={subUnit.id}>
                  {subUnit.displayName || subUnit.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="form-group">
          <label>이름</label>
          <input
            type="text"
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>표시 이름</label>
          <input
            type="text"
            value={formData.displayName || ''}
            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>설명</label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows="3"
          />
        </div>
        <div className="form-group">
          <label>순서</label>
          <input
            type="number"
            value={formData.orderIndex || 0}
            onChange={(e) => setFormData({ ...formData, orderIndex: parseInt(e.target.value) })}
            required
            min="0"
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
    );
  };

  const getModalTitle = () => {
    const titles = {
      level: '교육과정',
      grade: '학년',
      unit: '대단원',
      subunit: '소단원',
      concept: '핵심 개념'
    };
    return titles[modalType];
  };

  return (
    <div className="management-container">
      <Navbar />

      <div className="content-management">
        <div className="quick-add-buttons">
          <button onClick={() => openCreateModal('level')} className="quick-add-btn level">
            + 교육과정
          </button>
          <button onClick={() => openCreateModal('grade')} className="quick-add-btn grade">
            + 학년
          </button>
          <button onClick={() => openCreateModal('unit')} className="quick-add-btn unit">
            + 대단원
          </button>
          <button onClick={() => openCreateModal('subunit')} className="quick-add-btn subunit">
            + 소단원
          </button>
          <button onClick={() => openCreateModal('concept')} className="quick-add-btn concept">
            + 핵심 개념
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading">로딩 중...</div>
        ) : (
          <div className="content-sections">
            {renderSection('교육과정', levels, 'level')}
            {renderSection('학년', grades, 'grade')}
            {renderSection('대단원', units, 'unit')}
            {renderSection('소단원', subUnits, 'subunit')}
            {renderSection('핵심 개념', concepts, 'concept')}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingItem ? `${getModalTitle()} 수정` : `${getModalTitle()} 추가`}</h2>
            {renderForm()}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentManagement;
