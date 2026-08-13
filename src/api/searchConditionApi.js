import apiClient from './apiClient';

export async function getSearchConditions(signal) {
  const response = await apiClient.get(
    '/api/admin/search-conditions',
    { signal }
  );

  return response.data;
}
