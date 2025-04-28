export type UserRole = 'ADMIN' | 'MENTOR';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  class?: string; // Only for mentors
}

export interface Student {
  slNo: number;
  name: string;
  studentId: string;
  phoneNumber: string;
  gender: 'M' | 'F' | 'DIFFERENT';
  batch: string;
  classTeacher: string;
  hostel: string;
  stream: 'MEDICAL' | 'ENGINEERING' | 'FOUNDATION' | string;
  program: 'FOUNDATION' | 'EVENING' | 'SPECIAL' | 'SUPER' | 'HYBRID' | 'REPEATER' | 'REGULAR'|string;
  studyMaterial: 'NOT RECEIVED' | 'RECEIVED' | 'PARTIALLY RECEIVED' |string;
  uniform: 'NOT RECEIVED' | 'RECEIVED' | 'PARTIALLY RECEIVED' |string;
  idCard: 'NOT RECEIVED' | 'NOT RECEIVED' | string;
  tab: 'REQUESTED NOT PAID' | 'RECEIVED PAID' | 'RECEIVED NOT PAID' | 'REQUESTED PAID' | 'PERSONAL TAB' | 'NOT REQUIRED' |string;
  joined: 'ALLOTED' | 'DISCONTINUED' | 'JOINED' | 'NOT JOINING' | 'CENTRE CHANGE';
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

export interface Faculty {
  code?: string;
  name?: string;
}

export interface Hour {
  _id?: string;
  id?: string;
  batch: string;
  subject: string;
  chapter: string;
  mode: string;
  faculties?: Faculty[];
  // Legacy faculty fields for backward compatibility
  faculty1?: Faculty | string;
  faculty2?: Faculty | string;
  faculty3?: Faculty | string;
  examDate?: Date | string;
  allotedHours: number;
  completedHours: number;
  remainingHoursNeeded?: number;
  classTeacher: string;
  chapterStatus: 'NOT STARTED' | 'ONGOING' | 'COMPLETED';
  averageMarksOfBatch?: number;
  numberOfAPlus?: number;
  remarks1?: string;
  remarks2?: string;
  remarks3?: string;
  flag1?: string;
  flag2?: string;
  flag3?: string;
  year?: string;
  remainingHours?: number;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string | User;
  updatedBy?: string | User;
}

export interface HourStats {
  subjectStats: Array<{
    subject: string;
    totalAllotedHours: number;
    totalCompletedHours: number;
    totalRemainingHours: number;
    completionPercentage: number;
  }>;
  batchStats: Array<{
    batch: string;
    subject: string;
    totalAllotedHours: number;
    totalCompletedHours: number;
    totalRemainingHours: number;
    completedChapters: number;
    ongoingChapters: number;
    notStartedChapters: number;
    totalChapters: number;
    completionPercentage: number;
  }>;
  chapterStatusStats: Array<{
    status: string;
    count: number;
  }>;
  overallStats: {
    totalAllotedHours: number;
    totalCompletedHours: number;
    totalRemainingHours: number;
    totalEntries: number;
    averageMarks: number;
    totalAPlus: number;
    completionPercentage: number;
  };
  // Additional properties for charts
  hoursByMonth: Array<{
    month: string;
    totalHours: number;
  }>;
  hoursByMode: Array<{
    mode: string;
    totalHours: number;
  }>;
  hoursBySubject: Array<{
    subject: string;
    totalHours: number;
  }>;
  hoursByStatus: Array<{
    status: string;
    totalHours: number;
  }>;
  totalHours: number;
  totalChapters: number;
  completionRate: number;
}

export interface FieldConfig {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select';
  options?: string[];
  editable: boolean; // Whether mentors can edit this field
  validation?: (value: string | number) => boolean;
  errorMessage?: string;
}

export interface BatchConfig {
  batches: string[];
  teachers: string[];
  hostels: string[];
  hostelCapacity: Record<string, number>;
  programs: string[];
  streams: string[];
  studyMaterials: string[];
  uniforms: string[];
  idCards: string[];
  tabs: string[];
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

export interface SubjectChaptersConfig {
  [subject: string]: string[];
}