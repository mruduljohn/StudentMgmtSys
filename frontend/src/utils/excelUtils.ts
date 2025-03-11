import * as XLSX from 'xlsx';
import { Student } from '../types';

// Define a type for Excel row data
interface ExcelRow {
  [key: string]: string | number | boolean | undefined;
}

// Convert Excel data to Student objects
export const excelToStudents = (data: ArrayBuffer): Student[] => {
  const workbook = XLSX.read(data, { type: 'array' });
  console.log('Sheet Names:', workbook.SheetNames);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet);
  
  jsonData.forEach((row: ExcelRow) => {
    console.log('Excel Row:', row);
  });

  // Helper function to convert boolean to string representation
  const booleanToString = (value: string | number | boolean | undefined): string => {
    if (value === true || value === 'true' || value === 'yes' || value === 'y' || value === 1) return 'JOINED';
    if (value === false || value === 'false' || value === 'no' || value === 'n' || value === 0) return 'NOT JOINING';
    return String(value || '');
  };

  // Helper function to ensure enum values match allowed values
  const ensureValidEnum = (
    value: string | number | boolean | undefined, 
    allowedValues: string[], 
    defaultValue: string
  ): string => {
    if (value === undefined || value === null) return defaultValue;
    const strValue = String(value).toUpperCase();
    if (allowedValues.includes(strValue)) return strValue;
    return defaultValue;
  };

  // Helper function to convert to string
  const toString = (value: string | number | boolean | undefined): string => {
    if (value === undefined || value === null) return '';
    return String(value);
  };

  // Helper function to convert to number
  const toNumber = (value: string | number | boolean | undefined): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'boolean') return value ? 1 : 0;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  // Define allowed enum values based on the backend schema
  const genderValues = ["M", "F", "DIFFERENT"];
  // Map gender values from backend to frontend
  const genderMap: Record<string, Student['gender']> = {
    'M': 'M',
    'F': 'F',
    'DIFFERENT': 'DIFFERENT'
  };

  const studyMaterialValues = ["NOT RECEIVED", "RECEIVED", "PARTIALLY RECEIVED"];
  const uniformValues = ["NOT RECEIVED", "RECEIVED", "PARTIALLY RECEIVED"];
  const idCardValues = ["NOT RECEIVED", "RECEIVED"];
  const tabValues = ["REQUESTED NOT PAID", "RECEIVED PAID", "RECEIVED NOT PAID", "REQUESTED PAID", "PERSONAL TAB", "NOT REQUIRED"];
  const joinedStatusValues = ["ALLOTED", "DISCONTINUED", "JOINED", "NOT JOINING", "CENTRE CHANGE"];
  // Map joined status values from backend to frontend
  const joinedStatusMap: Record<string, Student['joined']> = {
    'ALLOTED': 'ALLOTED',
    'DISCONTINUED': 'DISCONTINUED',
    'JOINED': 'JOINED',
    'NOT JOINING': 'NOT JOINING',
    'CENTRE CHANGE': 'CENTRE CHANGE'
  };

  const syllabusValues = ["STATE", "CBSE", "ICSE", "OTHER"];
  // Map syllabus values from backend to frontend
  const syllabusMap: Record<string, Student['syllabus']> = {
    'STATE': 'STATE',
    'CBSE': 'CBSE',
    'ICSE': 'ICSC',
    'OTHER': 'OTHERS'
  };

  return jsonData.map((row: ExcelRow, index): Student => {
    // Get gender value and map it to the frontend enum
    const backendGender = ensureValidEnum(row['GENDER'], genderValues, 'M');
    const frontendGender = genderMap[backendGender] as Student['gender'];
    
    // Get joined status value and map it to the frontend enum
    const backendJoined = ensureValidEnum(row['JOINED'], joinedStatusValues, 'ALLOTED');
    const frontendJoined = joinedStatusMap[backendJoined] as Student['joined'];
    
    // Get syllabus value and map it to the frontend enum
    const backendSyllabus = ensureValidEnum(row['Syllabus'], syllabusValues, 'STATE');
    const frontendSyllabus = syllabusMap[backendSyllabus] as Student['syllabus'];
    
    return {
      slNo: toNumber(row['Sl No']) || index + 1,
      name: toString(row['NAME']) || '',
      studentId: toString(row['STUDENT ID']) || '',
      phoneNumber: toString(row['PHONE NUMBER']) || '',
      gender: frontendGender,
      batch: toString(row['BATCH']) || '',
      classTeacher: toString(row['CLASS TEACHER']) || '',
      hostel: toString(row['Hostel']) || '',
      stream: toString(row['Stream']) || '',
      program: toString(row['PROGRAM']) || '',
      studyMaterial: ensureValidEnum(row['Study Material'], studyMaterialValues, 'NOT RECEIVED'),
      uniform: ensureValidEnum(row['Uniform'], uniformValues, 'NOT RECEIVED'),
      idCard: ensureValidEnum(row['ID Card'], idCardValues, 'NOT RECEIVED'),
      tab: ensureValidEnum(row['Tab'], tabValues, 'NOT REQUIRED'),
      joined: frontendJoined,
      syllabus: frontendSyllabus,
      percentageOfPlus2Marks: toNumber(row['Percentage of +2 Marks']) || 0,
      neetScore: toNumber(row['NEET Score']) || 0,
      remarks: toString(row['Remarks']) || '',
      remarks1: toString(row['Remarks 1']) || '',
      remarks2: toString(row['Remarks 2']) || '',
      remarks3: toString(row['Remarks 3']) || '',
      remarks4: toString(row['Remarks 4']) || '',
      feeDue: toNumber(row['Fee Due']) || 0,
      flag1: booleanToString(row['Flag1']),
      flag2: booleanToString(row['Flag2']),
      flag3: booleanToString(row['Flag3']),
      flag4: booleanToString(row['Flag4']),
    };
  });
};

// Convert Student objects to Excel data
export const studentsToExcel = (students: Student[]): ArrayBuffer => {
  const worksheet = XLSX.utils.json_to_sheet(students.map(student => ({
    'Sl No': student.slNo,
    'NAME': student.name,
    'STUDENT ID': student.studentId,
    'PHONE NUMBER': student.phoneNumber,
    'GENDER': student.gender,
    'BATCH': student.batch,
    'CLASS TEACHER': student.classTeacher,
    'Hostel': student.hostel,
    'Stream': student.stream,
    'PROGRAM': student.program,
    'Study Material': student.studyMaterial,
    'Uniform': student.uniform,
    'ID Card': student.idCard,
    'Tab': student.tab,
    'JOINED': student.joined,
    'Syllabus': student.syllabus,
    'Percentage of +2 Marks': student.percentageOfPlus2Marks,
    'NEET Score': student.neetScore,
    'Remarks': student.remarks,
    'Remarks 1': student.remarks1,
    'Remarks 2': student.remarks2,
    'Remarks 3': student.remarks3,
    'Remarks 4': student.remarks4,
    'Fee Due': student.feeDue,
    'Flag1': student.flag1,
    'Flag2': student.flag2,
    'Flag3': student.flag3,
    'Flag4': student.flag4,
  })));
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
  
  return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
};

// Download Excel file
export const downloadExcel = (data: ArrayBuffer, filename: string): void => {
  const blob = new Blob([data], { type: 'application/octet-stream' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};