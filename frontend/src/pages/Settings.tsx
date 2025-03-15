import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Input from '../components/ui/Input';
import TextArea from '../components/ui/TextArea';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import { useStudentStore } from '../store/studentStore';
import { BatchConfig, RemarksConfig, FlagsConfig } from '../types';
import { 
  getSubjectChapters, 
  updateSubjectChapters, 
  initializeDefaultSubjectChapters
} from '../api';
import { toast, Toaster } from 'react-hot-toast';

const Settings: React.FC = () => {
  const { 
    batchConfig, 
    remarksConfig, 
    flagsConfig,
    updateBatchConfig,
    updateRemarksConfig,
    updateFlagsConfig
  } = useStudentStore();
  
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
  
  useEffect(() => {
    setBatchSettings({ ...batchConfig });
    setRemarksSettings({ ...remarksConfig });
    setFlagsSettings({ ...flagsConfig });
    fetchSubjectChapters();
  }, [batchConfig, remarksConfig, flagsConfig]);
  
  const fetchSubjectChapters = async () => {
    try {
      setChaptersLoading(true);
      const chapters = await getSubjectChapters();
      setSubjectChapters(chapters || {});
      
      // Set the first subject as selected if none is selected
      if (!selectedSubject && Object.keys(chapters || {}).length > 0) {
        setSelectedSubject(Object.keys(chapters)[0]);
        setChapterText((chapters[Object.keys(chapters)[0]] || []).join('\n'));
      }
    } catch (error) {
      console.error('Error fetching subject chapters:', error);
      try {
        // Try to initialize default chapters if none exist
        await initializeDefaultSubjectChapters();
        const chapters = await getSubjectChapters();
        setSubjectChapters(chapters || {});
        
        if (!selectedSubject && Object.keys(chapters || {}).length > 0) {
          setSelectedSubject(Object.keys(chapters)[0]);
          setChapterText((chapters[Object.keys(chapters)[0]] || []).join('\n'));
        }
      } catch (initError) {
        console.error('Error initializing subject chapters:', initError);
        toast.error('Failed to load subject chapters');
      }
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
    if (!selectedSubject) return;
    
    try {
      setChaptersLoading(true);
      setSaveSuccess(false);
      setSaveError(false);
      
      // Parse chapters from text area
      const chapters = chapterText.split('\n')
        .map(line => line.trim())
        .filter(line => line !== '');
      
      await updateSubjectChapters(selectedSubject, chapters);
      
      // Update local state
      setSubjectChapters(prev => ({
        ...prev,
        [selectedSubject]: chapters
      }));
      
      setSaveSuccess(true);
      toast.success('Subject chapters saved successfully');
    } catch (error) {
      console.error('Error saving subject chapters:', error);
      setSaveError(true);
      toast.error('Failed to save subject chapters');
    } finally {
      setChaptersLoading(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
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
  
  // const handleInitializeDefaults = async () => {
  //   try {
  //     await initializeDefaultConfigs();
  //     // Refresh the store
  //     await fetchAllConfigs();
  //     setSaveSuccess(true);
  //     setTimeout(() => setSaveSuccess(false), 3000);
  //   } catch (error) {
  //     console.error('Error initializing defaults:', error);
  //     setSaveError(true);
  //     setTimeout(() => setSaveError(false), 3000);
  //   }
  // };
  
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