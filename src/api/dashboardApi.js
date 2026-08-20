import apiClient from './apiClient';

export async function getScreeningResults(signal) {
  const response = await apiClient.get(
    '/api/admin/dashboard/screening-results',
    { signal }
  );
  return response.data;
}

export async function getRealtimeWatchTargets(signal) {
  const response = await apiClient.get(
    '/api/admin/dashboard/realtime-watch-targets',
    { signal }
  );
  return response.data;
}
