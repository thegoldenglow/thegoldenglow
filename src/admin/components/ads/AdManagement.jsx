import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseAvailable } from '../../utils/supabase';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

const AdManagement = () => {
  const { adminUser, isAuthenticated } = useAdminAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    activeCampaigns: 0,
    totalImpressions: 0,
    totalClicks: 0,
    ctr: 0
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCampaigns, setTotalCampaigns] = useState(0);
  const campaignsPerPage = 5;

  // State for new campaign modal
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const initialCampaignFormData = {
    name: '',
    type: 'Display', // Default type
    target_audience: '',
    budget: '',
    start_date: '',
    end_date: '',
    status: 'Draft', // Default status
    goal: '',
    direct_link: '', // Direct link for ads to appear in game
    video_url: '', // YouTube video URL for Video type campaigns
    reward_amount: 50, // Credits users earn for watching (default 50)
    required_watch_percentage: 80, // % of video user must watch (default 80%)
  };

  const [campaignFormData, setCampaignFormData] = useState(initialCampaignFormData);

  // Debug logging for campaign type changes
  useEffect(() => {
    console.log('Campaign type changed:', campaignFormData.type);
    console.log('Should show video fields:', campaignFormData.type === 'Video');
  }, [campaignFormData.type]);
  const [isSubmittingCampaign, setIsSubmittingCampaign] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [isDeletingCampaign, setIsDeletingCampaign] = useState(null);

  // Helper function to format numbers with commas
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Status badge styling helper
  const getStatusStyle = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-emeraldGreen/10 text-emeraldGreen';
      case 'Scheduled':
        return 'bg-royalGold/10 text-royalGold';
      case 'Draft':
        return 'bg-mysticalPurple/10 text-mysticalPurple';
      case 'Ended':
        return 'bg-rubyRed/10 text-rubyRed';
      default:
        return 'bg-textLight/10 text-textLight';
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
      return dateString;
    }
  };

  // Demo campaign data
  const demoCampaigns = [
    {
      id: 'demo-1',
      name: 'Summer Wellness',
      description: 'Promoting summer wellness activities and premium features',
      status: 'Active',
      target: 'All Users',
      start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      impressions: 8500,
      clicks: 340,
      ctr: 4.0,
      direct_link: 'https://example.com/summer-wellness-promo'
    },
    {
      id: 'demo-2',
      name: 'Premium Membership Promo',
      description: 'Special discount on premium membership upgrades',
      status: 'Active',
      target: 'Free Users',
      start_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      end_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      impressions: 5200,
      clicks: 156,
      ctr: 3.0,
      direct_link: 'https://example.com/premium-upgrade-50off'
    },
    {
      id: 'demo-3',
      name: 'New Features Announcement',
      description: 'Announcing new meditation and tracking features',
      status: 'Scheduled',
      target: 'All Users',
      start_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      end_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      impressions: 0,
      clicks: 0,
      ctr: 0,
      direct_link: 'https://example.com/new-features-beta'
    }
  ];

  // Fetch campaigns and stats from Supabase only
  const fetchCampaignsAndStats = async () => {
    setLoading(true);
    setError(null);

    try {
      // Production mode: Use Supabase
      // Get total count
      const { count, error: countError } = await supabase
        .from('ad_campaigns')
        .select('*', { count: 'exact', head: true });
        
      if (countError) throw countError;
      setTotalCampaigns(count || 0);
      
      // Calculate range for pagination
      const from = (currentPage - 1) * campaignsPerPage;
      const to = from + campaignsPerPage - 1;
      
      // Fetch paginated campaigns
      const { data, error: fetchError } = await supabase
        .from('ad_campaigns')
        .select(`
          *,
          ad_impressions(count),
          ad_clicks(count)
        `)
        .range(from, to)
        .order('created_at', { ascending: false });
        
      if (fetchError) throw fetchError;
      
      // Process campaign data with metrics
      const processedCampaigns = (data || []).map(campaign => {
        const impressions = campaign.ad_impressions?.length > 0 
          ? campaign.ad_impressions[0].count || 0 
          : 0;
          
        const clicks = campaign.ad_clicks?.length > 0 
          ? campaign.ad_clicks[0].count || 0 
          : 0;
          
        return {
          ...campaign,
          impressions: impressions,
          clicks: clicks,
          ctr: impressions > 0 ? (clicks / impressions * 100) : 0
        };
      });
      
      setCampaigns(processedCampaigns);
      
      // Get aggregate stats
      const { data: statsData, error: statsError } = await supabase
        .from('ad_stats')
        .select('*')
        .single();
        
      if (statsError && statsError.code !== 'PGRST116') throw statsError; // PGRST116 is "no rows returned" error
      
      // Get active campaigns count
      const { count: activeCount, error: activeError } = await supabase
        .from('ad_campaigns')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Active');
        
      if (activeError) throw activeError;
      
      setStats({
        activeCampaigns: activeCount || 0,
        totalImpressions: statsData?.total_impressions || 0,
        totalClicks: statsData?.total_clicks || 0,
        ctr: statsData?.total_impressions > 0 
          ? (statsData.total_clicks / statsData.total_impressions * 100) 
          : 0
      });
    } catch (err) {
      console.error('Error fetching ad campaigns:', err);
      setError(`Failed to load campaigns: ${err.message}`);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaignsAndStats();
  }, [currentPage]);

  const handleOpenCampaignModal = () => {
    setCampaignFormData(initialCampaignFormData);
    setModalError(null);
    setEditingCampaign(null);
    setIsCampaignModalOpen(true);
  };

  const handleEditCampaign = (campaign) => {
     console.log('Edit button clicked for campaign:', campaign);
     setCampaignFormData({
       name: campaign.name || '',
       type: campaign.type || 'Display',
       target_audience: campaign.target_audience || campaign.target || '',
       budget: campaign.budget ? campaign.budget.toString() : '',
       start_date: campaign.start_date ? new Date(campaign.start_date).toISOString().split('T')[0] : '',
       end_date: campaign.end_date ? new Date(campaign.end_date).toISOString().split('T')[0] : '',
       status: campaign.status || 'Draft',
       goal: campaign.goal || '',
       direct_link: campaign.direct_link || '',
       video_url: campaign.video_url || '',
       reward_amount: campaign.reward_amount || 50,
       required_watch_percentage: campaign.required_watch_percentage || 80,
     });
     setEditingCampaign(campaign);
     setModalError(null);
     setIsCampaignModalOpen(true);
   };

  const handleDeleteCampaign = async (campaignId) => {
    console.log('Delete button clicked for campaign ID:', campaignId);
    
    // Check if user is authenticated
    if (!isAuthenticated || !adminUser) {
      setError('You must be authenticated to delete campaigns. Please log in again.');
      return;
    }
    
    if (!window.confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      return;
    }

    setIsDeletingCampaign(campaignId);
    
    try {
      // Production mode: Use Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw new Error('Authentication session expired. Please log in again.');
      }
      
      if (!session) {
        throw new Error('No active session found. Please log in again.');
      }
      
      console.log('Authenticated user attempting delete:', session.user.email);
      
      const { error } = await supabase
        .from('ad_campaigns')
        .delete()
        .eq('id', campaignId);

      if (error) {
        console.error('Supabase delete error:', error);
        throw error;
      }

      console.log('Campaign deleted successfully:', campaignId);
      // Refresh the campaigns list
      fetchCampaignsAndStats();
    } catch (err) {
      console.error('Error deleting campaign:', err);
      setError(`Failed to delete campaign: ${err.message}`);
    } finally {
      setIsDeletingCampaign(null);
    }
  };

  const handleCloseCampaignModal = () => {
    setIsCampaignModalOpen(false);
    setModalError(null);
    setEditingCampaign(null);
  };

  const handleCampaignInputChange = (e) => {
    const { name, value } = e.target;
    setCampaignFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCampaignFormSubmit = async (e) => {
    e.preventDefault();
    setModalError(null);
    setIsSubmittingCampaign(true);

    // Check if user is authenticated
    if (!isAuthenticated || !adminUser) {
      setModalError('You must be authenticated to create/update campaigns. Please log in again.');
      setIsSubmittingCampaign(false);
      return;
    }

    // Basic Validation
    if (!campaignFormData.name.trim()) {
      setModalError('Campaign name is required.');
      setIsSubmittingCampaign(false);
      return;
    }
    if (!campaignFormData.budget || parseFloat(campaignFormData.budget) <= 0) {
      setModalError('Budget must be a positive number.');
      setIsSubmittingCampaign(false);
      return;
    }
    if (!campaignFormData.start_date) {
      setModalError('Start date is required.');
      setIsSubmittingCampaign(false);
      return;
    }
    if (campaignFormData.end_date && new Date(campaignFormData.end_date) < new Date(campaignFormData.start_date)) {
      setModalError('End date cannot be before start date.');
      setIsSubmittingCampaign(false);
      return;
    }
    // Video-specific validation
    if (campaignFormData.type === 'Video' && !campaignFormData.video_url?.trim()) {
      setModalError('YouTube Video URL is required for Video campaigns.');
      setIsSubmittingCampaign(false);
      return;
    }

    try {
      const campaignDataToSubmit = {
        ...campaignFormData,
        budget: parseFloat(campaignFormData.budget),
        reward_amount: parseInt(campaignFormData.reward_amount) || 50,
        required_watch_percentage: parseInt(campaignFormData.required_watch_percentage) || 80,
        // Ensure dates are in ISO format if not already, or null if empty for end_date
        start_date: campaignFormData.start_date ? new Date(campaignFormData.start_date).toISOString() : null,
        end_date: campaignFormData.end_date ? new Date(campaignFormData.end_date).toISOString() : null,
        target: campaignFormData.target_audience.trim() || 'General Audience' // Required field
      };

      // Production mode: Use Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw new Error('Authentication session expired. Please log in again.');
      }
      
      if (!session) {
        throw new Error('No active session found. Please log in again.');
      }
      
      console.log('Authenticated user attempting campaign operation:', session.user.email);

      if (editingCampaign) {
        // Update existing campaign
        const { data, error: updateError } = await supabase
          .from('ad_campaigns')
          .update(campaignDataToSubmit)
          .eq('id', editingCampaign.id)
          .select();

        if (updateError) throw updateError;
        console.log('Campaign updated:', data);
      } else {
        // Create new campaign
        const { data, error: insertError } = await supabase
          .from('ad_campaigns')
          .insert([campaignDataToSubmit])
          .select();

        if (insertError) throw insertError;
        console.log('Campaign added:', data);
      }

      handleCloseCampaignModal();
      // Go to first page to see new/updated campaign, assuming it's ordered by creation date descending
      if (currentPage !== 1 && !editingCampaign) {
        setCurrentPage(1);
      } else {
        fetchCampaignsAndStats(); // Refresh the current page
      }

    } catch (err) {
      console.error('Error submitting campaign:', err);
      setModalError(`Failed to ${editingCampaign ? 'update' : 'add'} campaign: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSubmittingCampaign(false);
    }
  };

  // Handle pagination
  const totalPages = Math.ceil(totalCampaigns / campaignsPerPage);
  
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-textGold mb-2">Ad Management</h1>
        <p className="text-textLight/80">Create and manage advertising campaigns for the Golden Glow platform.</p>
        {error && (
          <div className="mt-2 p-2 bg-rubyRed/10 border border-rubyRed/30 rounded text-rubyRed text-sm">
            {error}
          </div>
        )}

        {/* Supabase Connection Status */}
        <div className="mt-2 text-sm flex items-center justify-between">
          <div>
            {isSupabaseAvailable() ? (
              <span className="text-emeraldGreen">✅ Supabase Connected</span>
            ) : (
              <span className="text-rubyRed">❌ Supabase Not Configured</span>
            )}
          </div>
          {localStorage.getItem('adminUser') && (
            <button
              onClick={() => {
                localStorage.removeItem('adminUser');
                window.location.reload();
              }}
              className="text-xs text-royalGold hover:text-goldHover underline"
              title="Clear localStorage admin session and reload"
            >
              Clear Demo Session
            </button>
          )}
        </div>
      </div>

      {/* Add New Campaign Button */}
      <div className="mb-6 flex justify-end">
        <button 
          onClick={handleOpenCampaignModal}
          className="bg-royalGold/20 hover:bg-royalGold/30 text-textGold py-2 px-4 rounded text-sm transition-colors flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          New Campaign
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Ad Stats Summary Cards */}
        <div className="bg-deepLapisDark arabesque-border shadow-sm rounded-lg p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-textLight/60 text-sm">Active Campaigns</p>
              <h3 className="text-2xl font-bold text-textGold mt-1">{stats.activeCampaigns}</h3>
            </div>
            <div className="bg-emeraldGreen/10 rounded-lg p-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emeraldGreen" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-deepLapisDark arabesque-border shadow-sm rounded-lg p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-textLight/60 text-sm">Total Impressions</p>
              <h3 className="text-2xl font-bold text-textGold mt-1">{formatNumber(stats.totalImpressions)}</h3>
            </div>
            <div className="bg-royalGold/10 rounded-lg p-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-royalGold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-deepLapisDark arabesque-border shadow-sm rounded-lg p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-textLight/60 text-sm">Total Clicks</p>
              <h3 className="text-2xl font-bold text-textGold mt-1">{formatNumber(stats.totalClicks)}</h3>
              <p className="text-xs mt-1 text-emeraldGreen">{stats.ctr.toFixed(2)}% CTR</p>
            </div>
            <div className="bg-mysticalPurple/10 rounded-lg p-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-mysticalPurple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      {/* Ad Campaigns Table */}
      <div className="bg-deepLapisDark arabesque-border shadow-sm rounded-lg overflow-hidden">
        <div className="p-4 border-b border-royalGold/10 flex justify-between items-center">
          <h2 className="font-medium text-textGold">Ad Campaigns</h2>
        </div>
        
        <div className="p-4">
          {loading ? (
            <div className="py-20 flex justify-center items-center">
              <div className="animate-spin w-10 h-10 border-3 border-royalGold/20 border-t-royalGold rounded-full"></div>
            </div>
          ) : campaigns.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-royalGold/10">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textLight/50 uppercase tracking-wider">Campaign</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textLight/50 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textLight/50 uppercase tracking-wider">Target</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textLight/50 uppercase tracking-wider">Performance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textLight/50 uppercase tracking-wider">Timeline</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textLight/50 uppercase tracking-wider">Direct Link</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-textLight/50 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-royalGold/10 bg-deepLapis/30">
                  {campaigns.map((campaign) => (
                    <tr key={campaign.id}>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-textGold">{campaign.name}</p>
                          <p className="text-xs text-textLight/50 mt-1">{campaign.description}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(campaign.status)}`}>
                          {campaign.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-textLight/70">{campaign.target}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="flex items-center text-xs mb-1">
                            <span className="text-textLight/70 mr-2">Impressions:</span>
                            <span className="text-textLight">{formatNumber(campaign.impressions)}</span>
                          </div>
                          <div className="flex items-center text-xs">
                            <span className="text-textLight/70 mr-2">Clicks:</span>
                            <span className="text-textLight">{formatNumber(campaign.clicks)}</span>
                            {campaign.impressions > 0 && (
                              <span className="text-xs ml-2 text-emeraldGreen">
                                ({campaign.ctr.toFixed(2)}% CTR)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs text-textLight/70">
                          <div>Start: {formatDate(campaign.start_date)}</div>
                          <div>End: {formatDate(campaign.end_date)}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {campaign.direct_link ? (
                          <a 
                            href={campaign.direct_link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-royalGold hover:text-royalGold/80 underline break-all"
                          >
                            {campaign.direct_link.length > 30 ? 
                              campaign.direct_link.substring(0, 30) + '...' : 
                              campaign.direct_link
                            }
                          </a>
                        ) : (
                          <span className="text-xs text-textLight/40">No link</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm" style={{position: 'relative', zIndex: 10}}>
                        <div className="flex justify-end space-x-2" style={{position: 'relative', zIndex: 20}}>
                           <button 
                               type="button"
                               onClick={(e) => {
                                 e.preventDefault();
                                 e.stopPropagation();
                                 alert(`Edit clicked for: ${campaign.name}`);
                                 console.log('Edit button clicked for campaign:', campaign);
                                 handleEditCampaign(campaign);
                               }}
                               className="bg-royalGold/20 hover:bg-royalGold/30 text-royalGold px-3 py-1 rounded text-xs transition-colors font-medium cursor-pointer"
                               style={{pointerEvents: 'auto', zIndex: 1000}}
                             >
                               Edit
                             </button>
                             <button 
                               type="button"
                               onClick={(e) => {
                                 e.preventDefault();
                                 e.stopPropagation();
                                 console.log('Delete button clicked for campaign:', campaign);
                                 handleDeleteCampaign(campaign.id);
                               }}
                               disabled={isDeletingCampaign === campaign.id}
                               className="bg-rubyRed/20 hover:bg-rubyRed/30 text-rubyRed px-3 py-1 rounded text-xs transition-colors disabled:opacity-50 font-medium cursor-pointer"
                               style={{pointerEvents: 'auto', zIndex: 1000}}
                             >
                               {isDeletingCampaign === campaign.id ? 'Deleting...' : 'Delete'}
                             </button>
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-20 text-center">
              <p className="text-textLight/50">No campaigns found. Create one to get started.</p>
            </div>
          )}
          
          {campaigns.length > 0 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-textLight/50">
                Showing <span className="font-medium text-textLight">{campaigns.length}</span> of <span className="font-medium text-textLight">{totalCampaigns}</span> campaigns
              </div>
              <div className="flex items-center space-x-1">
                <button 
                  className={`border border-royalGold/20 text-textLight/70 rounded-md px-3 py-1 text-sm hover:bg-royalGold/5 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Calculate page numbers to show
                  let pageNum = i + 1;
                  if (totalPages > 5) {
                    if (currentPage > 3) {
                      pageNum = currentPage - 3 + i;
                    }
                    if (currentPage > totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    }
                  }
                  
                  if (pageNum <= totalPages) {
                    return (
                      <button 
                        key={pageNum}
                        className={`border border-royalGold/20 rounded-md px-3 py-1 text-sm ${
                          currentPage === pageNum 
                            ? 'bg-royalGold/10 text-textGold' 
                            : 'text-textLight/70 hover:bg-royalGold/5'
                        }`}
                        onClick={() => goToPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                  return null;
                })}
                
                <button 
                  className={`border border-royalGold/20 text-textLight/70 rounded-md px-3 py-1 text-sm hover:bg-royalGold/5 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Campaign Modal */}
      {isCampaignModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out opacity-100">
          <div className="bg-deepLapisDark arabesque-border-modal p-6 rounded-lg shadow-2xl w-full max-w-lg max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-textGold">{editingCampaign ? 'Edit Campaign' : 'Add New Campaign'}</h2>
              <button onClick={handleCloseCampaignModal} className="text-textLight/70 hover:text-textGold">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            {modalError && (
              <div className="mb-4 p-3 bg-rubyRed/10 border border-rubyRed/30 rounded text-rubyRed text-sm">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCampaignFormSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-textLight/90 mb-1">Campaign Name</label>
                <input 
                  type="text" 
                  name="name" 
                  id="name" 
                  value={campaignFormData.name} 
                  onChange={handleCampaignInputChange} 
                  className="w-full p-2 bg-deepLapisLight/60 border border-royalGold/30 rounded-md focus:ring-royalGold focus:border-royalGold text-textLight placeholder-textLight/50"
                  placeholder="e.g., Summer Sale Promotion"
                  required 
                />
              </div>

              <div>
                <label htmlFor="type" className="block text-sm font-medium text-textLight/90 mb-1">Campaign Type</label>
                <select 
                  name="type" 
                  id="type" 
                  value={campaignFormData.type} 
                  onChange={handleCampaignInputChange} 
                  className="w-full p-2 bg-deepLapisLight/60 border border-royalGold/30 rounded-md focus:ring-royalGold focus:border-royalGold text-textLight"
                >
                  <option value="Display">Display</option>
                  <option value="Search">Search</option>
                  <option value="Social Media">Social Media</option>
                  <option value="Video">Video</option>
                  <option value="Email">Email</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="target_audience" className="block text-sm font-medium text-textLight/90 mb-1">Target Audience (Optional)</label>
                <textarea 
                  name="target_audience" 
                  id="target_audience" 
                  rows="3" 
                  value={campaignFormData.target_audience} 
                  onChange={handleCampaignInputChange} 
                  className="w-full p-2 bg-deepLapisLight/60 border border-royalGold/30 rounded-md focus:ring-royalGold focus:border-royalGold text-textLight placeholder-textLight/50"
                  placeholder="e.g., Young professionals, 25-35, interested in gaming"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="budget" className="block text-sm font-medium text-textLight/90 mb-1">Budget ($)</label>
                  <input 
                    type="number" 
                    name="budget" 
                    id="budget" 
                    value={campaignFormData.budget} 
                    onChange={handleCampaignInputChange} 
                    className="w-full p-2 bg-deepLapisLight/60 border border-royalGold/30 rounded-md focus:ring-royalGold focus:border-royalGold text-textLight placeholder-textLight/50"
                    placeholder="e.g., 500"
                    min="0.01" 
                    step="0.01"
                    required 
                  />
                </div>
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-textLight/90 mb-1">Status</label>
                  <select 
                    name="status" 
                    id="status" 
                    value={campaignFormData.status} 
                    onChange={handleCampaignInputChange} 
                    className="w-full p-2 bg-deepLapisLight/60 border border-royalGold/30 rounded-md focus:ring-royalGold focus:border-royalGold text-textLight"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="Active">Active</option>
                    {/* Paused might be handled via edit, not create */}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="start_date" className="block text-sm font-medium text-textLight/90 mb-1">Start Date</label>
                  <input 
                    type="date" 
                    name="start_date" 
                    id="start_date" 
                    value={campaignFormData.start_date} 
                    onChange={handleCampaignInputChange} 
                    className="w-full p-2 bg-deepLapisLight/60 border border-royalGold/30 rounded-md focus:ring-royalGold focus:border-royalGold text-textLight calendar-picker-indicator-gold"
                    required 
                  />
                </div>
                <div>
                  <label htmlFor="end_date" className="block text-sm font-medium text-textLight/90 mb-1">End Date (Optional)</label>
                  <input 
                    type="date" 
                    name="end_date" 
                    id="end_date" 
                    value={campaignFormData.end_date} 
                    onChange={handleCampaignInputChange} 
                    className="w-full p-2 bg-deepLapisLight/60 border border-royalGold/30 rounded-md focus:ring-royalGold focus:border-royalGold text-textLight calendar-picker-indicator-gold"
                    min={campaignFormData.start_date || ''} // Prevent choosing end date before start date
                  />
                </div>
              </div>

              <div>
                <label htmlFor="goal" className="block text-sm font-medium text-textLight/90 mb-1">Campaign Goal (Optional)</label>
                <input 
                  type="text" 
                  name="goal" 
                  id="goal" 
                  value={campaignFormData.goal} 
                  onChange={handleCampaignInputChange} 
                  className="w-full p-2 bg-deepLapisLight/60 border border-royalGold/30 rounded-md focus:ring-royalGold focus:border-royalGold text-textLight placeholder-textLight/50"
                  placeholder="e.g., Increase brand awareness by 20%"
                />
              </div>

              {/* Video-Specific Fields - Only show when type is "Video" */}
              {campaignFormData.type === 'Video' && (
                <div className="p-4 bg-deepLapis/40 rounded-lg border border-royalGold/20 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">🎥</span>
                    <h4 className="text-sm font-medium text-textGold">Video Campaign Settings</h4>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="video_url" className="block text-sm font-medium text-textLight/90">
                        YouTube Video URL <span className="text-rubyRed">*</span>
                      </label>
                      {campaignFormData.video_url?.trim() ? (
                        <a
                          href={campaignFormData.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-royalGold hover:text-goldHover underline"
                          title="Open current video URL in a new tab"
                        >
                          Preview
                        </a>
                      ) : null}
                    </div>
                    <input
                      type="url"
                      name="video_url"
                      id="video_url"
                      value={campaignFormData.video_url}
                      onChange={handleCampaignInputChange}
                      className="w-full p-2 bg-deepLapisLight/60 border border-royalGold/30 rounded-md focus:ring-royalGold focus:border-royalGold text-textLight placeholder-textLight/50"
                      placeholder="https://www.youtube.com/watch?v=..."
                      required={campaignFormData.type === 'Video'}
                    />
                    <p className="text-xs text-textLight/60 mt-1">
                      Users must provide a valid YouTube link (watch, shorts, or youtu.be)
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="reward_amount" className="block text-sm font-medium text-textLight/90 mb-1">
                        Reward Amount (Credits)
                      </label>
                      <input
                        type="number"
                        name="reward_amount"
                        id="reward_amount"
                        value={campaignFormData.reward_amount}
                        onChange={handleCampaignInputChange}
                        className="w-full p-2 bg-deepLapisLight/60 border border-royalGold/30 rounded-md focus:ring-royalGold focus:border-royalGold text-textLight placeholder-textLight/50"
                        placeholder="50"
                        min="1"
                        max="1000"
                      />
                      <p className="text-xs text-textLight/60 mt-1">Golden Credits users earn</p>
                    </div>

                    <div>
                      <label htmlFor="required_watch_percentage" className="block text-sm font-medium text-textLight/90 mb-1">
                        Required Watch (%)
                      </label>
                      <input
                        type="number"
                        name="required_watch_percentage"
                        id="required_watch_percentage"
                        value={campaignFormData.required_watch_percentage}
                        onChange={handleCampaignInputChange}
                        className="w-full p-2 bg-deepLapisLight/60 border border-royalGold/30 rounded-md focus:ring-royalGold focus:border-royalGold text-textLight placeholder-textLight/50"
                        placeholder="80"
                        min="50"
                        max="100"
                      />
                      <p className="text-xs text-textLight/60 mt-1">% of video to watch</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Direct Link - Show for non-Video campaigns */}
              {campaignFormData.type !== 'Video' && (
                <div>
                  <label htmlFor="direct_link" className="block text-sm font-medium text-textLight/90 mb-1">Direct Link (Optional)</label>
                  <input
                    type="url"
                    name="direct_link"
                    id="direct_link"
                    value={campaignFormData.direct_link}
                    onChange={handleCampaignInputChange}
                    className="w-full p-2 bg-deepLapisLight/60 border border-royalGold/30 rounded-md focus:ring-royalGold focus:border-royalGold text-textLight placeholder-textLight/50"
                    placeholder="e.g., https://example.com/promo-page"
                  />
                  <p className="text-xs text-textLight/60 mt-1">This link will appear to users in the game when they interact with your ad</p>
                </div>
              )}

              <div className="pt-4 flex justify-end space-x-3">
                <button 
                  type="button" 
                  onClick={handleCloseCampaignModal} 
                  disabled={isSubmittingCampaign}
                  className="px-4 py-2 text-sm font-medium text-textLight/80 hover:text-textLight bg-transparent hover:bg-royalGold/10 rounded-md border border-royalGold/30 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmittingCampaign}
                  className="px-4 py-2 text-sm font-medium text-deepLapisDark bg-royalGold hover:bg-goldHover rounded-md transition-colors disabled:opacity-50 disabled:bg-royalGold/50 flex items-center"
                >
                  {isSubmittingCampaign ? (
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : null}
                  {isSubmittingCampaign ? (editingCampaign ? 'Updating...' : 'Creating...') : (editingCampaign ? 'Update Campaign' : 'Create Campaign')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdManagement;