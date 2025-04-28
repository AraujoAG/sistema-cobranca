// frontend/src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import app from './app';  // Corrigido para corresponder ao nome do arquivo
import './index.css'; 

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <app />
  </React.StrictMode>
);