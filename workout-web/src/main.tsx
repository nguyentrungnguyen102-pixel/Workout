import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { useThemeStore } from './stores/themeStore';

// Runs before the first render so themeStore's resolvedTheme (used by
// chart color literals — see lib/chartTheme.ts) matches the `dark` class
// index.html's inline script already applied to <html>.
useThemeStore.getState().init();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
