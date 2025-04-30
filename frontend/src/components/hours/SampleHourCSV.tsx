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
      'FACULTY1 CODE',
      'FACULTY1 NAME',
      'FACULTY2 CODE',
      'FACULTY2 NAME',
      'FACULTY3 CODE',
      'FACULTY3 NAME',
      'BATCH',
      'EXAM DATE',
      'ALLOTED HOURS',
      'COMPLETED HOURS',
      'REMAINING HOURS NEEDED',
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
        'BDZ',              // Faculty1 Code
        'Dr. Bina Diaz',    // Faculty1 Name
        '',                 // Faculty2 Code
        '',                 // Faculty2 Name
        '',                 // Faculty3 Code
        '',                 // Faculty3 Name
        'BATCH1',
        '23-02-2025',
        '12',
        '11',
        '1',
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
        'PHY1',                // Faculty1 Code
        'Dr. Richard Feynman', // Faculty1 Name
        'PHY2',                // Faculty2 Code
        'Dr. Albert Einstein', // Faculty2 Name
        '',                    // Faculty3 Code
        '',                    // Faculty3 Name
        'BATCH2',
        '24-02-2025',
        '8',
        '6',
        '2',
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
        'MTH1',                // Faculty1 Code
        'Dr. Paul Erdős',      // Faculty1 Name
        '',                    // Faculty2 Code
        '',                    // Faculty2 Name
        '',                    // Faculty3 Code
        '',                    // Faculty3 Name
        'BATCH3',
        '25-02-2025',
        '10',
        '0',
        '10',
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
        Both faculty code and name fields are included for better data organization.
        The STATUS field is automatically calculated based on the COMPLETED HOURS and ALLOTED HOURS values.
      </p>
    </div>
  );
};

export default SampleHourCSV; 