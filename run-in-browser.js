(function() {
  // Read campaigns from localStorage
  const campaigns = JSON.parse(localStorage.getItem('gg_local_campaigns') || '[]');
  
  // Helper function to extract YouTube ID
  function extractYouTubeId(url) {
    if (!url) return null;
    try {
      const shorts = url.match(/youtube\.com\/shorts\/([\w-]{6,})/i);
      if (shorts) return shorts[1];
      const watch = url.match(/[?&]v=([\w-]{6,})/i);
      if (watch) return watch[1];
      const youtu = url.match(/youtu\.be\/([\w-]{6,})/i);
      if (youtu) return youtu[1];
      const u = new URL(url);
      const seg = u.pathname.split('/').filter(Boolean).pop();
      if (seg && /^[\w-]{6,}$/.test(seg)) return seg;
    } catch (_) {
      return null;
    }
    return null;
  }
  
  // Analyze campaigns
  const videoCampaigns = campaigns.filter(c => c.type === 'Video');
  const activeVideoCampaigns = videoCampaigns.filter(c => c.status === 'Active');
  const validCampaigns = activeVideoCampaigns.filter(c => {
    const url = c.video_url || c.direct_link;
    return !!extractYouTubeId(url);
  });
  
  // Create detailed report
  const report = {
    summary: {
      totalCampaigns: campaigns.length,
      videoCampaigns: videoCampaigns.length,
      activeVideoCampaigns: activeVideoCampaigns.length,
      validCampaigns: validCampaigns.length
    },
    campaigns: videoCampaigns.map(c => {
      const url = c.video_url || c.direct_link;
      const videoId = extractYouTubeId(url);
      const isActive = c.status === 'Active';
      const hasValidUrl = !!videoId;
      const isValid = isActive && hasValidUrl;
      
      const issues = [];
      if (c.type !== 'Video') issues.push('Type is not "Video"');
      if (!isActive) issues.push('Status is not "Active"');
      if (!url) issues.push('video_url is missing');
      if (url && !videoId) issues.push('Invalid YouTube URL format');
      
      return {
        id: c.id,
        name: c.name,
        type: c.type,
        status: c.status,
        video_url: c.video_url || null,
        direct_link: c.direct_link || null,
        reward_amount: c.reward_amount || 50,
        required_watch_percentage: c.required_watch_percentage || 80,
        start_date: c.start_date,
        end_date: c.end_date,
        extracted_video_id: videoId,
        is_valid: isValid,
        issues: issues
      };
    })
  };
  
  // Output the report
  console.clear();
  console.log('📊 CAMPAIGN REPORT');
  console.log('='.repeat(60));
  console.log('\n📈 Summary:');
  console.log('   Total Campaigns:', report.summary.totalCampaigns);
  console.log('   Video Campaigns:', report.summary.videoCampaigns);
  console.log('   Active Video Campaigns:', report.summary.activeVideoCampaigns);
  console.log('   ✅ Valid for Display:', report.summary.validCampaigns);
  
  console.log('\n🎥 Campaign Details:');
  report.campaigns.forEach((c, i) => {
    console.log(`\n[${i + 1}] ${c.name}`);
    console.log(`    ID: ${c.id}`);
    console.log(`    Type: ${c.type}`);
    console.log(`    Status: ${c.status}`);
    console.log(`    Video URL: ${c.video_url || c.direct_link || 'MISSING'}`);
    console.log(`    Extracted ID: ${c.extracted_video_id || 'FAILED'}`);
    console.log(`    Reward: ${c.reward_amount} credits`);
    console.log(`    Required Watch: ${c.required_watch_percentage}%`);
    console.log(`    Valid: ${c.is_valid ? '✅ YES' : '❌ NO'}`);
    if (c.issues.length > 0) {
      console.log(`    Issues:`);
      c.issues.forEach(issue => console.log(`      - ${issue}`));
    }
  });
  
  console.log('\n' + '='.repeat(60));
  
  if (report.summary.validCampaigns === 0) {
    console.log('\n❌ NO VALID CAMPAIGNS FOUND!');
    console.log('\n🔧 Action Required:');
    console.log('   1. Go to http://localhost:3000/admin');
    console.log('   2. Navigate to Ads Management');
    console.log('   3. Edit your campaign:');
    console.log('      - Set Type to "Video"');
    console.log('      - Set Status to "Active"');
    console.log('      - Add a YouTube URL in the video_url field');
    console.log('   4. Click Update Campaign');
  } else {
    console.log(`\n✅ Found ${report.summary.validCampaigns} valid campaign(s)!`);
    console.log('\n   These should appear in the Sponsored Videos widget.');
    console.log('   If not, click the Refresh button in the widget.');
  }
  
  // Also save to a variable for easy copying
  window.campaignReport = report;
  console.log('\n💾 Full report saved to: window.campaignReport');
  console.log('   Type "copy(JSON.stringify(campaignReport, null, 2))" to copy JSON');
  
  return report;
})();