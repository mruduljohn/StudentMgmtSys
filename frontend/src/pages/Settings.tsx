import React, { useState, useEffect } from 'react';
import { Save, RefreshCw } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useStudentStore } from '../store/studentStore';
import { BatchConfig, RemarksConfig, FlagsConfig } from '../types';
import { initializeDefaultConfigs } from '../api';

const Settings: React.FC = () => {
  const { 
    batchConfig, 
    remarksConfig, 
    flagsConfig,
    updateBatchConfig,
    updateRemarksConfig,
    updateFlagsConfig,
    isLoading,
    fetchAllConfigs
  } = useStudentStore();
  
  const [batchSettings, setBatchSettings] = useState<BatchConfig>({ ...batchConfig });
  const [remarksSettings, setRemarksSettings] = useState<RemarksConfig>({ ...remarksConfig });
  const [flagsSettings, setFlagsSettings] = useState<FlagsConfig>({ ...flagsConfig });
  
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(false);
  
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
    'JOYAL.P.JOSE', 'HARIKRISHNAN.R', 'ARPITHA.SHAJAN', 'SANJANA', 'NELSON', 
    'VISWAM.MURALI', 'MANJIMA.JIMMY', 'ANOOP.MOHAN', 'VISAKHAN', 'ANJALI.K.DAS.(WB)', 
    'ANANDALAKSHMI', 'JISHNA', 'DONA.MERIN.JOSE', 'RADHIKA.ANILKUMAR', 'SREELAKSHMI.P'
  ];
  
  const predefinedHostels = [
    'DAY SCHOLAR', 'ST.ANNS', 'MARIGOLD GRAND', 'HOSTEL REQUIRED', 'ST.JOHNS', 
    'THE GUARDIAN', 'NEST GRAND', 'LAVERNA', 'B MADONA', 'B MARTHOMA', 'B ST.MARYS', 
    'PETER CLAVER', 'LITTLE FLOWER', 'ST.AUGUSTINE', 'SDV'
  ];
  
  const predefinedStreams = ['FOUNDATION', 'ENGINEERING', 'MEDICAL'];
  
  const predefinedPrograms = ['FOUNDATION', 'EVENING', 'SPECIAL', 'SUPER', 'HYBRID', 'REPEATER', 'REGULAR'];
  
  useEffect(() => {
    setBatchSettings({ ...batchConfig });
    setRemarksSettings({ ...remarksConfig });
    setFlagsSettings({ ...flagsConfig });
  }, [batchConfig, remarksConfig, flagsConfig]);
  
  const handleBatchChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
    field: keyof BatchConfig
  ) => {
    const values = e.target.value.split('\n').filter(Boolean);
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
    setSaveSuccess(false);
    setSaveError(false);
    
    try {
      const batchResult = await updateBatchConfig(batchSettings);
      const remarksResult = await updateRemarksConfig(remarksSettings);
      const flagsResult = await updateFlagsConfig(flagsSettings);
      
      if (batchResult && remarksResult && flagsResult) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setSaveError(true);
        setTimeout(() => setSaveError(false), 3000);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveError(true);
      setTimeout(() => setSaveError(false), 3000);
    }
  };
  
  const handleLoadPredefined = (field: keyof BatchConfig, values: string[]) => {
    setBatchSettings(prev => ({
      ...prev,
      [field]: values,
    }));
  };
  
  const handleInitializeDefaults = async () => {
    try {
      await initializeDefaultConfigs();
      // Refresh the store
      await fetchAllConfigs();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error initializing defaults:', error);
      setSaveError(true);
      setTimeout(() => setSaveError(false), 3000);
    }
  };
  
  return (
    <Layout>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
          <p className="text-gray-600">
            Configure system settings and field options
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={handleInitializeDefaults}
          className="flex items-center"
          disabled={isLoading}
        >
          <RefreshCw size={16} className="mr-2" />
          Initialize Defaults
        </Button>
      </div>
      
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
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Batch Settings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Batch Settings</h2>
          <p className="text-gray-600 mb-4">
            Configure the available options for batches, teachers, hostels, etc.
            Enter each option on a new line.
          </p>
          
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Batches
              </label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleLoadPredefined('batches', predefinedBatches)}
                className="text-xs"
              >
                Load Predefined
              </Button>
            </div>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              rows={5}
              value={batchSettings.batches.join('\n')}
              onChange={(e) => handleBatchChange(e, 'batches')}
            />
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Teachers
              </label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleLoadPredefined('teachers', predefinedTeachers)}
                className="text-xs"
              >
                Load Predefined
              </Button>
            </div>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              rows={5}
              value={batchSettings.teachers.join('\n')}
              onChange={(e) => handleBatchChange(e, 'teachers')}
            />
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Hostels
              </label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleLoadPredefined('hostels', predefinedHostels)}
                className="text-xs"
              >
                Load Predefined
              </Button>
            </div>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              rows={5}
              value={batchSettings.hostels.join('\n')}
              onChange={(e) => handleBatchChange(e, 'hostels')}
            />
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Programs
              </label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleLoadPredefined('programs', predefinedPrograms)}
                className="text-xs"
              >
                Load Predefined
              </Button>
            </div>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              rows={5}
              value={batchSettings.programs.join('\n')}
              onChange={(e) => handleBatchChange(e, 'programs')}
            />
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Streams
              </label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleLoadPredefined('streams', predefinedStreams)}
                className="text-xs"
              >
                Load Predefined
              </Button>
            </div>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              rows={5}
              value={batchSettings.streams.join('\n')}
              onChange={(e) => handleBatchChange(e, 'streams')}
            />
          </div>
        </div>
        
        {/* Remarks and Flags Settings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Field Labels</h2>
          <p className="text-gray-600 mb-4">
            Customize the display labels for remarks and flag fields
          </p>
          
          <div className="mb-6">
            <h3 className="font-medium text-gray-700 mb-2">Remarks Fields</h3>
            
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
          
          <div>
            <h3 className="font-medium text-gray-700 mb-2">Flag Fields</h3>
            
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
          className="flex items-center"
          disabled={isLoading}
        >
          <Save size={16} className="mr-2" />
          Save Settings
        </Button>
      </div>
    </Layout>
  );
};

export default Settings;