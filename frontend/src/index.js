// frontend/src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';  // Corrigido: 'App' com A maiúsculo
import './index.css'; 

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />  // Corrigido: 'App' com A maiúsculo
  </React.StrictMode>
);