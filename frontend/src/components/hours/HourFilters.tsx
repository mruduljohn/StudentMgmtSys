import React, { useState, useEffect } from 'react';
import { Search, Loader, Check, X, AlertTriangle, Filter } from 'lucide-react';
import Button from '../ui/Button';

interface HourFiltersProps {
  batches: string[];
  subjects: string[];
  modes: string[];
  classTeachers: string[];
  selectedBatch: string;
  selectedSubject: string;
  selectedMode: string;
  selectedTeacher: string;
  selectedStatus: string;
  chapterSearchQuery?: string;
  onBatchChange: (batch: string) => void;
  onSubjectChange: (subject: string) => void;
  onModeChange: (mode: string) => void;
  onTeacherChange: (teacher: string) => void;
  onStatusChange: (status: string) => void;
  onChapterSearch?: (query: string) => void;
  loading?: boolean;
  totalResults?: number;
}

const HourFilters: React.FC<HourFiltersProps> = ({
  batches,
  subjects,
  modes,
  classTeachers,
  selectedBatch,
  selectedSubject,
  selectedMode,
  selectedTeacher,
  selectedStatus,
  chapterSearchQuery = '',
  onBatchChange,
  onSubjectChange,
  onModeChange,
  onTeacherChange,
  onStatusChange,
  onChapterSearch = () => {},
  loading = false,
  totalResults = 0
}) => {
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState(chapterSearchQuery);
  const [searchStatus, setSearchStatus] = useState<'idle' | 'searching' | 'completed' | 'no-results'>('idle');
  const [facultyCode, setFacultyCode] = useState('');
  const [facultyName, setFacultyName] = useState('');
  const [localBatch, setLocalBatch] = useState(selectedBatch);
  const [localSubject, setLocalSubject] = useState(selectedSubject);
  const [localMode, setLocalMode] = useState(selectedMode);
  const [localTeacher, setLocalTeacher] = useState(selectedTeacher);
  const [localStatus, setLocalStatus] = useState(selectedStatus);

  // Update local state when props change
  useEffect(() => {
    setSearchQuery(chapterSearchQuery);
    setLocalBatch(selectedBatch);
    setLocalSubject(selectedSubject);
    setLocalMode(selectedMode);
    setLocalTeacher(selectedTeacher);
    setLocalStatus(selectedStatus);
  }, [chapterSearchQuery, selectedBatch, selectedSubject, selectedMode, selectedTeacher, selectedStatus]);

  // Update search status based on loading state and results
  useEffect(() => {
    if (loading) {
      setSearchStatus('searching');
    } else if (searchQuery && totalResults === 0) {
      setSearchStatus('no-results');
    } else if (searchQuery) {
      setSearchStatus('completed');
    } else {
      setSearchStatus('idle');
    }
  }, [loading, searchQuery, totalResults]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Apply all filters
    onBatchChange(localBatch);
    onSubjectChange(localSubject);
    onModeChange(localMode);
    onTeacherChange(localTeacher);
    onStatusChange(localStatus);
    
    // If there's a general search query, use that
    if (searchQuery.trim()) {
      onChapterSearch(searchQuery);
    } else {
      onChapterSearch('');
    }
    
    // Update search status
    setSearchStatus('searching');
  };

  const handleReset = () => {
    setLocalBatch('');
    setLocalSubject('');
    setLocalMode('');
    setLocalTeacher('');
    setLocalStatus('');
    setSearchQuery('');
    setFacultyCode('');
    setFacultyName('');
    
    // Reset all filters
    onBatchChange('');
    onSubjectChange('');
    onModeChange('');
    onTeacherChange('');
    onStatusChange('');
    onChapterSearch('');
    
    setSearchStatus('idle');
  };

  // Render search status indicator
  const renderSearchStatus = () => {
    if (loading) {
      return (
        <div className="flex items-center text-blue-500 ml-4">
          <Loader className="h-4 w-4 animate-spin mr-2" />
          <span className="text-sm">Searching...</span>
        </div>
      );
    }
    
    if (searchStatus === 'no-results') {
      return (
        <div className="flex items-center text-amber-500 ml-4">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <span className="text-sm">No matches found</span>
        </div>
      );
    }
    
    if (searchStatus === 'completed' && totalResults > 0) {
      return (
        <div className="flex items-center text-green-500 ml-4">
          <Check className="h-4 w-4 mr-2" />
          <span className="text-sm">{totalResults} matches found</span>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="w-full bg-white p-4 rounded-lg shadow-sm mb-4">
      <form onSubmit={handleSearch}>
        <div className="flex flex-col md:flex-row items-start md:items-end gap-4 mb-4">
          <div className="w-full md:w-1/3">
            <label htmlFor="search-query" className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                id="search-query"
                type="text"
                placeholder="Search across all fields..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 px-3 py-2 bg-white border shadow-sm border-gray-300 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-blue-500 block w-full rounded-md sm:text-sm focus:ring-1"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              type="submit" 
              variant="primary"
              className="flex items-center"
              disabled={loading}
            >
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            
            <Button 
              type="button" 
              variant="secondary"
              onClick={handleReset}
              className="flex items-center"
            >
              <X className="h-4 w-4 mr-2" />
              Reset
            </Button>
            
            <Button 
              type="button" 
              variant="secondary"
              onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
              className="flex items-center"
            >
              <Filter className="h-4 w-4 mr-2" />
              {showAdvancedSearch ? 'Hide Filters' : 'Show Filters'}
            </Button>
          </div>
          
          {renderSearchStatus()}
        </div>
        
        {showAdvancedSearch && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mt-4 border-t border-gray-200 pt-4">
            <div>
              <label htmlFor="batch-select" className="block text-sm font-medium text-gray-700 mb-1">
                Batch
              </label>
              <select
                id="batch-select"
                value={localBatch}
                onChange={(e) => setLocalBatch(e.target.value)}
                className="px-3 py-2 bg-white border shadow-sm border-gray-300 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-blue-500 block w-full rounded-md sm:text-sm focus:ring-1"
              >
                <option value="">All Batches</option>
                {batches.map((batch) => (
                  <option key={batch} value={batch}>
                    {batch}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="subject-select" className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <select
                id="subject-select"
                value={localSubject}
                onChange={(e) => setLocalSubject(e.target.value)}
                className="px-3 py-2 bg-white border shadow-sm border-gray-300 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-blue-500 block w-full rounded-md sm:text-sm focus:ring-1"
              >
                <option value="">All Subjects</option>
                {subjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="faculty-code" className="block text-sm font-medium text-gray-700 mb-1">
                Faculty Code
              </label>
              <input
                id="faculty-code"
                type="text"
                placeholder="Enter faculty code"
                value={facultyCode}
                onChange={(e) => {
                  setFacultyCode(e.target.value);
                  // Include faculty code in the search query
                  if (e.target.value) {
                    setSearchQuery(prev => 
                      prev ? `${prev} ${e.target.value}` : e.target.value
                    );
                  }
                }}
                className="px-3 py-2 bg-white border shadow-sm border-gray-300 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-blue-500 block w-full rounded-md sm:text-sm focus:ring-1"
              />
            </div>
            
            <div>
              <label htmlFor="faculty-name" className="block text-sm font-medium text-gray-700 mb-1">
                Faculty Name
              </label>
              <input
                id="faculty-name"
                type="text"
                placeholder="Enter faculty name"
                value={facultyName}
                onChange={(e) => {
                  setFacultyName(e.target.value);
                  // Include faculty name in the search query
                  if (e.target.value) {
                    setSearchQuery(prev => 
                      prev ? `${prev} ${e.target.value}` : e.target.value
                    );
                  }
                }}
                className="px-3 py-2 bg-white border shadow-sm border-gray-300 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-blue-500 block w-full rounded-md sm:text-sm focus:ring-1"
              />
            </div>
            
            <div>
              <label htmlFor="mode-select" className="block text-sm font-medium text-gray-700 mb-1">
                Mode
              </label>
              <select
                id="mode-select"
                value={localMode}
                onChange={(e) => setLocalMode(e.target.value)}
                className="px-3 py-2 bg-white border shadow-sm border-gray-300 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-blue-500 block w-full rounded-md sm:text-sm focus:ring-1"
              >
                <option value="">All Modes</option>
                {modes.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="status-select" className="block text-sm font-medium text-gray-700 mb-1">
                Chapter Status
              </label>
              <select
                id="status-select"
                value={localStatus}
                onChange={(e) => setLocalStatus(e.target.value)}
                className="px-3 py-2 bg-white border shadow-sm border-gray-300 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-blue-500 block w-full rounded-md sm:text-sm focus:ring-1"
              >
                <option value="">All Statuses</option>
                <option value="NOT STARTED">Not Started</option>
                <option value="ONGOING">Ongoing</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="teacher-select" className="block text-sm font-medium text-gray-700 mb-1">
                Class Teacher
              </label>
              <select
                id="teacher-select"
                value={localTeacher}
                onChange={(e) => setLocalTeacher(e.target.value)}
                className="px-3 py-2 bg-white border shadow-sm border-gray-300 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-blue-500 block w-full rounded-md sm:text-sm focus:ring-1"
              >
                <option value="">All Teachers</option>
                {classTeachers.map((teacher) => (
                  <option key={teacher} value={teacher}>
                    {teacher}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default HourFilters; 