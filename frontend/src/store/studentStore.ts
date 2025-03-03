import { makeAutoObservable } from 'mobx';
import axios from 'axios';
import { Student, BatchConfig, RemarksConfig, FlagsConfig } from '../types';

class StudentStore {
  students: Student[] = [];
  loading: boolean = false;
  error: string | null = null;

  batchConfig: BatchConfig = {
    batches: ['BATCH01', 'BATCH02', 'BATCH03'],
    teachers: ['TEACHER1', 'TEACHER2', 'TEACHER3'],
    hostels: ['HOSTEL1', 'HOSTEL2', 'HOSTEL3'],
    programs: ['PROGRAM1', 'PROGRAM2', 'PROGRAM3'],
    streams: ['MEDICAL', 'ENGINEERING', 'FOUNDATION'],
  };

  remarksConfig: RemarksConfig = {
    remarks: 'Remarks',
    remarks1: 'Remarks 1',
    remarks2: 'Remarks 2',
    remarks3: 'Remarks 3',
    remarks4: 'Remarks 4',
  };

  flagsConfig: FlagsConfig = {
    flag1: 'Flag 1',
    flag2: 'Flag 2',
    flag3: 'Flag 3',
    flag4: 'Flag 4',
  };

  constructor() {
    makeAutoObservable(this);
  }

  async fetchStudents() {
    this.loading = true;
    this.error = null;
    try {
      const response = await axios.get('/api/students');
      this.students = response.data;
    } catch (error: any) {
      this.error = error.message;
    } finally {
      this.loading = false;
    }
  }

  async addStudent(student: Student) {
    this.loading = true;
    this.error = null;
    try {
      const response = await axios.post('/api/students', student);
      this.students.push(response.data);
    } catch (error: any) {
      this.error = error.message;
    } finally {
      this.loading = false;
    }
  }

  async updateStudent(id: string, student: Student) {
    this.loading = true;
    this.error = null;
    try {
      const response = await axios.put(`/api/students/${id}`, student);
      const index = this.students.findIndex((s) => s.studentId === id);
      if (index !== -1) {
        this.students[index] = response.data;
      }
    } catch (error: any) {
      this.error = error.message;
    } finally {
      this.loading = false;
    }
  }

  async deleteStudent(id: string) {
    this.loading = true;
    this.error = null;
    try {
      await axios.delete(`/api/students/${id}`);
      this.students = this.students.filter((s) => s.studentId !== id);
    } catch (error: any) {
      this.error = error.message;
    } finally {
      this.loading = false;
    }
  }

  updateBatchConfig(config: Partial<BatchConfig>) {
    this.batchConfig = { ...this.batchConfig, ...config };
  }

  updateRemarksConfig(config: Partial<RemarksConfig>) {
    this.remarksConfig = { ...this.remarksConfig, ...config };
  }

  updateFlagsConfig(config: Partial<FlagsConfig>) {
    this.flagsConfig = { ...this.flagsConfig, ...config };
  }

  importStudents(students: Student[]) {
    if (!students || students.length === 0) {
      console.warn('No students to import');
      return;
    }
    this.students = [...this.students, ...students];
  }
}

export const studentStore = new StudentStore();

export function useStudentStore() {
  return studentStore;
} 