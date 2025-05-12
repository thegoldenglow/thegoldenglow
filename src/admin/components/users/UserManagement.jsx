import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const usersPerPage = 10;

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' });

      if (searchTerm) {
        query = query.or(`username.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      const from = (currentPage - 1) * usersPerPage;
      const to = from + usersPerPage - 1;
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data, error: usersError, count } = await query;
      if (usersError) throw usersError;
      setUsers(data || []);
      setTotalUsers(count || 0);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(`Failed to load users: ${err.message}`);
      setUsers([]);
      setTotalUsers(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1); // Reset to first page on new search
  };

  const totalPages = Math.ceil(totalUsers / usersPerPage);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  
  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-emeraldGreen/10 text-emeraldGreen';
      case 'inactive':
        return 'bg-rubyRed/10 text-rubyRed';
      case 'pending':
        return 'bg-royalGold/10 text-royalGold';
      default:
        return 'bg-textLight/10 text-textLight';
    }
  };

  return (
    <div className="py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-textGold mb-2">User Management</h1>
        <p className="text-textLight/80">View users on the Golden Glow platform. Users are added via Telegram.</p>
        {error && (
          <div className="mt-2 p-2 bg-rubyRed/10 border border-rubyRed/30 rounded text-rubyRed text-sm">
            {error}
          </div>
        )}
      </div>

      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center">
        <input 
          type="text" 
          placeholder="Search users by name or email..." 
          value={searchTerm} 
          onChange={handleSearchChange} 
          className="w-full sm:w-auto p-2 bg-deepLapisLight/60 border border-royalGold/30 rounded-md focus:ring-royalGold focus:border-royalGold text-textLight placeholder-textLight/50 mb-2 sm:mb-0"
        />
      </div>

      <div className="bg-deepLapisDark arabesque-border shadow-sm rounded-lg overflow-x-auto">
        {loading ? (
          <div className="p-6 text-center text-textLight">Loading users...</div>
        ) : error ? (
          <div className="p-6 text-center text-rubyRed">{error}</div>
        ) : users.length === 0 ? (
          <div className="p-6 text-center text-textLight">No users found.</div>
        ) : (
          <table className="w-full text-sm text-left text-textLight/90">
            <thead className="text-xs text-textGold uppercase bg-deepLapisLight/30">
              <tr>
                <th scope="col" className="px-6 py-3">User</th>
                <th scope="col" className="px-6 py-3">Role</th>
                <th scope="col" className="px-6 py-3">Status</th>
                <th scope="col" className="px-6 py-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="bg-deepLapisDark hover:bg-deepLapisLight/20 border-b border-royalGold/10">
                  <td className="px-6 py-4 font-medium whitespace-nowrap">
                    <div className="text-base text-textGold">{user.username || 'N/A'}</div>
                    <div className="text-xs text-textLight/70">{user.email || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 capitalize">{user.role || 'user'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusStyle(user.status)}`}>
                      {user.status || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && !loading && users.length > 0 && (
        <div className="mt-6 flex justify-between items-center text-sm">
          <span className="text-textLight/80">
            Page {currentPage} of {totalPages} (Total: {totalUsers} users)
          </span>
          <div className="space-x-2">
            <button 
              onClick={() => goToPage(currentPage - 1)} 
              disabled={currentPage === 1}
              className="px-3 py-1 border border-royalGold/30 rounded-md hover:bg-royalGold/10 disabled:opacity-50 disabled:cursor-not-allowed text-textLight"
            >
              Previous
            </button>
            <button 
              onClick={() => goToPage(currentPage + 1)} 
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-royalGold/30 rounded-md hover:bg-royalGold/10 disabled:opacity-50 disabled:cursor-not-allowed text-textLight"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;