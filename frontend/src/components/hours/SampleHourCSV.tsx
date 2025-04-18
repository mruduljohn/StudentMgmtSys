import React from 'react';
import { Download } from 'lucide-react';
import Button from '../ui/Button';

const SampleHourCSV: React.FC = () => {
  const generateSampleCSV = () => {
    // Define sample data for CSV with the required format
    const headers = [
      'SERIAL NO',
      'SUBJECT',
      'CHAPTER NAME',
      'CLASS TEACHER',
      'YEAR',
      'MODE',
      'FACULTY1',
      'FACULTY2',
      'BATCH',
      'EXAM DATE',
      'ALLOTED HOURS',
      'COMPLETED HOURS',
      'REMAINING HOURS NEEDED',
      'CHAPTER STATUS',
      'AVERAGE MARK OF BATCH',
      'NUMBER OF A+',
      'REMARKS1',
      'REMARKS2',
      'REMARKS3',
      'FLAG1',
      'FLAG2',
      'FLAG3'
    ];
    
    const rows = [
      [
        '1',
        'CHEMISTRY',
        'Aldehydes and Ketones',
        'ANANDALAKSHMI',
        '2026',
        'OFFLINE',
        'BDZ',
        '',
        'BATCH1',
        '23-02-2025',
        '12',
        '11',
        '1',
        'COMPLETED',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        ''
      ],
      [
        '2',
        'PHYSICS',
        'Motion in a Straight Line',
        'JOHN.DOE',
        '2026',
        'OFFLINE',
        'PHY1',
        'PHY2',
        'BATCH2',
        '24-02-2025',
        '8',
        '6',
        '2',
        'ONGOING',
        '85',
        '12',
        '',
        '',
        '',
        '',
        '',
        ''
      ],
      [
        '3',
        'MATHS',
        'Calculus',
        'JANE.SMITH',
        '2026',
        'ONLINE',
        'MTH1',
        '',
        'BATCH3',
        '25-02-2025',
        '10',
        '0',
        '10',
        'NOT STARTED',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        ''
      ]
    ];
    
    // Create CSV content
    let csvContent = [headers.join(',')];
    
    // Add rows to CSV content
    rows.forEach(row => {
      csvContent.push(row.join(','));
    });
    
    return csvContent.join('\n');
  };
  
  const downloadSampleCSV = () => {
    const csvContent = generateSampleCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'hour_data_sample.csv');
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="mt-2">
      <Button 
        variant="link" 
        size="sm" 
        onClick={downloadSampleCSV}
        className="text-blue-600 px-0"
      >
        <Download className="h-3 w-3 mr-1" />
        Download Sample CSV Template
      </Button>
      <p className="text-xs text-gray-500 mt-1">
        Note: CSV must include EXAM DATE column (not just DATE). Date format should be DD-MM-YYYY.
      </p>
    </div>
  );
};

export default SampleHourCSV; 