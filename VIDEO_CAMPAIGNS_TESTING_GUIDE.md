# Video Campaigns - Testing Guide

## ✅ Implementation Complete

### What Was Implemented:

1. **Admin Panel Enhancement** (`src/admin/components/ads/AdManagement.jsx`)
   - Added video campaign fields (video_url, reward_amount, required_watch_percentage)
   - Demo mode localStorage support for campaign creation
   - Fixed bug where editing demo campaigns wasn't saving to localStorage

2. **User-Facing Video Player** (`src/components/ads/YouTubeVideoPlayer.jsx`)
   - YouTube video embedding with react-youtube
   - Watch progress tracking
   - Reward system integration
   - Credit awarding when required watch percentage is reached

3. **Sponsored Videos Widget** (`src/components/ads/AdsWidget.jsx`)
   - Loads active Video-type campaigns from database or localStorage
   - Displays campaigns with navigation (Previous, Random, Next)
   - Shows reward notifications

4. **Database Migration** (`supabase/migrations/20251001_add_video_campaign_fields.sql`)
   - Added `video_url`, `reward_amount`, `required_watch_percentage` columns to `ad_campaigns` table
   - ✅ Successfully applied to Supabase database via MCP

---

## 📋 How to Test

### Prerequisites:
- Run `npm install` to ensure all dependencies are installed
- Make sure the development server is running on the correct port

### Test Steps:

#### Option A: Using Supabase (Production)
1. **Navigate to Admin Panel:**
   ```
   http://localhost:PORT/admin
   ```

2. **Login with Supabase credentials**

3. **Create a Video Campaign:**
   - Go to Ads Management
   - Click "+ New Campaign"
   - Fill in:
     - Name: "Test Video Campaign"
     - Type: **Video**
     - Status: **Active**
     - Budget: 500
     - Start Date: Today
     - YouTube Video URL: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
     - Reward Amount: 50 credits
     - Required Watch: 80%
   - Click "Create Campaign"

4. **View on Daily Tasks Page:**
   ```
   http://localhost:PORT/daily-tasks
   ```
   - Scroll to "Sponsored Videos" widget
   - YouTube video should appear
   - Watch 80% of the video to earn 50 credits

#### Option B: Using Demo Mode (localStorage)
1. **Navigate to Admin Panel:**
   ```
   http://localhost:PORT/admin
   ```

2. **Login with Demo mode** (admin / password)

3. **Create Campaign** (same as Option A, steps 3-4)

4. **Verify localStorage:**
   Open browser console (F12) and run:
   ```javascript
   JSON.parse(localStorage.getItem('gg_local_campaigns'))
   ```
   You should see your campaign with `type: "Video"` and `video_url` populated

---

## 🔧 Key Features:

### Admin Side:
- ✅ Campaign Type dropdown includes "Video"
- ✅ Video-specific fields appear when "Video" is selected
- ✅ Validation ensures video_url is required for Video campaigns
- ✅ Demo mode saves campaigns to `gg_local_campaigns` in localStorage
- ✅ Production mode saves to Supabase `ad_campaigns` table

### User Side:
- ✅ Loads only Active Video campaigns
- ✅ Filters campaigns with valid YouTube URLs
- ✅ Displays video using YouTubeVideoPlayer component
- ✅ Tracks watch progress in real-time
- ✅ Awards credits when required percentage is watched
- ✅ Records ad impressions in database
- ✅ Shows reward notification

### Database:
- ✅ Migration applied to Supabase
- ✅ Columns added: `video_url`, `reward_amount`, `required_watch_percentage`, `direct_link`, `updated_at`
- ✅ Index created for faster queries: `idx_ad_campaigns_type_status`
- ✅ View created: `active_video_campaigns` for easy querying

---

## 🐛 Known Issues:

1. **Port 3001 Initialization Error:**
   - If port 3001 shows "App failed to initialize", use the main port instead
   - Check console for specific error details
   - Ensure all dependencies are installed

2. **Demo Mode Campaign Editing Bug - FIXED:**
   - ✅ Previously, editing demo campaigns didn't save to localStorage
   - ✅ Now properly saves edited demo campaigns

---

## 📊 Testing Checklist:

- [ ] Admin can create Video campaigns
- [ ] Admin can edit existing campaigns to Video type
- [ ] Video campaigns appear in localStorage (demo mode)
- [ ] Video campaigns appear in database (production mode)
- [ ] Sponsored Videos widget loads on Daily Tasks page
- [ ] YouTube video plays correctly
- [ ] Watch progress displays (e.g., "60% / 80%")
- [ ] Credits are awarded when threshold is reached
- [ ] Reward notification appears
- [ ] Multiple campaigns can be created
- [ ] Navigation (Previous, Random, Next) works
- [ ] Only Active Video campaigns with valid URLs appear

---

## 🎯 Next Steps:

1. **Test on the correct port** - Identify which port your dev server is running on
2. **Create multiple video campaigns** to test randomization
3. **Verify Supabase integration** by checking the `ad_campaigns` table directly
4. **Test reward awarding** by watching videos and checking user points

---

## 🚀 Production Deployment:

When deploying to production:
1. ✅ Migration already applied to Supabase
2. Ensure `react-youtube` package is in `package.json` dependencies
3. Test video playback on production domain
4. Monitor ad_impressions table for tracking
5. Consider adding analytics for video completion rates

---

## 💡 Tips:

- **Quick Test Video:** Use `https://www.youtube.com/watch?v=dQw4w9WgXcQ` (short Rick Roll)
- **Debugging:** Check browser console for logs like "Loading video campaigns from localStorage"
- **Clear Data:** Run `localStorage.clear()` in console to reset demo mode data
- **View Raw Data:** Run `localStorage.getItem('gg_local_campaigns')` to see campaign JSON

---

## 📞 Support:

If issues persist:
1. Check browser console for errors
2. Verify database migration was applied successfully
3. Ensure `react-youtube` package is installed
4. Check that the correct port is being used



