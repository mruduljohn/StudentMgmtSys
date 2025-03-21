import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Input from '../components/ui/Input';
import TextArea from '../components/ui/TextArea';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import { useStudentStore } from '../store/studentStore';
import { BatchConfig, RemarksConfig, FlagsConfig } from '../types';
import { toast, Toaster } from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

const Settings: React.FC = () => {
  const { 
    batchConfig, 
    remarksConfig, 
    flagsConfig,
    updateBatchConfig,
    updateRemarksConfig,
    updateFlagsConfig,
    fetchSubjectChapters,
    updateSubjectChapters,
    initializeDefaultSubjectChapters,
    getSubjectChapters,
  } = useStudentStore();
  
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  
  const [batchSettings, setBatchSettings] = useState<BatchConfig>({ ...batchConfig });
  const [remarksSettings, setRemarksSettings] = useState<RemarksConfig>({ ...remarksConfig });
  const [flagsSettings, setFlagsSettings] = useState<FlagsConfig>({ ...flagsConfig });
  const [subjectChapters, setSubjectChapters] = useState<Record<string, string[]>>({});
  const [selectedSubject, setSelectedSubject] = useState<string>('PHYSICS');
  const [chapterText, setChapterText] = useState<string>('');
  
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [chaptersLoading, setChaptersLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Predefined values
  const predefinedBatches = [
    '25HTSE', '25HTSM', '25STE1(Bh)', '25STE2(Nm)', '25STM1(Bh)', '25STM2(Nm)', 
    '25TRE1(State)', '25TRE2(CBSE)', '25TRM1', '25TSRFIX', '25TSRFVI', '25TSRFVII', 
    '25TSRFVIII', '25TSRFX', '26BTE1(Bh)', '26BTM1(Bh)', '26ETSA1', '26ETSI1', 
    '26HTSA1', '26HTSI1', '26TRE11', '26TRM11', '26TSRA3', '26TSRA4', '26TSRI3', 
    '26TSRI4', 'K1', 'K10', 'K11', 'K2', 'K3', 'K4', 'K5', 'K6', 'K7', 'K8RR', 
    'K9RR', 'KE1', 'KE2', 'KE3', 'NEW R', 'NEW RR', 'ONLINE'
  ];
  
  const predefinedTeachers = [
    'DEEPA.MD.(WB)', 'ARCHANA', 'JEEVAN.JOSHY', 'KEERTHY.E.(WB)', 'NIMYA.GIRIJAN.(WB)', 
    'SRUTHI.(WB)', 'SANDRA.(WB)', 'ATHIRA.(WB)', 'ARYA.R', 'LIMSY.PAULSON.(WB)', 
    'STENIYA.LIEONS.(WB)', 'SHINI.T.S.(WB)', 'CHAITRA', 'ANJU.K', 'MEGHA.MUKUNDAN', 
    'NOT ASSIGNED', 'ALBIN.VARGHESE', 'RAJESWARY.VISWANATHAN', 'SWATHY', 'SRUTHI.P', 
    'SRUTHI.SATHYAN', 'SRUTHI.SURESH', 'SRUTHI.SURESH.KUMAR', 'SRUTHI.SURESH.KUMAR.NAIR'
  ];
  
  const predefinedHostels = [
    'BOYS HOSTEL', 'GIRLS HOSTEL', 'DAY SCHOLAR'
  ];
  
  const predefinedStreams = ['FOUNDATION', 'ENGINEERING', 'MEDICAL'];
  
  const predefinedPrograms = ['FOUNDATION', 'EVENING', 'SPECIAL', 'SUPER', 'HYBRID', 'REPEATER', 'REGULAR'];
  
  const predefinedSubjects = ['PHYSICS', 'CHEMISTRY', 'BOTANY', 'ZOOLOGY', 'MATHS'];
  
  // Effect to handle config changes
  useEffect(() => {
    setBatchSettings({ ...batchConfig });
    setRemarksSettings({ ...remarksConfig });
    setFlagsSettings({ ...flagsConfig });
  }, [batchConfig, remarksConfig, flagsConfig]);
  
  // Effect to load subject chapters once when component mounts
  useEffect(() => {
    const loadSubjectChapters = async () => {
      try {
        setChaptersLoading(true);
        await fetchSubjectChapters();
        const chapters = getSubjectChapters;
        
        if (!chapters || Object.keys(chapters).length === 0) {
          console.log('No subject chapters found in the database');
          setSubjectChapters({});
          if (isAdmin) {
            toast.error('No subject chapters found. Please click "Initialize Default Chapters" to create them.');
          } else {
            toast.error('No subject chapters found. Please contact an administrator.');
          }
        } else {
          setSubjectChapters(chapters);
          
          // Set the first subject as selected if none is selected
          if ((!selectedSubject || selectedSubject === 'PHYSICS') && Object.keys(chapters).length > 0) {
            const firstSubject = Object.keys(chapters)[0];
            setSelectedSubject(firstSubject);
            setChapterText((chapters[firstSubject] || []).join('\n'));
          }
        }
      } catch (error) {
        console.error('Error fetching subject chapters:', error);
        setSubjectChapters({});
        toast.error('Failed to load subject chapters');
      } finally {
        setChaptersLoading(false);
      }
    };
    
    loadSubjectChapters();
  }, []);
  
  // Effect to update chapter text when selected subject changes
  useEffect(() => {
    if (selectedSubject && subjectChapters[selectedSubject]) {
      setChapterText(subjectChapters[selectedSubject].join('\n'));
    } else if (selectedSubject && !subjectChapters[selectedSubject]) {
      // If subject is selected but no chapters exist for it
      setChapterText('');
    }
  }, [selectedSubject, subjectChapters]);
  
  const fetchAndLoadSubjectChapters = async () => {
    try {
      setChaptersLoading(true);
      // Fetch chapters from the API
      await fetchSubjectChapters();
      // Get the updated chapters from the store
      const chapters = getSubjectChapters;
      
      if (!chapters || Object.keys(chapters).length === 0) {
        console.log('No subject chapters found in the database');
        setSubjectChapters({});
        if (isAdmin) {
          toast.error('No subject chapters found. Please click "Initialize Default Chapters" to create them.');
        } else {
          toast.error('No subject chapters found. Please contact an administrator.');
        }
      } else {
        // Update the local state with the fetched chapters
        setSubjectChapters(chapters);
        
        // Ensure selected subject is valid and update chapter text
        if (selectedSubject && chapters[selectedSubject]) {
          setChapterText(chapters[selectedSubject].join('\n'));
        } else if (Object.keys(chapters).length > 0) {
          const firstSubject = Object.keys(chapters)[0];
          setSelectedSubject(firstSubject);
          setChapterText((chapters[firstSubject] || []).join('\n'));
        }
      }
    } catch (error) {
      console.error('Error fetching subject chapters:', error);
      setSubjectChapters({});
      toast.error('Failed to load subject chapters');
    } finally {
      setChaptersLoading(false);
    }
  };
  
  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedSubject(value);
    
    // Update chapter text for the selected subject
    if (subjectChapters[value]) {
      setChapterText(subjectChapters[value].join('\n'));
    } else {
      setChapterText('');
    }
  };
  
  const handleChapterTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setChapterText(e.target.value);
  };
  
  const saveSubjectChapters = async () => {
    // Don't proceed if already loading
    if (chaptersLoading) {
      return;
    }
    
    if (!selectedSubject) {
      toast.error('Please select a subject');
      return;
    }
    
    if (!chapterText.trim()) {
      toast.error('Please provide at least one chapter');
      return;
    }
    
    try {
      setChaptersLoading(true);
      
      // Parse the text area content into an array of chapters
      const chapters = chapterText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
      
      if (chapters.length === 0) {
        toast.error('Please provide at least one chapter');
        return;
      }
      
      // Update chapters for the selected subject
      const success = await updateSubjectChapters(selectedSubject, chapters);
      
      if (success) {
        // Update local state with the new chapters
        setSubjectChapters({
          ...subjectChapters,
          [selectedSubject]: chapters
        });
        
        toast.success(`Chapters for ${selectedSubject} saved successfully`);
      } else {
        toast.error('Failed to save chapters');
      }
    } catch (error) {
      console.error('Error saving chapters:', error);
      toast.error('Failed to save chapters');
    } finally {
      setChaptersLoading(false);
    }
  };
  
  const handleBatchChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
    field: keyof BatchConfig
  ) => {
    // Keep all lines including empty ones, but trim whitespace
    const values = e.target.value.split('\n')
      .map(line => line.trim())
      .filter((line, index, array) => {
        // Keep non-empty lines
        if (line !== '') return true;
        
        // Keep empty lines that are not at the end
        if (index < array.length - 1) return true;
        
        return false;
      });
    
    setBatchSettings(prev => ({
      ...prev,
      [field]: values,
    }));
  };
  
  const handleRemarksChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof RemarksConfig
  ) => {
    setRemarksSettings(prev => ({
      ...prev,
      [field]: e.target.value,
    }));
  };
  
  const handleFlagsChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof FlagsConfig
  ) => {
    setFlagsSettings(prev => ({
      ...prev,
      [field]: e.target.value,
    }));
  };
  
  const handleSave = async () => {
    try {
      setIsLoading(true);
      setSaveSuccess(false);
      setSaveError(false);
      
      // Update batch settings using store function
      const batchResult = await updateBatchConfig(batchSettings);
      
      // Update remarks settings using store function
      const remarksResult = await updateRemarksConfig(remarksSettings);
      
      // Update flags settings using store function
      const flagsResult = await updateFlagsConfig(flagsSettings);
      
      // Save current subject chapters if they've been modified
      if (chapterText) {
        const chapters = chapterText
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0);
        
        await updateSubjectChapters(selectedSubject, chapters);
        
        // Update local state
        setSubjectChapters(prev => ({
          ...prev,
          [selectedSubject]: chapters
        }));
      }
      
      if (batchResult && remarksResult && flagsResult) {
        setSaveSuccess(true);
        toast.success('Settings saved successfully');
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSaveSuccess(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveError(true);
      toast.error('Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLoadPredefined = (field: keyof BatchConfig, values: string[]) => {
    setBatchSettings(prev => ({
      ...prev,
      [field]: values,
    }));
  };
  
  const handleInitializeSubjectChapters = async () => {
    try {
      setChaptersLoading(true);
      const result = await initializeDefaultSubjectChapters();
      
      if (result) {
        toast.success('Default subject chapters initialized successfully');
        // Fetch the updated chapters
        await fetchAndLoadSubjectChapters();
      } else {
        toast.error('Failed to initialize default subject chapters');
      }
    } catch (error) {
      console.error('Error initializing default subject chapters:', error);
      toast.error('Failed to initialize default subject chapters');
    } finally {
      setChaptersLoading(false);
    }
  };
  
  return (
    <Layout>
      <Toaster position="top-right" />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">System Settings</h1>
        
        {saveSuccess && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
            Settings saved successfully!
          </div>
        )}
        
        {saveError && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            Error saving settings. Please try again.
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Batch Configuration */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Batch Configuration</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Batches
                </label>
                <TextArea
                  value={batchSettings.batches.join('\n')}
                  onChange={(e) => handleBatchChange(e, 'batches')}
                  rows={8}
                  fullWidth
                />
                <div className="mt-2 flex justify-end">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleLoadPredefined('batches', predefinedBatches)}
                  >
                    Load Predefined
                  </Button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class Teachers
                </label>
                <TextArea
                  value={batchSettings.teachers.join('\n')}
                  onChange={(e) => handleBatchChange(e, 'teachers')}
                  rows={8}
                  fullWidth
                />
                <div className="mt-2 flex justify-end">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleLoadPredefined('teachers', predefinedTeachers)}
                  >
                    Load Predefined
                  </Button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hostels
                </label>
                <TextArea
                  value={batchSettings.hostels.join('\n')}
                  onChange={(e) => handleBatchChange(e, 'hostels')}
                  rows={8}
                  fullWidth
                />
                <div className="mt-2 flex justify-end">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleLoadPredefined('hostels', predefinedHostels)}
                  >
                    Load Predefined
                  </Button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Streams
                </label>
                <TextArea
                  value={batchSettings.streams.join('\n')}
                  onChange={(e) => handleBatchChange(e, 'streams')}
                  rows={4}
                  fullWidth
                />
                <div className="mt-2 flex justify-end">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleLoadPredefined('streams', predefinedStreams)}
                  >
                    Load Predefined
                  </Button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Programs
                </label>
                <TextArea
                  value={batchSettings.programs.join('\n')}
                  onChange={(e) => handleBatchChange(e, 'programs')}
                  rows={4}
                  fullWidth
                />
                <div className="mt-2 flex justify-end">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleLoadPredefined('programs', predefinedPrograms)}
                  >
                    Load Predefined
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Subject Chapters Configuration */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Subject Chapters Configuration</h2>
            
            {Object.keys(subjectChapters).length === 0 && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-yellow-800 text-sm">
                  No subject chapters found in the database. Please initialize the default chapters.
                </p>
              </div>
            )}
            
            {chaptersLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="mb-2">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                  </div>
                  <p className="text-gray-600 text-sm">Loading subject chapters...</p>
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <Select
                  value={selectedSubject}
                  onChange={handleSubjectChange}
                  options={Object.keys(subjectChapters).length > 0 
                    ? Object.keys(subjectChapters) 
                    : predefinedSubjects}
                  fullWidth
                />
                
                <div className="mt-2">
                  {isAdmin && (
                    <Button
                      variant="secondary"
                      onClick={handleInitializeSubjectChapters}
                      disabled={chaptersLoading}
                      className="mr-2"
                    >
                      {chaptersLoading ? 'Initializing...' : 'Initialize Default Chapters'}
                    </Button>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chapters (one per line)
                </label>
                <TextArea
                  value={chapterText}
                  onChange={handleChapterTextChange}
                  rows={20}
                  fullWidth
                />
              </div>
              
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  onClick={saveSubjectChapters}
                  disabled={chaptersLoading}
                  className="flex items-center"
                >
                  <Save size={16} className="mr-1" />
                  Save Chapters
                </Button>
              </div>
            </div>
          </div>
          
          {/* Remarks Configuration */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Remarks Configuration</h2>
            
            <div className="space-y-4">
              <Input
                label="Remarks"
                value={remarksSettings.remarks}
                onChange={(e) => handleRemarksChange(e, 'remarks')}
                fullWidth
              />
              
              <Input
                label="Remarks 1"
                value={remarksSettings.remarks1}
                onChange={(e) => handleRemarksChange(e, 'remarks1')}
                fullWidth
              />
              
              <Input
                label="Remarks 2"
                value={remarksSettings.remarks2}
                onChange={(e) => handleRemarksChange(e, 'remarks2')}
                fullWidth
              />
              
              <Input
                label="Remarks 3"
                value={remarksSettings.remarks3}
                onChange={(e) => handleRemarksChange(e, 'remarks3')}
                fullWidth
              />
              
              <Input
                label="Remarks 4"
                value={remarksSettings.remarks4}
                onChange={(e) => handleRemarksChange(e, 'remarks4')}
                fullWidth
              />
            </div>
          </div>
          
          {/* Flags Configuration */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Flags Configuration</h2>
            
            <div className="space-y-4">
              <Input
                label="Flag 1"
                value={flagsSettings.flag1}
                onChange={(e) => handleFlagsChange(e, 'flag1')}
                fullWidth
              />
              
              <Input
                label="Flag 2"
                value={flagsSettings.flag2}
                onChange={(e) => handleFlagsChange(e, 'flag2')}
                fullWidth
              />
              
              <Input
                label="Flag 3"
                value={flagsSettings.flag3}
                onChange={(e) => handleFlagsChange(e, 'flag3')}
                fullWidth
              />
              
              <Input
                label="Flag 4"
                value={flagsSettings.flag4}
                onChange={(e) => handleFlagsChange(e, 'flag4')}
                fullWidth
              />
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={isLoading}
            className="flex items-center"
          >
            <Save size={16} className="mr-1" />
            Save All Settings
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;