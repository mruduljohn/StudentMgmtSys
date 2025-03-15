import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { Calendar, Filter, RefreshCw, Search, Clock, User, FileText, Database } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Table, { TableItem } from '../components/ui/Table';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Pagination from '../components/ui/Pagination';
import { getAuditLogs } from '../api';
import { useAuthStore } from '../store/authStore';

// Original AuditLog interface from the API
interface AuditLog {
  _id: string;
  userId: string;
  username: string;
  action: string;
  entityType: string;
  entityId: string;
  details: Record<string, unknown>;
  timestamp?: string;
  createdAt: string;
  user?: {
    username: string;
    name: string;
    role: string;
  };
}

// Safe table row interface with only string values
interface AuditLogTableRow extends TableItem {
  id: string;
  timestamp: string;
  username: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
}

interface AuditLogFilters {
  action: string;
  entityType: string;
  startDate: string;
  endDate: string;
}

const AuditLogs: React.FC = observer(() => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  
  const [logs, setLogs] = useState<AuditLogTableRow[]>([]);
  const [allLogs, setAllLogs] = useState<AuditLog[]>([]); // Store all logs for statistics
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true); // Separate loading state for stats
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<AuditLogFilters>({
    action: '',
    entityType: '',
    startDate: '',
    endDate: '',
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Define columns for the table
  const columns = [
    { id: 'timestamp', label: 'Timestamp', width: '180px', sortable: true },
    { id: 'username', label: 'User', width: '150px', sortable: true },
    { id: 'action', label: 'Action', width: '120px', sortable: true },
    { id: 'entityType', label: 'Entity Type', width: '120px', sortable: true },
    { id: 'entityId', label: 'Entity ID', width: '150px', sortable: true },
    { id: 'details', label: 'Details', width: '300px' },
  ];
  
  // Convert AuditLog to AuditLogTableRow
  const convertToTableRow = (log: AuditLog): AuditLogTableRow => {
    // Format details as a string
    let formattedDetails = 'No details';
    
    if (log.details) {
      try {
        if (typeof log.details === 'object') {
          // Convert object to a readable string format
          formattedDetails = Object.entries(log.details)
            .map(([key, value]) => `${key}: ${String(value)}`)
            .join(', ');
        } else {
          formattedDetails = String(log.details);
        }
      } catch (e) {
        console.error('Error formatting details:', e);
        formattedDetails = 'Error formatting details';
      }
    }
    
    return {
      id: log._id,
      timestamp: new Date(log.createdAt).toLocaleString(),
      username: log.user?.username || log.username || 'Unknown',
      action: String(log.action),
      entityType: String(log.entityType),
      entityId: String(log.entityId),
      details: formattedDetails
    };
  };
  
  // Fetch all logs for statistics
  const fetchAllLogsForStats = async () => {
    setStatsLoading(true);
    try {
      // Use the same filters but with a large limit to get all logs
      const params = {
        limit: 1000, // Set a high limit to get all logs
        action: filters.action,
        entityType: filters.entityType,
        startDate: filters.startDate,
        endDate: filters.endDate,
      };
      
      const response = await getAuditLogs(params);
      
      if (response && response.auditLogs && Array.isArray(response.auditLogs)) {
        setAllLogs(response.auditLogs as AuditLog[]);
      } else {
        console.error('Invalid response format for stats:', response);
        setAllLogs([]);
      }
    } catch (error) {
      console.error('Error fetching all audit logs for stats:', error);
      setAllLogs([]);
    } finally {
      setStatsLoading(false);
    }
  };
  
  // Fetch logs on component mount and when dependencies change
  useEffect(() => {
    if (!isAdmin) return;
    
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const params = {
          page: currentPage,
          limit: pageSize,
          action: filters.action,
          entityType: filters.entityType,
          startDate: filters.startDate,
          endDate: filters.endDate,
        };
        
        const response = await getAuditLogs(params);
        
        // Add defensive checks to prevent errors
        if (response && response.auditLogs && Array.isArray(response.auditLogs)) {
          const apiLogs = response.auditLogs as AuditLog[];
          // Update the logs state directly without using rawLogs
          const tableRows = apiLogs.map(convertToTableRow);
          setLogs(tableRows);
          
          // Set pagination data with defensive checks
          setTotalPages(response.pagination?.pages || 1);
          setTotalLogs(response.pagination?.total || 0);
        } else {
          console.error('Invalid response format:', response);
          setLogs([]);
          setTotalPages(1);
          setTotalLogs(0);
        }
      } catch (error) {
        console.error('Error fetching audit logs:', error);
        setLogs([]);
        setTotalPages(1);
        setTotalLogs(0);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLogs();
    fetchAllLogsForStats(); // Fetch all logs for statistics
  }, [isAdmin, currentPage, pageSize, filters]);
  
  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality by filtering logs that contain the search term
    // This is a client-side search since we don't have a specific API endpoint for searching logs
    console.log('Searching for:', searchTerm);
  };
  
  // Handle filter changes
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
    }));
  };
  
  // Apply filters
  const applyFilters = () => {
    setCurrentPage(1);
    setIsFilterOpen(false);
  };
  
  // Reset filters
  const resetFilters = () => {
    setFilters({
      action: '',
      entityType: '',
      startDate: '',
      endDate: '',
    });
    setCurrentPage(1);
  };

  // Refresh logs
  const refreshLogs = () => {
    setCurrentPage(1);
    // The useEffect will trigger a refetch
  };
  
  // If not admin, redirect or show access denied
  if (!isAdmin) {
    return (
      <Layout>
        <div className="p-4 text-center">
          <div className="text-lg text-red-600">Access Denied</div>
          <p className="mt-2">You do not have permission to view audit logs.</p>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">System Audit Logs</h1>
          <p className="text-gray-600">
            View and filter system activity logs
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="secondary"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center"
          >
            <Filter size={16} className="mr-2" />
            Filter
          </Button>
          <Button
            variant="secondary"
            onClick={refreshLogs}
            className="flex items-center"
          >
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </Button>
        </div>
      </div>
      
      {/* Filter panel */}
      {isFilterOpen && (
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <h2 className="text-lg font-semibold mb-4">Filter Logs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Action
              </label>
              <select
                name="action"
                value={filters.action}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Actions</option>
                <option value="CREATE">Create</option>
                <option value="UPDATE">Update</option>
                <option value="DELETE">Delete</option>
                <option value="LOGIN">Login</option>
                <option value="LOGOUT">Logout</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Entity Type
              </label>
              <select
                name="entityType"
                value={filters.entityType}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Entities</option>
                <option value="STUDENT">Student</option>
                <option value="USER">User</option>
                <option value="CONFIG">Configuration</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <Calendar size={16} className="absolute right-3 top-3 text-gray-400" />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <Calendar size={16} className="absolute right-3 top-3 text-gray-400" />
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex justify-end space-x-2">
            <Button variant="secondary" onClick={resetFilters}>
              Reset
            </Button>
            <Button variant="primary" onClick={applyFilters}>
              Apply Filters
            </Button>
          </div>
        </div>
      )}
      
      {/* Search bar */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex">
          <Input
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow"
          />
          <Button type="submit" variant="secondary" className="ml-2">
            <Search size={16} />
          </Button>
        </form>
      </div>
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 flex items-center">
          <div className="p-3 rounded-full bg-blue-100 text-blue-500 mr-3">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Logs</p>
            <p className="text-xl font-semibold">{totalLogs}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 flex items-center">
          <div className="p-3 rounded-full bg-green-100 text-green-500 mr-3">
            <User size={20} />
          </div>
          <div>
            <p className="text-sm text-gray-500">User Actions</p>
            <p className="text-xl font-semibold">
              {statsLoading ? '...' : allLogs.filter(log => log.entityType === 'USER').length}
            </p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 flex items-center">
          <div className="p-3 rounded-full bg-purple-100 text-purple-500 mr-3">
            <FileText size={20} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Student Actions</p>
            <p className="text-xl font-semibold">
              {statsLoading ? '...' : allLogs.filter(log => log.entityType === 'STUDENT').length}
            </p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 flex items-center">
          <div className="p-3 rounded-full bg-amber-100 text-amber-500 mr-3">
            <Database size={20} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Config Actions</p>
            <p className="text-xl font-semibold">
              {statsLoading ? '...' : allLogs.filter(log => log.entityType === 'CONFIG').length}
            </p>
          </div>
        </div>
      </div>
      
      {/* Logs table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-4 text-center">
            <div className="text-lg">Loading audit logs...</div>
          </div>
        ) : logs.length > 0 ? (
          <Table
            columns={columns}
            data={logs}
            emptyMessage="No audit logs found"
          />
        ) : (
          <div className="p-4 text-center">
            <div className="text-lg">No audit logs found</div>
          </div>
        )}
      </div>
      
      {/* Pagination */}
      <div className="mt-4 flex justify-between items-center">
        <div>
          Showing {logs.length} of {totalLogs} logs
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          pageSize={pageSize}
          totalItems={totalLogs}
          onPageSizeChange={setPageSize}
        />
      </div>
    </Layout>
  );
});

export default AuditLogs;