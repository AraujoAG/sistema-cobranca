// frontend/src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // 'App' com A maiúsculo está correto
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);