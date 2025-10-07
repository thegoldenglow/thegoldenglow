import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import TelegramLayoutFix from '../components/layout/TelegramLayoutFix.jsx';

// Simple Telegram WebApp stub for tests
function setupTelegramStub() {
  window.Telegram = {
    WebApp: {
      version: 'test',
      initData: 'test-init-data',
    },
  };
}

describe('TelegramLayoutFix', () => {
  beforeEach(() => {
    // Ensure a #root element exists like in the real app
    const root = document.createElement('div');
    root.id = 'root';
    document.body.appendChild(root);
    setupTelegramStub();
  });

  afterEach(() => {
    cleanup();
    // Clean up #root and Telegram stub
    const root = document.getElementById('root');
    if (root) root.remove();
    delete window.Telegram;
  });

  it('applies block display and body class when in Telegram', () => {
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById('root');

    // Pre-conditions
    expect(body.classList.contains('telegram-layout-fix')).toBe(false);
    expect(html.style.display).toBe('');
    expect(body.style.display).toBe('');
    expect(root.style.display).toBe('');

    render(
      <TelegramLayoutFix>
        <div data-testid="content">content</div>
      </TelegramLayoutFix>
    );

    // Effect applied
    expect(body.classList.contains('telegram-layout-fix')).toBe(true);
    expect(html.style.display).toBe('block');
    expect(body.style.display).toBe('block');
    expect(root.style.display).toBe('block');
  });

  it('cleans up styles and class on unmount', () => {
    const { unmount } = render(
      <TelegramLayoutFix>
        <div>content</div>
      </TelegramLayoutFix>
    );

    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById('root');

    // Verify applied
    expect(body.classList.contains('telegram-layout-fix')).toBe(true);

    // Unmount and verify cleanup
    unmount();
    expect(body.classList.contains('telegram-layout-fix')).toBe(false);
    expect(html.style.display).toBe('');
    expect(body.style.display).toBe('');
    expect(root.style.display).toBe('');
  });
});