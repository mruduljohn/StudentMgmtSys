import React, { useState, useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { Edit, Trash2, Plus, ArrowUp, ArrowDown, Download, Upload, FileText, CheckSquare, Square } from 'lucide-react';
import { useHourStore } from '../../store/hourStore';
import { useAuthStore } from '../../store/authStore';
import { Hour } from '../../types';
import HourModal from './HourModal';
import ConfirmDialog from '../common/ConfirmDialog';
import { formatDate } from '../../utils/formatters';
import Button from '../../components/ui/Button';
import {
  hoursToExcel, downloadExcel, hoursToCSV, downloadCSV, hoursToPDF, downloadPDF,
  hoursToTransposedExcel, hoursToTransposedCSV, hoursToTransposedPDF
} from '../../utils/excelUtils';
import FileNamePrompt from '../ui/FileNamePrompt';
import toast from 'react-hot-toast';
import Menu from '../ui/Menu';
import SampleHourCSV from './SampleHourCSV';

const HourList: React.FC = observer(() => {
  const hourStore = useHourStore();
  const authStore = useAuthStore();
  const isAdmin = authStore.user?.role === 'ADMIN';
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedHour, setSelectedHour] = useState<Hour | null>(null);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isFileNamePromptOpen, setIsFileNamePromptOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'xlsx' | 'csv' | 'pdf'>('xlsx');
  const [selectedHours, setSelectedHours] = useState<string[]>([]);
  const [showBulkMenu, setShowBulkMenu] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploadMode, setUploadMode] = useState<'new' | 'update' | 'both'>('both');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChangePage = async (newPage: number) => {
    try {
      // Use combined action that handles both page change and fetching
      await hourStore.setPageAndFetch(newPage);
      // Clear selections on page change
      setSelectedHours([]);
    } catch (error) {
      console.error('Error changing page:', error);
      toast.error('An error occurred while changing page');
    }
  };

  const handleChangeRowsPerPage = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    try {
      const size = parseInt(e.target.value, 10);
      // Use combined action that handles both page size change and fetching
      await hourStore.setPageSizeAndFetch(size);
      // Clear selections on page size change
      setSelectedHours([]);
    } catch (error) {
      console.error('Error changing rows per page:', error);
      toast.error('An error occurred while changing rows per page');
    }
  };

  const handleSort = async (field: string) => {
    try {
      const newOrder = hourStore.getSortField === field && hourStore.getSortOrder === 'asc' ? 'desc' : 'asc';
      // Use the combined action that handles both sorting and fetching
      await hourStore.sortAndFetch(field, newOrder);
      // Clear selections on sort
      setSelectedHours([]);
    } catch (error) {
      console.error('Error sorting hours:', error);
      toast.error('An error occurred while sorting');
    }
  };

  const handleAddClick = () => {
    setSelectedHour(null);
    setOpenAddModal(true);
  };

  const handleEditClick = (hour: Hour) => {
    setSelectedHour(hour);
    setOpenEditModal(true);
  };

  const handleDeleteClick = (hour: Hour) => {
    setSelectedHour(hour);
    setOpenDeleteDialog(true);
  };

  const handleAddHour = async (hourData: Partial<Hour>) => {
    await hourStore.addHour(hourData);
    setOpenAddModal(false);
  };

  const handleUpdateHour = async (hourData: Partial<Hour>) => {
    if (selectedHour) {
      await hourStore.updateHour(selectedHour._id as string, hourData);
      setOpenEditModal(false);
    }
  };

  const handleDeleteHour = async () => {
    if (selectedHour) {
      await hourStore.deleteHour(selectedHour._id as string);
      setOpenDeleteDialog(false);
    }
  };

  const renderSortIcon = (field: string) => {
    if (hourStore.getSortField !== field) return null;
    return hourStore.getSortOrder === 'asc' ? 
      <ArrowUp className="h-4 w-4 inline ml-1" /> : 
      <ArrowDown className="h-4 w-4 inline ml-1" />;
  };

  const getChapterStatusColor = (status: string) => {
    switch (status) {
      case 'NOT STARTED':
        return 'bg-red-100 text-red-800';
      case 'ONGOING':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Function to highlight search matches in text
  const highlightSearchMatch = (text: string | number | undefined | null) => {
    // Handle undefined, null, or empty values
    if (text === undefined || text === null) {
      return <span>-</span>;
    }
    
    // Convert to string for consistency
    const stringValue = String(text);
    if (stringValue.trim() === '') {
      return <span>-</span>;
    }
    
    const searchQuery = hourStore.searchQuery.get();
    
    if (!searchQuery || typeof searchQuery !== 'string' || searchQuery.trim() === '') {
      return <span>{stringValue}</span>;
    }
    
    // The server has already filtered matching results, but we still want to highlight matches
    try {
      const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      const parts = stringValue.split(regex);
      
      return (
        <>
          {parts.map((part, i) => 
            regex.test(part) ? 
              <span key={i} className="bg-yellow-200 font-medium">{part}</span> : 
              <span key={i}>{part}</span>
          )}
        </>
      );
    } catch (error) {
      // Fallback in case of regex errors
      console.error('Error in highlightSearchMatch:', error);
      return <span>{stringValue}</span>;
    }
  };

  // Handle row selection
  const handleSelectRow = (hourId: string) => {
    setSelectedHours(prev => {
      if (prev.includes(hourId)) {
        return prev.filter(id => id !== hourId);
      } else {
        return [...prev, hourId];
      }
    });
  };

  // Handle select all rows
  const handleSelectAll = () => {
    if (selectedHours.length === hourStore.getHours.length) {
      setSelectedHours([]);
    } else {
      setSelectedHours(hourStore.getHours.map(hour => hour._id as string));
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    try {
      for (const hourId of selectedHours) {
        await hourStore.deleteHour(hourId);
      }
      toast.success(`Successfully deleted ${selectedHours.length} hours`);
      setSelectedHours([]);
      setIsBulkDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting hours:', error);
      toast.error('An error occurred while deleting hours');
    }
  };

  // Handle export of selected hours
  const handleExportSelected = (format: 'xlsx' | 'csv' | 'pdf') => {
    setExportFormat(format);
    setIsExportMenuOpen(false);
    setIsFileNamePromptOpen(true);
  };

  const handleExportFormat = (format: 'xlsx' | 'csv' | 'pdf') => {
    setExportFormat(format);
    setIsExportMenuOpen(false);
    setIsFileNamePromptOpen(true);
  };
  
  const handleExport = (filename: string) => {
    try {
      // If there are selected hours, only export those
      const hours = selectedHours.length > 0 
        ? hourStore.getHours.filter(h => selectedHours.includes(h._id as string))
        : hourStore.getHours;

      if (hours.length === 0) {
        toast.error('No hours data to export');
        return;
      }
      
      switch (exportFormat) {
        case 'xlsx':
          const excelData = hoursToTransposedExcel(hours);
          downloadExcel(excelData, `${filename}.xlsx`);
          break;
        case 'csv':
          const csvData = hoursToTransposedCSV(hours);
          downloadCSV(csvData, `${filename}.csv`);
          break;
        case 'pdf':
          const pdfDoc = hoursToTransposedPDF(hours);
          downloadPDF(pdfDoc, `${filename}.pdf`);
          break;
      }
      
      toast.success(`Successfully exported ${hours.length} hour records`);
    } catch (err) {
      console.error('Error exporting data:', err);
      toast.error('Failed to export data');
    }
  };

  // Handle CSV file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setCsvFile(files[0]);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleUploadCSV = async () => {
    if (!csvFile) {
      toast.error('Please select a CSV file');
      return;
    }

    try {
      await hourStore.uploadHoursCSV(csvFile, uploadMode);
      toast.success('CSV file uploaded successfully');
      setCsvFile(null);
      setIsUploadModalOpen(false);
      // Refresh hours data
      await hourStore.fetchHours();
    } catch (error) {
      console.error('Error uploading CSV:', error);
      toast.error('Failed to upload CSV file');
    }
  };

  // Add invert selection function
  const handleInvertSelection = () => {
    const allHourIds = hourStore.getHours.map(hour => hour._id as string);
    const invertedSelection = allHourIds.filter(id => !selectedHours.includes(id));
    setSelectedHours(invertedSelection);
  };

  // Handle export of unselected hours
  const handleExportUnselected = () => {
    try {
      // Get the hours that are not in the selected list
      const unselectedHours = hourStore.getHours.filter(h => !selectedHours.includes(h._id as string));

      if (unselectedHours.length === 0) {
        toast.error('No unselected hours to export');
        return;
      }
      
      // Set the file name with a timestamp
      const timestamp = new Date().toISOString().slice(0, 10);
      const fileName = `hours-unselected-${timestamp}`;
      
      switch (exportFormat) {
        case 'xlsx':
          const excelData = hoursToTransposedExcel(unselectedHours);
          downloadExcel(excelData, `${fileName}.xlsx`);
          break;
        case 'csv':
          const csvData = hoursToTransposedCSV(unselectedHours);
          downloadCSV(csvData, `${fileName}.csv`);
          break;
        case 'pdf':
          const pdfDoc = hoursToTransposedPDF(unselectedHours);
          downloadPDF(pdfDoc, `${fileName}.pdf`);
          break;
      }
      
      toast.success(`Successfully exported ${unselectedHours.length} unselected hour records`);
    } catch (err) {
      console.error('Error exporting unselected data:', err);
      toast.error('Failed to export unselected data');
    }
  };

  if (hourStore.isLoading && !hourStore.getHours.length) {
    return (
      <div className="flex justify-center p-8">
        <div className="text-lg">Loading hour entries...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Hour Entries</h2>
        <div className="flex space-x-2">
          {/* Upload CSV Button - Admin Only */}
          {isAdmin && (
            <div className="relative">
              <Button
                variant="secondary"
                onClick={() => setIsUploadModalOpen(true)}
              >
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".csv"
                className="hidden"
              />
            </div>
          )}

          {/* Bulk Operations Menu */}
          {selectedHours.length > 0 && (
            <div className="relative">
              <Button
                variant="secondary"
                onClick={() => setShowBulkMenu(!showBulkMenu)}
              >
                <CheckSquare className="h-4 w-4 mr-2" />
                Bulk Actions ({selectedHours.length})
              </Button>
              
              {showBulkMenu && (
                <Menu
                  items={[
                    { 
                      label: 'Invert Selection', 
                      onClick: handleInvertSelection 
                    },
                    ...(isAdmin ? [
                      { 
                        label: 'Export Selected to Excel', 
                        onClick: () => handleExportSelected('xlsx') 
                      },
                      { 
                        label: 'Export Selected to CSV', 
                        onClick: () => handleExportSelected('csv') 
                      },
                      { 
                        label: 'Export Selected to PDF', 
                        onClick: () => handleExportSelected('pdf') 
                      },
                      { 
                        label: 'Export Unselected to Excel',
                        onClick: () => {
                          setExportFormat('xlsx');
                          handleExportUnselected();
                        },
                        disabled: selectedHours.length === hourStore.getHours.length
                      },
                      { 
                        label: 'Export Unselected to CSV',
                        onClick: () => {
                          setExportFormat('csv');
                          handleExportUnselected();
                        },
                        disabled: selectedHours.length === hourStore.getHours.length
                      },
                      { 
                        label: 'Export Unselected to PDF',
                        onClick: () => {
                          setExportFormat('pdf');
                          handleExportUnselected();
                        },
                        disabled: selectedHours.length === hourStore.getHours.length
                      },
                    ] : []),
                    { 
                      label: 'Delete Selected', 
                      onClick: () => setIsBulkDeleteDialogOpen(true),
                      className: 'text-red-600'
                    }
                  ]}
                  onClose={() => setShowBulkMenu(false)}
                  className="right-0 mt-2"
                />
              )}
            </div>
          )}

          {/* Export Menu - Admin Only */}
          {isAdmin && (
            <div className="relative">
              <Button
                variant="secondary"
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
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
          
          <Button
            variant="primary"
            onClick={handleAddClick}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Hour
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {/* Select All Checkbox */}
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center justify-center cursor-pointer" onClick={handleSelectAll}>
                  {selectedHours.length === hourStore.getHours.length && hourStore.getHours.length > 0 ? (
                    <CheckSquare className="h-4 w-4 text-blue-600" />
                  ) : (
                    <Square className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              </th>
              <th 
                onClick={() => handleSort('examDate')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              >
                Exam Date {renderSortIcon('examDate')}
              </th>
              <th 
                onClick={() => handleSort('batch')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              >
                Batch {renderSortIcon('batch')}
              </th>
              <th 
                onClick={() => handleSort('subject')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              >
                Subject {renderSortIcon('subject')}
              </th>
              <th 
                onClick={() => handleSort('chapter')}
                className="sticky left-0 z-10 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer bg-gray-50"
              >
                Chapter {renderSortIcon('chapter')}
              </th>
              <th 
                onClick={() => handleSort('mode')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              >
                Mode {renderSortIcon('mode')}
              </th>
              <th 
                onClick={() => handleSort('classTeacher')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              >
                Teacher {renderSortIcon('classTeacher')}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Faculty
              </th>
              <th 
                onClick={() => handleSort('allotedHours')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              >
                Alloted {renderSortIcon('allotedHours')}
              </th>
              <th 
                onClick={() => handleSort('completedHours')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              >
                Completed {renderSortIcon('completedHours')}
              </th>
              <th 
                onClick={() => handleSort('remainingHoursNeeded')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              >
                Remaining {renderSortIcon('remainingHoursNeeded')}
              </th>
              <th 
                onClick={() => handleSort('chapterStatus')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              >
                Status {renderSortIcon('chapterStatus')}
              </th>
              <th 
                onClick={() => handleSort('averageMarksOfBatch')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              >
                Avg. Marks {renderSortIcon('averageMarksOfBatch')}
              </th>
              <th 
                onClick={() => handleSort('numberOfAPlus')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              >
                A+ Count {renderSortIcon('numberOfAPlus')}
              </th>
              <th 
                onClick={() => handleSort('year')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              >
                Year {renderSortIcon('year')}
              </th>
              <th 
                onClick={() => handleSort('remarks1')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              >
                Remarks 1 {renderSortIcon('remarks1')}
              </th>
              <th 
                onClick={() => handleSort('remarks2')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              >
                Remarks 2 {renderSortIcon('remarks2')}
              </th>
              <th 
                onClick={() => handleSort('remarks3')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              >
                Remarks 3 {renderSortIcon('remarks3')}
              </th>
              <th 
                onClick={() => handleSort('flag1')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              >
                Flag 1 {renderSortIcon('flag1')}
              </th>
              <th 
                onClick={() => handleSort('flag2')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              >
                Flag 2 {renderSortIcon('flag2')}
              </th>
              <th 
                onClick={() => handleSort('flag3')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              >
                Flag 3 {renderSortIcon('flag3')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {hourStore.getHours.length === 0 ? (
              <tr>
                <td colSpan={23} className="px-6 py-4 text-center text-sm text-gray-500">
                  No hour entries found
                </td>
              </tr>
            ) : (
              hourStore.getHours.map((hour) => (
                <tr key={hour._id} className={`hover:bg-gray-50 ${selectedHours.includes(hour._id as string) ? 'bg-blue-50' : ''}`}>
                  {/* Row Checkbox */}
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div 
                      className="flex items-center justify-center cursor-pointer"
                      onClick={() => handleSelectRow(hour._id as string)}
                    >
                      {selectedHours.includes(hour._id as string) ? (
                        <CheckSquare className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Square className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(hour.examDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {highlightSearchMatch(hour.batch)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {highlightSearchMatch(hour.subject)}
                  </td>
                  <td className="sticky left-0 z-10 px-6 py-4 whitespace-nowrap text-sm text-gray-500 bg-white">
                    <div className="max-w-[250px] overflow-hidden text-ellipsis">
                      {highlightSearchMatch(hour.chapter)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {highlightSearchMatch(hour.mode)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {highlightSearchMatch(hour.classTeacher)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {hour.faculties && hour.faculties.length > 0 ? (
                      <div>
                        {hour.faculties.map((faculty, index) => (
                          <div key={index} className="mb-1">
                            {faculty.code && faculty.name ? (
                              <>
                                <span className="font-semibold">{highlightSearchMatch(faculty.code)}</span>: {highlightSearchMatch(faculty.name)}
                              </>
                            ) : (
                              highlightSearchMatch(faculty.code || faculty.name || '')
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      // For backward compatibility with old data format
                      <>
                        {hour.faculty1 && (
                          <div className="mb-1">
                            {typeof hour.faculty1 === 'object' ? (
                              <>
                                {hour.faculty1.code && hour.faculty1.name ? (
                                  <>
                                    <span className="font-semibold">{highlightSearchMatch(hour.faculty1.code)}</span>: {highlightSearchMatch(hour.faculty1.name)}
                                  </>
                                ) : (
                                  highlightSearchMatch(hour.faculty1.code || hour.faculty1.name || '')
                                )}
                              </>
                            ) : (
                              highlightSearchMatch(String(hour.faculty1))
                            )}
                          </div>
                        )}
                        {hour.faculty2 && (
                          <div className="mb-1">
                            {typeof hour.faculty2 === 'object' ? (
                              <>
                                {hour.faculty2.code && hour.faculty2.name ? (
                                  <>
                                    <span className="font-semibold">{highlightSearchMatch(hour.faculty2.code)}</span>: {highlightSearchMatch(hour.faculty2.name)}
                                  </>
                                ) : (
                                  highlightSearchMatch(hour.faculty2.code || hour.faculty2.name || '')
                                )}
                              </>
                            ) : (
                              highlightSearchMatch(String(hour.faculty2))
                            )}
                          </div>
                        )}
                        {hour.faculty3 && (
                          <div className="mb-1">
                            {typeof hour.faculty3 === 'object' ? (
                              <>
                                {hour.faculty3.code && hour.faculty3.name ? (
                                  <>
                                    <span className="font-semibold">{highlightSearchMatch(hour.faculty3.code)}</span>: {highlightSearchMatch(hour.faculty3.name)}
                                  </>
                                ) : (
                                  highlightSearchMatch(hour.faculty3.code || hour.faculty3.name || '')
                                )}
                              </>
                            ) : (
                              highlightSearchMatch(String(hour.faculty3))
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {hour.allotedHours}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {hour.completedHours}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {hour.remainingHoursNeeded || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 text-xs rounded-full ${getChapterStatusColor(hour.chapterStatus)}`}>
                      {highlightSearchMatch(hour.chapterStatus === 'NOT STARTED' ? 'NOT STARTED' : hour.chapterStatus)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {hour.averageMarksOfBatch ? highlightSearchMatch(String(hour.averageMarksOfBatch)) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {hour.numberOfAPlus ? highlightSearchMatch(String(hour.numberOfAPlus)) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {hour.year ? highlightSearchMatch(String(hour.year)) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {hour.remarks1 ? highlightSearchMatch(String(hour.remarks1)) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {hour.remarks2 ? highlightSearchMatch(String(hour.remarks2)) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {hour.remarks3 ? highlightSearchMatch(String(hour.remarks3)) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {hour.flag1 ? highlightSearchMatch(String(hour.flag1)) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {hour.flag2 ? highlightSearchMatch(String(hour.flag2)) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {hour.flag3 ? highlightSearchMatch(String(hour.flag3)) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button 
                      onClick={() => handleEditClick(hour)}
                      className="text-blue-600 hover:text-blue-900 mr-2"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteClick(hour)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center">
          <span className="mr-2 text-sm text-gray-700">Rows per page:</span>
          <select
            value={hourStore.getPageSize}
            onChange={handleChangeRowsPerPage}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            {[50, 100, 250, 500].map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center">
          <span className="mr-4 text-sm text-gray-700">
            {hourStore.getTotalHours === 0 ? '0-0' : 
              `${hourStore.getCurrentPage * hourStore.getPageSize - hourStore.getPageSize + 1}-
              ${Math.min(hourStore.getCurrentPage * hourStore.getPageSize, hourStore.getTotalHours)}`} of {hourStore.getTotalHours}
          </span>
          <div className="flex">
            <button
              onClick={() => handleChangePage(hourStore.getCurrentPage - 1)}
              disabled={hourStore.getCurrentPage === 1}
              className="px-2 py-1 border border-gray-300 rounded-l disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => handleChangePage(hourStore.getCurrentPage + 1)}
              disabled={hourStore.getCurrentPage >= Math.ceil(hourStore.getTotalHours / hourStore.getPageSize)}
              className="px-2 py-1 border border-gray-300 rounded-r disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Add Hour Modal */}
      <HourModal
        open={openAddModal}
        onClose={() => setOpenAddModal(false)}
        onSubmit={handleAddHour}
        title="Add Hour Entry"
      />

      {/* Edit Hour Modal */}
      <HourModal
        open={openEditModal}
        onClose={() => setOpenEditModal(false)}
        onSubmit={handleUpdateHour}
        title="Edit Hour Entry"
        hour={selectedHour}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        onConfirm={handleDeleteHour}
        title="Delete Hour Entry"
        content="Are you sure you want to delete this hour entry? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* Bulk Delete Confirmation Dialog */}
      <ConfirmDialog
        open={isBulkDeleteDialogOpen}
        onClose={() => setIsBulkDeleteDialogOpen(false)}
        onConfirm={handleBulkDelete}
        title="Delete Selected Hours"
        content={`Are you sure you want to delete ${selectedHours.length} selected hour entries? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* CSV Upload Modal */}
      <ConfirmDialog
        open={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setCsvFile(null);
        }}
        onConfirm={handleUploadCSV}
        title="Upload Hours CSV"
        content={
          <div className="space-y-4 py-2">
            <p>Upload a CSV file to import hour data.</p>
            <div className="border border-dashed border-gray-300 rounded-md p-4">
              <div className="flex flex-col items-center space-y-2">
                <FileText className="h-8 w-8 text-gray-400" />
                <div className="text-sm text-gray-500">
                  {csvFile ? (
                    <span className="text-blue-600 font-medium">{csvFile.name}</span>
                  ) : (
                    <span>Click to select a CSV file or drag and drop</span>
                  )}
                </div>
                <Button
                  variant="secondary"
                  onClick={handleUploadClick}
                  size="sm"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Browse Files
                </Button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Import Mode
              </label>
              <select
                value={uploadMode}
                onChange={(e) => setUploadMode(e.target.value as 'new' | 'update' | 'both')}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="both">Add New & Update Existing</option>
                <option value="new">Add New Only</option>
                <option value="update">Update Existing Only</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Select how you want to handle the imported data.
              </p>
            </div>
            <div className="border-t border-gray-200 pt-3">
              <p className="text-sm text-gray-600 mb-1">Need a template?</p>
              <SampleHourCSV />
            </div>
          </div>
        }
        confirmText="Upload"
        cancelText="Cancel"
        confirmDisabled={!csvFile}
        fullWidth
      />

      {/* Add FileNamePrompt */}
      <FileNamePrompt
        isOpen={isFileNamePromptOpen}
        onClose={() => setIsFileNamePromptOpen(false)}
        onConfirm={handleExport}
        defaultFileName={`hours-export-${new Date().toISOString().slice(0, 10)}`}
        title="Export Hours"
        fileType={exportFormat === 'xlsx' ? 'Excel (.xlsx)' : exportFormat === 'csv' ? 'CSV' : 'PDF'}
      />
    </div>
  );
});

export default HourList; 