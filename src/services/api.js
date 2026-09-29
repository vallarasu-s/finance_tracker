// API client for Java 21 REST backend with offline resilience

const API_BASE = '/api';

export async function checkBackendHealth() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(`${API_BASE}/health`, {
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      return { online: true, ...data };
    }
    return { online: false, error: 'Non-200 response' };
  } catch (err) {
    return { online: false, error: err.message };
  }
}

export async function syncWithJavaBackend(payload) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(`${API_BASE}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    const data = await res.json();
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
