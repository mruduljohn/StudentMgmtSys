import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Edit, Trash2, Plus, ArrowUp, ArrowDown } from 'lucide-react';
import { useHourStore } from '../../store/hourStore';
import { Hour } from '../../types';
import HourModal from './HourModal';
import ConfirmDialog from '../common/ConfirmDialog';
import { formatDate } from '../../utils/formatters';
import Button from '../../components/ui/Button';

const HourList: React.FC = observer(() => {
  const hourStore = useHourStore();
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedHour, setSelectedHour] = useState<Hour | null>(null);

  const handleChangePage = (newPage: number) => {
    hourStore.setPage(newPage);
    hourStore.fetchHours();
  };

  const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLSelectElement>) => {
    hourStore.setPageSize(parseInt(e.target.value, 10));
    hourStore.setPage(1);
    hourStore.fetchHours();
  };

  const handleSort = (field: string) => {
    const newOrder = hourStore.getSortField === field && hourStore.getSortOrder === 'asc' ? 'desc' : 'asc';
    hourStore.setSorting(field, newOrder);
    hourStore.fetchHours();
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
        <Button
          variant="primary"
          onClick={handleAddClick}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Hour
        </Button>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                onClick={() => handleSort('date')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              >
                Date {renderSortIcon('date')}
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
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {hourStore.getHours.length === 0 ? (
              <tr>
                <td colSpan={14} className="px-6 py-4 text-center text-sm text-gray-500">
                  No hour entries found
                </td>
              </tr>
            ) : (
              hourStore.getHours.map((hour) => (
                <tr key={hour._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(hour.examDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {hour.batch}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {hour.subject}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {hour.chapter}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {hour.mode}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {hour.classTeacher}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {hour.faculties && hour.faculties.length > 0 ? (
                      <div>
                        {hour.faculties.map((faculty, index) => (
                          <div key={index} className="mb-1">
                            {faculty.code && faculty.name ? (
                              <>
                                <span className="font-semibold">{faculty.code}</span>: {faculty.name}
                              </>
                            ) : (
                              faculty.code || faculty.name || ''
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
                                    <span className="font-semibold">{hour.faculty1.code}</span>: {hour.faculty1.name}
                                  </>
                                ) : (
                                  hour.faculty1.code || hour.faculty1.name || ''
                                )}
                              </>
                            ) : (
                              String(hour.faculty1)
                            )}
                          </div>
                        )}
                        {hour.faculty2 && (
                          <div className="mb-1">
                            {typeof hour.faculty2 === 'object' ? (
                              <>
                                {hour.faculty2.code && hour.faculty2.name ? (
                                  <>
                                    <span className="font-semibold">{hour.faculty2.code}</span>: {hour.faculty2.name}
                                  </>
                                ) : (
                                  hour.faculty2.code || hour.faculty2.name || ''
                                )}
                              </>
                            ) : (
                              String(hour.faculty2)
                            )}
                          </div>
                        )}
                        {hour.faculty3 && (
                          <div className="mb-1">
                            {typeof hour.faculty3 === 'object' ? (
                              <>
                                {hour.faculty3.code && hour.faculty3.name ? (
                                  <>
                                    <span className="font-semibold">{hour.faculty3.code}</span>: {hour.faculty3.name}
                                  </>
                                ) : (
                                  hour.faculty3.code || hour.faculty3.name || ''
                                )}
                              </>
                            ) : (
                              String(hour.faculty3)
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
                      {hour.chapterStatus === 'NOT STARTED' ? 'NOT STARTED' : hour.chapterStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {hour.averageMarksOfBatch || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {hour.numberOfAPlus || '-'}
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
            {[5, 10, 25, 50].map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center">
          <span className="mr-4 text-sm text-gray-700">
            {hourStore.getCurrentPage * hourStore.getPageSize - hourStore.getPageSize + 1}-
            {Math.min(hourStore.getCurrentPage * hourStore.getPageSize, hourStore.getTotalHours)} of {hourStore.getTotalHours}
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
    </div>
  );
});

export default HourList; 