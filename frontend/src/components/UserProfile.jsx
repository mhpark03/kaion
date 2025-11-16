import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { levelService } from '../services/levelService';
import { gradeService } from '../services/gradeService';
import { unitService } from '../services/unitService';
import { subUnitService } from '../services/subUnitService';
import { DIFFICULTY_LEVELS } from '../constants/difficulty';
import Navbar from './Navbar';
import './UserProfile.css';

const UserProfile = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    levelId: '',
    gradeId: '',
    unitId: '',
    subUnitId: '',
    proficiencyLevel: ''
  });

  const [levels, setLevels] = useState([]);
  const [grades, setGrades] = useState([]);
  const [units, setUnits] = useState([]);
  const [subUnits, setSubUnits] = useState([]);
  const [allGrades, setAllGrades] = useState([]);
  const [allUnits, setAllUnits] = useState([]);
  const [allSubUnits, setAllSubUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const [levelsResponse, gradesResponse, unitsResponse, subUnitsResponse] = await Promise.all([
        levelService.getAll(),
        gradeService.getAll(),
        unitService.getAll(),
        subUnitService.getAll()
      ]);
      setLevels(levelsResponse.data);
      setAllGrades(gradesResponse.data);
      setAllUnits(unitsResponse.data);
      setAllSubUnits(subUnitsResponse.data);

      // Set initial form data from user
      if (user) {
        setFormData({
          username: user.username || '',
          email: user.email || '',
          fullName: user.fullName || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
          levelId: user.levelId?.toString() || '',
          gradeId: user.gradeId?.toString() || '',
          unitId: user.unitId?.toString() || '',
          subUnitId: user.subUnitId?.toString() || '',
          proficiencyLevel: user.proficiencyLevel || ''
        });
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('데이터를 불러오는데 실패했습니다.');
    }
  };

  // Filter grades when level changes
  useEffect(() => {
    if (formData.levelId) {
      const filteredGrades = allGrades.filter(
        grade => grade.levelId === parseInt(formData.levelId)
      );
      setGrades(filteredGrades);

      // Reset grade if it doesn't belong to selected level
      if (formData.gradeId) {
        const gradeExists = filteredGrades.some(
          g => g.id === parseInt(formData.gradeId)
        );
        if (!gradeExists) {
          setFormData(prev => ({ ...prev, gradeId: '', unitId: '', subUnitId: '' }));
        }
      }
    } else {
      setGrades([]);
      setFormData(prev => ({ ...prev, gradeId: '', unitId: '', subUnitId: '' }));
    }
  }, [formData.levelId, allGrades]);

  // Filter units when grade changes (units are filtered by grade, not subject)
  useEffect(() => {
    if (formData.gradeId) {
      const filteredUnits = allUnits.filter(
        unit => unit.gradeId === parseInt(formData.gradeId)
      );
      setUnits(filteredUnits);

      // Reset unit if it doesn't belong to selected grade
      if (formData.unitId) {
        const unitExists = filteredUnits.some(
          u => u.id === parseInt(formData.unitId)
        );
        if (!unitExists) {
          setFormData(prev => ({ ...prev, unitId: '', subUnitId: '' }));
        }
      }
    } else {
      setUnits([]);
      setFormData(prev => ({ ...prev, unitId: '', subUnitId: '' }));
    }
  }, [formData.gradeId, allUnits]);

  // Filter subUnits when unit changes
  useEffect(() => {
    if (formData.unitId) {
      const filteredSubUnits = allSubUnits.filter(
        subUnit => subUnit.unitId === parseInt(formData.unitId)
      );
      setSubUnits(filteredSubUnits);

      // Reset subUnit if it doesn't belong to selected unit
      if (formData.subUnitId) {
        const subUnitExists = filteredSubUnits.some(
          su => su.id === parseInt(formData.subUnitId)
        );
        if (!subUnitExists) {
          setFormData(prev => ({ ...prev, subUnitId: '' }));
        }
      }
    } else {
      setSubUnits([]);
      setFormData(prev => ({ ...prev, subUnitId: '' }));
    }
  }, [formData.unitId, allSubUnits]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Password validation
    if (formData.newPassword) {
      if (!formData.currentPassword) {
        setError('현재 비밀번호를 입력해주세요.');
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        setError('새 비밀번호가 일치하지 않습니다.');
        return;
      }
      if (formData.newPassword.length < 6) {
        setError('비밀번호는 최소 6자 이상이어야 합니다.');
        return;
      }
    }

    setLoading(true);

    try {
      const updateData = {
        fullName: formData.fullName,
        email: formData.email,
        levelId: formData.levelId ? parseInt(formData.levelId) : null,
        gradeId: formData.gradeId ? parseInt(formData.gradeId) : null,
        unitId: formData.unitId ? parseInt(formData.unitId) : null,
        subUnitId: formData.subUnitId ? parseInt(formData.subUnitId) : null,
        proficiencyLevel: formData.proficiencyLevel || null
      };

      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      // TODO: Call backend API to update user profile
      // For now, we'll update the auth context
      await updateUser(updateData);

      setSuccess('프로필이 성공적으로 업데이트되었습니다.');

      // Clear password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (err) {
      setError(err.message || '프로필 업데이트에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="user-profile-container">
        <div className="page-header">
          <h1>프로필 설정</h1>
          <p>회원 정보를 수정할 수 있습니다</p>
        </div>

        <div className="profile-card">
          <form onSubmit={handleSubmit}>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="form-section">
              <h3>기본 정보</h3>

              <div className="form-group">
                <label htmlFor="username">사용자 이름</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  disabled
                  className="disabled-input"
                />
                <small>사용자 이름은 변경할 수 없습니다.</small>
              </div>

              <div className="form-group">
                <label htmlFor="fullName">이름</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="홍길동"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">이메일</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="example@email.com"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>역할</label>
                <input
                  type="text"
                  value={getRoleDisplay(user?.role)}
                  disabled
                  className="disabled-input"
                />
                <small>역할은 관리자만 변경할 수 있습니다.</small>
              </div>
            </div>

            {/* 학습 정보 섹션 - 학생만 표시 */}
            {user?.role === 'STUDENT' && (
              <div className="form-section">
                <h3>학습 정보</h3>

                <div className="form-group">
                  <label htmlFor="levelId">교육과정</label>
                  <select
                    id="levelId"
                    name="levelId"
                    value={formData.levelId}
                    onChange={handleChange}
                    disabled={loading}
                  >
                    <option value="">선택하세요</option>
                    {levels.map(level => (
                      <option key={level.id} value={level.id}>
                        {level.displayName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="gradeId">학년</label>
                  <select
                    id="gradeId"
                    name="gradeId"
                    value={formData.gradeId}
                    onChange={handleChange}
                    disabled={loading || !formData.levelId}
                  >
                    <option value="">선택하세요</option>
                    {grades.map(grade => (
                      <option key={grade.id} value={grade.id}>
                        {grade.displayName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="unitId">대단원</label>
                  <select
                    id="unitId"
                    name="unitId"
                    value={formData.unitId}
                    onChange={handleChange}
                    disabled={loading || !formData.gradeId}
                  >
                    <option value="">선택하세요</option>
                    {units.map(unit => (
                      <option key={unit.id} value={unit.id}>
                        {unit.displayName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="subUnitId">소단원</label>
                  <select
                    id="subUnitId"
                    name="subUnitId"
                    value={formData.subUnitId}
                    onChange={handleChange}
                    disabled={loading || !formData.unitId}
                  >
                    <option value="">선택하세요</option>
                    {subUnits.map(subUnit => (
                      <option key={subUnit.id} value={subUnit.id}>
                        {subUnit.displayName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="proficiencyLevel">학습 수준 (난이도)</label>
                  <select
                    id="proficiencyLevel"
                    name="proficiencyLevel"
                    value={formData.proficiencyLevel}
                    onChange={handleChange}
                    disabled={loading}
                  >
                    <option value="">선택하세요</option>
                    {DIFFICULTY_LEVELS.map(level => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="form-section">
              <h3>비밀번호 변경</h3>
              <p className="section-description">비밀번호를 변경하지 않으려면 비워두세요.</p>

              <div className="form-group">
                <label htmlFor="currentPassword">현재 비밀번호</label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">새 비밀번호</label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">새 비밀번호 확인</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="btn-secondary"
                disabled={loading}
              >
                취소
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? '저장 중...' : '저장'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

const getRoleDisplay = (role) => {
  const roleMap = {
    'STUDENT': '학생',
    'TEACHER': '선생님',
    'ADMIN': '관리자'
  };
  return roleMap[role] || role;
};

export default UserProfile;
