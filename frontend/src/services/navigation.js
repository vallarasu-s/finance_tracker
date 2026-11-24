/**
 * Navigation & Back-History Service
 * 
 * Provides native-like, 1-step-at-a-time back button handling for both Laptop & Mobile devices:
 * - Desktop/Laptop: Browser toolbar back button, mouse back button, Alt+Left Arrow, Escape key.
 * - Mobile: Hardware back button, edge swipe back gesture, mobile browser back button.
 * - Prevents accidental quitting from website/PWA at root screen ("Press back again to exit").
 * - Hierarchical LIFO back stack: closes sub-popups -> closes top modal -> goes to previous tab.
 */

// LIFO stack of active modals / overlays / popups
// Each item: { id: string, onClose: Function, meta: Object }
const modalStack = [];

// Tab history stack to walk back between tabs (e.g. ['dashboard', 'transactions', 'analytics'])
const tabHistory = ['dashboard'];

// Internal state tracking
let isInternalPop = false;
let lastRootBackPressTime = 0;
let tabChangeCallback = null;
let toastCallback = null;
let activeTabGetter = () => 'dashboard';
let isInitialized = false;

/**
 * Check whether device is mobile / touch screen
 */
export function isMobileOrTouch() {
  if (typeof window === 'undefined') return false;
  return (
    window.innerWidth <= 768 ||
    'ontouchstart' in window ||
    (navigator && navigator.maxTouchPoints > 0)
  );
}

/**
 * Initialize navigation and set up history barrier + popstate listener
 */
export function initNavigation({
  onTabChange,
  showToast,
  getActiveTab
}) {
  if (typeof window === 'undefined') return;

  tabChangeCallback = onTabChange;
  toastCallback = showToast;
  if (getActiveTab) {
    activeTabGetter = getActiveTab;
  }

  if (isInitialized) return;
  isInitialized = true;

  const currentTab = activeTabGetter() || 'dashboard';
  tabHistory.length = 0;
  tabHistory.push(currentTab);

  // Set up history barrier so clicking back on the very first screen does not immediately quit the site
  try {
    const currentState = window.history.state;
    if (!currentState || !currentState.__fogo) {
      window.history.replaceState({ __fogo: true, type: 'root_barrier' }, '');
      window.history.pushState({ __fogo: true, type: 'tab', tab: currentTab }, '');
    }
  } catch (err) {
    console.warn('Navigation history init warning:', err);
  }

  // Global popstate event handler
  window.addEventListener('popstate', handlePopState);

  // Keyboard shortcut listener for laptop/desktop (Escape key closes topmost modal)
  window.addEventListener('keydown', handleKeyDown);
}

/**
 * Handle popstate event (triggered by browser Back button, mobile Back gesture/button, or history.back())
 */
function handlePopState(event) {
  // If this popstate was triggered programmatically by popModalNavigation, clear flag and return
  if (isInternalPop) {
    isInternalPop = false;
    return;
  }

  // STEP 1: If any modal, drawer, or popup is open, close ONLY the topmost one!
  if (modalStack.length > 0) {
    const topmost = modalStack.pop();
    if (topmost && typeof topmost.onClose === 'function') {
      try {
        topmost.onClose();
      } catch (e) {
        console.error('Error closing modal on back navigation:', e);
      }
    }
    return;
  }

  // STEP 2: If no modal is open, check if we have tab history to step back through
  if (tabHistory.length > 1) {
    // Remove current tab
    tabHistory.pop();
    const prevTab = tabHistory[tabHistory.length - 1];

    if (prevTab && typeof tabChangeCallback === 'function') {
      tabChangeCallback(prevTab, 'backward');
      return;
    }
  }

  // STEP 3: We are at the root tab (Dashboard) with no previous history steps.
  // Guard against accidental exit on laptop and mobile devices!
  const state = event.state;
  const isBarrier = !state || state.type === 'root_barrier';
  const now = Date.now();

  if (isBarrier || tabHistory.length <= 1) {
    // If the user pressed Back again within 2.5 seconds, allow exit
    if (lastRootBackPressTime && (now - lastRootBackPressTime) < 2500) {
      if (typeof toastCallback === 'function') {
        toastCallback('Exiting Finance Tracker...', 'info');
      }
      // Allow browser to exit by performing normal back without restoring barrier
      try {
        window.history.back();
      } catch {
        // ignore
      }
      return;
    }

    // First back press at root: inform user and restore barrier
    lastRootBackPressTime = now;
    if (typeof toastCallback === 'function') {
      toastCallback('Press back again to exit', 'info');
    }

    // Restore the barrier state so another back button press within 2.5s will exit
    try {
      const curTab = activeTabGetter() || 'dashboard';
      window.history.pushState({ __fogo: true, type: 'tab', tab: curTab }, '');
    } catch {
      // ignore
    }
  }
}

/**
 * Keyboard listener for laptop/desktop
 */
function handleKeyDown(e) {
  if (e.key === 'Escape') {
    if (modalStack.length > 0) {
      e.preventDefault();
      const topmost = modalStack[modalStack.length - 1];
      if (topmost) {
        popModalNavigation(topmost.id);
      }
    }
  }
}

/**
 * Push tab navigation step to browser history
 */
export function pushTabNavigation(newTabId, oldTabId) {
  if (typeof window === 'undefined') return;
  if (!newTabId || newTabId === oldTabId) return;

  tabHistory.push(newTabId);

  try {
    window.history.pushState({ __fogo: true, type: 'tab', tab: newTabId }, '');
  } catch (err) {
    console.warn('Tab navigation pushState warning:', err);
  }
}

/**
 * Register and push a modal, drawer, or popup to the back navigation stack
 * @param {string} modalId - Unique identifier for the modal
 * @param {Function} onClose - Callback to close this modal
 * @param {Object} [meta] - Optional metadata
 * @returns {Function} dismiss - Function to close modal and pop history
 */
export function pushModalNavigation(modalId, onClose, meta = {}) {
  if (typeof window === 'undefined') return () => {};

  // If already registered, update callback
  const existingIdx = modalStack.findIndex(m => m.id === modalId);
  if (existingIdx !== -1) {
    modalStack[existingIdx].onClose = onClose;
    modalStack[existingIdx].meta = meta;
    return () => popModalNavigation(modalId);
  }

  // Push to internal stack
  modalStack.push({ id: modalId, onClose, meta });

  // Push history state so browser Back button will pop it
  try {
    window.history.pushState({ __fogo: true, type: 'modal', modalId }, '');
  } catch (err) {
    console.warn('Modal navigation pushState warning:', err);
  }

  return () => popModalNavigation(modalId);
}

/**
 * Dismiss/close a modal from UI (e.g. clicking "X" button, backdrop, or Save)
 * Ensures modal closes in UI AND its entry is cleanly popped from browser history
 */
export function popModalNavigation(modalId) {
  if (typeof window === 'undefined') return;

  const idx = modalStack.findIndex(m => m.id === modalId);
  if (idx === -1) {
    return;
  }

  const [removed] = modalStack.splice(idx, 1);
  if (removed && typeof removed.onClose === 'function') {
    try {
      removed.onClose();
    } catch (e) {
      console.error('Error in modal onClose callback:', e);
    }
  }

  // Pop the corresponding history entry from browser
  isInternalPop = true;
  try {
    window.history.back();
  } catch {
    isInternalPop = false;
  }
}

/**
 * Programmatic "go back one step" (can be bound to in-app back buttons)
 */
export function goBackOneStep() {
  if (typeof window === 'undefined') return;

  if (modalStack.length > 0) {
    const topmost = modalStack[modalStack.length - 1];
    popModalNavigation(topmost.id);
  } else if (tabHistory.length > 1) {
    try {
      window.history.back();
    } catch {
      // fallback
      tabHistory.pop();
      const prevTab = tabHistory[tabHistory.length - 1];
      if (prevTab && tabChangeCallback) {
        tabChangeCallback(prevTab, 'backward');
      }
    }
  } else {
    // At root
    if (typeof toastCallback === 'function') {
      toastCallback('You are at the home dashboard', 'info');
    }
  }
}

/**
 * Get count of open modals / overlays in stack
 */
export function getOpenModalCount() {
  return modalStack.length;
}

/**
 * Check if a specific modal is in the navigation stack
 */
export function isModalInStack(modalId) {
  return modalStack.some(m => m.id === modalId);
}
