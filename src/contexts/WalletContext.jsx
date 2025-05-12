import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUser } from './UserContext';
import PropTypes from 'prop-types';

// Create WalletContext
const WalletContext = createContext();

export const useWallet = () => useContext(WalletContext);

export const WalletProvider = ({ children }) => {
  const { user, updateUserPoints } = useUser();
  
  // Transaction history state
  const [transactions, setTransactions] = useState([]);
  
  // Wallet statistics
  const [stats, setStats] = useState({
    totalEarned: 0,
    totalSpent: 0,
    totalTransactions: 0,
    highestTransaction: 0,
    lastTransaction: null
  });
  
  // Initialize from localStorage
  useEffect(() => {
    if (user) {
      const storedTransactions = localStorage.getItem(`transactions_${user.id}`);
      if (storedTransactions) {
        try {
          const parsedTransactions = JSON.parse(storedTransactions);
          setTransactions(parsedTransactions);
          calculateStats(parsedTransactions);
        } catch (error) {
          console.error('Failed to parse transactions from localStorage', error);
        }
      }
    }
  }, [user]);
  
  // Save to localStorage when transactions change
  useEffect(() => {
    if (user && transactions.length > 0) {
      localStorage.setItem(`transactions_${user.id}`, JSON.stringify(transactions));
      calculateStats(transactions);
    }
  }, [user, transactions]);
  
  // Calculate wallet statistics
  const calculateStats = useCallback((transactionList) => {
    if (!transactionList || transactionList.length === 0) {
      setStats({
        totalEarned: 0,
        totalSpent: 0,
        totalTransactions: 0,
        highestTransaction: 0,
        lastTransaction: null
      });
      return;
    }
    
    // Sort transactions by timestamp (newest first)
    const sortedTransactions = [...transactionList].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );
    
    // Calculate totals
    let totalEarned = 0;
    let totalSpent = 0;
    let highestTransaction = 0;
    
    for (const tx of transactionList) {
      if (tx.amount > 0) {
        totalEarned += tx.amount;
      } else {
        totalSpent += Math.abs(tx.amount);
      }
      
      // Check for highest absolute transaction
      if (Math.abs(tx.amount) > highestTransaction) {
        highestTransaction = Math.abs(tx.amount);
      }
    }
    
    setStats({
      totalEarned,
      totalSpent,
      totalTransactions: transactionList.length,
      highestTransaction,
      lastTransaction: sortedTransactions[0] || null
    });
  }, []);
  
  // Add new transaction
  const addTransaction = useCallback((amount, source, description = '') => {
    if (!user) return null;
    
    // Calculate new balance
    const currentBalance = user.points || 0;
    const newBalance = currentBalance + amount;
    
    // Create transaction object
    const transaction = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      amount,
      source,
      description,
      balance: newBalance,
      userId: user.id
    };
    
    // Update transactions
    setTransactions(prev => [transaction, ...prev]);
    
    // Update user points (via UserContext)
    updateUserPoints(amount);
    
    return transaction;
  }, [user, updateUserPoints]);
  
  // Get filtered transaction history
  const getTransactionHistory = useCallback((options = {}) => {
    const { 
      limit, 
      type, // 'earned' or 'spent'
      startDate, 
      endDate,
      source
    } = options;
    
    let filtered = [...transactions];
    
    // Filter by type
    if (type === 'earned') {
      filtered = filtered.filter(tx => tx.amount > 0);
    } else if (type === 'spent') {
      filtered = filtered.filter(tx => tx.amount < 0);
    }
    
    // Filter by date range
    if (startDate) {
      const start = new Date(startDate).getTime();
      filtered = filtered.filter(tx => new Date(tx.timestamp).getTime() >= start);
    }
    
    if (endDate) {
      const end = new Date(endDate).getTime();
      filtered = filtered.filter(tx => new Date(tx.timestamp).getTime() <= end);
    }
    
    // Filter by source
    if (source) {
      filtered = filtered.filter(tx => tx.source === source);
    }
    
    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Apply limit
    if (limit && limit > 0) {
      filtered = filtered.slice(0, limit);
    }
    
    return filtered;
  }, [transactions]);
  
  // Export transactions to CSV
  const exportTransactionsCSV = useCallback(() => {
    if (transactions.length === 0) return;
    
    // Define CSV header
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Time,Source,Amount,Balance,Description\n";
    
    // Add transactions
    transactions.forEach(tx => {
      const date = new Date(tx.timestamp);
      const dateStr = date.toLocaleDateString();
      const timeStr = date.toLocaleTimeString();
      
      const row = [
        dateStr,
        timeStr,
        tx.source,
        tx.amount,
        tx.balance,
        tx.description
      ].join(',');
      
      csvContent += row + "\n";
    });
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `golden_credits_history_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    
    // Trigger download and cleanup
    link.click();
    document.body.removeChild(link);
  }, [transactions]);
  
  // Clear transaction history
  const clearTransactionHistory = useCallback(() => {
    if (window.confirm('Are you sure you want to clear your transaction history? This cannot be undone.')) {
      setTransactions([]);
      localStorage.removeItem(`transactions_${user.id}`);
    }
  }, [user]);
  
  // Purchase a game with Golden Credits
  const purchaseGame = useCallback((game) => {
    if (!user) return { success: false, error: 'User not authenticated' };
    
    // Check if user has enough credits
    if (user.points < game.gcCost) {
      return { 
        success: false, 
        error: 'Insufficient Golden Credits', 
        required: game.gcCost, 
        current: user.points 
      };
    }
    
    // Create transaction with negative amount (cost)
    const transaction = addTransaction(
      -game.gcCost, // negative amount represents spending
      'game_unlock',
      `Unlocked ${game.name}`
    );
    
    return { 
      success: true, 
      transaction,
      message: `Successfully purchased ${game.name}` 
    };
  }, [user, addTransaction]);
  
  const contextValue = {
    transactions,
    stats,
    addTransaction,
    getTransactionHistory,
    exportTransactionsCSV,
    clearTransactionHistory,
    purchaseGame
  };
  
  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};

WalletProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export default WalletProvider;