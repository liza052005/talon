import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthProvider, AuthContext } from './store/AuthContext';
import { RegisterProvider } from './store/RegisterContext';

import Auth from './Pages/Auth';
import RegisterStep1 from './Pages/RegisterStep1';
import RegisterStep2 from './Pages/RegisterStep2';
import RegisterStep3 from './Pages/RegisterStep3';
import CodeInput from './Pages/CodeInput';
import ForgotPassword from './Pages/ForgotPassword';
import Privacy from './Pages/Privacy';
import AccountCheck from './Pages/AccountCheck';
import SuccessCheck from './Pages/SuccessCheck'; // <--- Импортируем
import StudentHome from './Pages/StudentHome';
import ScanQR from './Pages/ScanQR';
import MealConfirm from './Pages/MealConfirm';
import MealSuccess from './Pages/MealSuccess';

const ProtectedRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  if (user) return <Navigate to="/student" replace />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicRoute><Auth /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterStep1 /></PublicRoute>} />
      <Route path="/register/step-2" element={<PublicRoute><RegisterStep2 /></PublicRoute>} />
      <Route path="/register/step-3" element={<PublicRoute><RegisterStep3 /></PublicRoute>} />
      <Route path="/code" element={<PublicRoute><CodeInput /></PublicRoute>} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/student" element={<ProtectedRoute><StudentHome /></ProtectedRoute>} />
      <Route path="/student/scan" element={<ProtectedRoute><ScanQR /></ProtectedRoute>} />
      <Route path="/student/confirm" element={<ProtectedRoute><MealConfirm /></ProtectedRoute>} />
      <Route path="/student/success" element={<ProtectedRoute><MealSuccess /></ProtectedRoute>} />

      {/* Эти два экрана доступны всем (и авторизованным, и нет) */}
      <Route path="/check" element={<AccountCheck />} />
      <Route path="/success" element={<SuccessCheck />} /> 

      <Route path="/student" element={<ProtectedRoute><StudentHome /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <RegisterProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </RegisterProvider>
    </AuthProvider>
  );
}

export default App;