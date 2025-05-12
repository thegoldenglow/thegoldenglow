import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';

const SystemSettings = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [appConfig, setAppConfig] = useState({
    appName: 'Golden Glow',
    environment: 'production',
    maintenanceMode: false
  });
  const [systemHealth, setSystemHealth] = useState({
    serverStatus: 'Operational',
    databaseStatus: 'Connected',
    cacheStatus: 'Active',
    memoryUsage: 0,
    cpuLoad: 0,
    lastDeployment: null
  });

  // Fetch system settings from Supabase
  useEffect(() => {
    const fetchSystemSettings = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch app configuration
        const { data: configData, error: configError } = await supabase
          .from('system_config')
          .select('*')
          .single();
          
        if (configError && configError.code !== 'PGRST116') {
          throw configError;
        }
        
        if (configData) {
          setAppConfig({
            appName: configData.app_name || 'Golden Glow',
            environment: configData.environment || 'production',
            maintenanceMode: configData.maintenance_mode || false
          });
        }
        
        // Fetch system health metrics
        const { data: healthData, error: healthError } = await supabase
          .from('system_health')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
          
        if (healthError && healthError.code !== 'PGRST116') {
          throw healthError;
        }
        
        if (healthData) {
          setSystemHealth({
            serverStatus: healthData.server_status || 'Operational',
            databaseStatus: healthData.database_status || 'Connected',
            cacheStatus: healthData.cache_status || 'Active',
            memoryUsage: healthData.memory_usage || 0,
            cpuLoad: healthData.cpu_load || 0,
            lastDeployment: healthData.last_deployment || new Date().toISOString()
          });
        }
      } catch (err) {
        console.error('Error fetching system settings:', err);
        setError(`Failed to load system settings: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSystemSettings();
  }, []);

  // Handle app config changes
  const handleAppConfigChange = (field, value) => {
    setAppConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Save app configuration
  const saveAppConfig = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('system_config')
        .upsert({
          id: 1, // Assuming a single config record with ID 1
          app_name: appConfig.appName,
          environment: appConfig.environment,
          maintenance_mode: appConfig.maintenanceMode,
          updated_at: new Date().toISOString()
        });
        
      if (error) throw error;
      
      // Show success message (could add a state for this)
      console.log('Configuration saved successfully');
    } catch (err) {
      console.error('Error saving configuration:', err);
      setError(`Failed to save configuration: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'N/A';
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Operational':
      case 'Connected':
      case 'Active':
        return 'text-emeraldGreen';
      case 'Degraded':
      case 'Warning':
        return 'text-amber';
      case 'Down':
      case 'Error':
      case 'Inactive':
        return 'text-rubyRed';
      default:
        return 'text-textLight/70';
    }
  };

  return (
    <div className="py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-textGold mb-2">System Settings</h1>
        <p className="text-textLight/80">Manage application configurations and system preferences.</p>
        {error && (
          <div className="mt-2 p-2 bg-rubyRed/10 border border-rubyRed/30 rounded text-rubyRed text-sm">
            {error}
          </div>
        )}
      </div>
      
      {loading ? (
        <div className="py-20 flex justify-center items-center">
          <div className="animate-spin w-10 h-10 border-3 border-royalGold/20 border-t-royalGold rounded-full"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Admin Users Panel */}
          <div className="bg-deepLapisDark arabesque-border shadow-sm rounded-lg overflow-hidden">
            <div className="p-4 border-b border-royalGold/10">
              <h2 className="font-medium text-textGold">Admin Users</h2>
            </div>
            <div className="p-6">
              <div className="flex flex-col items-center justify-center py-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-royalGold/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="text-lg font-medium text-textGold mb-2">Admin Management</h3>
                <p className="text-textLight/70 text-center">This feature is under development.</p>
              </div>
            </div>
          </div>
          
          {/* Roles & Permissions Panel */}
          <div className="bg-deepLapisDark arabesque-border shadow-sm rounded-lg overflow-hidden">
            <div className="p-4 border-b border-royalGold/10">
              <h2 className="font-medium text-textGold">Roles & Permissions</h2>
            </div>
            <div className="p-6">
              <div className="flex flex-col items-center justify-center py-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-royalGold/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <h3 className="text-lg font-medium text-textGold mb-2">Access Controls</h3>
                <p className="text-textLight/70 text-center">This feature is under development.</p>
              </div>
            </div>
          </div>
          
          {/* App Configuration Panel */}
          <div className="bg-deepLapisDark arabesque-border shadow-sm rounded-lg overflow-hidden">
            <div className="p-4 border-b border-royalGold/10">
              <h2 className="font-medium text-textGold">App Configuration</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-textLight/80 mb-1">Application Name</label>
                  <input
                    type="text"
                    value={appConfig.appName}
                    onChange={(e) => handleAppConfigChange('appName', e.target.value)}
                    className="w-full py-2 px-3 rounded-lg bg-deepLapis border border-royalGold/20 focus:border-royalGold/50 focus:outline-none text-textLight"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-textLight/80 mb-1">Environment</label>
                  <select
                    className="w-full py-2 px-3 rounded-lg bg-deepLapis border border-royalGold/20 focus:border-royalGold/50 focus:outline-none text-textLight"
                    value={appConfig.environment}
                    onChange={(e) => handleAppConfigChange('environment', e.target.value)}
                  >
                    <option value="development">Development</option>
                    <option value="staging">Staging</option>
                    <option value="production">Production</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-textLight/80 mb-1">Maintenance Mode</label>
                  <div className="flex items-center">
                    <label className="inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={appConfig.maintenanceMode}
                        onChange={(e) => handleAppConfigChange('maintenanceMode', e.target.checked)}
                      />
                      <div className="relative w-11 h-6 bg-deepLapis border border-royalGold/20 rounded-full peer peer-checked:bg-royalGold/30 peer-focus:outline-none">
                        <div className="absolute top-[2px] left-[2px] bg-textLight/50 w-5 h-5 rounded-full transition-all peer-checked:translate-x-full peer-checked:bg-textGold"></div>
                      </div>
                      <span className="ml-3 text-sm text-textLight/80">Enable maintenance mode</span>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 text-right">
                <button 
                  className="bg-gradient-to-r from-royalGold to-royalGold/80 text-deepLapis py-2 px-4 rounded-lg font-medium hover:shadow-glow-sm transition-all disabled:opacity-50"
                  onClick={saveAppConfig}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
          
          {/* System Health Panel */}
          <div className="bg-deepLapisDark arabesque-border shadow-sm rounded-lg overflow-hidden">
            <div className="p-4 border-b border-royalGold/10">
              <h2 className="font-medium text-textGold">System Health</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-textLight/80">Server Status</span>
                  <span className={`flex items-center ${getStatusColor(systemHealth.serverStatus)}`}>
                    <span className={`h-2 w-2 ${getStatusColor(systemHealth.serverStatus).replace('text-', 'bg-')} rounded-full mr-1`}></span>
                    {systemHealth.serverStatus}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-textLight/80">Database Status</span>
                  <span className={`flex items-center ${getStatusColor(systemHealth.databaseStatus)}`}>
                    <span className={`h-2 w-2 ${getStatusColor(systemHealth.databaseStatus).replace('text-', 'bg-')} rounded-full mr-1`}></span>
                    {systemHealth.databaseStatus}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-textLight/80">Redis Cache</span>
                  <span className={`flex items-center ${getStatusColor(systemHealth.cacheStatus)}`}>
                    <span className={`h-2 w-2 ${getStatusColor(systemHealth.cacheStatus).replace('text-', 'bg-')} rounded-full mr-1`}></span>
                    {systemHealth.cacheStatus}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-textLight/80">Memory Usage</span>
                  <span className="text-textGold">{systemHealth.memoryUsage}%</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-textLight/80">CPU Load</span>
                  <span className="text-textGold">{systemHealth.cpuLoad}%</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-textLight/80">Last Deployment</span>
                  <span className="text-textGold">{formatDate(systemHealth.lastDeployment)}</span>
                </div>
              </div>
              
              <div className="mt-6 text-center">
                <button className="text-sm text-royalGold hover:text-royalGold/80 transition-colors">
                  View Full System Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemSettings;