// frontend/src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://sistema-cobranca-backend.onrender.com/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

export default api;