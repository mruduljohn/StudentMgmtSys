import React from 'react';
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

interface SubjectHoursBarGraphProps {
  batch?: string;
}

const SubjectHoursBarGraph: React.FC<SubjectHoursBarGraphProps> = observer(({ batch }) => {
  const hourStore = useHourStore();
  const stats = hourStore.getStats;

  if (hourStore.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!stats || !stats.subjectStats || stats.subjectStats.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="body1" color="text.secondary">
          No subject data available
        </Typography>
      </Box>
    );
  }

  // Prepare data for the stacked bar chart
  const subjectData = stats.subjectStats.map((item) => ({
    subject: item.subject,
    completedHours: item.totalCompletedHours,
    remainingHours: item.totalRemainingHours,
    totalHours: item.totalAllotedHours,
  }));

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Subject Hours Distribution {batch ? `for ${batch}` : ''}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Completed vs Remaining Hours by Subject
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <Box sx={{ height: 400 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={subjectData}
            margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="subject" 
              angle={-45} 
              textAnchor="end" 
              height={70}
              interval={0}
            />
            <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
            <Tooltip 
              formatter={(value, name) => {
                return [`${value} hours`, name === 'completedHours' ? 'Completed Hours' : 'Remaining Hours'];
              }}
              labelFormatter={(label) => `Subject: ${label}`}
            />
            <Legend 
              verticalAlign="top" 
              wrapperStyle={{ paddingBottom: 10 }}
              payload={[
                { value: 'Completed Hours', type: 'square', color: '#4CAF50' },
                { value: 'Remaining Hours', type: 'square', color: '#FF9800' }
              ]}
            />
            <Bar 
              dataKey="completedHours" 
              stackId="a" 
              fill="#4CAF50" 
              name="Completed Hours" 
            />
            <Bar 
              dataKey="remainingHours" 
              stackId="a" 
              fill="#FF9800" 
              name="Remaining Hours" 
            />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
});

export default SubjectHoursBarGraph; 