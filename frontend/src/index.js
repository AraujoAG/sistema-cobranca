import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app';
import './index.css'; // Se você tiver um arquivo de estilo global

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);