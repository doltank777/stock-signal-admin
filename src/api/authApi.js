import apiClient from './apiClient';

export async function login(email, password) {
  const response = await apiClient.post('/api/auth/login', {
    email,
    password,
  });

  return response.data;
}

export async function getMyInfo() {
  const response = await apiClient.get('/api/auth/me');

  return response.data;
}