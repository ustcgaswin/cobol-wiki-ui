import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import App from './App';
import './index.css';


import WikiPage from './pages/WikiPage.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Global Sonner Toaster configuration */}
    <Toaster
      richColors
      position="bottom-right"
      closeButton
      expand
      toastOptions={{
        duration: 3000,
        style: {
          background: '#111827',
          color: '#F9FAFB',
          border: '1px solid #1F2937',
        },
      }}
    />
    <BrowserRouter>
      <Routes>
        <Route path="/wiki/:projectId" element={<WikiPage />} />
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);