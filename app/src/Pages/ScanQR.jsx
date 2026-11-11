import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../api/client';

const ScanQR = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Используем ref, чтобы не рендерить библиотеку дважды
  const scannerRef = useRef(null);

  useEffect(() => {
    // Инициализация сканера
    const html5QrCode = new Html5Qrcode("reader");
    scannerRef.current = html5QrCode;

    const startScanner = async () => {
      try {
        await html5QrCode.start(
          { facingMode: "environment" }, // Задняя камера
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          async (decodedText) => {
            // Если считали QR — останавливаем сканер и отправляем токен
            await html5QrCode.stop();
            handleScanSuccess(decodedText);
          },
          (errorMessage) => {
            // Игнорируем ошибки поиска QR в кадре (они спамят консоль)
          }
        );
      } catch (err) {
        setError('Не удалось получить доступ к камере. Разрешите доступ в браузере.');
      }
    };

    startScanner();

    // Очистка при размонтировании компонента
    return () => {
      if (html5QrCode.isScanning) {
        html5QrCode.stop().catch(console.error);
      }
    };
  }, []);

  const handleScanSuccess = async (token) => {
    setError('');
    setLoading(true);
    try {
      // Отправляем токен на бэкенд
      await api.post('/qr/scan/', { token });
      // Если успех — переходим на экран подтверждения
      navigate('/student/confirm');
    } catch (err) {
      if (err.response?.data?.non_field_errors) {
        setError(err.response.data.non_field_errors[0]);
      } else {
        setError('К сожалению, вам питание не доступно.');
      }
      setLoading(false);
      // Если ошибка — перезапускаем сканер через 2 секунды
      setTimeout(() => {
        if (scannerRef.current && !scannerRef.current.isScanning) {
           window.location.reload(); // простой способ перезапустить
        }
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen w-full bg-primary flex flex-col px-6">
      <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col pt-10">
        
        {/* Кнопка закрыть */}
        <button
          onClick={() => navigate('/student')}
          className="self-end p-2 text-black hover:bg-gray-100 rounded-full"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <h1 className="mt-8 text-3xl font-semibold text-center text-black leading-tight">
          Сканирование<br/>QR-кода
        </h1>
        <p className="mt-2 text-sm text-gray text-center">
          Наведите камеру на QR-код
        </p>

        {/* Плашка с ошибкой */}
        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 text-center">
            {error}
          </div>
        )}

        {/* Контейнер для камеры */}
        <div className="mt-10 flex flex-col items-center justify-center relative min-h-[300px]">
          <div id="reader" className="w-full max-w-[300px] rounded-2xl overflow-hidden"></div>
          
          {loading && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
              <span className="text-black font-medium">Проверка кода...</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ScanQR;