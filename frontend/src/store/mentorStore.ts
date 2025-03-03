import { create } from 'zustand';
import { User } from '../types';

interface MentorState {
  mentors: User[];
  addMentor: (mentor: User) => void;
  updateMentor: (id: string, data: Partial<User>) => void;
  deleteMentor: (id: string) => void;
}

export const useMentorStore = create<MentorState>((set) => ({
  mentors: [
    {
      id: '2',
      name: 'Mentor One',
      email: 'mentor1@example.com',
      role: 'mentor',
      class: 'BATCH01',
    },
    {
      id: '3',
      name: 'Mentor Two',
      email: 'mentor2@example.com',
      role: 'mentor',
      class: 'BATCH02',
    },
  ],
  
  addMentor: (mentor) => set((state) => ({
    mentors: [...state.mentors, { ...mentor, role: 'mentor' }],
  })),
  
  updateMentor: (id, data) => set((state) => ({
    mentors: state.mentors.map((mentor) => 
      mentor.id === id ? { ...mentor, ...data } : mentor
    ),
  })),
  
  deleteMentor: (id) => set((state) => ({
    mentors: state.mentors.filter((mentor) => mentor.id !== id),
  })),
}));