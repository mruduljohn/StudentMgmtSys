import { FieldConfig } from '../types';

// Define which fields mentors can edit
export const getFieldConfigs = (): FieldConfig[] => [
  { id: 'slNo', label: 'Sl No', type: 'number', editable: true },
  { id: 'name', label: 'Name', type: 'text', editable: true },
  { id: 'studentId', label: 'Student ID', type: 'text', editable: false },
  { id: 'phoneNumber', label: 'Phone Number', type: 'text', editable: true },
  { 
    id: 'gender', 
    label: 'Gender', 
    type: 'select', 
    options: ['M', 'F', 'DIFFERENT'], 
    editable: true 
  },
  { id: 'batch', label: 'Batch', type: 'select', editable: true },
  { id: 'classTeacher', label: 'Class Teacher', type: 'select', editable: true },
  { id: 'hostel', label: 'Hostel', type: 'select', editable: true },
  { 
    id: 'stream', 
    label: 'Stream', 
    type: 'select', 
    options: ['MEDICAL', 'ENGINEERING', 'FOUNDATION'], 
    editable: true 
  },
  { id: 'program', label: 'Program', type: 'select', editable: true },
  { id: 'studyMaterial', label: 'Study Material', type: 'select', editable: true },
  { id: 'uniform', label: 'Uniform', type: 'select', editable: true },
  { id: 'idCard', label: 'ID Card', type: 'select', editable: true },
  { id: 'tab', label: 'Tab', type: 'select', editable: true },
  { 
    id: 'joined', 
    label: 'Joined', 
    type: 'select', 
    options: ['ALLOTED', 'JOINING SOON', 'JOINED', 'NOT JOINING', 'VACATED'], 
    editable: true 
  },
  { 
    id: 'syllabus', 
    label: 'Syllabus', 
    type: 'select', 
    options: ['STATE', 'CBSE', 'ICSC', 'OTHER'], 
    editable: true 
  },
  { 
    id: 'percentageOfPlus2Marks', 
    label: 'Percentage of +2 Marks', 
    type: 'number', 
    editable: true,
    validation: (value) => value >= 0 && value <= 100,
    errorMessage: 'Percentage must be between 0 and 100'
  },
  { 
    id: 'neetScore', 
    label: 'NEET Score', 
    type: 'number', 
    editable: true,
    validation: (value) => value >= 0 && value <= 720,
    errorMessage: 'NEET score must be between 0 and 720'
  },
  { id: 'remarks', label: 'Remarks', type: 'text', editable: true },
  { id: 'remarks1', label: 'Remarks 1', type: 'text', editable: true },
  { id: 'remarks2', label: 'Remarks 2', type: 'text', editable: true },
  { id: 'remarks3', label: 'Remarks 3', type: 'text', editable: true },
  { id: 'remarks4', label: 'Remarks 4', type: 'text', editable: true },
  { id: 'feeDue', label: 'Fee Due', type: 'number', editable: true },
  { id: 'flag1', label: 'Flag 1', type: 'select', editable: true },
  { id: 'flag2', label: 'Flag 2', type: 'select', editable: true },
  { id: 'flag3', label: 'Flag 3', type: 'select', editable: true },
  { id: 'flag4', label: 'Flag 4', type: 'select', editable: true },
];