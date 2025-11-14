import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showContentDropdown, setShowContentDropdown] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  const isContentMenuActive = () => {
    const contentPaths = ['/levels', '/grades', '/subjects', '/units', '/sub-units', '/concepts'];
    return contentPaths.includes(location.pathname) ? 'active' : '';
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
            <div
              className="navbar-item dropdown"
              onMouseEnter={() => setShowContentDropdown(true)}
              onMouseLeave={() => setShowContentDropdown(false)}
            >
              <span className={`nav-link ${isContentMenuActive()}`}>
                교육과정 관리 ▾
              </span>
              {showContentDropdown && (
                <div className="dropdown-menu">
                  <div className="dropdown-item" onClick={() => navigate('/levels')}>
                    교육과정
                  </div>
                  <div className="dropdown-item" onClick={() => navigate('/grades')}>
                    학년
                  </div>
                  <div className="dropdown-item" onClick={() => navigate('/subjects')}>
                    과목
                  </div>
                  <div className="dropdown-item" onClick={() => navigate('/units')}>
                    대단원
                  </div>
                  <div className="dropdown-item" onClick={() => navigate('/sub-units')}>
                    소단원
                  </div>
                  <div className="dropdown-item" onClick={() => navigate('/concepts')}>
                    핵심 개념
                  </div>
                </div>
              )}
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
