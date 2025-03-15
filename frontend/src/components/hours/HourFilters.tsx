import React from 'react';

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
  onBatchChange: (batch: string) => void;
  onSubjectChange: (subject: string) => void;
  onModeChange: (mode: string) => void;
  onTeacherChange: (teacher: string) => void;
  onStatusChange: (status: string) => void;
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
  onBatchChange,
  onSubjectChange,
  onModeChange,
  onTeacherChange,
  onStatusChange
}) => {
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

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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