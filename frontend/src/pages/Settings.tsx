import React, { useState } from 'react';
import { Save } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useStudentStore } from '../store/studentStore';
import { BatchConfig, RemarksConfig, FlagsConfig } from '../types';

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
  
  const [saveSuccess, setSaveSuccess] = useState(false);
  
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
  
  const handleSave = () => {
    updateBatchConfig(batchSettings);
    updateRemarksConfig(remarksSettings);
    updateFlagsConfig(flagsSettings);
    
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };
  
  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        <p className="text-gray-600">
          Configure system settings and field options
        </p>
      </div>
      
      {saveSuccess && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
          Settings saved successfully!
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Batches
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              value={batchSettings.batches.join('\n')}
              onChange={(e) => handleBatchChange(e, 'batches')}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teachers
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              value={batchSettings.teachers.join('\n')}
              onChange={(e) => handleBatchChange(e, 'teachers')}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hostels
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              value={batchSettings.hostels.join('\n')}
              onChange={(e) => handleBatchChange(e, 'hostels')}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Programs
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              value={batchSettings.programs.join('\n')}
              onChange={(e) => handleBatchChange(e, 'programs')}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Streams
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              rows={3}
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
        >
          <Save size={16} className="mr-2" />
          Save Settings
        </Button>
      </div>
    </Layout>
  );
};

export default Settings;