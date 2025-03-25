import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Clock, BarChart2, BookOpen } from 'lucide-react';
import Layout from '../components/layout/Layout';
import { useHourStore } from '../store/hourStore';
import HourList from '../components/hours/HourList';
import HourStats from '../components/hours/HourStats';
import ChapterStatus from '../components/hours/ChapterStatus';
import HourFilters from '../components/hours/HourFilters';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`hour-tabpanel-${index}`}
      aria-labelledby={`hour-tab-${index}`}
      {...other}
    >
      {value === index && (
        <div className="p-4">
          {children}
        </div>
      )}
    </div>
  );
}

const HourDashboard: React.FC = observer(() => {
  const hourStore = useHourStore();
  const [tabValue, setTabValue] = useState(0);
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedMode, setSelectedMode] = useState<string>('');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [chapterSearchQuery, setChapterSearchQuery] = useState<string>('');

  useEffect(() => {
    // Initialize the store when component mounts
    hourStore.init();
  }, [hourStore]);

  const handleTabChange = (index: number) => {
    setTabValue(index);
  };

  const handleBatchChange = (batch: string) => {
    setSelectedBatch(batch);
    
    // Update filters based on the selected batch
    if (tabValue === 0) {
      hourStore.setFilter('batch', batch);
    } else if (tabValue === 1) {
      hourStore.fetchStats(batch);
      hourStore.setFilter('batch', batch);
    } else if (tabValue === 2) {
      hourStore.fetchChapterStatus(batch, selectedSubject);
    }
  };

  const handleSubjectChange = (subject: string) => {
    setSelectedSubject(subject);
    
    // Update filters based on the selected subject
    if (tabValue === 0) {
      hourStore.setFilter('subject', subject);
    } else if (tabValue === 1) {
      hourStore.setFilter('subject', subject);
    } else if (tabValue === 2) {
      hourStore.fetchChapterStatus(selectedBatch, subject);
    }
  };
  
  const handleModeChange = (mode: string) => {
    setSelectedMode(mode);
    
    // Update filters based on the selected mode
    if (tabValue === 0) {
      hourStore.setFilter('mode', mode);
    }
  };
  
  const handleTeacherChange = (teacher: string) => {
    setSelectedTeacher(teacher);
    
    // Update filters based on the selected teacher
    if (tabValue === 0) {
      hourStore.setFilter('classTeacher', teacher);
    }
  };
  
  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    
    // Update filters based on the selected status
    if (tabValue === 0) {
      hourStore.setFilter('chapterStatus', status);
    }
  };
  
  const handleChapterSearch = (query: string) => {
    setChapterSearchQuery(query);
    
    // Update search in store
    if (tabValue === 0) {
      // If the search query is at least 2 characters or empty, update the filter
      if (query.length >= 2 || query === '') {
        hourStore.setFilter('chapter', query);
      }
    }
  };

  if (hourStore.isLoading && !hourStore.isDataLoaded) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading hour data...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Hour Dashboard</h1>
        <p className="text-gray-600">
          Track and manage teaching hours
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow-md mb-6">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              className={`flex items-center px-4 py-3 text-sm font-medium ${
                tabValue === 0
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => handleTabChange(0)}
            >
              <Clock className="h-5 w-5 mr-2" />
              Hour Entries
            </button>
            <button
              className={`flex items-center px-4 py-3 text-sm font-medium ${
                tabValue === 1
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => handleTabChange(1)}
            >
              <BarChart2 className="h-5 w-5 mr-2" />
              Statistics
            </button>
            <button
              className={`flex items-center px-4 py-3 text-sm font-medium ${
                tabValue === 2
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => handleTabChange(2)}
            >
              <BookOpen className="h-5 w-5 mr-2" />
              Chapter Status
            </button>
          </div>
        </div>
        
        {/* Filters */}
        <div className="p-4 border-b border-gray-200">
          <HourFilters 
            batches={hourStore.getOptions.batches || []}
            subjects={hourStore.getOptions.subjects || []}
            modes={hourStore.getOptions.modes || []}
            classTeachers={hourStore.getOptions.classTeachers || []}
            selectedBatch={selectedBatch}
            selectedSubject={selectedSubject}
            selectedMode={selectedMode}
            selectedTeacher={selectedTeacher}
            selectedStatus={selectedStatus}
            chapterSearchQuery={chapterSearchQuery}
            onBatchChange={handleBatchChange}
            onSubjectChange={handleSubjectChange}
            onModeChange={handleModeChange}
            onTeacherChange={handleTeacherChange}
            onStatusChange={handleStatusChange}
            onChapterSearch={handleChapterSearch}
          />
        </div>
        
        {/* Error message */}
        {hourStore.getError && (
          <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
            {hourStore.getError}
          </div>
        )}
        
        {/* Tab panels */}
        <TabPanel value={tabValue} index={0}>
          <HourList />
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <HourStats />
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <ChapterStatus 
            batch={selectedBatch} 
            subject={selectedSubject} 
          />
        </TabPanel>
      </div>
    </Layout>
  );
});

export default HourDashboard; 