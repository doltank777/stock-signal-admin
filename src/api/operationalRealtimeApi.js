import apiClient from './apiClient';

export async function getOperationalRealtimeStatus(signal) {
  const response = await apiClient.get(
    '/api/admin/operational-realtime/status',
    { signal }
  );
  return response.data;
}

export async function retryOperationalRealtimeReconciliation() {
  const response = await apiClient.post(
    '/api/admin/operational-realtime/reconciliation/retry'
  );
  return response.data;
}
