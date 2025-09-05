import React, { useState } from 'react';
import { useWallet } from '../../contexts/WalletContext';
import { FiDownload, FiFilter, FiClock, FiXCircle } from 'react-icons/fi';

const TransactionHistory = () => {
  const { transactions, getTransactionHistory, exportTransactionsCSV, clearTransactionHistory } = useWallet();
  
  // Filter state
  const [filters, setFilters] = useState({
    type: 'all', // 'all', 'earned', 'spent'
    source: '',
    startDate: '',
    endDate: '',
    limit: 10
  });
  
  const [showFilters, setShowFilters] = useState(false);
  
  // Get filtered transactions
  const filteredTransactions = getTransactionHistory({
    type: filters.type === 'all' ? null : filters.type,
    source: filters.source || null,
    startDate: filters.startDate || null,
    endDate: filters.endDate || null,
    limit: filters.limit
  });
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Format amount with + or - sign
  const formatAmount = (amount) => {
    return amount >= 0 ? `+${amount}` : `${amount}`;
  };
  
  // Handle filter changes
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  // Reset filters
  const resetFilters = () => {
    setFilters({
      type: 'all',
      source: '',
      startDate: '',
      endDate: '',
      limit: 10
    });
  };
  
  // Get unique sources for filter dropdown
  const sources = [...new Set(transactions.map(tx => tx.source))].sort();
  
  return (
    <div className="bg-deepLapisDark border border-royalGold/30 rounded-lg p-4 shadow-glow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-primary text-royalGold flex items-center gap-2">
          <FiClock className="text-royalGold" />
          Transaction History
        </h3>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 bg-deepLapis border border-royalGold/40 rounded-md hover:bg-deepLapis/70 transition text-royalGold"
            title="Filter Transactions"
          >
            <FiFilter />
          </button>
          
          <button
            onClick={exportTransactionsCSV}
            className="p-2 bg-deepLapis border border-royalGold/40 rounded-md hover:bg-deepLapis/70 transition text-royalGold"
            title="Export to CSV"
          >
            <FiDownload />
          </button>
        </div>
      </div>
      
      {/* Filters */}
      {showFilters && (
        <div className="mb-4 p-3 bg-deepLapis border border-royalGold/20 rounded-md">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-royalGold">Filters</h4>
            <button
              onClick={resetFilters}
              className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
            >
              <FiXCircle /> Reset
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-textLight mb-1">Type</label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full bg-deepLapisDark border border-royalGold/30 rounded p-2 text-textLight"
              >
                <option value="all">All Transactions</option>
                <option value="earned">Credits Earned</option>
                <option value="spent">Credits Spent</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs text-textLight mb-1">Source</label>
              <select
                value={filters.source}
                onChange={(e) => handleFilterChange('source', e.target.value)}
                className="w-full bg-deepLapisDark border border-royalGold/30 rounded p-2 text-textLight"
              >
                <option value="">All Sources</option>
                {sources.map((source) => (
                  <option key={source} value={source}>{source.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs text-textLight mb-1">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full bg-deepLapisDark border border-royalGold/30 rounded p-2 text-textLight"
              />
            </div>
            
            <div>
              <label className="block text-xs text-textLight mb-1">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full bg-deepLapisDark border border-royalGold/30 rounded p-2 text-textLight"
              />
            </div>
          </div>
          
          <div className="mt-3">
            <label className="block text-xs text-textLight mb-1">Show Entries</label>
            <select
              value={filters.limit}
              onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
              className="bg-deepLapisDark border border-royalGold/30 rounded p-2 text-textLight"
            >
              <option value={10}>10 entries</option>
              <option value={20}>20 entries</option>
              <option value={50}>50 entries</option>
              <option value={100}>100 entries</option>
              <option value={0}>All</option>
            </select>
          </div>
        </div>
      )}
      
      {/* Transaction List */}
      <div className="overflow-hidden rounded-md border border-royalGold/20">
        {filteredTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-deepLapis border-b border-royalGold/20">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-medium text-textLight">Date & Time</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-textLight">Source</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-textLight">Description</th>
                  <th className="py-3 px-4 text-right text-xs font-medium text-textLight">Amount</th>
                  <th className="py-3 px-4 text-right text-xs font-medium text-textLight">Balance</th>
                </tr>
              </thead>
              
              <tbody>
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-royalGold/10 hover:bg-deepLapis/50">
                    <td className="py-3 px-4 text-xs text-gray-300">
                      {formatDate(tx.timestamp)}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-300 capitalize">
                      {tx.source.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-300">
                      {tx.description || '-'}
                    </td>
                    <td className={`py-3 px-4 text-xs font-medium text-right ${
                      tx.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {formatAmount(tx.amount)} GC
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-300 font-medium text-right">
                      {tx.balance} GC
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-400">
            <p>No transactions found.</p>
            <p className="text-sm mt-1">Complete activities to earn Golden Credits!</p>
          </div>
        )}
      </div>
      
      {/* Transaction Count */}
      <div className="mt-3 text-right text-xs text-gray-400">
        Showing {filteredTransactions.length} of {transactions.length} transactions
      </div>
      
      {/* Clear History Button */}
      {transactions.length > 0 && (
        <div className="mt-4 text-center">
          <button
            onClick={clearTransactionHistory}
            className="text-xs text-rose-400 hover:text-rose-300"
          >
            Clear Transaction History
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;