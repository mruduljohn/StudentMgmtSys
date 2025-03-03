export type UserRole = 'admin' | 'mentor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  class?: string; // Only for mentors
}

export interface Student {
  slNo: number;
  name: string;
  studentId: string;
  phoneNumber: string;
  gender: 'MALE' | 'FEMALE' | 'DIFFERENT';
  batch: string;
  classTeacher: string;
  hostel: string;
  stream: 'MEDICAL' | 'ENGINEERING' | 'FOUNDATION' | string;
  program: string;
  studyMaterial: string;
  uniform: string;
  idCard: string;
  tab: string;
  joined: 'ALLOTED' | 'JOINING SOON' | 'JOINED' | 'NOT JOINING' | 'VACATED';
  syllabus: 'STATE' | 'CBSE' | 'ICSC' | 'OTHERS';
  percentageOfPlus2Marks: number;
  neetScore: number;
  remarks: string;
  remarks1: string;
  remarks2: string;
  remarks3: string;
  remarks4: string;
  feeDue: number;
  flag1: string;
  flag2: string;
  flag3: string;
  flag4: string;
}

export interface FieldConfig {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select';
  options?: string[];
  editable: boolean; // Whether mentors can edit this field
  validation?: (value: any) => boolean;
  errorMessage?: string;
}

export interface BatchConfig {
  batches: string[];
  teachers: string[];
  hostels: string[];
  programs: string[];
  streams: string[];
}

export interface RemarksConfig {
  remarks: string;
  remarks1: string;
  remarks2: string;
  remarks3: string;
  remarks4: string;
}

export interface FlagsConfig {
  flag1: string;
  flag2: string;
  flag3: string;
  flag4: string;
}