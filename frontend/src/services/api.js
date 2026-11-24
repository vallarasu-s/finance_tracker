// API client for Java 21 REST backend & MongoDB Atlas Cloud Database
// Provides complete, bidirectional Read & Write functionality for:
// - User Information
// - Transactions & Amounts
// - Financial Goals
// - App Settings & Formatting Preferences
// - Full Database Synchronization

const API_BASE = '/api';

/**
 * Check Java server and MongoDB connection health
 */
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

/**
 * Get MongoDB Atlas connection status and configuration
 */
export async function getMongoStatus() {
  try {
    const res = await fetch(`${API_BASE}/config/mongodb`);
    if (res.ok) {
      return await res.json();
    }
    return { connected: false, error: 'Could not fetch MongoDB status' };
  } catch (err) {
    return { connected: false, error: err.message };
  }
}

/**
 * Update MongoDB Atlas password and connect
 */
export async function saveMongoPassword(password) {
  try {
    const res = await fetch(`${API_BASE}/config/mongodb`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// =============================================================================
// 1. USER INFORMATION (READ & WRITE)
// =============================================================================

/**
 * READ: Get User Information from Java backend & MongoDB Atlas
 */
export async function getUserInformation(userId = 'default_user') {
  try {
    const res = await fetch(`${API_BASE}/user?userId=${encodeURIComponent(userId)}`);
    if (res.ok) {
      return await res.json();
    }
    return null;
  } catch (err) {
    return null;
  }
}

/**
 * WRITE: Store User Information in Java backend & MongoDB Atlas
 */
export async function saveUserInformation(userData) {
  try {
    const res = await fetch(`${API_BASE}/user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// =============================================================================
// 2. TRANSACTIONS & AMOUNTS (READ, WRITE, DELETE)
// =============================================================================

/**
 * READ: Fetch all transactions from Java backend & MongoDB Atlas
 */
export async function getTransactionsFromCloud() {
  try {
    const res = await fetch(`${API_BASE}/transactions`);
    if (res.ok) {
      return await res.json();
    }
    return null;
  } catch (err) {
    return null;
  }
}

/**
 * WRITE: Save Transactions (Amounts) to Java backend & MongoDB Atlas
 */
export async function saveTransactionsToCloud(transactions) {
  try {
    const res = await fetch(`${API_BASE}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transactions)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * WRITE: Delete a transaction by id from Java backend & MongoDB Atlas
 */
export async function deleteTransactionFromCloud(id) {
  try {
    const res = await fetch(`${API_BASE}/transactions?id=${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// =============================================================================
// 3. FINANCIAL GOALS (READ, WRITE, DELETE)
// =============================================================================

/**
 * READ: Fetch all goals from Java backend & MongoDB Atlas
 */
export async function getGoalsFromCloud() {
  try {
    const res = await fetch(`${API_BASE}/goals`);
    if (res.ok) {
      return await res.json();
    }
    return null;
  } catch (err) {
    return null;
  }
}

/**
 * WRITE: Save Goals to Java backend & MongoDB Atlas
 */
export async function saveGoalsToCloud(goals) {
  try {
    const res = await fetch(`${API_BASE}/goals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(goals)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * WRITE: Delete a goal by id from Java backend & MongoDB Atlas
 */
export async function deleteGoalFromCloud(id) {
  try {
    const res = await fetch(`${API_BASE}/goals?id=${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// =============================================================================
// 3.1 INVESTMENTS (READ, WRITE, DELETE)
// =============================================================================

/**
 * READ: Fetch all investments from Java backend & MongoDB Atlas
 */
export async function getInvestmentsFromCloud() {
  try {
    const res = await fetch(`${API_BASE}/investments`);
    if (res.ok) {
      return await res.json();
    }
    return null;
  } catch (err) {
    return null;
  }
}

/**
 * WRITE: Save Investments to Java backend & MongoDB Atlas
 */
export async function saveInvestmentsToCloud(investments) {
  try {
    const res = await fetch(`${API_BASE}/investments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(investments)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * WRITE: Delete an investment by id from Java backend & MongoDB Atlas
 */
export async function deleteInvestmentFromCloud(id) {
  try {
    const res = await fetch(`${API_BASE}/investments?id=${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// =============================================================================
// 4. SETTINGS & PREFERENCES (READ & WRITE)
// =============================================================================

/**
 * READ: Fetch settings from Java backend & MongoDB Atlas
 */
export async function getSettingsFromCloud() {
  try {
    const res = await fetch(`${API_BASE}/settings`);
    if (res.ok) {
      return await res.json();
    }
    return null;
  } catch (err) {
    return null;
  }
}

/**
 * WRITE: Save settings to Java backend & MongoDB Atlas
 */
export async function saveSettingsToCloud(settings) {
  try {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// =============================================================================
// 5. UNIFIED READ & WRITE FULL SYNC
// =============================================================================

/**
 * READ ALL: Fetch all transactions, goals, user, and settings in one call
 */
export async function fetchAllCloudData() {
  try {
    const res = await fetch(`${API_BASE}/sync`, { method: 'GET' });
    if (res.ok) {
      return await res.json();
    }
    return null;
  } catch (err) {
    return null;
  }
}

/**
 * WRITE & SYNC: Full bidirectional sync of transactions, goals, user, settings
 */
export async function syncWithJavaBackend(payload) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

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
