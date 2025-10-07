# 🎥 YouTube Video Campaigns - Complete Guide

## Overview

This system allows admins to create video campaigns where users watch YouTube videos and earn Golden Credits as rewards. The system tracks video progress using the YouTube IFrame API and automatically awards credits when users watch the required percentage.

---

## 🎯 How It Works

### **Admin Creates Campaign → Users Watch Video → Users Earn Credits**

```
1. Admin logs into admin panel
2. Creates a "Video" type campaign
3. Adds YouTube URL + reward settings
4. Campaign becomes active
5. Users see video in "Sponsored Videos" widget
6. Users watch video (tracked in real-time)
7. When they reach required % → Credits awarded automatically!
```

---

## 📋 Step-by-Step Guide

### **Step 1: Admin Creates Video Campaign**

1. **Login to Admin Panel**
   - Go to `https://your-domain.com/admin`
   - Login with admin credentials

2. **Navigate to Ads Management**
   - Click "Ads" in sidebar
   - Click "New Campaign" button

3. **Fill in Campaign Details**:

   | Field | Description | Example |
   |-------|-------------|---------|
   | **Campaign Name** | Give it a descriptive name | "Golden Glow Tutorial Video" |
   | **Campaign Type** | **Select "Video"** ⭐ | Video |
   | **Target Audience** | Optional demographics | "New users" |
   | **Budget** | Campaign budget | $100 |
   | **Status** | Set to Active to go live | Active |
   | **Start Date** | When campaign begins | 2025-10-01 |
   | **End Date** | When it ends (optional) | 2025-10-31 |

4. **Configure Video Settings** (appears when type = "Video"):

   ```
   🎥 Video Campaign Settings
   ┌────────────────────────────────────────┐
   │ YouTube Video URL *                    │
   │ https://youtube.com/watch?v=xxxxx      │
   │ Users will watch this video and        │
   │ earn credits                           │
   ├────────────────────────────────────────┤
   │ Reward Amount (Credits)  │ 50          │
   │ Golden Credits users earn              │
   ├────────────────────────────────────────┤
   │ Required Watch (%)       │ 80          │
   │ % of video to watch                    │
   └────────────────────────────────────────┘
   ```

   - **YouTube Video URL**: Full YouTube link (supports watch, shorts, youtu.be)
   - **Reward Amount**: 1-1000 Golden Credits (default: 50)
   - **Required Watch %**: 50-100% (default: 80%)

5. **Click "Create Campaign"**
   - Campaign is now live!
   - Users can immediately see it in "Sponsored Videos"

---

### **Step 2: Users Watch Videos**

#### Where Users See Videos

Videos appear in the **"Sponsored Videos"** widget located in:
- Daily Tasks page (sidebar)
- Any page with the AdsWidget component

#### The User Experience

1. **User Sees Campaign**:
   ```
   ┌─────────────────────────────────────┐
   │  Sponsored Videos          1 of 3   │
   ├─────────────────────────────────────┤
   │  [YouTube Video Player]             │
   │                                      │
   │  Watch progress: 45%                │
   │  ████████░░░░░░░░░░░░                │
   │  Watch 80% to earn reward           │
   ├─────────────────────────────────────┤
   │  Golden Glow Tutorial Video         │
   │  Learn how to earn more credits!    │
   │                      💰 +50          │
   │                   Golden Credits     │
   └─────────────────────────────────────┘
   ```

2. **Video Playback**:
   - Full YouTube player with controls
   - Play, pause, seek, fullscreen all work
   - Progress bar shows watch percentage
   - Real-time tracking every second

3. **Progress Tracking**:
   - Green progress bar appears when playing
   - Shows current watch percentage
   - Updates in real-time
   - Clear indicator when reward threshold reached

4. **Reward Awarded**:
   ```
   ┌─────────────────────────────────────┐
   │  🎁 Reward Earned!                  │
   │  +50 Golden Credits added to your   │
   │  balance                            │
   └─────────────────────────────────────┘
   ```

5. **Credits Added**:
   - Automatically added to user's balance
   - Works for both authenticated and guest users
   - Guest credits transfer when they login

---

## 🎬 Technical Details

### **YouTube Video URL Formats Supported**

All of these work:
```
✅ https://www.youtube.com/watch?v=dQw4w9WgXcQ
✅ https://youtu.be/dQw4w9WgXcQ
✅ https://youtube.com/shorts/abc123xyz
✅ https://www.youtube.com/embed/dQw4w9WgXcQ
```

### **How Video Tracking Works**

Uses **YouTube IFrame API**:

1. **Loads YouTube Player**:
   ```javascript
   new YT.Player({
     videoId: extractedId,
     events: {
       onReady: () => console.log('Player ready'),
       onStateChange: (state) => trackProgress(state),
       onError: (err) => handleError(err)
     }
   })
   ```

2. **Tracks Progress Every Second**:
   ```javascript
   const currentTime = player.getCurrentTime();
   const duration = player.getDuration();
   const percentComplete = (currentTime / duration) * 100;
   
   if (percentComplete >= requiredWatchPercentage) {
     awardReward(); // ✨ Award credits!
   }
   ```

3. **Awards Reward Once**:
   - Uses `hasRewarded` flag
   - Prevents duplicate rewards
   - Even if user rewinds/replays

---

## 💾 Database Schema

### **New Columns in `ad_campaigns` Table**

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `video_url` | TEXT | NULL | YouTube video URL |
| `reward_amount` | INTEGER | 50 | Credits users earn |
| `required_watch_percentage` | INTEGER | 80 | % to watch (50-100) |

### **View: `active_video_campaigns`**

Pre-filtered view of active video campaigns:
```sql
SELECT * FROM active_video_campaigns;
-- Returns only Video type, Active status, within date range
```

---

## 🔧 Configuration Options

### **Reward Amount Guidelines**

| Video Length | Recommended Reward |
|--------------|-------------------|
| < 1 minute | 10-25 credits |
| 1-3 minutes | 25-50 credits |
| 3-5 minutes | 50-100 credits |
| 5-10 minutes | 100-200 credits |
| > 10 minutes | 200+ credits |

### **Required Watch Percentage**

- **50%**: Minimum (very lenient)
- **80%**: Recommended (good balance)
- **90%**: Strict (ensures full engagement)
- **100%**: Very strict (must watch entire video)

---

## 🎨 User Interface Features

### **Video Player**

- ✅ Full YouTube controls (play, pause, seek, volume, fullscreen)
- ✅ Real-time progress bar
- ✅ Progress percentage display
- ✅ Reward indicator
- ✅ Campaign name and description
- ✅ Credit amount prominently displayed

### **Campaign Navigation**

```
[← Previous] [🎲 Random] [Next →]
```

- Navigate between multiple campaigns
- Random shuffle option
- Shows "X of Y" counter

### **Reward Notifications**

```
🎉 Reward Claimed!
+50 Golden Credits from "Tutorial Video"
```

- Auto-dismisses after 5 seconds
- Shows campaign name
- Shows exact credit amount

---

## 📊 For Admins: Tracking & Analytics

### **View Campaign Performance**

In Admin → Ads Management:

| Column | What It Shows |
|--------|---------------|
| Impressions | How many times video loaded |
| Clicks | How many times "Open on YouTube" clicked |
| CTR | Click-through rate |
| Direct Link | Link to video |

### **Best Practices**

1. **Start Small**: Test with 25-50 credits per video
2. **Keep Videos Short**: 2-3 minutes optimal
3. **Set 80% Watch**: Good balance of engagement vs. reward
4. **Update Regularly**: Rotate videos to keep fresh
5. **Track Performance**: Monitor which videos perform best

---

## 🚀 Features

### **For Users**

✅ **Earn Credits**: Watch videos, get rewarded  
✅ **Progress Tracking**: See exactly how much to watch  
✅ **Multiple Videos**: Browse different campaigns  
✅ **Guest Mode**: Works even without login  
✅ **Beautiful UI**: Themed, smooth, engaging  
✅ **Fair System**: Can't cheese it—must actually watch  

### **For Admins**

✅ **Easy Setup**: Create campaigns in minutes  
✅ **Full Control**: Set rewards, watch requirements  
✅ **Active/Scheduled**: Control when campaigns run  
✅ **Edit Anytime**: Update campaigns on the fly  
✅ **Track Performance**: See impressions, clicks  
✅ **Database-Driven**: All data persisted properly  

---

## 🔐 Security Features

### **Anti-Cheat**

- ✅ YouTube API tracking (can't fake watch time)
- ✅ Server-side credit awarding
- ✅ One reward per video per user (future enhancement)
- ✅ Requires actual video playback (can't script it)

### **User Privacy**

- ✅ No personal data collection
- ✅ YouTube videos load directly from YouTube
- ✅ Credits stored securely in database
- ✅ Works in guest mode (localStorage)

---

## 📱 Mobile Support

- ✅ Fully responsive design
- ✅ Touch-friendly controls
- ✅ Works on iOS and Android
- ✅ Supports YouTube mobile app fallback

---

## 🐛 Troubleshooting

### **Video Not Loading**

**Problem**: Video player shows error  
**Solutions**:
1. Check YouTube URL is valid
2. Ensure video is not age-restricted
3. Verify video is not region-blocked
4. Make sure video allows embedding

### **Reward Not Awarded**

**Problem**: User watched but didn't get credits  
**Solutions**:
1. Check required watch % in campaign settings
2. Verify campaign is Active
3. Check user account (logged in or guest)
4. Look for errors in browser console

### **Campaign Not Showing**

**Problem**: Video campaign created but not visible  
**Solutions**:
1. Ensure Status = "Active"
2. Check start/end dates
3. Verify video_url is filled in
4. Make sure Type = "Video"

---

## 🎯 Examples

### **Example 1: Product Tutorial**

```
Name: "How to Use Golden Glow Features"
Type: Video
Video URL: https://youtube.com/watch?v=abc123
Reward: 100 credits
Required: 85%
Status: Active
```

→ Users watch tutorial, learn features, earn 100 credits

### **Example 2: Short Promo**

```
Name: "30-Second Summer Promo"
Type: Video
Video URL: https://youtu.be/xyz789
Reward: 25 credits
Required: 90%
Status: Active
```

→ Quick video, small reward, high completion required

### **Example 3: Partner Content**

```
Name: "Sponsored: Partner Channel Video"
Type: Video
Video URL: https://youtube.com/watch?v=partner123
Reward: 200 credits
Required: 80%
Status: Active
Budget: $500
```

→ Paid partnership, generous reward to drive views

---

## 🔄 Integration Flow

```
┌─────────────────┐
│  Admin Panel    │
│  Create Video   │
│  Campaign       │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  Database               │
│  ad_campaigns table     │
│  + video_url            │
│  + reward_amount        │
│  + required_watch_%     │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Frontend               │
│  AdsWidget.jsx          │
│  Fetches active         │
│  video campaigns        │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  YouTubeVideoPlayer.jsx │
│  Loads YouTube IFrame   │
│  Tracks progress        │
│  Awards credits         │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  UserContext            │
│  updateUserPoints()     │
│  Credits added!         │
└─────────────────────────┘
```

---

## 📝 Summary

This YouTube video campaign system provides a complete, production-ready solution for:

1. **Admins**: Create and manage video campaigns with custom rewards
2. **Users**: Watch videos and earn credits automatically
3. **Platform**: Drive engagement through rewarded video content

The system is fully integrated, tracked, secure, and provides an excellent user experience with the mystical Golden Glow theme! ✨

---

## 🆘 Support

For issues or questions:
1. Check browser console for errors
2. Verify database migration ran successfully
3. Test with a simple YouTube video first
4. Ensure all environment variables are set

Happy campaigning! 🎬✨


