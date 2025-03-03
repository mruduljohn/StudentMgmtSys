import { create } from 'zustand';
import { Student, BatchConfig, RemarksConfig, FlagsConfig } from '../types';

interface StudentState {
  students: Student[];
  batchConfig: BatchConfig;
  remarksConfig: RemarksConfig;
  flagsConfig: FlagsConfig;
  
  // Student CRUD operations
  addStudent: (student: Student) => void;
  updateStudent: (studentId: string, updatedData: Partial<Student>) => void;
  deleteStudent: (studentId: string) => void;
  
  // Bulk operations
  importStudents: (students: Student[]) => void;
  
  // Configuration updates
  updateBatchConfig: (config: Partial<BatchConfig>) => void;
  updateRemarksConfig: (config: Partial<RemarksConfig>) => void;
  updateFlagsConfig: (config: Partial<FlagsConfig>) => void;
}

export const useStudentStore = create<StudentState>((set) => ({
  students: [],
  batchConfig: {
    batches: ['BATCH01', 'BATCH02', 'BATCH03'],
    teachers: ['TEACHER1', 'TEACHER2', 'TEACHER3'],
    hostels: ['HOSTEL1', 'HOSTEL2', 'HOSTEL3'],
    programs: ['PROGRAM1', 'PROGRAM2', 'PROGRAM3'],
    streams: ['MEDICAL', 'ENGINEERING', 'FOUNDATION'],
  },
  remarksConfig: {
    remarks: 'Remarks',
    remarks1: 'Remarks 1',
    remarks2: 'Remarks 2',
    remarks3: 'Remarks 3',
    remarks4: 'Remarks 4',
  },
  flagsConfig: {
    flag1: 'Flag 1',
    flag2: 'Flag 2',
    flag3: 'Flag 3',
    flag4: 'Flag 4',
  },
  
  addStudent: (student) => set((state) => {
    // Check if student ID already exists
    if (state.students.some(s => s.studentId === student.studentId)) {
      alert(`Student with ID ${student.studentId} already exists!`);
      return state;
    }
    return { students: [...state.students, student] };
  }),
  
  updateStudent: (studentId, updatedData) => set((state) => ({
    students: state.students.map((student) => 
      student.studentId === studentId 
        ? { ...student, ...updatedData } 
        : student
    ),
  })),
  
  deleteStudent: (studentId) => set((state) => ({
    students: state.students.filter((student) => student.studentId !== studentId),
  })),
  
  importStudents: (newStudents) => set((state) => {
    // Filter out students with duplicate IDs
    const existingIds = new Set(state.students.map(s => s.studentId));
    const validNewStudents = newStudents.filter(student => {
      if (existingIds.has(student.studentId)) {
        console.warn(`Skipping duplicate student ID: ${student.studentId}`);
        return false;
      }
      existingIds.add(student.studentId);
      return true;
    });
    
    return { students: [...state.students, ...validNewStudents] };
  }),
  
  updateBatchConfig: (config) => set((state) => ({
    batchConfig: { ...state.batchConfig, ...config },
  })),
  
  updateRemarksConfig: (config) => set((state) => ({
    remarksConfig: { ...state.remarksConfig, ...config },
  })),
  
  updateFlagsConfig: (config) => set((state) => ({
    flagsConfig: { ...state.flagsConfig, ...config },
  })),
}));