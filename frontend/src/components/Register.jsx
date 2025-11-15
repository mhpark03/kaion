import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { levelService } from '../services/levelService';
import { gradeService } from '../services/gradeService';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    role: 'STUDENT',
    levelId: '',
    gradeId: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [levels, setLevels] = useState([]);
  const [grades, setGrades] = useState([]);
  const [allGrades, setAllGrades] = useState([]);

  const { register } = useAuth();
  const navigate = useNavigate();

  // Load levels and grades on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [levelsResponse, gradesResponse] = await Promise.all([
          levelService.getAll(),
          gradeService.getAll()
        ]);
        setLevels(levelsResponse.data);
        setAllGrades(gradesResponse.data);
      } catch (err) {
        console.error('Failed to load levels and grades:', err);
      }
    };
    loadData();
  }, []);

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
          setFormData(prev => ({ ...prev, gradeId: '' }));
        }
      }
    } else {
      setGrades([]);
      setFormData(prev => ({ ...prev, gradeId: '' }));
    }
  }, [formData.levelId, allGrades]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다');
      return;
    }

    if (formData.password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다');
      return;
    }

    setLoading(true);

    // username을 fullName으로도 사용
    const { confirmPassword, ...registerData } = formData;
    registerData.fullName = registerData.username;

    // Convert levelId and gradeId to numbers (or null if empty)
    registerData.levelId = registerData.levelId ? parseInt(registerData.levelId) : null;
    registerData.gradeId = registerData.gradeId ? parseInt(registerData.gradeId) : null;

    const result = await register(registerData);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>회원가입</h2>
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="username">이름</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
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
            <label htmlFor="role">역할</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="STUDENT">학생</option>
              <option value="TEACHER">선생님</option>
              <option value="ADMIN">관리자</option>
            </select>
          </div>

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
            <label htmlFor="password">비밀번호</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">비밀번호 확인</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            이미 계정이 있으신가요? <Link to="/login">로그인</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
