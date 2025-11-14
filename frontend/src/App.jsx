import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import LevelManagement from './components/LevelManagement';
import GradeManagement from './components/GradeManagement';
import UnitManagement from './components/UnitManagement';
import SubUnitManagement from './components/SubUnitManagement';
import ConceptManagement from './components/ConceptManagement';
import QuestionManagement from './components/QuestionManagement';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <Router>
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
            path="/levels"
            element={
              <ProtectedRoute>
                <LevelManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/grades"
            element={
              <ProtectedRoute>
                <GradeManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/units"
            element={
              <ProtectedRoute>
                <UnitManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sub-units"
            element={
              <ProtectedRoute>
                <SubUnitManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/concepts"
            element={
              <ProtectedRoute>
                <ConceptManagement />
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
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
