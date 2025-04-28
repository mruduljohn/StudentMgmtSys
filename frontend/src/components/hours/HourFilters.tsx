import React, { useState, useEffect } from 'react';
import { Search, Loader, Check, X, AlertTriangle } from 'lucide-react';

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
  const [internalSearchQuery, setInternalSearchQuery] = useState(chapterSearchQuery);
  const [searchStatus, setSearchStatus] = useState<'idle' | 'searching' | 'completed' | 'no-results'>('idle');
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);

  // Update internal search state when prop changes
  useEffect(() => {
    setInternalSearchQuery(chapterSearchQuery);
  }, [chapterSearchQuery]);

  // Update search status based on loading state and results
  useEffect(() => {
    if (loading) {
      setSearchStatus('searching');
    } else if (internalSearchQuery && totalResults === 0) {
      setSearchStatus('no-results');
    } else if (internalSearchQuery) {
      setSearchStatus('completed');
    } else {
      setSearchStatus('idle');
    }
  }, [loading, internalSearchQuery, totalResults]);

  const handleBatchChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onBatchChange(event.target.value);
  };

  const handleSubjectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onSubjectChange(event.target.value);
  };
  
  const handleModeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onModeChange(event.target.value);
  };
  
  const handleTeacherChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onTeacherChange(event.target.value);
  };
  
  const handleStatusChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onStatusChange(event.target.value);
  };
  
  const handleChapterSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setInternalSearchQuery(value);
    
    // Clear any existing timeout
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    
    // Set searching status immediately for better UX
    if (value.trim()) {
      setSearchStatus('searching');
    } else {
      setSearchStatus('idle');
    }
    
    // Debounce the actual search to avoid too many API calls
    const timeout = setTimeout(() => {
      onChapterSearch(value);
    }, 300); // 300ms debounce
    
    setDebounceTimeout(timeout);
  };

  const clearSearch = () => {
    setInternalSearchQuery('');
    onChapterSearch('');
    setSearchStatus('idle');
  };

  // Render search status indicator
  const renderSearchStatus = () => {
    switch (searchStatus) {
      case 'searching':
        return (
          <div className="absolute inset-y-0 right-10 flex items-center pr-2">
            <Loader className="h-4 w-4 text-blue-500 animate-spin" />
          </div>
        );
      case 'completed':
        return (
          <div className="absolute inset-y-0 right-10 flex items-center pr-2">
            <Check className="h-4 w-4 text-green-500" />
            <span className="text-xs text-green-500 ml-1">{totalResults} found</span>
          </div>
        );
      case 'no-results':
        return (
          <div className="absolute inset-y-0 right-10 flex items-center pr-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span className="text-xs text-amber-500 ml-1">No results</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div>
          <label htmlFor="batch-select" className="block text-sm font-medium text-gray-700 mb-1">
            Batch
          </label>
          <select
            id="batch-select"
            value={selectedBatch}
            onChange={handleBatchChange}
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
            value={selectedSubject}
            onChange={handleSubjectChange}
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
          <label htmlFor="chapter-search" className="block text-sm font-medium text-gray-700 mb-1">
            Chapter Search
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              id="chapter-search"
              type="text"
              placeholder="Search chapters..."
              value={internalSearchQuery}
              onChange={handleChapterSearch}
              className="pl-10 px-3 py-2 bg-white border shadow-sm border-gray-300 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-blue-500 block w-full rounded-md sm:text-sm focus:ring-1"
            />
            {renderSearchStatus()}
            {internalSearchQuery && (
              <div 
                className="absolute inset-y-0 right-0 flex items-center pr-2 cursor-pointer"
                onClick={clearSearch}
              >
                <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </div>
            )}
          </div>
        </div>
        
        <div>
          <label htmlFor="mode-select" className="block text-sm font-medium text-gray-700 mb-1">
            Mode
          </label>
          <select
            id="mode-select"
            value={selectedMode}
            onChange={handleModeChange}
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
          <label htmlFor="teacher-select" className="block text-sm font-medium text-gray-700 mb-1">
            Class Teacher
          </label>
          <select
            id="teacher-select"
            value={selectedTeacher}
            onChange={handleTeacherChange}
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
        
        <div>
          <label htmlFor="status-select" className="block text-sm font-medium text-gray-700 mb-1">
            Chapter Status
          </label>
          <select
            id="status-select"
            value={selectedStatus}
            onChange={handleStatusChange}
            className="px-3 py-2 bg-white border shadow-sm border-gray-300 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-blue-500 block w-full rounded-md sm:text-sm focus:ring-1"
          >
            <option value="">All Statuses</option>
            <option value="NOT STARTED">Not Started</option>
            <option value="ONGOING">Ongoing</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default HourFilters; 