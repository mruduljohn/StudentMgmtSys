import * as XLSX from 'xlsx';
import { Student } from '../types';

// Add new imports for PDF export
import jsPDF from 'jspdf';
import 'jspdf-autotable';

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

// Convert Student objects to CSV data
export const studentsToCSV = (students: Student[]): string => {
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
  
  return XLSX.utils.sheet_to_csv(worksheet);
};

// Convert Student objects to PDF data
export const studentsToPDF = (students: Student[]): jsPDF => {
  const doc = new jsPDF('landscape');
  
  // Define columns for PDF table
  const columns = [
    { header: 'Sl No', dataKey: 'slNo' },
    { header: 'Name', dataKey: 'name' },
    { header: 'Student ID', dataKey: 'studentId' },
    { header: 'Phone', dataKey: 'phoneNumber' },
    { header: 'Gender', dataKey: 'gender' },
    { header: 'Batch', dataKey: 'batch' },
    { header: 'Class Teacher', dataKey: 'classTeacher' },
    { header: 'Hostel', dataKey: 'hostel' },
    { header: 'Stream', dataKey: 'stream' },
    { header: 'Program', dataKey: 'program' },
    { header: 'Joined', dataKey: 'joined' },
    { header: 'Fee Due', dataKey: 'feeDue' },
  ];
  
  // Convert students to rows for PDF
  const rows = students.map(student => ({
    slNo: student.slNo,
    name: student.name,
    studentId: student.studentId,
    phoneNumber: student.phoneNumber,
    gender: student.gender,
    batch: student.batch,
    classTeacher: student.classTeacher,
    hostel: student.hostel,
    stream: student.stream,
    program: student.program,
    joined: student.joined,
    feeDue: student.feeDue,
  }));
  
  // Add title to PDF
  doc.setFontSize(16);
  doc.text('Student Records', 14, 15);
  doc.setFontSize(10);
  doc.text(`Generated on ${new Date().toLocaleString()}`, 14, 22);
  
  // Create table in PDF
  (doc as any).autoTable({
    startY: 30,
    columns: columns,
    body: rows,
    styles: { overflow: 'linebreak' },
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    alternateRowStyles: { fillColor: [242, 242, 242] },
    margin: { top: 30 },
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
  const worksheet = XLSX.utils.json_to_sheet(hours.map(hour => ({
    'Batch': hour.batch,
    'Subject': hour.subject,
    'Chapter': hour.chapter,
    'Mode': hour.mode,
    'Class Teacher': hour.classTeacher,
    'Status': hour.chapterStatus,
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
  })));
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Hours');
  
  return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
};

// Convert Hour objects to CSV data
export const hoursToCSV = (hours: any[]): string => {
  const worksheet = XLSX.utils.json_to_sheet(hours.map(hour => ({
    'Batch': hour.batch,
    'Subject': hour.subject,
    'Chapter': hour.chapter,
    'Mode': hour.mode,
    'Class Teacher': hour.classTeacher,
    'Status': hour.chapterStatus,
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
  })));
  
  return XLSX.utils.sheet_to_csv(worksheet);
};

// Convert Hour objects to PDF data
export const hoursToPDF = (hours: any[]): jsPDF => {
  const doc = new jsPDF('landscape');
  
  // Define columns for PDF table
  const columns = [
    { header: 'Batch', dataKey: 'batch' },
    { header: 'Subject', dataKey: 'subject' },
    { header: 'Chapter', dataKey: 'chapter' },
    { header: 'Mode', dataKey: 'mode' },
    { header: 'Class Teacher', dataKey: 'classTeacher' },
    { header: 'Status', dataKey: 'status' },
    { header: 'Alloted Hrs', dataKey: 'allotedHours' },
    { header: 'Completed Hrs', dataKey: 'completedHours' },
    { header: 'Remaining Hrs', dataKey: 'remainingHours' }
  ];
  
  // Convert hours to rows for PDF
  const rows = hours.map(hour => ({
    batch: hour.batch,
    subject: hour.subject,
    chapter: hour.chapter,
    mode: hour.mode,
    classTeacher: hour.classTeacher,
    status: hour.chapterStatus,
    allotedHours: hour.allotedHours,
    completedHours: hour.completedHours,
    remainingHours: hour.remainingHours || (hour.allotedHours - hour.completedHours)
  }));
  
  // Add title to PDF
  doc.setFontSize(16);
  doc.text('Hour Records', 14, 15);
  doc.setFontSize(10);
  doc.text(`Generated on ${new Date().toLocaleString()}`, 14, 22);
  
  // Create table in PDF
  (doc as any).autoTable({
    startY: 30,
    columns: columns,
    body: rows,
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
    
    (doc as any).autoTable({
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
    
    yPosition = (doc as any).lastAutoTable.finalY + 15;
  }
  
  // Add subject stats
  if (stats.subjectStats && stats.subjectStats.length > 0) {
    doc.setFontSize(14);
    doc.text('Subject Statistics', 14, yPosition);
    yPosition += 10;
    
    const columns = [
      { header: 'Subject', dataKey: 'subject' },
      { header: 'Alloted Hours', dataKey: 'allotedHours' },
      { header: 'Completed Hours', dataKey: 'completedHours' },
      { header: 'Remaining Hours', dataKey: 'remainingHours' },
      { header: 'Completion %', dataKey: 'completionPercentage' }
    ];
    
    const rows = stats.subjectStats.map((stat: any) => ({
      subject: stat.subject,
      allotedHours: stat.totalAllotedHours,
      completedHours: stat.totalCompletedHours,
      remainingHours: stat.totalRemainingHours,
      completionPercentage: `${stat.completionPercentage.toFixed(2)}%`
    }));
    
    (doc as any).autoTable({
      startY: yPosition,
      columns: columns,
      body: rows,
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      alternateRowStyles: { fillColor: [242, 242, 242] },
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 15;
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
    
    const columns = [
      { header: 'Batch', dataKey: 'batch' },
      { header: 'Subject', dataKey: 'subject' },
      { header: 'Alloted', dataKey: 'allotedHours' },
      { header: 'Completed', dataKey: 'completedHours' },
      { header: 'Remaining', dataKey: 'remainingHours' },
      { header: 'Completion %', dataKey: 'completionPercentage' }
    ];
    
    const rows = stats.batchStats.map((stat: any) => ({
      batch: stat.batch,
      subject: stat.subject,
      allotedHours: stat.totalAllotedHours,
      completedHours: stat.totalCompletedHours,
      remainingHours: stat.totalRemainingHours,
      completionPercentage: `${stat.completionPercentage.toFixed(2)}%`
    }));
    
    (doc as any).autoTable({
      startY: yPosition,
      columns: columns,
      body: rows,
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      alternateRowStyles: { fillColor: [242, 242, 242] },
    });
  }
  
  return doc;
};