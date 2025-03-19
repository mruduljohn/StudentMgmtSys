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
  onExistingStudent?: (studentId: string) => void;
}

const StudentForm: React.FC<StudentFormProps> = ({
  student,
  onClose,
  mode,
  onExistingStudent,
}) => {
  const { addStudent, updateStudent, batchConfig, fetchAllConfigs, findStudent } = useStudentStore();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  
  const [formData, setFormData] = useState<Partial<Student>>(
    student || {
      slNo: 0,
      name: '',
      studentId: '',
      phoneNumber: '',
      gender: 'M',
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
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const fieldConfigs = getFieldConfigs();
  
  // Filter fields based on user role and mode
  const visibleFields = fieldConfigs.filter(field => {
    // When adding a student, show all fields regardless of user role
    if (mode === 'add') return true;
    
    // When editing, apply role-based restrictions
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
    
    // Clear success message when form is edited
    if (successMessage) {
      setSuccessMessage('');
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
        // Ensure value is not undefined before passing to validation function
        if (value !== undefined && !field.validation(value as string | number)) {
          newErrors[field.id] = field.errorMessage || 'Invalid value';
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Add a function to map display values to backend values
  const getDisplayValue = (field: string, value: string): string => {
    // Map gender values
    if (field === 'gender') {
      if (value === 'MALE') return 'M';
      if (value === 'FEMALE') return 'F';
      return value;
    }
    
    // Map hostel values
    if (field === 'hostel') {
      if (value === 'DAY SCHOLAR') return 'DS';
      return value;
    }
    
    return value;
  };
  
  // Update the handleSubmit function to map display values to backend values
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsSubmitting(true);
    setErrors({});
    setSuccessMessage('');
    
    // Create a copy of the form data
    const submissionData = { ...formData };
    
    // Map display values to backend values
    if (submissionData.gender) {
      const genderValue = getDisplayValue('gender', submissionData.gender as string);
      submissionData.gender = genderValue as unknown as typeof submissionData.gender;
    }
    
    if (submissionData.hostel) {
      submissionData.hostel = getDisplayValue('hostel', submissionData.hostel as string);
    }
    
    // Submit the form
    try {
      if (mode === 'add') {
        // Check if student ID already exists
        if (formData.studentId) {
          try {
            const existingStudent = await findStudent(formData.studentId as string);
            if (existingStudent) {
              setErrors(prev => ({
                ...prev,
                studentId: 'Student ID already exists',
                form: 'A student with this ID already exists.'
              }));
              
              // Call the callback to inform parent component about existing student
              if (onExistingStudent) {
                onExistingStudent(formData.studentId as string);
              }
              
              setIsSubmitting(false);
              return;
            }
          } catch (error: unknown) {
            // If the error is not a 404 (not found), it's a different error
            const err = error as { response?: { status?: number; data?: { message?: string } } };
            if (err.response && err.response.status !== 404) {
              console.error('Error checking student existence:', error);
              setErrors(prev => ({
                ...prev,
                form: 'Error checking student existence. Please try again.'
              }));
              setIsSubmitting(false);
              return;
            }
            // If it's a 404, the student doesn't exist, so we can proceed
          }
        }
        
        // If we get here, the student ID doesn't exist yet, so proceed with adding
        await addStudent(submissionData);
        setSuccessMessage('Student added successfully!');
        
        // Wait for 1.5 seconds to show the success message, then close the form
        setTimeout(() => {
          onClose();
        }, 1500);
      } else if (mode === 'edit' && student) {
        await updateStudent(student.studentId, submissionData);
        setSuccessMessage('Student updated successfully!');
        
        // Wait for 1.5 seconds to show the success message, then close the form
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (error: unknown) {
      console.error('Error submitting student:', error);
      
      // Check if it's a duplicate student ID error
      const err = error as { 
        response?: { 
          status?: number; 
          data?: { 
            message?: string 
          } 
        } 
      };
      
      if (err.response && err.response.status === 400 && 
          err.response.data?.message === "Student ID already exists") {
        setErrors(prev => ({
          ...prev,
          studentId: 'Student ID already exists',
          form: 'A student with this ID already exists.'
        }));
        
        // Call the callback to inform parent component about existing student
        if (onExistingStudent) {
          onExistingStudent(formData.studentId as string);
        }
      } else {
        // Generic error
        setErrors(prev => ({
          ...prev,
          form: err.response?.data?.message || 'Failed to submit student. Please try again.'
        }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Render form fields based on configuration
  const renderField = (field: FieldConfig) => {
    const id = field.id as keyof Student;
    const value = formData[id];
    const error = errors[field.id];
    
    // When adding a student, all fields are editable regardless of user role
    const isAddingStudent = mode === 'add';
    
    // For mentors editing students, only allow editing students they are assigned to
    if (!isAdmin && !isAddingStudent && student) {
      // The username is already in the correct format (e.g., "SIJO.JAMES")
      // The class teacher name in the student record is in display format (e.g., "Sijo James")
      // We need to convert the class teacher name to username format for comparison
      
      const classTeacherAsUsername = student.classTeacher
        .toUpperCase()
        .replace(/\s+/g, '.');
      
      const isClassTeacher = classTeacherAsUsername === user?.username;
      
      if (!isClassTeacher) {
        return (
          <Input
            key={field.id}
            type={field.type === 'number' ? 'number' : 'text'}
            name={field.id}
            label={field.label}
            value={field.type === 'number' ? (value as number) : (value as string)}
            onChange={handleChange}
            error={error}
            disabled={true}
            fullWidth
          />
        );
      }
    }
    
    switch (field.type) {
      case 'select': {
        let options: string[] = field.options || [];
        
        // Use dynamic options from batch config if available
        if (id === 'batch') options = batchConfig.batches;
        if (id === 'classTeacher') options = batchConfig.teachers;
        if (id === 'hostel') options = batchConfig.hostels;
        if (id === 'stream') options = batchConfig.streams;
        if (id === 'program') options = batchConfig.programs;
        
        return (
          <Select
            key={field.id}
            name={field.id}
            label={field.label}
            value={value as string}
            onChange={handleChange}
            options={options}
            error={error}
            disabled={!isAdmin && !isAddingStudent && !field.editable}
            fullWidth
          />
        );
      }
      
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
            disabled={!isAdmin && !isAddingStudent && !field.editable}
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
            disabled={!isAdmin && !isAddingStudent && !field.editable}
            fullWidth
          />
        );
    }
  };
  
  // Add useEffect to ensure configuration data is loaded
  useEffect(() => {
    // Ensure batch config is loaded
    if (
      !batchConfig.batches.length ||
      !batchConfig.teachers.length ||
      !batchConfig.hostels.length ||
      !batchConfig.programs.length ||
      !batchConfig.streams.length
    ) {
      // Fetch configurations if not loaded
      const loadConfigs = async () => {
        try {
          await fetchAllConfigs();
        } catch (error) {
          console.error('Error loading configurations:', error);
        }
      };
      
      loadConfigs();
    }
  }, [batchConfig, fetchAllConfigs]);
  
  return (
    <form onSubmit={handleSubmit}>
      {errors.form && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600">
          {errors.form}
        </div>
      )}
      
      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-600">
          {successMessage}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visibleFields.map(renderField)}
      </div>
      
      <div className="mt-6 flex justify-end space-x-3">
        <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : mode === 'add' ? 'Add Student' : 'Update Student'}
        </Button>
      </div>
    </form>
  );
};

export default StudentForm;