import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdRewardModal from '../components/tasks/AdRewardModal.jsx';
import { RewardType } from '../utils/taskConstants.js';
import { vi, describe, it, expect } from 'vitest';

// Mock Supabase client chain used in AdRewardModal
vi.mock('../utils/supabase.js', () => {
  const campaigns = [
    {
      id: 'cmp-1',
      name: 'Test Video Campaign',
      description: 'A test campaign',
      direct_link: 'https://youtu.be/dQw4w9WgXcQ',
      video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      reward_amount: 50,
      required_watch_percentage: 80,
      status: 'Active',
      created_at: new Date().toISOString(),
    },
  ];

  const chain = {
    select: () => chain,
    eq: () => chain,
    order: () => ({ data: campaigns, error: null }),
  };

  return {
    supabase: {
      from: () => chain,
    },
  };
});

// Mock YouTubeVideoPlayer to avoid loading external scripts and to immediately complete
vi.mock('../components/ads/YouTubeVideoPlayer.jsx', () => ({
  __esModule: true,
  default: ({ onComplete }) => {
    // Immediately invoke completion to simulate watched video
    setTimeout(() => {
      if (typeof onComplete === 'function') onComplete();
    }, 0);
    return <div data-testid="yt-player">Mock Player</div>;
  },
}));

describe('AdRewardModal', () => {
  const baseTask = {
    id: 'task-1',
    rewards: [{ type: RewardType.MYSTIC_COINS, amount: 10 }],
  };

  it('loads campaigns, starts ad, and shows doubled rewards on completion', async () => {
    const onClose = vi.fn();
    const onAdCompleted = vi.fn();

    render(<AdRewardModal task={baseTask} onClose={onClose} onAdCompleted={onAdCompleted} />);

    // Pre-ad screen should mention readiness once campaigns load
    const readyText = await screen.findByText(/Ready to play: Test Video Campaign/i);
    expect(readyText).toBeTruthy();

    // Proceed to start ad (switches view to player)
    const proceedBtn = screen.getByRole('button', { name: /Proceed/i });
    fireEvent.click(proceedBtn);

    // Mock player renders
    const player = await screen.findByTestId('yt-player');
    expect(player).toBeTruthy();

    // After onComplete, it should transition to post-ad screen with doubled rewards
    await waitFor(() => {
      expect(screen.getByText(/Wisdom received!/i)).toBeTruthy();
    });

    // Reward should be doubled: +20 Mystic Coins
    expect(screen.getByText(/\+20\s+Mystic Coins/i)).toBeTruthy();

    // "Continue your journey" CTA present
    expect(screen.getByRole('button', { name: /Continue your journey/i })).toBeTruthy();

    // Handler should be called when user finishes ad
    // Click continue to trigger onAdCompleted(true)
    fireEvent.click(screen.getByRole('button', { name: /Continue your journey/i }));
    expect(onAdCompleted).toHaveBeenCalledWith(true);
  });
});