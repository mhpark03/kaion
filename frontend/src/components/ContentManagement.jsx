import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { levelService } from '../services/levelService';
import { gradeService } from '../services/gradeService';
import { unitService } from '../services/unitService';
import { subUnitService } from '../services/subUnitService';
import { conceptService } from '../services/conceptService';
import Navbar from './Navbar';
import './ContentManagement.css';

const ContentManagement = () => {
  const navigate = useNavigate();
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
  const [showListModal, setShowListModal] = useState(false);
  const [listModalType, setListModalType] = useState(''); // 'level', 'grade', 'unit', 'subunit', 'concept'
  const [selectedFilters, setSelectedFilters] = useState({
    levelId: '',
    gradeId: '',
    unitId: '',
    subUnitId: ''
  });
  const [newItemName, setNewItemName] = useState(''); // For inline add in list modal
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
    // Check if required parent items exist
    if (type === 'grade' && levels.length === 0) {
      setError('교육과정을 먼저 추가해주세요');
      return;
    }
    if (type === 'unit' && grades.length === 0) {
      setError('학년을 먼저 추가해주세요');
      return;
    }
    if (type === 'subunit' && units.length === 0) {
      setError('대단원을 먼저 추가해주세요');
      return;
    }
    if (type === 'concept' && subUnits.length === 0) {
      setError('소단원을 먼저 추가해주세요');
      return;
    }

    setError('');
    setListModalType(type);
    setSelectedFilters({
      levelId: '',
      gradeId: '',
      unitId: '',
      subUnitId: ''
    });
    setNewItemName('');
    setShowListModal(true);
  };

  const openFormModal = (type) => {
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

  const handleAddQuestion = (conceptId) => {
    navigate(`/questions?conceptId=${conceptId}`);
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

  const handleQuickAdd = async () => {
    if (!newItemName.trim()) {
      setError('이름을 입력해주세요');
      return;
    }

    // Validate parent selection for non-level types
    if (listModalType === 'grade' && !selectedFilters.levelId) {
      setError('교육과정을 선택해주세요');
      return;
    }
    if (listModalType === 'unit' && !selectedFilters.gradeId) {
      setError('학년을 선택해주세요');
      return;
    }
    if (listModalType === 'subunit' && !selectedFilters.unitId) {
      setError('대단원을 선택해주세요');
      return;
    }
    if (listModalType === 'concept' && !selectedFilters.subUnitId) {
      setError('소단원을 선택해주세요');
      return;
    }

    setError('');

    try {
      const data = { name: newItemName.trim() };

      switch (listModalType) {
        case 'level':
          await levelService.create(data);
          break;
        case 'grade':
          data.levelId = selectedFilters.levelId;
          await gradeService.create(data);
          break;
        case 'unit':
          data.gradeId = selectedFilters.gradeId;
          await unitService.create(data);
          break;
        case 'subunit':
          data.unitId = selectedFilters.unitId;
          await subUnitService.create(data);
          break;
        case 'concept':
          data.subUnitId = selectedFilters.subUnitId;
          await conceptService.create(data);
          break;
      }

      setNewItemName('');
      loadAllData();
    } catch (error) {
      setError(error.response?.data || '추가에 실패했습니다');
    }
  };

  // Get full hierarchy path for items
  const getLevelName = (levelId) => {
    const level = levels.find(l => l.id === levelId);
    return level ? (level.displayName || level.name) : '-';
  };

  const getGradeName = (gradeId) => {
    const grade = grades.find(g => g.id === gradeId);
    return grade ? (grade.displayName || grade.name) : '-';
  };

  const getUnitName = (unitId) => {
    const unit = units.find(u => u.id === unitId);
    return unit ? (unit.displayName || unit.name) : '-';
  };

  const getSubUnitName = (subUnitId) => {
    const subUnit = subUnits.find(su => su.id === subUnitId);
    return subUnit ? (subUnit.displayName || subUnit.name) : '-';
  };

  // Get filtered items based on selected filters
  const getFilteredItems = () => {
    switch (listModalType) {
      case 'level':
        return levels;
      case 'grade':
        if (!selectedFilters.levelId) return [];
        return grades.filter(g => g.levelId === parseInt(selectedFilters.levelId));
      case 'unit':
        if (!selectedFilters.gradeId) return [];
        return units.filter(u => u.gradeId === parseInt(selectedFilters.gradeId));
      case 'subunit':
        if (!selectedFilters.unitId) return [];
        return subUnits.filter(su => su.unitId === parseInt(selectedFilters.unitId));
      case 'concept':
        if (!selectedFilters.subUnitId) return [];
        return concepts.filter(c => c.subUnitId === parseInt(selectedFilters.subUnitId));
      default:
        return [];
    }
  };

  // Get enriched data with full hierarchy
  const getEnrichedGrades = () => {
    return grades.map(grade => ({
      ...grade,
      levelDisplayName: getLevelName(grade.levelId)
    }));
  };

  const getEnrichedUnits = () => {
    return units.map(unit => {
      const grade = grades.find(g => g.id === unit.gradeId);
      return {
        ...unit,
        gradeDisplayName: getGradeName(unit.gradeId),
        levelDisplayName: grade ? getLevelName(grade.levelId) : '-'
      };
    });
  };

  const getEnrichedSubUnits = () => {
    return subUnits.map(subUnit => {
      const unit = units.find(u => u.id === subUnit.unitId);
      const grade = unit ? grades.find(g => g.id === unit.gradeId) : null;
      return {
        ...subUnit,
        unitDisplayName: getUnitName(subUnit.unitId),
        gradeDisplayName: unit ? getGradeName(unit.gradeId) : '-',
        levelDisplayName: grade ? getLevelName(grade.levelId) : '-'
      };
    });
  };

  const getEnrichedConcepts = () => {
    return concepts.map(concept => {
      const subUnit = subUnits.find(su => su.id === concept.subUnitId);
      const unit = subUnit ? units.find(u => u.id === subUnit.unitId) : null;
      const grade = unit ? grades.find(g => g.id === unit.gradeId) : null;
      return {
        ...concept,
        subUnitDisplayName: getSubUnitName(concept.subUnitId),
        unitDisplayName: unit ? getUnitName(unit.id) : '-',
        gradeDisplayName: unit ? getGradeName(unit.gradeId) : '-',
        levelDisplayName: grade ? getLevelName(grade.levelId) : '-',
        questionCount: 0 // TODO: 실제 문제 개수를 가져오도록 구현
      };
    });
  };

  const renderTable = (title, items, type) => {
    return (
      <div className="content-section">
        {items.length === 0 ? (
          <div className="empty-section">등록된 {title}이(가) 없습니다</div>
        ) : (
          <div className="table-wrapper">
            <table className="content-table">
              <thead>
                <tr>
                  <th>교육과정</th>
                  {type !== 'level' && <th>학년</th>}
                  {(type === 'unit' || type === 'subunit' || type === 'concept') && <th>대단원</th>}
                  {(type === 'subunit' || type === 'concept') && <th>소단원</th>}
                  {type === 'concept' && <th>핵심개념</th>}
                  {type === 'concept' && <th className="count-header">문제수</th>}
                  <th className="action-header">동작</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.id}>
                    <td>{type === 'level' ? (item.displayName || item.name) : item.levelDisplayName}</td>
                    {type === 'grade' && <td className="name-cell">{item.displayName || item.name}</td>}
                    {type === 'unit' && (
                      <>
                        <td>{item.gradeDisplayName}</td>
                        <td className="name-cell">{item.displayName || item.name}</td>
                      </>
                    )}
                    {type === 'subunit' && (
                      <>
                        <td>{item.gradeDisplayName}</td>
                        <td>{item.unitDisplayName}</td>
                        <td className="name-cell">{item.displayName || item.name}</td>
                      </>
                    )}
                    {type === 'concept' && (
                      <>
                        <td>{item.gradeDisplayName}</td>
                        <td>{item.unitDisplayName}</td>
                        <td>{item.subUnitDisplayName}</td>
                        <td className="name-cell">{item.displayName || item.name}</td>
                        <td className="count-cell">{item.questionCount}</td>
                      </>
                    )}
                    <td className="action-cell">
                      {type === 'concept' && (
                        <button
                          onClick={() => handleAddQuestion(item.id)}
                          className="btn-add-question"
                          title="문제 추가"
                        >
                          문제 추가
                        </button>
                      )}
                      <button onClick={() => handleEdit(item, type)} className="btn-edit-small">
                        수정
                      </button>
                      <button onClick={() => handleDelete(item.id, type)} className="btn-delete-small">
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

  const getModalTitle = (type) => {
    const typeToUse = type || modalType;
    const titles = {
      level: '교육과정',
      grade: '학년',
      unit: '대단원',
      subunit: '소단원',
      concept: '핵심 개념'
    };
    return titles[typeToUse];
  };

  return (
    <div className="management-container">
      <Navbar />

      <div className="content-management">
        <div className="page-header">
          <h1>과정관리</h1>
          <div className="icon-buttons">
            <button onClick={() => openCreateModal('level')} className="icon-btn level" title="교육과정">
              과
            </button>
            <button onClick={() => openCreateModal('grade')} className="icon-btn grade" title="학년">
              학
            </button>
            <button onClick={() => openCreateModal('unit')} className="icon-btn unit" title="대단원">
              대
            </button>
            <button onClick={() => openCreateModal('subunit')} className="icon-btn subunit" title="소단원">
              소
            </button>
            <button onClick={() => openCreateModal('concept')} className="icon-btn concept" title="핵심 개념">
              핵
            </button>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading">로딩 중...</div>
        ) : (
          <div className="content-sections">
            {renderTable('핵심 개념', getEnrichedConcepts(), 'concept')}
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

      {showListModal && (
        <div className="modal-overlay" onClick={() => setShowListModal(false)}>
          <div className="modal-content modal-content-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{getModalTitle(listModalType)} 관리</h2>
              <div className="modal-header-actions">
                <input
                  type="text"
                  placeholder="이름 입력"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleQuickAdd();
                    }
                  }}
                  className="quick-add-input"
                />
                <button onClick={handleQuickAdd} className="btn-quick-add" title="추가">
                  +
                </button>
                <button onClick={() => setShowListModal(false)} className="btn-close-modal" title="닫기">
                  ×
                </button>
              </div>
            </div>

            {/* Filter Section */}
            <div className="filter-section">
              {listModalType === 'grade' && (
                <div className="filter-group">
                  <label>교육과정</label>
                  <select
                    value={selectedFilters.levelId}
                    onChange={(e) => setSelectedFilters({ ...selectedFilters, levelId: e.target.value })}
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

              {listModalType === 'unit' && (
                <>
                  <div className="filter-group">
                    <label>교육과정</label>
                    <select
                      value={selectedFilters.levelId}
                      onChange={(e) => {
                        setSelectedFilters({ ...selectedFilters, levelId: e.target.value, gradeId: '' });
                      }}
                    >
                      <option value="">선택하세요</option>
                      {levels.map((level) => (
                        <option key={level.id} value={level.id}>
                          {level.displayName || level.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="filter-group">
                    <label>학년</label>
                    <select
                      value={selectedFilters.gradeId}
                      onChange={(e) => setSelectedFilters({ ...selectedFilters, gradeId: e.target.value })}
                      disabled={!selectedFilters.levelId}
                    >
                      <option value="">선택하세요</option>
                      {grades
                        .filter(g => g.levelId === parseInt(selectedFilters.levelId))
                        .map((grade) => (
                          <option key={grade.id} value={grade.id}>
                            {grade.displayName || grade.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </>
              )}

              {listModalType === 'subunit' && (
                <>
                  <div className="filter-group">
                    <label>교육과정</label>
                    <select
                      value={selectedFilters.levelId}
                      onChange={(e) => {
                        setSelectedFilters({ ...selectedFilters, levelId: e.target.value, gradeId: '', unitId: '' });
                      }}
                    >
                      <option value="">선택하세요</option>
                      {levels.map((level) => (
                        <option key={level.id} value={level.id}>
                          {level.displayName || level.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="filter-group">
                    <label>학년</label>
                    <select
                      value={selectedFilters.gradeId}
                      onChange={(e) => {
                        setSelectedFilters({ ...selectedFilters, gradeId: e.target.value, unitId: '' });
                      }}
                      disabled={!selectedFilters.levelId}
                    >
                      <option value="">선택하세요</option>
                      {grades
                        .filter(g => g.levelId === parseInt(selectedFilters.levelId))
                        .map((grade) => (
                          <option key={grade.id} value={grade.id}>
                            {grade.displayName || grade.name}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="filter-group">
                    <label>대단원</label>
                    <select
                      value={selectedFilters.unitId}
                      onChange={(e) => setSelectedFilters({ ...selectedFilters, unitId: e.target.value })}
                      disabled={!selectedFilters.gradeId}
                    >
                      <option value="">선택하세요</option>
                      {units
                        .filter(u => u.gradeId === parseInt(selectedFilters.gradeId))
                        .map((unit) => (
                          <option key={unit.id} value={unit.id}>
                            {unit.displayName || unit.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </>
              )}

              {listModalType === 'concept' && (
                <>
                  <div className="filter-group">
                    <label>교육과정</label>
                    <select
                      value={selectedFilters.levelId}
                      onChange={(e) => {
                        setSelectedFilters({ ...selectedFilters, levelId: e.target.value, gradeId: '', unitId: '', subUnitId: '' });
                      }}
                    >
                      <option value="">선택하세요</option>
                      {levels.map((level) => (
                        <option key={level.id} value={level.id}>
                          {level.displayName || level.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="filter-group">
                    <label>학년</label>
                    <select
                      value={selectedFilters.gradeId}
                      onChange={(e) => {
                        setSelectedFilters({ ...selectedFilters, gradeId: e.target.value, unitId: '', subUnitId: '' });
                      }}
                      disabled={!selectedFilters.levelId}
                    >
                      <option value="">선택하세요</option>
                      {grades
                        .filter(g => g.levelId === parseInt(selectedFilters.levelId))
                        .map((grade) => (
                          <option key={grade.id} value={grade.id}>
                            {grade.displayName || grade.name}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="filter-group">
                    <label>대단원</label>
                    <select
                      value={selectedFilters.unitId}
                      onChange={(e) => {
                        setSelectedFilters({ ...selectedFilters, unitId: e.target.value, subUnitId: '' });
                      }}
                      disabled={!selectedFilters.gradeId}
                    >
                      <option value="">선택하세요</option>
                      {units
                        .filter(u => u.gradeId === parseInt(selectedFilters.gradeId))
                        .map((unit) => (
                          <option key={unit.id} value={unit.id}>
                            {unit.displayName || unit.name}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="filter-group">
                    <label>소단원</label>
                    <select
                      value={selectedFilters.subUnitId}
                      onChange={(e) => setSelectedFilters({ ...selectedFilters, subUnitId: e.target.value })}
                      disabled={!selectedFilters.unitId}
                    >
                      <option value="">선택하세요</option>
                      {subUnits
                        .filter(su => su.unitId === parseInt(selectedFilters.unitId))
                        .map((subUnit) => (
                          <option key={subUnit.id} value={subUnit.id}>
                            {subUnit.displayName || subUnit.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </>
              )}
            </div>

            {/* List Section */}
            {getFilteredItems().length === 0 ? (
              <div className="empty-section">
                {listModalType === 'level'
                  ? '등록된 교육과정이 없습니다'
                  : '상위 항목을 선택하거나 등록된 항목이 없습니다'}
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="content-table">
                  <thead>
                    <tr>
                      <th>{getModalTitle(listModalType)}</th>
                      <th className="action-header">동작</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredItems().map((item, index) => (
                      <tr key={item.id}>
                        <td className="name-cell">{item.displayName || item.name}</td>
                        <td className="action-cell">
                          <button
                            onClick={() => handleReorder(item.id, 'up', listModalType)}
                            className="btn-order-small"
                            disabled={index === 0}
                          >
                            ▲
                          </button>
                          <button
                            onClick={() => handleReorder(item.id, 'down', listModalType)}
                            className="btn-order-small"
                            disabled={index === getFilteredItems().length - 1}
                          >
                            ▼
                          </button>
                          <button onClick={() => handleEdit(item, listModalType)} className="btn-edit-small">
                            수정
                          </button>
                          <button onClick={() => handleDelete(item.id, listModalType)} className="btn-delete-small">
                            삭제
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentManagement;
