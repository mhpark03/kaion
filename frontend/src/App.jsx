import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [message, setMessage] = useState('')
  const [health, setHealth] = useState(null)

  useEffect(() => {
    // 백엔드 API 테스트
    fetch('/api/test/hello')
      .then(res => res.json())
      .then(data => setMessage(data.message))
      .catch(err => console.error('Error:', err))

    fetch('/api/test/health')
      .then(res => res.json())
      .then(data => setHealth(data))
      .catch(err => console.error('Error:', err))
  }, [])

  return (
    <div className="App">
      <header className="App-header">
        <h1>EduTest - 교육 컨텐츠 관리 시스템</h1>
        <div className="welcome-section">
          <h2>환영합니다!</h2>
          <p>과목별/레벨별 문제 관리 및 학습 결과 추적 시스템</p>
        </div>

        {message && (
          <div className="api-test">
            <h3>백엔드 연결 테스트</h3>
            <p>메시지: {message}</p>
          </div>
        )}

        {health && (
          <div className="health-check">
            <h3>서버 상태</h3>
            <ul>
              <li>상태: {health.status}</li>
              <li>서비스: {health.service}</li>
              <li>타임스탬프: {new Date(health.timestamp).toLocaleString()}</li>
            </ul>
          </div>
        )}

        <div className="features">
          <h3>주요 기능</h3>
          <ul>
            <li>과목 및 레벨 관리</li>
            <li>문제 생성 및 관리</li>
            <li>문제 풀이</li>
            <li>개인별 결과 추적 및 통계</li>
          </ul>
        </div>
      </header>
    </div>
  )
}

export default App
