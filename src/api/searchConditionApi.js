import apiClient from './apiClient';

export async function getSearchConditions(signal) {
  const response = await apiClient.get(
    '/api/admin/search-conditions',
    { signal }
  );

  return response.data;
}

export async function getSearchConditionMetadata(signal) {
  const response = await apiClient.get(
    '/api/admin/search-conditions/meta',
    { signal }
  );

  return response.data;
}

export async function createSearchCondition(request) {
  const response = await apiClient.post(
    '/api/admin/search-conditions',
    request
  );

  return response.data;
}

export async function getSearchCondition(id, signal) {
  const response = await apiClient.get(
    `/api/admin/search-conditions/${id}`,
    { signal }
  );

  return response.data;
}

export async function updateSearchCondition(id, request) {
  const response = await apiClient.put(
    `/api/admin/search-conditions/${id}`,
    request
  );

  return response.data;
}
