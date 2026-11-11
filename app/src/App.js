import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './Pages/Auth';
import RegisterStep1 from './Pages/RegisterStep1';
import RegisterStep2 from './Pages/RegisterStep2';
import RegisterStep3 from './Pages/RegisterStep3';
import CodeInput from './Pages/CodeInput';
import ForgotPassword from './Pages/ForgotPassword';
import Privacy from './Pages/Privacy';
import AccountCheck from './Pages/AccountCheck';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Auth />} />

        {/* Регистрация: 3 шага */}
        <Route path="/register" element={<RegisterStep1 />} />
        <Route path="/register/step-2" element={<RegisterStep2 />} />
        <Route path="/register/step-3" element={<RegisterStep3 />} />

        <Route path="/code" element={<CodeInput />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/check" element={<AccountCheck />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;