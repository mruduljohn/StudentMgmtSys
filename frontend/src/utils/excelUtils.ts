import * as XLSX from 'xlsx';
import { Student } from '../types';

// Add new imports for PDF export
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Define a type for Excel row data
interface ExcelRow {
  [key: string]: string | number | boolean | undefined;
}

// Define types for custom labels
interface CustomLabels {
  remarks?: string;
  remarks1?: string;
  remarks2?: string;
  remarks3?: string;
  remarks4?: string;
  flag1?: string;
  flag2?: string;
  flag3?: string;
  flag4?: string;
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
export const studentsToExcel = (
  students: Student[], 
  customLabels: CustomLabels = {}
): ArrayBuffer => {
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
    [customLabels.remarks || 'Remarks']: student.remarks,
    [customLabels.remarks1 || 'Remarks 1']: student.remarks1,
    [customLabels.remarks2 || 'Remarks 2']: student.remarks2,
    [customLabels.remarks3 || 'Remarks 3']: student.remarks3,
    [customLabels.remarks4 || 'Remarks 4']: student.remarks4,
    'Fee Due': student.feeDue,
    [customLabels.flag1 || 'Flag 1']: student.flag1,
    [customLabels.flag2 || 'Flag 2']: student.flag2,
    [customLabels.flag3 || 'Flag 3']: student.flag3,
    [customLabels.flag4 || 'Flag 4']: student.flag4,
  })));
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
  
  return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
};

// Convert Student objects to CSV data
export const studentsToCSV = (
  students: Student[],
  customLabels: CustomLabels = {}
): string => {
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
    [customLabels.remarks || 'Remarks']: student.remarks,
    [customLabels.remarks1 || 'Remarks 1']: student.remarks1,
    [customLabels.remarks2 || 'Remarks 2']: student.remarks2,
    [customLabels.remarks3 || 'Remarks 3']: student.remarks3,
    [customLabels.remarks4 || 'Remarks 4']: student.remarks4,
    'Fee Due': student.feeDue,
    [customLabels.flag1 || 'Flag 1']: student.flag1,
    [customLabels.flag2 || 'Flag 2']: student.flag2,
    [customLabels.flag3 || 'Flag 3']: student.flag3,
    [customLabels.flag4 || 'Flag 4']: student.flag4,
  })));
  
  return XLSX.utils.sheet_to_csv(worksheet);
};

// Convert Student objects to PDF data
export const studentsToPDF = (
  students: Student[],
  customLabels: CustomLabels = {}
): jsPDF => {
  // Use landscape orientation with larger page size to fit all columns
  const doc = new jsPDF('landscape');
  
  // Get custom label values with defaults
  const remarksLabel = customLabels.remarks || 'Remarks';
  const remarks1Label = customLabels.remarks1 || 'Remarks 1';
  const remarks2Label = customLabels.remarks2 || 'Remarks 2';
  const remarks3Label = customLabels.remarks3 || 'Remarks 3';
  const remarks4Label = customLabels.remarks4 || 'Remarks 4';
  const flag1Label = customLabels.flag1 || 'Flag 1';
  const flag2Label = customLabels.flag2 || 'Flag 2';
  const flag3Label = customLabels.flag3 || 'Flag 3';
  const flag4Label = customLabels.flag4 || 'Flag 4';
  
  // Define columns for PDF table - include all student fields
  const tableColumn = [
    'Sl No', 
    'Name', 
    'Student ID', 
    'Phone', 
    'Gender', 
    'Batch', 
    'Class Teacher', 
    'Hostel', 
    'Stream', 
    'Program',
    'Study Material',
    'Uniform',
    'ID Card',
    'Tab',
    'Joined', 
    'Syllabus',
    '+2 Marks %',
    'NEET Score',
    'Fee Due',
    remarksLabel,
    remarks1Label,
    remarks2Label,
    remarks3Label,
    remarks4Label,
    flag1Label,
    flag2Label,
    flag3Label,
    flag4Label
  ];
  
  // Convert students to rows for PDF - include all fields
  const tableRows = students.map(student => [
    student.slNo,
    student.name,
    student.studentId,
    student.phoneNumber,
    student.gender,
    student.batch,
    student.classTeacher,
    student.hostel,
    student.stream,
    student.program,
    student.studyMaterial,
    student.uniform,
    student.idCard,
    student.tab,
    student.joined,
    student.syllabus,
    student.percentageOfPlus2Marks,
    student.neetScore,
    student.feeDue,
    student.remarks,
    student.remarks1,
    student.remarks2,
    student.remarks3,
    student.remarks4,
    student.flag1,
    student.flag2,
    student.flag3,
    student.flag4
  ]);
  
  // Add title to PDF
  doc.setFontSize(16);
  doc.text('Student Records', 14, 15);
  doc.setFontSize(10);
  doc.text(`Generated on ${new Date().toLocaleString()}`, 14, 22);
  
  // Add table with autoTable
  autoTable(doc, { 
    head: [tableColumn],
    body: tableRows,
    startY: 30,
    theme: 'grid',
    headStyles: { fillColor: [66, 66, 66] },
    styles: { overflow: 'linebreak', cellWidth: 'auto', fontSize: 8 },
    columnStyles: {
      // Set narrower width for certain columns to improve fit
      0: { cellWidth: 10 }, // Sl. No
      3: { cellWidth: 25 }, // Phone
      4: { cellWidth: 15 }, // Gender
      12: { cellWidth: 15 }, // ID Card
      13: { cellWidth: 15 }, // Tab
      14: { cellWidth: 20 }, // Joined
      15: { cellWidth: 20 }, // Syllabus
      16: { cellWidth: 20 }, // +2 Marks %
      17: { cellWidth: 20 }, // NEET Score
      18: { cellWidth: 15 }, // Fee Due
    }
  });
  
  return doc;
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

// Download CSV file
export const downloadCSV = (data: string, filename: string): void => {
  const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

// Download PDF file
export const downloadPDF = (doc: jsPDF, filename: string): void => {
  doc.save(filename);
};

// Convert Hour objects to Excel data
export const hoursToExcel = (hours: any[]): ArrayBuffer => {
  const worksheet = XLSX.utils.json_to_sheet(hours.map(hour => {
    // Extract faculty information
    const facultyNames = hour.faculties?.map((f: any) => f.name).join(', ') || '';
    const facultyCodes = hour.faculties?.map((f: any) => f.code).join(', ') || '';
    
    return {
      'Batch': hour.batch,
      'Subject': hour.subject,
      'Chapter': hour.chapter,
      'Mode': hour.mode,
      'Class Teacher': hour.classTeacher,
      'Faculty Code': facultyCodes,
      'Faculty Name': facultyNames,
      'Status': hour.chapterStatus,
      'Exam Date': hour.date,
      'Alloted Hours': hour.allotedHours,
      'Completed Hours': hour.completedHours,
      'Remaining Hours': hour.remainingHours,
      'Average Marks': hour.averageMarksOfBatch,
      'A+ Count': hour.numberOfAPlus,
      'Remarks 1': hour.remarks1,
      'Remarks 2': hour.remarks2,
      'Flag 1': hour.flag1,
      'Flag 2': hour.flag2,
      'Created At': hour.createdAt,
      'Updated At': hour.updatedAt
    };
  }));
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Hours');
  
  return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
};

// Convert Hour objects to CSV data
export const hoursToCSV = (hours: any[]): string => {
  const worksheet = XLSX.utils.json_to_sheet(hours.map(hour => {
    // Extract faculty information
    const facultyNames = hour.faculties?.map((f: any) => f.name).join(', ') || '';
    const facultyCodes = hour.faculties?.map((f: any) => f.code).join(', ') || '';
    
    return {
      'Batch': hour.batch,
      'Subject': hour.subject,
      'Chapter': hour.chapter,
      'Mode': hour.mode,
      'Class Teacher': hour.classTeacher,
      'Faculty Code': facultyCodes,
      'Faculty Name': facultyNames,
      'Status': hour.chapterStatus,
      'Exam Date': hour.date,
      'Alloted Hours': hour.allotedHours,
      'Completed Hours': hour.completedHours,
      'Remaining Hours': hour.remainingHours,
      'Average Marks': hour.averageMarksOfBatch,
      'A+ Count': hour.numberOfAPlus,
      'Remarks 1': hour.remarks1,
      'Remarks 2': hour.remarks2,
      'Flag 1': hour.flag1,
      'Flag 2': hour.flag2,
      'Created At': hour.createdAt,
      'Updated At': hour.updatedAt
    };
  }));
  
  return XLSX.utils.sheet_to_csv(worksheet);
};

// Convert Hour objects to PDF data
export const hoursToPDF = (hours: any[]): jsPDF => {
  const doc = new jsPDF('landscape');
  
  const tableColumn = ['Batch', 'Subject', 'Chapter', 'Mode', 'Class Teacher', 'Faculty', 'Status', 'Exam Date', 'Alloted Hrs', 'Completed Hrs', 'Remaining Hrs'];
  const tableRows = hours.map(hour => [
    hour.batch,
    hour.subject,
    hour.chapter,
    hour.mode,
    hour.classTeacher,
    hour.faculties?.map((f: any) => `${f.code ? f.code + ': ' : ''}${f.name || ''}`).join(', ') || '',
    hour.chapterStatus,
    hour.examDate,
    hour.allotedHours,
    hour.completedHours,
    hour.remainingHours || (hour.allotedHours - hour.completedHours)
  ]);
  
  // Add title to PDF
  doc.setFontSize(16);
  doc.text('Hour Records', 14, 15);
  doc.setFontSize(10);
  doc.text(`Generated on ${new Date().toLocaleString()}`, 14, 22);
  
  // Create table in PDF
  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 30,
    styles: { overflow: 'linebreak' },
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    alternateRowStyles: { fillColor: [242, 242, 242] },
    margin: { top: 30 },
  });
  
  return doc;
};

// Convert HourStats to Excel data for export
export const hourStatsToExcel = (stats: any): ArrayBuffer => {
  const workbook = XLSX.utils.book_new();
  
  // Convert subject stats
  if (stats.subjectStats && stats.subjectStats.length > 0) {
    const subjectWorksheet = XLSX.utils.json_to_sheet(stats.subjectStats.map((stat: any) => ({
      'Subject': stat.subject,
      'Total Alloted Hours': stat.totalAllotedHours,
      'Total Completed Hours': stat.totalCompletedHours,
      'Total Remaining Hours': stat.totalRemainingHours,
      'Completion Percentage': `${stat.completionPercentage.toFixed(2)}%`
    })));
    XLSX.utils.book_append_sheet(workbook, subjectWorksheet, 'Subject Stats');
  }
  
  // Convert batch stats
  if (stats.batchStats && stats.batchStats.length > 0) {
    const batchWorksheet = XLSX.utils.json_to_sheet(stats.batchStats.map((stat: any) => ({
      'Batch': stat.batch,
      'Subject': stat.subject,
      'Total Alloted Hours': stat.totalAllotedHours,
      'Total Completed Hours': stat.totalCompletedHours,
      'Total Remaining Hours': stat.totalRemainingHours,
      'Completed Chapters': stat.completedChapters,
      'Ongoing Chapters': stat.ongoingChapters,
      'Not Started Chapters': stat.notStartedChapters,
      'Total Chapters': stat.totalChapters,
      'Completion Percentage': `${stat.completionPercentage.toFixed(2)}%`
    })));
    XLSX.utils.book_append_sheet(workbook, batchWorksheet, 'Batch Stats');
  }
  
  // Convert chapter status stats
  if (stats.chapterStatusStats && stats.chapterStatusStats.length > 0) {
    const statusWorksheet = XLSX.utils.json_to_sheet(stats.chapterStatusStats.map((stat: any) => ({
      'Status': stat.status,
      'Count': stat.count
    })));
    XLSX.utils.book_append_sheet(workbook, statusWorksheet, 'Status Stats');
  }
  
  // Convert overall stats
  if (stats.overallStats) {
    const overallWorksheet = XLSX.utils.json_to_sheet([{
      'Total Alloted Hours': stats.overallStats.totalAllotedHours,
      'Total Completed Hours': stats.overallStats.totalCompletedHours,
      'Total Remaining Hours': stats.overallStats.totalRemainingHours,
      'Total Entries': stats.overallStats.totalEntries,
      'Average Marks': stats.overallStats.averageMarks,
      'Total A+': stats.overallStats.totalAPlus,
      'Completion Percentage': `${stats.overallStats.completionPercentage.toFixed(2)}%`
    }]);
    XLSX.utils.book_append_sheet(workbook, overallWorksheet, 'Overall Stats');
  }
  
  return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
};

// Convert HourStats to CSV (will use the first sheet only - subject stats)
export const hourStatsToCSV = (stats: any): string => {
  // For CSV, we'll focus on the subject stats as the primary dataset
  if (stats.subjectStats && stats.subjectStats.length > 0) {
    const worksheet = XLSX.utils.json_to_sheet(stats.subjectStats.map((stat: any) => ({
      'Subject': stat.subject,
      'Total Alloted Hours': stat.totalAllotedHours,
      'Total Completed Hours': stat.totalCompletedHours,
      'Total Remaining Hours': stat.totalRemainingHours,
      'Completion Percentage': `${stat.completionPercentage.toFixed(2)}%`
    })));
    return XLSX.utils.sheet_to_csv(worksheet);
  }
  return '';
};

// Convert HourStats to PDF
export const hourStatsToPDF = (stats: any): jsPDF => {
  const doc = new jsPDF('landscape');
  
  // Add title to PDF
  doc.setFontSize(16);
  doc.text('Hour Statistics Report', 14, 15);
  doc.setFontSize(10);
  doc.text(`Generated on ${new Date().toLocaleString()}`, 14, 22);
  
  let yPosition = 30;
  
  // Add overall stats
  if (stats.overallStats) {
    doc.setFontSize(14);
    doc.text('Overall Statistics', 14, yPosition);
    yPosition += 10;
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: [
        ['Total Alloted Hours', stats.overallStats.totalAllotedHours],
        ['Total Completed Hours', stats.overallStats.totalCompletedHours],
        ['Total Remaining Hours', stats.overallStats.totalRemainingHours],
        ['Total Entries', stats.overallStats.totalEntries],
        ['Average Marks', stats.overallStats.averageMarks.toFixed(2)],
        ['Total A+', stats.overallStats.totalAPlus],
        ['Completion Percentage', `${stats.overallStats.completionPercentage.toFixed(2)}%`]
      ],
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      alternateRowStyles: { fillColor: [242, 242, 242] },
    });
    
    // Get the last Y position after the table is rendered
    const lastAutoTable = doc.lastAutoTable;
    yPosition = lastAutoTable ? lastAutoTable.finalY + 15 : yPosition + 70;
  }
  
  // Add subject stats
  if (stats.subjectStats && stats.subjectStats.length > 0) {
    doc.setFontSize(14);
    doc.text('Subject Statistics', 14, yPosition);
    yPosition += 10;
    
    const subjectRows = stats.subjectStats.map((stat: any) => [
      stat.subject,
      stat.totalAllotedHours,
      stat.totalCompletedHours,
      stat.totalRemainingHours,
      `${stat.completionPercentage.toFixed(2)}%`
    ]);
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Subject', 'Alloted Hours', 'Completed Hours', 'Remaining Hours', 'Completion %']],
      body: subjectRows,
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      alternateRowStyles: { fillColor: [242, 242, 242] },
    });
    
    // Get the last Y position after the table is rendered
    const lastAutoTable = doc.lastAutoTable;
    yPosition = lastAutoTable ? lastAutoTable.finalY + 15 : yPosition + 70;
  }
  
  // Add a new page if needed
  if (yPosition > 180) {
    doc.addPage();
    yPosition = 20;
  }
  
  // Add batch stats (first few columns only to fit)
  if (stats.batchStats && stats.batchStats.length > 0) {
    doc.setFontSize(14);
    doc.text('Batch Statistics', 14, yPosition);
    yPosition += 10;
    
    const batchRows = stats.batchStats.map((stat: any) => [
      stat.batch,
      stat.subject,
      stat.totalAllotedHours,
      stat.totalCompletedHours,
      stat.totalRemainingHours,
      `${stat.completionPercentage.toFixed(2)}%`
    ]);
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Batch', 'Subject', 'Alloted', 'Completed', 'Remaining', 'Completion %']],
      body: batchRows,
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      alternateRowStyles: { fillColor: [242, 242, 242] },
    });
  }
  
  return doc;
};

// Transposed export functions for hours data

// Convert Hour objects to Excel data in transposed format
export const hoursToTransposedExcel = (hours: any[]): ArrayBuffer => {
  // First, create the standard data structure
  const hourData = hours.map(hour => {
    // Extract faculty information
    const facultyNames = hour.faculties?.map((f: any) => f.name).join(', ') || '';
    const facultyCodes = hour.faculties?.map((f: any) => f.code).join(', ') || '';
    
    return {
      'Batch': hour.batch,
      'Subject': hour.subject,
      'Chapter': hour.chapter,
      'Mode': hour.mode,
      'Class Teacher': hour.classTeacher,
      'Faculty Code': facultyCodes,
      'Faculty Name': facultyNames,
      'Status': hour.chapterStatus,
      'Exam Date': hour.date,
      'Alloted Hours': hour.allotedHours,
      'Completed Hours': hour.completedHours,
      'Remaining Hours': hour.remainingHours,
      'Average Marks': hour.averageMarksOfBatch,
      'A+ Count': hour.numberOfAPlus,
      'Remarks 1': hour.remarks1,
      'Remarks 2': hour.remarks2,
      'Flag 1': hour.flag1,
      'Flag 2': hour.flag2,
      'Created At': hour.createdAt,
      'Updated At': hour.updatedAt
    };
  });
  
  // Now transpose the data
  if (hourData.length === 0) {
    // Empty data, return empty workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([['No data available']]);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Hours');
    return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  }
  
  // Get all field names (column headers to become row headers)
  const headers = Object.keys(hourData[0]);
  
  // Create the transposed array
  // First row will be header row with numbered entries
  const transposedData = [
    ['Field', ...hourData.map((_, index) => `Entry ${index + 1}`)]
  ];
  
  // Add a row for each field
  headers.forEach(header => {
    const row = [header];
    // Add values for each hour
    hourData.forEach(hour => {
      row.push(hour[header]);
    });
    transposedData.push(row);
  });
  
  // Create the workbook
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(transposedData);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Hours');
  
  return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
};

// Convert Hour objects to CSV data - using normal format, not transposed
export const hoursToTransposedCSV = (hours: any[]): string => {
  // Use the standard CSV export function
  return hoursToCSV(hours);
};

// Convert Hour objects to PDF - using normal format, not transposed
export const hoursToTransposedPDF = (hours: any[]): jsPDF => {
  // Use the standard PDF export function
  return hoursToPDF(hours);
};