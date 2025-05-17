import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import { FiPlus, FiEdit2, FiSave, FiX, FiRefreshCw } from 'react-icons/fi';
import { loadAllUsers, createRealUser, updateUserPoints } from '../../utils/userManager';
import { notifyListeners, refreshUserData } from '../../utils/adminDataService';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [editingUser, setEditingUser] = useState(null);
  const [editPoints, setEditPoints] = useState('');
  const [addingUser, setAddingUser] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    username: '',
    email: '',
    points: 0,
    status: 'active',
    role: 'user',
  });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const usersPerPage = 10;

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching users using userManager utility');
      
      // Load all users using our utility that handles both database and local storage
      const { users: allUsers, count, error: loadError } = await loadAllUsers(searchTerm);
      
      if (loadError) {
        throw new Error(loadError);
      }
      
      // Apply pagination manually
      const from = (currentPage - 1) * usersPerPage;
      const to = from + usersPerPage;
      const paginatedUsers = allUsers.slice(from, to);
      
      setUsers(paginatedUsers);
      setTotalUsers(count);
      console.log('Total users loaded:', count);
      console.log('Users for current page:', paginatedUsers.length);
      
      // Notify other components (like dashboard) about the updated user count
      // This ensures QuickStat displays the same user count as UserManagement
      await refreshUserData();
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
    
    // Clear success message after 3 seconds
    if (saveSuccess) {
      const timer = setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [currentPage, searchTerm, saveSuccess]);
  
  // Handle starting to edit a user
  const handleEditUser = (user) => {
    setEditingUser(user.id);
    setEditPoints(user.points.toString());
  };
  
  // Handle canceling edit
  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditPoints('');
  };
  
  // Handle saving user points using userManager utility
  const handleSavePoints = async (userId) => {
    setSaveError(null);
    try {
      // Parse points as integer
      const pointsValue = parseInt(editPoints, 10);
      
      if (isNaN(pointsValue)) {
        throw new Error('Points must be a valid number');
      }
      
      console.log(`Updating points for user ${userId} to ${pointsValue}`);
      
      // Use our utility to update points - handles both DB users and local test users
      // Also maintains dual storage for points as per Golden Glow's requirements
      const { success, error: updateError } = await updateUserPoints(userId, pointsValue);
      
      if (!success) {
        throw new Error(updateError || 'Failed to update points');
      }
      
      console.log('Points updated successfully');
      
      // Update the UI
      setUsers(users.map(user => {
        if (user.id === userId) {
          return { ...user, points: pointsValue };
        }
        return user;
      }));
      
      setEditingUser(null);
      setSaveSuccess(true);
      
      // Notify other components that user data has changed
      refreshUserData();
    } catch (err) {
      console.error('Error updating user points:', err);
      setSaveError(`Failed to update points: ${err.message}`);
    }
  };
  
  // Toggle add user form
  const toggleAddUserForm = () => {
    setAddingUser(!addingUser);
    if (!addingUser) {
      setNewUser({
        name: '',
        username: '',
        bio: '',
        email: '',
        points: 0,
        status: 'active',
        role: 'regular', // Changed from 'user' to 'regular' to match Supabase schema
      });
    }
  };
  
  // Handle input change for new user form
  const handleNewUserChange = (e) => {
    const { name, value } = e.target;
    setNewUser({
      ...newUser,
      [name]: name === 'points' ? parseInt(value, 10) || 0 : value
    });
  };
  
  // Add a real user - creates a user in Supabase database
  const handleAddTestUser = async () => {
    setSaveError(null);
    try {
      if (!newUser.username) {
        throw new Error('Username is required');
      }
      
      console.log('Creating real user in Supabase database');
      
      // Use our utility to create a real user in Supabase
      const { user: createdUser, error: createError } = await createRealUser({
        username: newUser.username,
        bio: newUser.bio || `${newUser.username}'s profile`,
        points: newUser.points,
        role: newUser.role,
        status: newUser.status,
        email: newUser.email
      });
      
      if (createError) {
        throw new Error(createError);
      }
      
      console.log('Real user created successfully in Supabase:', createdUser);
      
      // Reset form and show success message
      setAddingUser(false);
      setNewUser({
        name: '',
        username: '',
        email: '',
        points: 0,
        status: 'active',
        role: 'user',
      });
      setSaveSuccess(true);
      
      // Refresh the user list to include the new test user
      // This will also update the QuickStat component via our adminDataService
      fetchUsers();
    } catch (err) {
      console.error('Error adding test user:', err);
      setSaveError(`Failed to add user: ${err.message}`);
    }
  };

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
    <div className="py-6" data-component-name="UserManagement">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-textGold mb-2">User Management</h1>
        <p className="text-textLight/80">Manage users on the Golden Glow platform. You can view, add test users, and edit user points.</p>
        {error && (
          <div className="mt-2 p-2 bg-rubyRed/10 border border-rubyRed/30 rounded text-rubyRed text-sm">
            {error}
          </div>
        )}
        {saveSuccess && (
          <div className="mt-2 p-2 bg-emeraldGreen/10 border border-emeraldGreen/30 rounded text-emeraldGreen text-sm">
            Changes saved successfully!
          </div>
        )}
        {saveError && (
          <div className="mt-2 p-2 bg-rubyRed/10 border border-rubyRed/30 rounded text-rubyRed text-sm">
            {saveError}
          </div>
        )}
      </div>

      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input 
            type="text" 
            placeholder="Search users by name or email..." 
            value={searchTerm} 
            onChange={handleSearchChange} 
            className="w-full p-2 bg-deepLapisLight/60 border border-royalGold/30 rounded-md focus:ring-royalGold focus:border-royalGold text-textLight placeholder-textLight/50"
          />
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={fetchUsers}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-deepLapisLight/80 text-textLight font-semibold rounded hover:bg-deepLapisLight transition-colors"
            title="Refresh User List"
          >
            <FiRefreshCw />
          </button>
          
          <button 
            className="flex items-center justify-center gap-2 px-4 py-2 bg-royalGold text-deepLapisDark font-semibold rounded hover:bg-royalGoldLight transition-colors w-full sm:w-auto"
            onClick={toggleAddUserForm}
          >
            {addingUser ? <><FiX /> Cancel</> : <><FiPlus /> Add User to Database</>}
          </button>
        </div>
      </div>
      
      {/* Add User Form */}
      {addingUser && (
        <div className="mb-6 p-4 bg-deepLapisDark arabesque-border rounded-lg">
          <h3 className="text-lg font-semibold text-textGold mb-3">Add User to Database</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-textLight/80 mb-1 text-sm">Name*</label>
              <input 
                type="text" 
                name="name"
                value={newUser.name}
                onChange={handleNewUserChange}
                className="w-full p-2 bg-deepLapisLight/60 border border-royalGold/30 rounded-md focus:ring-royalGold focus:border-royalGold text-textLight"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-textLight/80 mb-1 text-sm">Username*</label>
              <input 
                type="text" 
                name="username"
                value={newUser.username}
                onChange={handleNewUserChange}
                className="w-full p-2 bg-deepLapisLight/60 border border-royalGold/30 rounded-md focus:ring-royalGold focus:border-royalGold text-textLight"
                placeholder="johndoe"
              />
            </div>
            <div>
              <label className="block text-textLight/80 mb-1 text-sm">Email</label>
              <input 
                type="email" 
                name="email"
                value={newUser.email}
                onChange={handleNewUserChange}
                className="w-full p-2 bg-deepLapisLight/60 border border-royalGold/30 rounded-md focus:ring-royalGold focus:border-royalGold text-textLight"
                placeholder="john.doe@example.com"
              />
            </div>
            <div>
              <label className="block text-textLight/80 mb-1 text-sm">Points</label>
              <input 
                type="number" 
                name="points"
                value={newUser.points}
                onChange={handleNewUserChange}
                className="w-full p-2 bg-deepLapisLight/60 border border-royalGold/30 rounded-md focus:ring-royalGold focus:border-royalGold text-textLight"
                min="0"
              />
            </div>
            <div>
              <label className="block text-textLight/80 mb-1 text-sm">Status</label>
              <select
                name="status"
                value={newUser.status}
                onChange={handleNewUserChange}
                className="w-full p-2 bg-deepLapisLight/60 border border-royalGold/30 rounded-md focus:ring-royalGold focus:border-royalGold text-textLight"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div>
              <label className="block text-textLight/80 mb-1 text-sm">Role</label>
              <select
                name="role"
                value={newUser.role}
                onChange={handleNewUserChange}
                className="w-full p-2 bg-deepLapisLight/60 border border-royalGold/30 rounded-md focus:ring-royalGold focus:border-royalGold text-textLight"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="moderator">Moderator</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button 
              onClick={handleAddTestUser}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-royalGold text-deepLapisDark font-semibold rounded hover:bg-royalGoldLight transition-colors"
            >
              <FiPlus /> Add User
            </button>
          </div>
        </div>
      )}

      <div className="bg-deepLapisDark arabesque-border shadow-sm rounded-lg overflow-x-auto" data-component-name="UserManagement">
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
                <th scope="col" className="px-6 py-3">Telegram</th>
                <th scope="col" className="px-6 py-3">Role</th>
                <th scope="col" className="px-6 py-3">Points</th>
                <th scope="col" className="px-6 py-3">Status</th>
                <th scope="col" className="px-6 py-3">Joined</th>
                <th scope="col" className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="bg-deepLapisDark hover:bg-deepLapisLight/20 border-b border-royalGold/10">
                  <td className="px-6 py-4 font-medium whitespace-nowrap">
                    <div className="text-base text-textGold">{user.username || 'N/A'}</div>
                    <div className="text-xs text-textLight/70">{user.email || 'N/A'}</div>
                    {user.avatar_url && (
                      <div className="mt-1">
                        <img 
                          src={user.avatar_url} 
                          alt={user.username} 
                          className="h-8 w-8 rounded-full border border-royalGold/30" 
                        />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {user.telegram_id ? (
                      <div>
                        <div className="text-textGold flex items-center">
                          <svg viewBox="0 0 24 24" width="16" height="16" className="mr-1 text-blue-400">
                            <path fill="currentColor" d="M9.78 18.65l.28-4.23l7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3L3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
                          </svg>
                          {user.telegram_username ? `@${user.telegram_username}` : 'Connected'}
                        </div>
                        <div className="text-xs text-textLight/70">
                          {[user.telegram_first_name, user.telegram_last_name].filter(Boolean).join(' ')}
                        </div>
                      </div>
                    ) : (
                      <span className="text-textLight/50 text-xs">Not connected</span>
                    )}
                  </td>
                  <td className="px-6 py-4 capitalize">{user.role || 'user'}</td>
                  <td className="px-6 py-4">
                    {editingUser === user.id ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          className="w-20 p-1 bg-deepLapisLight/60 border border-royalGold/30 rounded-md focus:ring-royalGold focus:border-royalGold text-textLight"
                          value={editPoints}
                          onChange={(e) => setEditPoints(e.target.value)}
                          min="0"
                        />
                        <button 
                          onClick={() => handleSavePoints(user.id)}
                          className="p-1 text-emeraldGreen hover:text-emeraldGreenLight"
                          title="Save"
                        >
                          <FiSave />
                        </button>
                        <button 
                          onClick={handleCancelEdit}
                          className="p-1 text-rubyRed hover:text-rubyRedLight"
                          title="Cancel"
                        >
                          <FiX />
                        </button>
                      </div>
                    ) : (
                      <span className="text-textGold font-semibold">
                        {user.points !== undefined && user.points !== null ? user.points.toLocaleString() : '0'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusStyle(user.status)}`}>
                      {user.status || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : 
                     user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    {editingUser !== user.id && (
                      <button 
                        onClick={() => handleEditUser(user)}
                        className="p-1 text-textLight hover:text-textGold transition-colors"
                        title="Edit Points"
                      >
                        <FiEdit2 />
                      </button>
                    )}
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