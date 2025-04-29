import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Clock, BarChart2, BookOpen, Download, Search, AlertTriangle } from 'lucide-react';
import Layout from '../components/layout/Layout';
import { useHourStore } from '../store/hourStore';
import { useAuthStore } from '../store/authStore';
import HourList from '../components/hours/HourList';
import HourStats from '../components/hours/HourStats';
import ChapterStatus from '../components/hours/ChapterStatus';
import HourFilters from '../components/hours/HourFilters';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';
import { 
  hoursToExcel, downloadExcel, hoursToCSV, downloadCSV, hoursToPDF, downloadPDF, 
  hourStatsToExcel, hourStatsToCSV, hourStatsToPDF,
  hoursToTransposedExcel, hoursToTransposedCSV, hoursToTransposedPDF 
} from '../utils/excelUtils';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Menu from '../components/ui/Menu';
import FileNamePrompt from '../components/ui/FileNamePrompt';

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
  const authStore = useAuthStore();
  const isAdmin = authStore.user?.role === 'ADMIN';
  const [tabValue, setTabValue] = useState(0);
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedMode, setSelectedMode] = useState<string>('');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [chapterSearchQuery, setChapterSearchQuery] = useState<string>('');
  
  // Export functionality state
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isFileNamePromptOpen, setIsFileNamePromptOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'xlsx' | 'csv' | 'pdf'>('xlsx');
  const [exportData, setExportData] = useState<ArrayBuffer | string | jsPDF | null>(null);
  
  // Live clock state
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());

  useEffect(() => {
    // Initialize the store when component mounts
    hourStore.init();
    
    // Set up interval for updating the current time
    const timeInterval = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    
    // Inform users about the server-side searching
    toast.success("Hour search now works across all fields with highlighted matches", {
      duration: 5000,
      id: "server-side-search-notification",
    });
    
    // Clean up interval on unmount
    return () => {
      clearInterval(timeInterval);
    };
  }, [hourStore]);
  
  // Format the date and time
  const formattedTime = currentDateTime.toLocaleTimeString();
  const formattedDate = currentDateTime.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

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
      // Reset to first page when searching
      hourStore.setPage(1);
      
      // Use the general search parameter instead of specific chapter filter
      if (query.trim() === '') {
        hourStore.setSearchQuery('');
      } else {
        hourStore.setSearchQuery(query);
      }
      
      // Trigger API call to fetch with the new search parameters
      hourStore.fetchHours();
    }
  };

  // Handle selection of export format
  const handleExportFormat = (format: 'xlsx' | 'csv' | 'pdf') => {
    setExportFormat(format);
    
    try {
      if (tabValue === 0) {
        // Hour entries tab
        const hours = hourStore.getHours;
        if (hours.length === 0) {
          toast.error('No hours data to export');
          return;
        }
        
        switch (format) {
          case 'xlsx':
            // Use transposed format for Excel
            const excelData = hoursToTransposedExcel(hours);
            setExportData(excelData);
            break;
          case 'csv':
            // Use transposed format for CSV
            const csvData = hoursToTransposedCSV(hours);
            setExportData(csvData);
            break;
          case 'pdf':
            // Use transposed format for PDF
            const pdfDoc = hoursToTransposedPDF(hours);
            setExportData(pdfDoc);
            break;
        }
      } else if (tabValue === 1) {
        // Statistics tab
        const stats = hourStore.getStats;
        if (!stats) {
          toast.error('No statistics data to export');
          return;
        }
        
        switch (format) {
          case 'xlsx':
            const excelData = hourStatsToExcel(stats);
            setExportData(excelData);
            break;
          case 'csv':
            const csvData = hourStatsToCSV(stats);
            setExportData(csvData);
            break;
          case 'pdf':
            const pdfDoc = hourStatsToPDF(stats);
            setExportData(pdfDoc);
            break;
        }
      } else if (tabValue === 2) {
        // Chapter status tab
        const chapters = hourStore.getChapterStatus;
        if (!chapters || chapters.length === 0) {
          toast.error('No chapter status data to export');
          return;
        }
        
        // Format chapter status data for export
        const formattedData = chapters.map(chapter => ({
          'Chapter': chapter.chapter,
          'Status': chapter.status,
          'Alloted Hours': chapter.allotedHours,
          'Completed Hours': chapter.completedHours,
          'Remaining Hours': chapter.remainingHours,
          'Batch': selectedBatch,
          'Subject': selectedSubject
        }));
        
        switch (format) {
          case 'xlsx':
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(formattedData);
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Chapter Status');
            const excelData = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            setExportData(excelData);
            break;
          case 'csv':
            // Use the same worksheet creation and then convert to CSV
            const tempWorksheet = XLSX.utils.json_to_sheet(formattedData);
            const csvData = XLSX.utils.sheet_to_csv(tempWorksheet);
            setExportData(csvData);
            break;
          case 'pdf':
            // Create a PDF with the chapter status data
            const doc = new jsPDF('landscape');
            
            doc.setFontSize(16);
            doc.text(`Chapter Status - ${selectedSubject} (${selectedBatch})`, 14, 15);
            
            autoTable(doc, {
              startY: 25,
              head: [['Chapter', 'Status', 'Alloted Hours', 'Completed Hours', 'Remaining Hours']],
              body: chapters.map(chapter => [
                chapter.chapter,
                chapter.status,
                chapter.allotedHours,
                chapter.completedHours,
                chapter.remainingHours
              ]),
              headStyles: { fillColor: [41, 128, 185], textColor: 255 },
              alternateRowStyles: { fillColor: [242, 242, 242] }
            });
            
            setExportData(doc);
            break;
        }
      }
      
      // After preparing the data, open the filename prompt
      setIsExportMenuOpen(false);
      setIsFileNamePromptOpen(true);
      
    } catch (err) {
      console.error('Error preparing export data:', err);
      toast.error('Failed to prepare export data');
    }
  };
  
  // Handle actual export with the chosen filename
  const handleExportWithFilename = (filename: string) => {
    try {
      // Use the prepared export data based on format
      switch (exportFormat) {
        case 'xlsx':
          downloadExcel(exportData as ArrayBuffer, `${filename}.xlsx`);
          break;
        case 'csv':
          downloadCSV(exportData as string, `${filename}.csv`);
          break;
        case 'pdf':
          downloadPDF(exportData as jsPDF, `${filename}.pdf`);
          break;
      }
      
      // Show success message based on current tab
      let successMessage = '';
      if (tabValue === 0) {
        successMessage = `Successfully exported ${hourStore.getHours.length} hour records`;
      } else if (tabValue === 1) {
        successMessage = 'Successfully exported hour statistics';
      } else {
        successMessage = 'Successfully exported chapter status data';
      }
      
      toast.success(successMessage);
    } catch (err) {
      console.error('Error exporting data:', err);
      toast.error('Failed to export data');
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
      {/* Live clock display */}
      <div className="mb-4 bg-gray-100 p-3 rounded-lg shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <span className="font-bold">Current Date:</span> {formattedDate}
          </div>
          <div>
            <span className="font-bold">Current Time:</span> {formattedTime}
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Hour Dashboard</h1>
        <p className="text-gray-600">
          Track and manage teaching hours
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow-md mb-6">
        {/* Tabs and Export Button */}
        <div className="border-b border-gray-200 flex justify-between">
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
          
          {/* Export Button with Dropdown - Admin Only */}
          {isAdmin && (
            <div className="px-4 py-2 flex items-center relative">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                className="flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              
              {isExportMenuOpen && (
                <Menu
                  items={[
                    { label: 'Excel (.xlsx)', onClick: () => handleExportFormat('xlsx') },
                    { label: 'CSV (.csv)', onClick: () => handleExportFormat('csv') },
                    { label: 'PDF (.pdf)', onClick: () => handleExportFormat('pdf') }
                  ]}
                  onClose={() => setIsExportMenuOpen(false)}
                  className="right-0 mt-2"
                />
              )}
            </div>
          )}
        </div>
        
        {/* Filters Section */}
        <div className="mb-6">
          <HourFilters
            batches={hourStore.getOptions.batches}
            subjects={hourStore.getOptions.subjects}
            modes={hourStore.getOptions.modes}
            classTeachers={hourStore.getOptions.classTeachers}
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
            loading={hourStore.isLoading}
            totalResults={hourStore.getTotalHours}
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
      
      {/* Filename Prompt */}
      <FileNamePrompt
        isOpen={isFileNamePromptOpen}
        onClose={() => setIsFileNamePromptOpen(false)}
        onConfirm={handleExportWithFilename}
        defaultFileName={`hours-${tabValue === 0 ? 'data' : tabValue === 1 ? 'stats' : 'chapters'}-${new Date().toISOString().slice(0, 10)}`}
        title={`Export ${tabValue === 0 ? 'Hour Entries' : tabValue === 1 ? 'Statistics' : 'Chapter Status'}`}
        fileType={exportFormat === 'xlsx' ? 'Excel (.xlsx)' : exportFormat === 'csv' ? 'CSV' : 'PDF'}
      />
    </Layout>
  );
});

export default HourDashboard; 