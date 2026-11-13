import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { AuthProvider, AuthContext } from './store/AuthContext';
import { RegisterProvider } from './store/RegisterContext';
import DashboardStudent from './Pages/DashboardStudent';

import Auth from './Pages/Auth';
import RegisterStep1 from './Pages/RegisterStep1';
import RegisterStep2 from './Pages/RegisterStep2';
import RegisterStep3 from './Pages/RegisterStep3';
import CodeInput from './Pages/CodeInput';
import ForgotPassword from './Pages/ForgotPassword';
import Privacy from './Pages/Privacy';
import AccountCheck from './Pages/AccountCheck';
import SuccessCheck from './Pages/SuccessCheck';
import StudentHome from './Pages/StudentHome';
import ScanQR from './Pages/ScanQR';
import MealConfirm from './Pages/MealConfirm';
import MealSuccess from './Pages/MealSuccess';
import StaffLogin from './Pages/StaffLogin';
import StaffCode from './Pages/StaffCode';
import StaffQr from './Pages/StaffQr';
import AdminStaff from './Pages/AdminStaff';


const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return null; // Ждем загрузки
  if (!user) return <Navigate to="/" replace />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return null;
  if (!user) return <Navigate to="/" replace />;
  if (user.role !== 'admin' && user.role !== 'moderator') return <Navigate to="/" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();
  
  if (loading) return null; // Ждем загрузки, не делаем редирект!
  
  if (user) {
    if (user.role === 'admin' || user.role === 'moderator') {
      if (location.pathname.startsWith('/admin')) return children;
      return <Navigate to="/admin/staff" replace />;
    }
    if (user.role === 'canteen') {
      if (location.pathname.startsWith('/staff')) return children;
      return <Navigate to="/staff/qr" replace />;
    }
    if (location.pathname.startsWith('/student')) return children;
    return <Navigate to="/student" replace />;
  }
  
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

      <Route path="/staff" element={<PublicRoute><StaffLogin /></PublicRoute>} />
      <Route path="/staff/code" element={<PublicRoute><StaffCode /></PublicRoute>} />
      <Route path="/staff/qr" element={<ProtectedRoute><StaffQr /></ProtectedRoute>} />

      <Route path="/admin/staff" element={<AdminRoute><AdminStaff /></AdminRoute>} />
      
      <Route path="/check" element={<AccountCheck />} />
      <Route path="/success" element={<SuccessCheck />} />

      <Route path="*" element={<Navigate to="/" replace />} />

      <Route path="/admin/students" element={<DashboardStudent />} />
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