import apiClient from './apiClient';

export async function getAdminUsers(params, signal) {
  const response = await apiClient.get('/api/admin/users', {
    params,
    signal,
  });

  return response.data;
}

export async function getAdminUser(id, signal) {
  const response = await apiClient.get(
    `/api/admin/users/${id}`,
    { signal }
  );

  return response.data;
}

export async function updateAdminUserMembership(id, request) {
  const response = await apiClient.patch(
    `/api/admin/users/${id}/membership`,
    request
  );

  return response.data;
}
