import { useEffect } from 'react';

/**
 * Synchronizes document theme attribute, title, and dynamic currency favicon.
 */
export function useTheme(settings = {}) {
  const theme = settings.theme || 'dark';
  const currencySymbol = settings.currencySymbol || '₹';

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.title = `${currencySymbol} Finance Manager`;

    const faviconEl =
      document.getElementById('app-favicon') || document.querySelector("link[rel*='icon']");
    if (faviconEl) {
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'>
        <rect width='32' height='32' rx='8' fill='#10b981'/>
        <text x='50%' y='68%' font-size='18' font-weight='bold' font-family='system-ui, sans-serif' fill='white' text-anchor='middle'>${currencySymbol}</text>
      </svg>`;
      faviconEl.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
    }
  }, [currencySymbol]);
}
