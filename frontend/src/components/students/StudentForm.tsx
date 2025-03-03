import React, { useState, useEffect } from 'react';
import { useStudentStore } from '../../store/studentStore';
import { useAuthStore } from '../../store/authStore';
import { Student, FieldConfig } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { getFieldConfigs } from '../../utils/fieldConfig';

interface StudentFormProps {
  student?: Student;
  onClose: () => void;
  mode: 'add' | 'edit';
}

const StudentForm: React.FC<StudentFormProps> = ({
  student,
  onClose,
  mode,
}) => {
  const { addStudent, updateStudent, batchConfig } = useStudentStore();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  
  const [formData, setFormData] = useState<Partial<Student>>(
    student || {
      slNo: 0,
      name: '',
      studentId: '',
      phoneNumber: '',
      gender: 'MALE',
      batch: '',
      classTeacher: '',
      hostel: '',
      stream: 'MEDICAL',
      program: '',
      studyMaterial: '',
      uniform: '',
      idCard: '',
      tab: '',
      joined: 'ALLOTED',
      syllabus: 'STATE',
      percentageOfPlus2Marks: 0,
      neetScore: 0,
      remarks: '',
      remarks1: '',
      remarks2: '',
      remarks3: '',
      remarks4: '',
      feeDue: 0,
      flag1: '',
      flag2: '',
      flag3: '',
      flag4: '',
    }
  );
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fieldConfigs = getFieldConfigs();
  
  // Filter fields based on user role
  const visibleFields = fieldConfigs.filter(field => {
    if (isAdmin) return true;
    return field.editable;
  });
  
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    let parsedValue: string | number = value;
    
    // Convert number inputs to numbers
    if (type === 'number') {
      parsedValue = value === '' ? 0 : Number(value);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: parsedValue,
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Required fields
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.studentId) newErrors.studentId = 'Student ID is required';
    
    // Phone number validation
    if (formData.phoneNumber && !/^\d{10,15}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Enter a valid phone number';
    }
    
    // Custom field validations
    fieldConfigs.forEach(field => {
      if (field.validation && formData[field.id as keyof Student] !== undefined) {
        const value = formData[field.id as keyof Student];
        if (!field.validation(value)) {
          newErrors[field.id] = field.errorMessage || 'Invalid value';
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    if (mode === 'add') {
      addStudent(formData as Student);
    } else if (student) {
      updateStudent(student.studentId, formData);
    }
    
    onClose();
  };
  
  // Render form fields based on configuration
  const renderField = (field: FieldConfig) => {
    const id = field.id as keyof Student;
    const value = formData[id];
    const error = errors[field.id];
    
    // Skip fields that mentors can't edit if user is a mentor
    if (!isAdmin && !field.editable) return null;
    
    switch (field.type) {
      case 'select':
        let options: string[] = field.options || [];
        
        // Use dynamic options from batch config if available
        if (id === 'batch') options = batchConfig.batches;
        if (id === 'classTeacher') options = batchConfig.teachers;
        if (id === 'hostel') options = batchConfig.hostels;
        if (id === 'program') options = batchConfig.programs;
        if (id === 'stream') options = batchConfig.streams;
        
        return (
          <Select
            key={field.id}
            name={field.id}
            label={field.label}
            value={value as string}
            onChange={handleChange}
            options={options}
            error={error}
            disabled={!isAdmin && !field.editable}
            fullWidth
          />
        );
      
      case 'number':
        return (
          <Input
            key={field.id}
            type="number"
            name={field.id}
            label={field.label}
            value={value as number}
            onChange={handleChange}
            error={error}
            disabled={!isAdmin && !field.editable}
            fullWidth
          />
        );
      
      default:
        return (
          <Input
            key={field.id}
            type="text"
            name={field.id}
            label={field.label}
            value={value as string}
            onChange={handleChange}
            error={error}
            disabled={!isAdmin && !field.editable}
            fullWidth
          />
        );
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visibleFields.map(renderField)}
      </div>
      
      <div className="mt-6 flex justify-end space-x-3">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" type="submit">
          {mode === 'add' ? 'Add Student' : 'Update Student'}
        </Button>
      </div>
    </form>
  );
};

export default StudentForm;