import React, { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import {
  Box,
  Paper,
  Typography,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useHourStore } from '../../store/hourStore';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const BatchSubjectMultiBarGraph: React.FC = observer(() => {
  const hourStore = useHourStore();
  const stats = hourStore.getStats;

  const batchData = useMemo(() => {
    if (!stats || !stats.batchStats || stats.batchStats.length === 0) {
      return [];
    }

    // Group data by batch
    const batchGroups = stats.batchStats.reduce((acc, item) => {
      if (!acc[item.batch]) {
        acc[item.batch] = {
          batch: item.batch,
        };
      }
      
      // Add subject hours to the batch
      acc[item.batch][item.subject] = item.totalCompletedHours;
      
      return acc;
    }, {} as Record<string, Record<string, number | string>>);

    // Convert to array
    return Object.values(batchGroups);
  }, [stats]);

  // Extract all unique subjects
  const subjects = useMemo(() => {
    if (!stats || !stats.batchStats || stats.batchStats.length === 0) {
      return [];
    }
    
    return Array.from(new Set(stats.batchStats.map(item => item.subject)));
  }, [stats]);

  if (hourStore.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!stats || !stats.batchStats || stats.batchStats.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="body1" color="text.secondary">
          No batch data available
        </Typography>
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Hours by Batch and Subject
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Distribution of hours across batches and subjects
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <Box sx={{ height: 400 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={batchData}
            margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="batch" 
              angle={-45} 
              textAnchor="end" 
              height={70}
              interval={0}
            />
            <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
            <Tooltip 
              formatter={(value, name) => [`${value} hours`, `Subject: ${name}`]}
              labelFormatter={(label) => `Batch: ${label}`}
            />
            <Legend 
              verticalAlign="top" 
              wrapperStyle={{ paddingBottom: 10 }}
            />
            {subjects.map((subject, index) => (
              <Bar 
                key={subject}
                dataKey={subject} 
                fill={COLORS[index % COLORS.length]} 
                name={subject}
                barSize={20}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
});

export default BatchSubjectMultiBarGraph; 