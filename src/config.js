// src/config.js
const API_BASE_URL = process.env.REACT_APP_API_URL 
  ? `${process.env.REACT_APP_API_URL}/api`
  : 'http://localhost:5266/api';

export const config = {
  api: {
    baseURL: API_BASE_URL
  },
  environment: process.env.NODE_ENV || 'development'
}; 