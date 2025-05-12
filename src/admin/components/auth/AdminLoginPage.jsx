import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

const AdminLoginPage = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isDemo, setIsDemo] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAdminAuth();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      if (isDemo) {
        // For demo purposes, hardcode authentication
        if (username === 'admin' && password === 'password') {
          await login({ username, role: 'admin' });
          navigate('/');
        } else {
          setError('Invalid credentials. Try admin/password');
        }
      } else {
        // Use Supabase authentication
        await login({ email, password });
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col justify-center bg-deepLapis bg-pattern-arabesque">
      <div className="max-w-md w-full mx-auto p-8">
        {/* Logo and Title */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-royalGold to-textGold shadow-glow"></div>
          <h1 className="text-3xl font-calligraphy text-textGold tracking-wider">Golden Glow</h1>
          <p className="text-textLight/70 mt-1">Admin Portal</p>
        </div>
        
        {/* Login Form */}
        <div className="bg-deepLapisDark/60 backdrop-blur-sm arabesque-border shadow-lg rounded-lg p-8">
          <h2 className="text-xl font-medium text-textGold mb-6 text-center">Admin Login</h2>
          
          <div className="flex justify-center mb-6">
            <div className="flex rounded-md overflow-hidden">
              <button 
                className={`px-4 py-2 text-sm transition-colors ${isDemo ? 'bg-royalGold text-deepLapisDark' : 'bg-deepLapis/50 text-textLight/70'}`}
                onClick={() => setIsDemo(true)}
              >
                Demo
              </button>
              <button 
                className={`px-4 py-2 text-sm transition-colors ${!isDemo ? 'bg-royalGold text-deepLapisDark' : 'bg-deepLapis/50 text-textLight/70'}`}
                onClick={() => setIsDemo(false)}
              >
                Supabase
              </button>
            </div>
          </div>
          
          {error && (
            <div className="mb-4 bg-rubyRed/10 border border-rubyRed/30 text-rubyRed px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            {isDemo ? (
              <div className="mb-6">
                <label htmlFor="username" className="block text-textLight/80 text-sm font-medium mb-2">Username</label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2 rounded-md border border-royalGold/30 bg-deepLapis text-textLight focus:outline-none focus:border-royalGold/70 transition-colors"
                  placeholder="admin"
                  required
                />
              </div>
            ) : (
              <div className="mb-6">
                <label htmlFor="email" className="block text-textLight/80 text-sm font-medium mb-2">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 rounded-md border border-royalGold/30 bg-deepLapis text-textLight focus:outline-none focus:border-royalGold/70 transition-colors"
                  placeholder="admin@example.com"
                  required
                />
              </div>
            )}
            
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-textLight/80 text-sm font-medium">Password</label>
                <a href="#" className="text-xs text-royalGold hover:text-royalGold/80 transition-colors">Forgot Password?</a>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-md border border-royalGold/30 bg-deepLapis text-textLight focus:outline-none focus:border-royalGold/70 transition-colors"
                placeholder={isDemo ? "password" : "••••••••"}
                required
              />
            </div>
            
            <button
              type="submit"
              className={`w-full py-2.5 px-4 rounded-md font-medium transition-all ${isLoading 
                ? 'bg-royalGold/50 text-textLight/50 cursor-not-allowed' 
                : 'bg-gradient-to-r from-royalGold to-royalGold/80 text-deepLapis hover:shadow-glow-sm'}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </div>
              ) : 'Sign In'}
            </button>
          </form>
          
          {isDemo && (
            <div className="mt-6 text-center text-sm text-textLight/50">
              For demo purposes, use <span className="text-royalGold">admin</span> / <span className="text-royalGold">password</span>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="mt-8 text-center text-sm text-textLight/50">
          <p>© 2025 Golden Glow. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;