import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
  Box,
  Paper,
  Typography,
  Divider,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  CardHeader,
  LinearProgress,
  Chip,
  Alert,
  TextField,
  InputAdornment
} from '@mui/material';
import { Search } from 'lucide-react';
import { useHourStore } from '../../store/hourStore';
import ChapterProgressBarGraph from './ChapterProgressBarGraph';

interface ChapterStatusProps {
  batch: string;
  subject: string;
}

interface ChapterData {
  chapter: string;
  status: string;
  progress: number;
  totalHours: number;
  lastUpdated: string;
}

const ChapterStatus: React.FC<ChapterStatusProps> = observer(({ batch, subject }) => {
  const hourStore = useHourStore();
  const [chapters, setChapters] = useState<ChapterData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const fetchChapterStatus = async () => {
      if (!batch) {
        setError('Please select a batch to view chapter status');
        setChapters([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await hourStore.fetchChapterStatus(batch, subject);
        setChapters(data);
      } catch (err) {
        console.error('Error fetching chapter status:', err);
        setError('Failed to fetch chapter status');
      } finally {
        setLoading(false);
      }
    };

    fetchChapterStatus();
  }, [batch, subject, hourStore]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NOT STARTED':
        return 'error';
      case 'ONGOING':
        return 'warning';
      case 'COMPLETED':
        return 'success';
      default:
        return 'default';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress < 30) return 'error';
    if (progress < 70) return 'warning';
    return 'success';
  };
  
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };
  
  // Filter chapters based on search query
  const filteredChapters = searchQuery.trim() === '' 
    ? chapters 
    : chapters.filter(chapter => 
        chapter.chapter.toLowerCase().includes(searchQuery.toLowerCase())
      );
  
  // Highlight search matches in text
  const highlightSearchMatch = (text: string) => {
    if (!searchQuery || searchQuery.trim() === '') {
      return text;
    }
    
    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return (
      <>
        {parts.map((part, i) => 
          regex.test(part) ? 
            <span key={i} style={{ backgroundColor: '#FFEB3B', fontWeight: 'bold' }}>{part}</span> : 
            <span key={i}>{part}</span>
        )}
      </>
    );
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
      <Alert severity="info" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (chapters.length === 0) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        {batch ? 'No chapters found for the selected criteria' : 'Please select a batch to view chapter status'}
      </Alert>
    );
  }

  // Calculate overall progress
  const overallProgress = Math.round(
    chapters.reduce((sum, chapter) => sum + chapter.progress, 0) / chapters.length
  );

  // Check if a specific subject is selected (not "All subjects")
  const isSpecificSubject = subject && subject !== '';

  return (
    <Box>
      {/* Chapter Progress Bar Graph */}
      <ChapterProgressBarGraph batch={batch} subject={subject} />

      {isSpecificSubject && (
        <>
          <Box sx={{ mb: 3 }}>
            <Card>
              <CardHeader 
                title="Overall Progress" 
                subheader={`${batch}${subject ? ` - ${subject}` : ''}`} 
              />
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ width: '100%', mr: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={overallProgress} 
                      color={getProgressColor(overallProgress)}
                      sx={{ height: 10, borderRadius: 5 }}
                    />
                  </Box>
                  <Box sx={{ minWidth: 35 }}>
                    <Typography variant="body2" color="text.secondary">{`${overallProgress}%`}</Typography>
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {`${chapters.filter(c => c.status === 'COMPLETED').length} of ${chapters.length} chapters completed`}
                </Typography>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Chapter Details
            </Typography>
            <TextField
              placeholder="Search chapters..."
              size="small"
              value={searchQuery}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={20} />
                  </InputAdornment>
                ),
              }}
              sx={{ width: '250px' }}
            />
          </Box>
          <Divider sx={{ mb: 2 }} />
          
          {filteredChapters.length === 0 ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              No chapters found matching "{searchQuery}"
            </Alert>
          ) : (
            <Grid container spacing={2}>
              {filteredChapters.map((chapter, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Paper sx={{ p: 2, height: '100%' }}>
                    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {highlightSearchMatch(chapter.chapter)}
                      </Typography>
                      <Chip 
                        label={chapter.status} 
                        size="small" 
                        color={getStatusColor(chapter.status) as 'error' | 'warning' | 'success' | 'default'}
                      />
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Box sx={{ width: '100%', mr: 1 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={chapter.progress} 
                          color={getProgressColor(chapter.progress)}
                        />
                      </Box>
                      <Box sx={{ minWidth: 35 }}>
                        <Typography variant="body2" color="text.secondary">{`${chapter.progress}%`}</Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Subject: {subject}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Hours: {chapter.totalHours}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Last Updated: {new Date(chapter.lastUpdated).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}
    </Box>
  );
});

export default ChapterStatus; 