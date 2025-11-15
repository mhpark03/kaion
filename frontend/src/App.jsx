import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import ContentManagement from './components/ContentManagement';
import QuestionManagement from './components/QuestionManagement';
import QuestionCreate from './components/QuestionCreate';
import QuestionSolving from './components/QuestionSolving';
import UserProfile from './components/UserProfile';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <Router future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/content"
            element={
              <ProtectedRoute>
                <ContentManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/questions"
            element={
              <ProtectedRoute>
                <QuestionManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/question-create"
            element={
              <ProtectedRoute>
                <QuestionCreate />
              </ProtectedRoute>
            }
          />
          <Route
            path="/question-solving"
            element={
              <ProtectedRoute>
                <QuestionSolving />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
