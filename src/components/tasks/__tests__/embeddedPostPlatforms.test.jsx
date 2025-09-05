import '@testing-library/jest-dom/vitest';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

// Mock the Icon component to avoid pulling in SVGs or external assets BEFORE importing the component under test
vi.mock('../atoms/Icon', () => ({
  default: ({ name, size, className }) => (
    <div data-testid={`icon-${name}`} className={className} style={{ width: size, height: size }}>
      {name}
    </div>
  )
}));

import EmbeddedPostViewer from '../EmbeddedPostViewer.jsx';
import { testContentEngagementTasks } from './testContentEngagementTasks.js';

// Ensure DOM is cleaned between tests to prevent cross-test queries
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock IntersectionObserver
beforeEach(() => {
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
});

describe('EmbeddedPostViewer', () => {
  let mockOnViewingComplete;
  let mockOnClose;

  beforeEach(() => {
    mockOnViewingComplete = vi.fn();
    mockOnClose = vi.fn();
  });

  test('should render component with YouTube URL', () => {
    const task = testContentEngagementTasks.find(t => t.postUrl.includes('youtube'));
    
    render(
      <EmbeddedPostViewer 
        postUrl={task.postUrl}
        requiredViewingTime={task.requiredViewingTime}
        onViewingComplete={mockOnViewingComplete}
        onClose={mockOnClose}
      />
    );

    // Component should render the modal header
    expect(screen.getByText('View Social Media Post')).toBeInTheDocument();
  });

  test('should render generic iframe for unsupported domains', () => {
    render(
      <EmbeddedPostViewer 
        postUrl="https://unsupported-platform.com/post/123"
        requiredViewingTime={30}
        onViewingComplete={mockOnViewingComplete}
        onClose={mockOnClose}
      />
    );

    // Generic fallback renders an iframe titled "Embedded content"
    expect(screen.getByTitle('Embedded content')).toBeInTheDocument();
  });

  test('should render Instagram iframe when given an Instagram URL', () => {
    const task = testContentEngagementTasks.find(t => t.postUrl.includes('instagram.com'));

    render(
      <EmbeddedPostViewer 
        postUrl={task.postUrl}
        requiredViewingTime={task.requiredViewingTime}
        onViewingComplete={mockOnViewingComplete}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByTitle('Instagram post')).toBeInTheDocument();
  });

  test('should render TikTok iframe when given a TikTok URL', () => {
    const task = testContentEngagementTasks.find(t => t.postUrl.includes('tiktok.com'));

    render(
      <EmbeddedPostViewer 
        postUrl={task.postUrl}
        requiredViewingTime={task.requiredViewingTime}
        onViewingComplete={mockOnViewingComplete}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByTitle('TikTok video')).toBeInTheDocument();
  });

  test('should render Twitter fallback message for Twitter/X URLs', () => {
    const task = testContentEngagementTasks.find(t => t.postUrl.includes('twitter.com') || t.postUrl.includes('x.com'));

    render(
      <EmbeddedPostViewer 
        postUrl={task.postUrl}
        requiredViewingTime={task.requiredViewingTime}
        onViewingComplete={mockOnViewingComplete}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Twitter/X posts require external viewing')).toBeInTheDocument();
    expect(screen.getByText('View Tweet')).toHaveAttribute('href', task.postUrl);
  });

  test('should show header text and viewing progress label', () => {
    render(
      <EmbeddedPostViewer 
        postUrl="https://example.com/post"
        requiredViewingTime={42}
        onViewingComplete={mockOnViewingComplete}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('View Social Media Post')).toBeInTheDocument();
    expect(screen.getByText('Viewing Progress')).toBeInTheDocument();
    // Shows required viewing time text (static rendering, not time-based)
    expect(screen.getByText(/Watch for 42 seconds to complete the task/)).toBeInTheDocument();
  });

  test('should call onClose when close button is clicked', () => {
    const { getByText } = render(
      <EmbeddedPostViewer 
        postUrl="https://example.com/post"
        requiredViewingTime={30}
        onViewingComplete={mockOnViewingComplete}
        onClose={mockOnClose}
      />
    );

    // Find the header root via the title in this render scope, then query its sibling button
    const titleEl = getByText('View Social Media Post');
    const headerRoot = titleEl.parentElement?.parentElement; // div (title wrapper) -> header container
    const closeBtn = headerRoot?.querySelector('button');
    expect(closeBtn).toBeTruthy();
    fireEvent.click(closeBtn);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});