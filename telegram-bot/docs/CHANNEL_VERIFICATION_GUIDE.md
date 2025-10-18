# 📢 Telegram Channel Verification Guide

This bot requires users to join your channel before they can play the game.

## 🎯 How It Works

1. User sends `/start`
2. Bot checks membership in `@GoldenGlowGlobal`
3. If not a member: shows JOIN + I Joined buttons
4. User joins → clicks I Joined → bot verifies via Telegram API
5. If verified: shows PLAY NOW button

## 🔧 Config

- `TELEGRAM_REQUIRED_CHANNEL` (default: `@GoldenGlowGlobal`)
- `TELEGRAM_SKIP_MEMBERSHIP_CHECK` (optional for testing)

## 🛠 Requirements

- Bot must be an ADMIN in the channel to check membership

## Troubleshooting

- "member list is inaccessible" → Bot needs admin rights
- Everyone can play without joining → check skip flag/admin rights
- Button does nothing → check function logs, token, channel username
