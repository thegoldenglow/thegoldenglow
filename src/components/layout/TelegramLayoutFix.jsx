import React, { useEffect } from 'react';

// Ensures consistent block-level rendering when opened inside Telegram WebApp.
// Applies minimal, reversible DOM tweaks without altering app layout elsewhere.
export default function TelegramLayoutFix({ children }) {
  useEffect(() => {
    const isTelegram = typeof window !== 'undefined' && !!window.Telegram?.WebApp;
    if (!isTelegram) return;

    const root = document.getElementById('root');
    const html = document.documentElement;
    const body = document.body;

    // Add a scope class so CSS can target Telegram context safely.
    body.classList.add('telegram-layout-fix');

    // Force predictable block rendering semantics in Telegram webview.
    if (root) root.style.display = 'block';
    if (body) body.style.display = 'block';
    if (html) html.style.display = 'block';

    return () => {
      // Cleanup to avoid leaking styles when navigating away.
      body.classList.remove('telegram-layout-fix');
      if (root) root.style.display = '';
      if (body) body.style.display = '';
      if (html) html.style.display = '';
    };
  }, []);

  return children;
}