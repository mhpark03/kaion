import { useState, useEffect } from 'react';
import { levelService } from '../services/levelService';
import { gradeService } from '../services/gradeService';
import { unitService } from '../services/unitService';
import { subUnitService } from '../services/subUnitService';
import { conceptService } from '../services/conceptService';
import Navbar from './Navbar';
import './ContentManagement.css';

const ContentManagement = () => {
  const [activeTab, setActiveTab] = useState('level');
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
  const [formData, setFormData] = useState({});

  // Filter states
  const [filterLevel, setFilterLevel] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterUnit, setFilterUnit] = useState('');
  const [filterSubUnit, setFilterSubUnit] = useState('');

  useEffect(() => {
    loadData();
  }, [activeTab, filterLevel, filterGrade, filterUnit, filterSubUnit]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      switch (activeTab) {
        case 'level':
          const levelsRes = await levelService.getAll();
          setLevels(levelsRes.data);
          break;
        case 'grade':
          const [gradesRes, levelsForGradeRes] = await Promise.all([
            filterLevel ? gradeService.getByLevel(filterLevel) : gradeService.getAll(),
            levelService.getAll()
          ]);
          setGrades(gradesRes.data);
          setLevels(levelsForGradeRes.data);
          break;
        case 'unit':
          const [unitsRes, levelsForUnitRes, gradesForUnitRes] = await Promise.all([
            filterGrade ? unitService.getByGrade(filterGrade) : unitService.getAll(),
            levelService.getAll(),
            gradeService.getAll()
          ]);
          setUnits(unitsRes.data);
          setLevels(levelsForUnitRes.data);
          setGrades(gradesForUnitRes.data);
          break;
        case 'subunit':
          const [subUnitsRes, levelsForSubUnitRes, gradesForSubUnitRes, unitsForSubUnitRes] = await Promise.all([
            filterUnit ? subUnitService.getByUnit(filterUnit) : subUnitService.getAll(),
            levelService.getAll(),
            gradeService.getAll(),
            unitService.getAll()
          ]);
          setSubUnits(subUnitsRes.data);
          setLevels(levelsForSubUnitRes.data);
          setGrades(gradesForSubUnitRes.data);
          setUnits(unitsForSubUnitRes.data);
          break;
        case 'concept':
          const [conceptsRes, levelsForConceptRes, gradesForConceptRes, unitsForConceptRes, subUnitsForConceptRes] = await Promise.all([
            filterSubUnit ? conceptService.getBySubUnit(filterSubUnit) : conceptService.getAll(),
            levelService.getAll(),
            gradeService.getAll(),
            unitService.getAll(),
            subUnitService.getAll()
          ]);
          setConcepts(conceptsRes.data);
          setLevels(levelsForConceptRes.data);
          setGrades(gradesForConceptRes.data);
          setUnits(unitsForConceptRes.data);
          setSubUnits(subUnitsForConceptRes.data);
          break;
      }
    } catch (error) {
      setError('데이터를 불러오는데 실패했습니다');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setFilterLevel('');
    setFilterGrade('');
    setFilterUnit('');
    setFilterSubUnit('');
    resetForm();
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({ ...item });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    try {
      switch (activeTab) {
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
      loadData();
    } catch (error) {
      setError(error.response?.data || '삭제에 실패했습니다');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editingItem) {
        switch (activeTab) {
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
        switch (activeTab) {
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
      resetForm();
      loadData();
    } catch (error) {
      setError(error.response?.data || '저장에 실패했습니다');
    }
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({});
  };

  const renderFilters = () => {
    return (
      <div className="content-filters">
        {activeTab === 'grade' && (
          <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)}>
            <option value="">전체 교육과정</option>
            {levels.map((level) => (
              <option key={level.id} value={level.id}>
                {level.displayName || level.name}
              </option>
            ))}
          </select>
        )}
        {activeTab === 'unit' && (
          <select value={filterGrade} onChange={(e) => setFilterGrade(e.target.value)}>
            <option value="">전체 학년</option>
            {grades.map((grade) => (
              <option key={grade.id} value={grade.id}>
                {grade.displayName || grade.name}
              </option>
            ))}
          </select>
        )}
        {activeTab === 'subunit' && (
          <select value={filterUnit} onChange={(e) => setFilterUnit(e.target.value)}>
            <option value="">전체 대단원</option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.displayName || unit.name}
              </option>
            ))}
          </select>
        )}
        {activeTab === 'concept' && (
          <select value={filterSubUnit} onChange={(e) => setFilterSubUnit(e.target.value)}>
            <option value="">전체 소단원</option>
            {subUnits.map((subUnit) => (
              <option key={subUnit.id} value={subUnit.id}>
                {subUnit.displayName || subUnit.name}
              </option>
            ))}
          </select>
        )}
      </div>
    );
  };

  const renderList = () => {
    let items = [];
    switch (activeTab) {
      case 'level':
        items = levels;
        break;
      case 'grade':
        items = grades;
        break;
      case 'unit':
        items = units;
        break;
      case 'subunit':
        items = subUnits;
        break;
      case 'concept':
        items = concepts;
        break;
    }

    if (items.length === 0) {
      return <div className="empty-message">등록된 항목이 없습니다</div>;
    }

    return (
      <div className="content-list">
        {items.map((item) => (
          <div key={item.id} className="content-item">
            <div className="item-info">
              <h3>{item.displayName || item.name}</h3>
              {item.description && <p className="item-description">{item.description}</p>}
              {activeTab === 'grade' && item.levelName && (
                <span className="badge">{item.levelName}</span>
              )}
              {activeTab === 'unit' && item.gradeName && (
                <span className="badge">{item.gradeName}</span>
              )}
              {activeTab === 'subunit' && item.unitName && (
                <span className="badge">{item.unitName}</span>
              )}
              {activeTab === 'concept' && item.subUnitName && (
                <span className="badge">{item.subUnitName}</span>
              )}
              <span className="order-badge">순서: {item.orderIndex}</span>
            </div>
            <div className="item-actions">
              <button onClick={() => handleEdit(item)} className="btn-edit">
                수정
              </button>
              <button onClick={() => handleDelete(item.id)} className="btn-delete">
                삭제
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderForm = () => {
    return (
      <form onSubmit={handleSubmit}>
        {activeTab === 'grade' && (
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
        {activeTab === 'unit' && (
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
        {activeTab === 'subunit' && (
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
        {activeTab === 'concept' && (
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

  const getTabTitle = () => {
    const titles = {
      level: '교육과정',
      grade: '학년',
      unit: '대단원',
      subunit: '소단원',
      concept: '핵심 개념'
    };
    return titles[activeTab];
  };

  return (
    <div className="management-container">
      <Navbar />

      <div className="content-management">
        <div className="content-tabs">
          <button
            className={`tab-button ${activeTab === 'level' ? 'active' : ''}`}
            onClick={() => handleTabChange('level')}
          >
            교육과정
          </button>
          <button
            className={`tab-button ${activeTab === 'grade' ? 'active' : ''}`}
            onClick={() => handleTabChange('grade')}
          >
            학년
          </button>
          <button
            className={`tab-button ${activeTab === 'unit' ? 'active' : ''}`}
            onClick={() => handleTabChange('unit')}
          >
            대단원
          </button>
          <button
            className={`tab-button ${activeTab === 'subunit' ? 'active' : ''}`}
            onClick={() => handleTabChange('subunit')}
          >
            소단원
          </button>
          <button
            className={`tab-button ${activeTab === 'concept' ? 'active' : ''}`}
            onClick={() => handleTabChange('concept')}
          >
            핵심 개념
          </button>
        </div>

        <div className="content-body">
          <div className="management-header">
            <h1>{getTabTitle()} 관리</h1>
            <button onClick={openCreateModal} className="btn-create">
              + 새 {getTabTitle()}
            </button>
          </div>

          {renderFilters()}

          {error && <div className="error-message">{error}</div>}

          {loading ? <div className="loading">로딩 중...</div> : renderList()}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingItem ? `${getTabTitle()} 수정` : `새 ${getTabTitle()} 추가`}</h2>
            {renderForm()}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentManagement;
