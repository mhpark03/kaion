import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand" onClick={() => navigate('/dashboard')}>
        <h2>EduTest</h2>
      </div>

      <div className="navbar-menu">
        <div className="navbar-item" onClick={() => navigate('/dashboard')}>
          <span className={`nav-link ${isActive('/dashboard')}`}>대시보드</span>
        </div>

        {(user?.role === 'ADMIN' || user?.role === 'TEACHER') && (
          <>
            <div className="navbar-item" onClick={() => navigate('/levels')}>
              <span className={`nav-link ${isActive('/levels')}`}>교육과정</span>
            </div>

            <div className="navbar-item" onClick={() => navigate('/grades')}>
              <span className={`nav-link ${isActive('/grades')}`}>학년</span>
            </div>

            <div className="navbar-item" onClick={() => navigate('/subjects')}>
              <span className={`nav-link ${isActive('/subjects')}`}>과목</span>
            </div>

            <div className="navbar-item" onClick={() => navigate('/units')}>
              <span className={`nav-link ${isActive('/units')}`}>대단원</span>
            </div>

            <div className="navbar-item" onClick={() => navigate('/sub-units')}>
              <span className={`nav-link ${isActive('/sub-units')}`}>소단원</span>
            </div>

            <div className="navbar-item" onClick={() => navigate('/concepts')}>
              <span className={`nav-link ${isActive('/concepts')}`}>핵심 개념</span>
            </div>

            <div className="navbar-item" onClick={() => navigate('/questions')}>
              <span className={`nav-link ${isActive('/questions')}`}>문제</span>
            </div>
          </>
        )}
      </div>

      <div className="navbar-user">
        <span className="user-name">{user?.fullName}님</span>
        <span className="user-role">{getRoleDisplay(user?.role)}</span>
        <button onClick={handleLogout} className="btn-logout">
          로그아웃
        </button>
      </div>
    </nav>
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

export default Navbar;
