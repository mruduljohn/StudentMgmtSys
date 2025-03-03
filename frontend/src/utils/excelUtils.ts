import * as XLSX from 'xlsx';
import { Student } from '../types';

// Convert Excel data to Student objects
export const excelToStudents = (data: ArrayBuffer): Student[] => {
  const workbook = XLSX.read(data, { type: 'array' });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json(worksheet);
  
  return jsonData.map((row: any, index) => ({
    slNo: row['Sl No'] || index + 1,
    name: row['NAME'] || '',
    studentId: row['STUDENT ID']?.toString() || '',
    phoneNumber: row['PHONE NUMBER']?.toString() || '',
    gender: row['GENDER'] || 'MALE',
    batch: row['BATCH'] || '',
    classTeacher: row['CLASS TEACHER'] || '',
    hostel: row['Hostel'] || '',
    stream: row['Stream'] || 'MEDICAL',
    program: row['PROGRAM'] || '',
    studyMaterial: row['Study Material'] || '',
    uniform: row['Uniform'] || '',
    idCard: row['ID Card'] || '',
    tab: row['Tab'] || '',
    joined: row['JOINED'] || 'ALLOTED',
    syllabus: row['Syllabus'] || 'STATE',
    percentageOfPlus2Marks: parseFloat(row['Percentage of +2 Marks']) || 0,
    neetScore: parseInt(row['NEET Score']) || 0,
    remarks: row['Remarks'] || '',
    remarks1: row['Remarks 1'] || '',
    remarks2: row['Remarks 2'] || '',
    remarks3: row['Remarks 3'] || '',
    remarks4: row['Remarks 4'] || '',
    feeDue: parseFloat(row['Fee Due']) || 0,
    flag1: row['Flag1'] || '',
    flag2: row['Flag2'] || '',
    flag3: row['Flag3'] || '',
    flag4: row['Flag4'] || '',
  }));
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
  a.click();
  window.URL.revokeObjectURL(url);
};