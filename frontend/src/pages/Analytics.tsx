import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Layout from '../components/layout/Layout';
import { useStudentStore } from '../store/studentStore';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import Button from '../components/ui/Button';
import { exportToCSV, exportToPDF, exportToExcel } from '../utils/exportUtils';

interface BatchSummary {
  batch: string;
  classTeacher: string;
  strength: number;
  studyMaterialDue: number;
  uniformDue: number;
  idCardDue: number;
  tabDue: number;
  feeDue: number;
  feeDueAmount: number;
}

interface HostelSummary {
  hostel: string;
  totalCapacity: number;
  filled: number;
  vacancy: number;
  batches: Record<string, number>;
}

// Define colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

const Analytics: React.FC = observer(() => {
  const studentStore = useStudentStore();
  const [loading, setLoading] = useState(true);
  const [batchSummaries, setBatchSummaries] = useState<BatchSummary[]>([]);
  const [hostelSummaries, setHostelSummaries] = useState<HostelSummary[]>([]);
  const [genderSummary, setGenderSummary] = useState<{
    hostelers: { boys: number; girls: number };
    dayScholars: { boys: number; girls: number };
  }>({
    hostelers: { boys: 0, girls: 0 },
    dayScholars: { boys: 0, girls: 0 },
  });
  
  // Define hostel capacities (this would ideally come from an API or configuration)
  const hostelCapacities: Record<string, number> = {
    'ST.ANNS': 65,
    'MARIGOLD GRAND': 70,
    'ST.JOHNS': 42,
    'THE GUARDIAN': 73,
    'NEST GRAND': 121,
    'LAVERNA': 48,
    'B MADONA': 53,
    'B MARTHOMA': 59,
    'B ST.MARYS': 77,
    'PETER CLAVER': 38,
    'LITTLE FLOWER': 72,
    'ST.AUGUSTINE': 46,
  };
  
  useEffect(() => {
    const initializeData = async () => {
      try {
        if (!studentStore.isDataLoaded) {
          await studentStore.init();
        }
        
        const allStudents = studentStore.getAllStudents;
        
        // Filter to only include students who are JOINED
        const joinedStudents = allStudents.filter(student => student.joined === 'JOINED');
        
        // Process batch summaries
        const batchMap = new Map<string, BatchSummary>();
        
        joinedStudents.forEach(student => {
          if (!student.batch) return;
          
          if (!batchMap.has(student.batch)) {
            batchMap.set(student.batch, {
              batch: student.batch,
              classTeacher: student.classTeacher || 'Not Assigned',
              strength: 0,
              studyMaterialDue: 0,
              uniformDue: 0,
              idCardDue: 0,
              tabDue: 0,
              feeDue: 0,
              feeDueAmount: 0,
            });
          }
          
          const summary = batchMap.get(student.batch)!;
          summary.strength++;
          
          if (student.studyMaterial === 'NOT RECEIVED' || student.studyMaterial === 'PARTIALLY RECEIVED') {
            summary.studyMaterialDue++;
          }
          
          if (student.uniform === 'NOT RECEIVED' || student.uniform === 'PARTIALLY RECEIVED') {
            summary.uniformDue++;
          }
          
          if (student.idCard === 'NOT RECEIVED') {
            summary.idCardDue++;
          }
          
          if (student.tab === 'REQUESTED NOT PAID' || student.tab === 'REQUESTED PAID') {
            summary.tabDue++;
          }
          
          if (student.feeDue > 0) {
            summary.feeDue++;
            summary.feeDueAmount += student.feeDue;
          }
        });
        
        // Sort batch summaries by batch name
        const sortedBatchSummaries = Array.from(batchMap.values()).sort((a, b) => 
          a.batch.localeCompare(b.batch)
        );
        
        setBatchSummaries(sortedBatchSummaries);
        
        // Process hostel summaries
        const hostelMap = new Map<string, HostelSummary>();
        const batchesSet = new Set<string>(joinedStudents.map(s => s.batch).filter(Boolean));
        
        // Initialize hostel summaries using all known hostels from capacities
        Object.keys(hostelCapacities).forEach(hostel => {
          const batchCounts: Record<string, number> = {};
          batchesSet.forEach(batch => {
            batchCounts[batch as string] = 0;
          });
          
          hostelMap.set(hostel, {
            hostel,
            totalCapacity: hostelCapacities[hostel] || 0,
            filled: 0,
            vacancy: hostelCapacities[hostel] || 0,
            batches: batchCounts,
          });
        });
        
        // Add day scholar option
        const dayScholarBatchCounts: Record<string, number> = {};
        batchesSet.forEach(batch => {
          dayScholarBatchCounts[batch as string] = 0;
        });
        
        hostelMap.set('DAY SCHOLAR', {
          hostel: 'DAY SCHOLAR',
          totalCapacity: 0, // No capacity limit for day scholars
          filled: 0,
          vacancy: 0,
          batches: dayScholarBatchCounts,
        });
        
        // Add any additional hostels found in student data that aren't in hostelCapacities
        joinedStudents.forEach(student => {
          if (!student.hostel) return;
          
          const hostelName = student.hostel === 'DS' ? 'DAY SCHOLAR' : student.hostel;
          
          if (!hostelMap.has(hostelName)) {
            const batchCounts: Record<string, number> = {};
            batchesSet.forEach(batch => {
              batchCounts[batch as string] = 0;
            });
            
            hostelMap.set(hostelName, {
              hostel: hostelName,
              totalCapacity: 0, // Unknown capacity
              filled: 0,
              vacancy: 0,
              batches: batchCounts,
            });
          }
        });
        
        // Count students by hostel and batch
        joinedStudents.forEach(student => {
          if (!student.hostel || !student.batch) return;
          
          const hostelName = student.hostel === 'DS' ? 'DAY SCHOLAR' : student.hostel;
          
          if (!hostelMap.has(hostelName)) {
            // Handle hostels not in the predefined list (shouldn't happen now with the code above)
            const batchCounts: Record<string, number> = {};
            batchesSet.forEach(batch => {
              batchCounts[batch as string] = 0;
            });
            
            hostelMap.set(hostelName, {
              hostel: hostelName,
              totalCapacity: 0, // Unknown capacity
              filled: 0,
              vacancy: 0,
              batches: batchCounts,
            });
          }
          
          const summary = hostelMap.get(hostelName)!;
          summary.filled++;
          if (summary.totalCapacity > 0) {
            summary.vacancy = summary.totalCapacity - summary.filled;
          }
          
          if (student.batch && summary.batches[student.batch] !== undefined) {
            summary.batches[student.batch]++;
          }
        });
        
        // Sort hostel summaries, but put DAY SCHOLAR at the end
        const sortedHostelSummaries = Array.from(hostelMap.values()).sort((a, b) => {
          if (a.hostel === 'DAY SCHOLAR') return 1;
          if (b.hostel === 'DAY SCHOLAR') return -1;
          return a.hostel.localeCompare(b.hostel);
        });
        
        setHostelSummaries(sortedHostelSummaries);
        
        // Process gender summary
        const genderSummary = {
          hostelers: { boys: 0, girls: 0 },
          dayScholars: { boys: 0, girls: 0 },
        };
        
        joinedStudents.forEach(student => {
          if (!student.hostel || !student.gender) return;
          
          const isDayScholar = student.hostel === 'DS' || student.hostel === 'DAY SCHOLAR';
          const isMale = student.gender === 'M';
          
          if (isDayScholar) {
            if (isMale) {
              genderSummary.dayScholars.boys++;
            } else {
              genderSummary.dayScholars.girls++;
            }
          } else {
            if (isMale) {
              genderSummary.hostelers.boys++;
            } else {
              genderSummary.hostelers.girls++;
            }
          }
        });
        
        setGenderSummary(genderSummary);
        setLoading(false);
      } catch (error) {
        console.error('Error initializing analytics data:', error);
        setLoading(false);
      }
    };
    
    initializeData();
  }, [studentStore]);
  
  // Prepare data for charts - use all batch summaries, not just top 10
  const batchStrengthData = batchSummaries.map(summary => ({
    name: summary.batch,
    Students: summary.strength,
    'Fee Due': summary.feeDue,
  }));
  
  const genderData = [
    { name: 'Boys', value: genderSummary.hostelers.boys + genderSummary.dayScholars.boys },
    { name: 'Girls', value: genderSummary.hostelers.girls + genderSummary.dayScholars.girls },
  ];
  
  const accommodationData = [
    { name: 'Day Scholars', value: genderSummary.dayScholars.boys + genderSummary.dayScholars.girls },
    { name: 'Hostelers', value: genderSummary.hostelers.boys + genderSummary.hostelers.girls },
  ];

  // Export functions
  const exportBatchSummary = () => {
    // Define custom headers mapping for clearer CSV output
    const headers = {
      batch: 'Batch',
      classTeacher: 'Class Teacher',
      strength: 'Strength',
      studyMaterialDue: 'Study Material Due',
      uniformDue: 'Uniform Due',
      idCardDue: 'ID Card Due',
      tabDue: 'Tab Due',
      feeDue: 'Fee Due (Count)',
      feeDueAmount: 'Fee Due (Amount)'
    };
    
    exportToCSV(batchSummaries, 'batch-summary', headers);
  };

  const exportBatchSummaryPDF = () => {
    // Define custom headers mapping
    const headers = {
      batch: 'Batch',
      classTeacher: 'Class Teacher',
      strength: 'Strength',
      studyMaterialDue: 'Study Material Due',
      uniformDue: 'Uniform Due',
      idCardDue: 'ID Card Due',
      tabDue: 'Tab Due',
      feeDue: 'Fee Due (Count)',
      feeDueAmount: 'Fee Due (Amount)'
    };
    
    exportToPDF(batchSummaries, 'batch-summary', headers, 'Batch Summary Report');
  };

  const exportBatchSummaryExcel = () => {
    // Define custom headers mapping
    const headers = {
      batch: 'Batch',
      classTeacher: 'Class Teacher',
      strength: 'Strength',
      studyMaterialDue: 'Study Material Due',
      uniformDue: 'Uniform Due',
      idCardDue: 'ID Card Due',
      tabDue: 'Tab Due',
      feeDue: 'Fee Due (Count)',
      feeDueAmount: 'Fee Due (Amount)'
    };
    
    exportToExcel(batchSummaries, 'batch-summary', headers, 'Batch Summary');
  };

  const exportHostelAllocation = () => {
    // Create a flattened version of hostel data for export
    const flattenedHostelData = hostelSummaries.map(summary => {
      const data: Record<string, unknown> = {
        hostel: summary.hostel,
        totalCapacity: summary.totalCapacity,
        filled: summary.filled,
        vacancy: summary.vacancy
      };
      
      // Add all batch columns
      Object.entries(summary.batches).forEach(([batch, count]) => {
        data[`batch_${batch}`] = count;
      });
      
      return data;
    });
    
    // Create custom headers
    const headers: Record<string, string> = {
      hostel: 'Hostel',
      totalCapacity: 'Total Capacity',
      filled: 'Filled',
      vacancy: 'Vacancy'
    };
    
    // Add batch headers
    if (hostelSummaries.length > 0) {
      Object.keys(hostelSummaries[0].batches).forEach(batch => {
        headers[`batch_${batch}`] = batch;
      });
    }
    
    exportToCSV(flattenedHostelData, 'hostel-allocation', headers);
  };

  const exportHostelAllocationPDF = () => {
    // Create a flattened version of hostel data for export
    const flattenedHostelData = hostelSummaries.map(summary => {
      const data: Record<string, unknown> = {
        hostel: summary.hostel,
        totalCapacity: summary.totalCapacity,
        filled: summary.filled,
        vacancy: summary.vacancy
      };
      
      // Add all batch columns
      Object.entries(summary.batches).forEach(([batch, count]) => {
        data[`batch_${batch}`] = count;
      });
      
      return data;
    });
    
    // Create custom headers
    const headers: Record<string, string> = {
      hostel: 'Hostel',
      totalCapacity: 'Total Capacity',
      filled: 'Filled',
      vacancy: 'Vacancy'
    };
    
    // Add batch headers
    if (hostelSummaries.length > 0) {
      Object.keys(hostelSummaries[0].batches).forEach(batch => {
        headers[`batch_${batch}`] = batch;
      });
    }
    
    exportToPDF(flattenedHostelData, 'hostel-allocation', headers, 'Hostel Allocation Report');
  };

  const exportHostelAllocationExcel = () => {
    // Create a flattened version of hostel data for export
    const flattenedHostelData = hostelSummaries.map(summary => {
      const data: Record<string, unknown> = {
        hostel: summary.hostel,
        totalCapacity: summary.totalCapacity,
        filled: summary.filled,
        vacancy: summary.vacancy
      };
      
      // Add all batch columns
      Object.entries(summary.batches).forEach(([batch, count]) => {
        data[`batch_${batch}`] = count;
      });
      
      return data;
    });
    
    // Create custom headers
    const headers: Record<string, string> = {
      hostel: 'Hostel',
      totalCapacity: 'Total Capacity',
      filled: 'Filled',
      vacancy: 'Vacancy'
    };
    
    // Add batch headers
    if (hostelSummaries.length > 0) {
      Object.keys(hostelSummaries[0].batches).forEach(batch => {
        headers[`batch_${batch}`] = batch;
      });
    }
    
    exportToExcel(flattenedHostelData, 'hostel-allocation', headers, 'Hostel Allocation');
  };
  
  if (loading) {
    return (
      <Layout>
        <div className="p-4 text-center">
          <div className="text-lg">Loading analytics data...</div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Analytics</h1>
        <p className="text-gray-600">
          Detailed statistics and analytics for students
        </p>
      </div>
      
      {/* Overview Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Gender Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={genderData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {genderData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} students`, 'Count']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Accommodation Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={accommodationData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {accommodationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} students`, 'Count']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Batch Strength Chart - showing all batches, not just top 10 */}
      <div className="bg-white p-4 rounded-lg shadow mb-8">
        <h2 className="text-lg font-semibold mb-4">Batch Strength Comparison</h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={batchStrengthData}
            margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Students" name="Student Count" fill="#8884d8" />
            <Bar dataKey="Fee Due" name="Fee Due" fill="#ff0000" /> {/* Changed to red color */}
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Batch Summary Table */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Batch Summary</h2>
          <div className="flex gap-2">
            <Button 
              variant="secondary"
              size="sm"
              onClick={exportBatchSummary}
              className="flex items-center"
            >
              <Download size={16} className="mr-2" />
              CSV
            </Button>
            <Button 
              variant="secondary"
              size="sm"
              onClick={exportBatchSummaryExcel}
              className="flex items-center"
            >
              <FileSpreadsheet size={16} className="mr-2" />
              Excel
            </Button>
            <Button 
              variant="secondary"
              size="sm"
              onClick={exportBatchSummaryPDF}
              className="flex items-center"
            >
              <FileText size={16} className="mr-2" />
              PDF
            </Button>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="max-h-[70vh] overflow-y-auto relative">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10" style={{ position: 'sticky', top: 0 }}>
                  <tr>
                    <th className="sticky left-0 z-20 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Batch
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Class Teacher
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Strength
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Study Material Due
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Uniform Due
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID Card Due
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tab Due
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fee Due (Count)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fee Due (Amount)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {batchSummaries.map((summary) => (
                    <tr key={summary.batch}>
                      <td className="sticky left-0 z-10 px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 bg-white">
                        {summary.batch}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {summary.classTeacher}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {summary.strength}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {summary.studyMaterialDue}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {summary.uniformDue}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {summary.idCardDue}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {summary.tabDue}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {summary.feeDue}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ₹{summary.feeDueAmount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {/* Total row */}
                  <tr className="bg-gray-50">
                    <td className="sticky left-0 z-10 px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 bg-gray-50">
                      Total
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      -
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      {batchSummaries.reduce((sum, summary) => sum + summary.strength, 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      {batchSummaries.reduce((sum, summary) => sum + summary.studyMaterialDue, 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      {batchSummaries.reduce((sum, summary) => sum + summary.uniformDue, 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      {batchSummaries.reduce((sum, summary) => sum + summary.idCardDue, 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      {batchSummaries.reduce((sum, summary) => sum + summary.tabDue, 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      {batchSummaries.reduce((sum, summary) => sum + summary.feeDue, 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      ₹{batchSummaries.reduce((sum, summary) => sum + summary.feeDueAmount, 0).toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      {/* Hostel Summary Table */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Hostel Allocation</h2>
          <div className="flex gap-2">
            <Button 
              variant="secondary"
              size="sm"
              onClick={exportHostelAllocation}
              className="flex items-center"
            >
              <Download size={16} className="mr-2" />
              CSV
            </Button>
            <Button 
              variant="secondary"
              size="sm"
              onClick={exportHostelAllocationExcel}
              className="flex items-center"
            >
              <FileSpreadsheet size={16} className="mr-2" />
              Excel
            </Button>
            <Button 
              variant="secondary"
              size="sm"
              onClick={exportHostelAllocationPDF}
              className="flex items-center"
            >
              <FileText size={16} className="mr-2" />
              PDF
            </Button>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="max-h-[70vh] overflow-y-auto relative">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10" style={{ position: 'sticky', top: 0 }}>
                  <tr>
                    <th className="sticky left-0 z-20 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Hostel
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Capacity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Filled
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vacancy
                    </th>
                    {/* Render all batch columns */}
                    {hostelSummaries.length > 0 && Object.keys(hostelSummaries[0].batches).map(batch => (
                      <th key={batch} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {batch}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {hostelSummaries.map((summary) => (
                    <tr key={summary.hostel}>
                      <td className="sticky left-0 z-10 px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 bg-white">
                        {summary.hostel}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {summary.totalCapacity || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {summary.filled}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {summary.totalCapacity ? summary.vacancy : 'N/A'}
                      </td>
                      {/* Render all batch counts */}
                      {Object.keys(summary.batches).map(batch => (
                        <td key={batch} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {summary.batches[batch]}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {/* Total row */}
                  <tr className="bg-gray-50">
                    <td className="sticky left-0 z-10 px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 bg-gray-50">
                      Total
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      {hostelSummaries.reduce((sum, summary) => sum + (summary.totalCapacity || 0), 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      {hostelSummaries.reduce((sum, summary) => sum + summary.filled, 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      {hostelSummaries.reduce((sum, summary) => sum + (summary.vacancy || 0), 0)}
                    </td>
                    {/* Total for each batch column */}
                    {hostelSummaries.length > 0 && Object.keys(hostelSummaries[0].batches).map(batch => (
                      <td key={batch} className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        {hostelSummaries.reduce((sum, summary) => sum + (summary.batches[batch] || 0), 0)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      {/* Gender Summary */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Gender Distribution</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium mb-4">Hostelers</h3>
            <div className="flex justify-around">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{genderSummary.hostelers.boys}</div>
                <div className="text-gray-500">Boys</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-pink-600">{genderSummary.hostelers.girls}</div>
                <div className="text-gray-500">Girls</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {genderSummary.hostelers.boys + genderSummary.hostelers.girls}
                </div>
                <div className="text-gray-500">Total</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium mb-4">Day Scholars</h3>
            <div className="flex justify-around">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{genderSummary.dayScholars.boys}</div>
                <div className="text-gray-500">Boys</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-pink-600">{genderSummary.dayScholars.girls}</div>
                <div className="text-gray-500">Girls</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {genderSummary.dayScholars.boys + genderSummary.dayScholars.girls}
                </div>
                <div className="text-gray-500">Total</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
});

export default Analytics; 