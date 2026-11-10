import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './store/AuthContext'; // Импортируем

import Auth from './Pages/Auth';
import Register from './Pages/Register';
import CodeInput from './Pages/CodeInput';
import ForgotPassword from './Pages/ForgotPassword';
import Privacy from './Pages/Privacy';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Auth />} />
          <Route path="/register" element={<Register/>} />
          <Route path="/code" element={<CodeInput />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/privacy" element={<Privacy />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;