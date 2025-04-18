import React, { useEffect, useState, useCallback } from 'react';
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
  Cell,
  Rectangle,
} from 'recharts';
import { useHourStore } from '../../store/hourStore';

interface ChapterProgressBarGraphProps {
  batch: string;
  subject: string;
}

interface ChapterData {
  chapter: string;
  status: string;
  progress: number;
  totalHours: number;
  allotedHours?: number; // Add allotedHours property
  lastUpdated: string;
}

// Define types for the CustomBar component
interface CustomBarProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  value?: number;
  fill?: string;
  payload?: {
    allotedHours: number;
    totalHours: number;
    maxHours: number;
    [key: string]: number | string | boolean | object;
  };
  index?: number;
}

// Custom bar shape to show total hours in grey with completed hours colored
const CustomBar = (props: CustomBarProps) => {
  if (!props.payload || !props.width || !props.height || !props.x || !props.y || !props.fill) {
    return null;
  }
  
  const { x, y, width, height, fill } = props;
  const { allotedHours, totalHours, maxHours } = props.payload;
  
  // Calculate the width of the total hours bar (grey background)
  const totalWidth = width * (allotedHours / maxHours);
  
  // Calculate the width of the completed hours bar
  const completedWidth = width * (totalHours / maxHours);
  
  return (
    <g>
      {/* Total hours bar (grey background) */}
      <Rectangle
        x={x}
        y={y}
        width={totalWidth}
        height={height}
        fill="#e0e0e0" // Grey color for total hours
        radius={0}
      />
      {/* Completed hours bar (colored based on status) */}
      <Rectangle
        x={x}
        y={y}
        width={completedWidth}
        height={height}
        fill={fill}
        radius={0}
      />
    </g>
  );
};

const ChapterProgressBarGraph: React.FC<ChapterProgressBarGraphProps> = observer(({ batch, subject }) => {
  const hourStore = useHourStore();
  const [chapters, setChapters] = useState<ChapterData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoize the fetch function to avoid recreating it on every render
  const fetchChapterStatus = useCallback(async (batchValue: string, subjectValue: string) => {
    if (!batchValue) {
      setError('Please select a batch to view chapter progress');
      setChapters([]);
      return;
    }

    if (!subjectValue) {
      setError('Please select a subject to view chapter progress');
      setChapters([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await hourStore.fetchChapterStatus(batchValue, subjectValue);
      
      // Enhance data with allotedHours if not present
      const enhancedData = data.map((chapter: ChapterData) => ({
        ...chapter,
        // If allotedHours is not provided, estimate it based on progress and totalHours
        allotedHours: chapter.allotedHours || (chapter.progress > 0 ? Math.round(chapter.totalHours * 100 / chapter.progress) : chapter.totalHours * 2)
      }));
      
      // Sort chapters by name for better visualization
      const sortedData = [...enhancedData].sort((a, b) => a.chapter.localeCompare(b.chapter));
      setChapters(sortedData);
    } catch (err) {
      console.error('Error fetching chapter status:', err);
      setError('Failed to fetch chapter status');
    } finally {
      setLoading(false);
    }
  }, [hourStore]);

  // Fetch data when batch or subject changes
  useEffect(() => {
    if (batch && subject) {
      fetchChapterStatus(batch, subject);
    }
  }, [batch, subject, fetchChapterStatus]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return '#4CAF50'; // Green
      case 'ONGOING':
        return '#FF9800'; // Orange (changed from yellow)
      case 'NOT STARTED':
        return '#9E9E9E'; // Grey
      default:
        return '#9E9E9E'; // Grey
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="body1" color="text.secondary">
          {error}
        </Typography>
      </Box>
    );
  }

  // Prepare data for the chart
  const chartData = chapters.map(chapter => ({
    ...chapter,
    // Make sure we have a value for allotedHours
    allotedHours: chapter.allotedHours || Math.max(chapter.totalHours * 2, 10),
    // For the chart, we'll use totalHours as the maximum value
    maxHours: Math.max(chapter.allotedHours || 0, chapter.totalHours)
  }));

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6">
          Chapter Progress for {batch} - {subject}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Hours completed by chapter with status indication (grey bar shows total allotted hours)
        </Typography>
      </Box>
      <Divider sx={{ mb: 2 }} />
      
      {chapters.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No chapter data available for the selected criteria
          </Typography>
        </Box>
      ) : (
        <Box sx={{ height: Math.max(400, chapters.length * 40) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 20, right: 30, left: 150, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis 
                type="number" 
                label={{ value: 'Hours', position: 'insideBottom', offset: -10 }} 
                domain={[0, 'dataMax']}
              />
              <YAxis 
                type="category" 
                dataKey="chapter" 
                width={140}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value, name, props) => {
                  const { payload } = props;
                  if (name === 'totalHours') {
                    return [
                      `${value} / ${payload.allotedHours} hours (${payload.progress}%)`, 
                      'Hours Completed'
                    ];
                  }
                  return [value, name];
                }}
                labelFormatter={(label) => `Chapter: ${label}`}
              />
              <Legend 
                verticalAlign="top" 
                wrapperStyle={{ paddingBottom: 10 }}
                payload={[
                  { value: 'Completed', type: 'square', color: '#4CAF50' },
                  { value: 'Ongoing', type: 'square', color: '#FF9800' },
                  { value: 'Not Started', type: 'square', color: '#9E9E9E' },
                  { value: 'Total Allotted', type: 'square', color: '#e0e0e0' }
                ]}
              />
              <Bar 
                dataKey="totalHours" 
                name="Hours Completed"
                barSize={20}
                shape={<CustomBar />}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getStatusColor(entry.status)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>
      )}
    </Paper>
  );
});

export default ChapterProgressBarGraph; 