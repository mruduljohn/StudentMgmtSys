import React, { useState, useEffect } from 'react';
import { Hour } from '../../types';
import { useHourStore } from '../../store/hourStore';
import { useAuthStore } from '../../store/authStore';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import { formatDate } from '../../utils/formatters';
import { Plus, Trash2 } from 'lucide-react';

interface HourModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (hourData: Partial<Hour>) => void;
  title: string;
  hour?: Hour | null;
}

// Interface for legacy hour format with faculty1, faculty2, faculty3
interface LegacyHour extends Omit<Hour, 'faculties'> {
  faculty1?: { code?: string; name?: string };
  faculty2?: { code?: string; name?: string };
  faculty3?: { code?: string; name?: string };
}

const HourModal: React.FC<HourModalProps> = ({
  open,
  onClose,
  onSubmit,
  title,
  hour
}) => {
  const hourStore = useHourStore();
  const authStore = useAuthStore();
  const { batches, subjects, modes, classTeachers, subjectChapters } = hourStore.getOptions;
  const isAdmin = authStore.user?.role === 'ADMIN';
  
  const [formData, setFormData] = useState<Partial<Hour>>({
    batch: '',
    subject: '',
    chapter: '',
    mode: '',
    faculties: [],
    examDate: '',
    allotedHours: 0,
    completedHours: 0,
    remainingHoursNeeded: 0,
    chapterStatus: 'NOT STARTED',
    classTeacher: '',
    averageMarksOfBatch: 0,
    numberOfAPlus: 0,
    remarks1: '',
    remarks2: '',
    remarks3: '',
    flag1: '',
    flag2: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Get chapters for the selected subject
  const getChaptersForSubject = () => {
    if (!formData.subject) return [];
    return subjectChapters[formData.subject as string] || [];
  };
  
  useEffect(() => {
    if (hour) {
      // Convert old faculty format to new format if needed
      let faculties = hour.faculties || [];
      
      // Handle backward compatibility with old faculty1, faculty2, faculty3 format
      if (!hour.faculties) {
        const legacyHour = hour as LegacyHour;
        faculties = [];
        
        if (legacyHour.faculty1?.name || legacyHour.faculty1?.code) {
          faculties.push({
            name: legacyHour.faculty1?.name || '',
            code: legacyHour.faculty1?.code || ''
          });
        }
        
        if (legacyHour.faculty2?.name || legacyHour.faculty2?.code) {
          faculties.push({
            name: legacyHour.faculty2?.name || '',
            code: legacyHour.faculty2?.code || ''
          });
        }
        
        if (legacyHour.faculty3?.name || legacyHour.faculty3?.code) {
          faculties.push({
            name: legacyHour.faculty3?.name || '',
            code: legacyHour.faculty3?.code || ''
          });
        }
      }
      
      setFormData({
        ...hour,
        faculties,
        examDate: hour.examDate ? formatDate(new Date(hour.examDate as string)) : ''
      });
    } else {
      // Reset form for new entry
      setFormData({
        batch: '',
        subject: '',
        chapter: '',
        mode: '',
        faculties: [],
        examDate: '',
        allotedHours: 0,
        completedHours: 0,
        remainingHoursNeeded: 0,
        chapterStatus: 'NOT STARTED',
        // For mentors, pre-fill the classTeacher field with their username
        classTeacher: !isAdmin && authStore.user ? authStore.user.username : '',
        averageMarksOfBatch: 0,
        numberOfAPlus: 0,
        remarks1: '',
        remarks2: '',
        remarks3: '',
        flag1: '',
        flag2: ''
      });
    }
    
    setErrors({});
  }, [hour, open, isAdmin, authStore.user]);
  
  // Reset chapter when subject changes
  useEffect(() => {
    if (formData.subject) {
      // Reset chapter when subject changes
      setFormData(prev => ({ ...prev, chapter: '' }));
    }
  }, [formData.subject]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value);
    
    if (!isNaN(numValue) && numValue >= 0) {
      setFormData(prev => ({ ...prev, [name]: numValue }));
      
      // Calculate remaining hours needed
      if (name === 'allotedHours' || name === 'completedHours') {
        const allotedHours = name === 'allotedHours' ? numValue : (formData.allotedHours || 0);
        const completedHours = name === 'completedHours' ? numValue : (formData.completedHours || 0);
        const remainingHoursNeeded = Math.max(0, allotedHours - completedHours);
        
        setFormData(prev => ({ 
          ...prev, 
          [name]: numValue,
          remainingHoursNeeded
        }));
      } else {
        setFormData(prev => ({ ...prev, [name]: numValue }));
      }
      
      // Clear error when field is edited
      if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: '' }));
      }
    }
  };
  
  const handleFacultyChange = (index: number, field: 'code' | 'name', value: string) => {
    const updatedFaculties = [...(formData.faculties || [])];
    if (!updatedFaculties[index]) {
      updatedFaculties[index] = { code: '', name: '' };
    }
    updatedFaculties[index][field] = value;
    
    setFormData(prev => ({
      ...prev,
      faculties: updatedFaculties
    }));
    
    // Clear error when field is edited
    const errorKey = `faculties[${index}].${field}`;
    if (errors[errorKey]) {
      setErrors(prev => ({ ...prev, [errorKey]: '' }));
    }
  };
  
  const addFaculty = () => {
    setFormData(prev => ({
      ...prev,
      faculties: [...(prev.faculties || []), { code: '', name: '' }]
    }));
  };
  
  const removeFaculty = (index: number) => {
    const updatedFaculties = [...(formData.faculties || [])];
    updatedFaculties.splice(index, 1);
    
    setFormData(prev => ({
      ...prev,
      faculties: updatedFaculties
    }));
  };
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.batch) {
      newErrors.batch = 'Batch is required';
    }
    
    if (!formData.subject) {
      newErrors.subject = 'Subject is required';
    }
    
    if (!formData.chapter) {
      newErrors.chapter = 'Chapter is required';
    }
    
    if (!formData.mode) {
      newErrors.mode = 'Mode is required';
    }
    
    if (formData.allotedHours && formData.allotedHours < 0) {
      newErrors.allotedHours = 'Alloted hours must be greater than or equal to 0';
    }
    
    if (formData.completedHours && formData.completedHours < 0) {
      newErrors.completedHours = 'Completed hours must be greater than or equal to 0';
    }
    
    if (!formData.chapterStatus) {
      newErrors.chapterStatus = 'Chapter status is required';
    }
    
    // Only validate classTeacher for admin users
    // For mentors, we'll set it automatically
    if (isAdmin && !formData.classTeacher) {
      newErrors.classTeacher = 'Class teacher is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = () => {
    // For mentors, automatically set the classTeacher field to their username
    if (!isAdmin && authStore.user) {
      setFormData(prev => ({ 
        ...prev, 
        classTeacher: authStore.user?.username || ''
      }));
    }
    
    if (validateForm()) {
      // Format the data before submitting
      const submissionData = {
        ...formData,
        // For mentors, ensure classTeacher is set to their username
        ...((!isAdmin && authStore.user) ? { classTeacher: authStore.user.username } : {}),
        examDate: formData.examDate ? new Date(formData.examDate as string).toISOString() : undefined
      };
      
      onSubmit(submissionData);
    }
  };
  
  return (
    <Modal isOpen={open} onClose={onClose} title={title} size="lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Batch field - Now accessible to mentors */}
        <Select
          label="Batch"
          name="batch"
          value={formData.batch || ''}
          onChange={handleSelectChange}
          options={batches}
          error={errors.batch}
          fullWidth
        />
        
        {/* Subject field - Now accessible to mentors */}
        <Select
          label="Subject"
          name="subject"
          value={formData.subject || ''}
          onChange={handleSelectChange}
          options={subjects}
          error={errors.subject}
          fullWidth
        />
        
        {/* Chapter field - Now accessible to mentors */}
        <Select
          label="Chapter"
          name="chapter"
          value={formData.chapter || ''}
          onChange={handleSelectChange}
          options={getChaptersForSubject()}
          error={errors.chapter}
          fullWidth
        />
        
        {/* Mode field - Now accessible to mentors */}
        <Select
          label="Mode"
          name="mode"
          value={formData.mode || ''}
          onChange={handleSelectChange}
          options={modes}
          error={errors.mode}
          fullWidth
        />
        
        <Select
          label="Class Teacher"
          name="classTeacher"
          value={formData.classTeacher || (!isAdmin && authStore.user ? authStore.user.username : '')}
          onChange={handleSelectChange}
          options={classTeachers}
          error={errors.classTeacher}
          fullWidth
          disabled={!isAdmin}
        />
        
        {/* Faculty fields - Editable by both admin and mentors */}
        <div className="col-span-2 border p-4 rounded-md">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">Faculties</h3>
            <Button 
              variant="secondary" 
              onClick={addFaculty}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1" /> Add Faculty
            </Button>
          </div>
          
          {(formData.faculties || []).length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No faculties added. Click "Add Faculty" to add one.
            </div>
          ) : (
            (formData.faculties || []).map((faculty, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3 p-3 border rounded-md bg-gray-50">
                <div className="md:col-span-2">
                  <Input
                    label="Code"
                    name={`faculty-${index}-code`}
                    value={faculty.code || ''}
                    onChange={(e) => handleFacultyChange(index, 'code', e.target.value)}
                    fullWidth
                  />
                </div>
                <div className="md:col-span-2">
                  <Input
                    label="Name"
                    name={`faculty-${index}-name`}
                    value={faculty.name || ''}
                    onChange={(e) => handleFacultyChange(index, 'name', e.target.value)}
                    fullWidth
                  />
                </div>
                <div className="flex items-end justify-center md:justify-end pb-2">
                  <button
                    type="button"
                    onClick={() => removeFaculty(index)}
                    className="text-red-600 hover:text-red-800 p-2"
                    title="Remove faculty"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Exam Date - Admin only */}
        <Input
          label="Exam Date"
          name="examDate"
          type="date"
          value={formData.examDate as string || ''}
          onChange={handleChange}
          fullWidth
          disabled={!isAdmin}
        />
        
        {/* Hours fields - Editable by both admin and mentors */}
        <Input
          label="Alloted Hours"
          name="allotedHours"
          type="number"
          value={formData.allotedHours?.toString() || '0'}
          onChange={handleNumberChange}
          error={errors.allotedHours}
          fullWidth
        />
        
        <Input
          label="Completed Hours"
          name="completedHours"
          type="number"
          value={formData.completedHours?.toString() || '0'}
          onChange={handleNumberChange}
          error={errors.completedHours}
          fullWidth
        />
        
        <Input
          label="Remaining Hours Needed"
          name="remainingHoursNeeded"
          type="number"
          value={formData.remainingHoursNeeded?.toString() || '0'}
          disabled
          fullWidth
        />
        
        <Select
          label="Chapter Status"
          name="chapterStatus"
          value={formData.chapterStatus || ''}
          onChange={handleSelectChange}
          options={['NOT STARTED', 'ONGOING', 'COMPLETED']}
          error={errors.chapterStatus}
          fullWidth
        />
        
        {/* Fields editable by both admin and mentors */}
        <Input
          label="Average Marks of Batch"
          name="averageMarksOfBatch"
          type="number"
          value={formData.averageMarksOfBatch?.toString() || '0'}
          onChange={handleNumberChange}
          fullWidth
        />
        
        <Input
          label="Number of A+"
          name="numberOfAPlus"
          type="number"
          value={formData.numberOfAPlus?.toString() || '0'}
          onChange={handleNumberChange}
          fullWidth
        />
        
        {/* Remarks fields - Editable by both admin and mentors */}
        <Input
          label="Remarks 1"
          name="remarks1"
          value={formData.remarks1 || ''}
          onChange={handleChange}
          fullWidth
        />
        
        <Input
          label="Remarks 2"
          name="remarks2"
          value={formData.remarks2 || ''}
          onChange={handleChange}
          fullWidth
        />
        
        <Input
          label="Remarks 3"
          name="remarks3"
          value={formData.remarks3 || ''}
          onChange={handleChange}
          fullWidth
        />
        
        {/* Flag fields - Admin only */}
        <Input
          label="Flag 1"
          name="flag1"
          value={formData.flag1 || ''}
          onChange={handleChange}
          fullWidth
          disabled={!isAdmin}
        />
        
        <Input
          label="Flag 2"
          name="flag2"
          value={formData.flag2 || ''}
          onChange={handleChange}
          fullWidth
          disabled={!isAdmin}
        />
      </div>
      
      <div className="flex justify-end space-x-3">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          {hour ? 'Update' : 'Add'} Hour
        </Button>
      </div>
    </Modal>
  );
};

export default HourModal; 