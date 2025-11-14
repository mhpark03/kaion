import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const getRoleDisplay = (role) => {
    const roleMap = {
      'STUDENT': '학생',
      'TEACHER': '선생님',
      'ADMIN': '관리자'
    };
    return roleMap[role] || role;
  };

  return (
    <div className="dashboard-container">
      <Navbar />

      <div className="dashboard-content">
        <div className="welcome-card">
          <h2>환영합니다, {user?.fullName}님!</h2>
          <div className="user-info">
            <div className="info-item">
              <span className="label">사용자명:</span>
              <span className="value">{user?.username}</span>
            </div>
            <div className="info-item">
              <span className="label">이메일:</span>
              <span className="value">{user?.email}</span>
            </div>
            <div className="info-item">
              <span className="label">역할:</span>
              <span className="value role">{getRoleDisplay(user?.role)}</span>
            </div>
          </div>
        </div>

        <div className="features-grid">
          {user?.role === 'STUDENT' && (
            <>
              <div className="feature-card">
                <h3>문제 풀기</h3>
                <p>다양한 과목의 문제를 풀어보세요</p>
                <button className="btn-feature" disabled>준비 중</button>
              </div>
              <div className="feature-card">
                <h3>내 성적</h3>
                <p>학습 진도와 성적을 확인하세요</p>
                <button className="btn-feature" disabled>준비 중</button>
              </div>
            </>
          )}

          {user?.role === 'TEACHER' && (
            <>
              <div className="feature-card">
                <h3>문제 관리</h3>
                <p>문제를 생성하고 관리하세요</p>
                <button className="btn-feature" onClick={() => navigate('/questions')}>
                  문제 관리
                </button>
              </div>
              <div className="feature-card">
                <h3>과목 관리</h3>
                <p>과목을 추가하고 관리하세요</p>
                <button className="btn-feature" onClick={() => navigate('/subjects')}>
                  과목 관리
                </button>
              </div>
              <div className="feature-card">
                <h3>난이도 관리</h3>
                <p>난이도를 추가하고 관리하세요</p>
                <button className="btn-feature" onClick={() => navigate('/levels')}>
                  난이도 관리
                </button>
              </div>
              <div className="feature-card">
                <h3>학생 현황</h3>
                <p>학생들의 학습 현황을 확인하세요</p>
                <button className="btn-feature" disabled>준비 중</button>
              </div>
            </>
          )}

          {user?.role === 'ADMIN' && (
            <>
              <div className="feature-card">
                <h3>과목 관리</h3>
                <p>과목을 추가하고 관리하세요</p>
                <button className="btn-feature" onClick={() => navigate('/subjects')}>
                  과목 관리
                </button>
              </div>
              <div className="feature-card">
                <h3>난이도 관리</h3>
                <p>난이도를 추가하고 관리하세요</p>
                <button className="btn-feature" onClick={() => navigate('/levels')}>
                  난이도 관리
                </button>
              </div>
              <div className="feature-card">
                <h3>문제 관리</h3>
                <p>문제를 생성하고 관리하세요</p>
                <button className="btn-feature" onClick={() => navigate('/questions')}>
                  문제 관리
                </button>
              </div>
              <div className="feature-card">
                <h3>사용자 관리</h3>
                <p>시스템 사용자를 관리하세요</p>
                <button className="btn-feature" disabled>준비 중</button>
              </div>
              <div className="feature-card">
                <h3>통계</h3>
                <p>전체 시스템 통계를 확인하세요</p>
                <button className="btn-feature" disabled>준비 중</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
