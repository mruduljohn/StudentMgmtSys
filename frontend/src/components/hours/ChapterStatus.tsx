import React, { useEffect, useState, useMemo } from 'react';
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
  InputAdornment,
  IconButton
} from '@mui/material';
import { Search, X } from 'lucide-react';
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
  allotedHours: number;
  completedHours: number;
  remainingHours: number;
  lastUpdated: string;
}

const ChapterStatus: React.FC<ChapterStatusProps> = observer(({ batch, subject }) => {
  const hourStore = useHourStore();
  const [chapters, setChapters] = useState<ChapterData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchKey, setSearchKey] = useState<number>(0); // Add a key to force re-render

  // Fetch chapter data when batch or subject changes
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
        setSearchQuery(''); // Reset search query when batch/subject changes
      } catch (err) {
        console.error('Error fetching chapter status:', err);
        setError('Failed to fetch chapter status');
        setChapters([]);
      } finally {
        setLoading(false);
      }
    };

    fetchChapterStatus();
  }, [batch, subject, hourStore]);

  // Filter chapters based on search query with useMemo
  const filteredChapters = useMemo(() => {
    console.log('Filtering chapters with query:', searchQuery);
    console.log('Total chapters available:', chapters.length);
    
    if (!searchQuery || searchQuery.trim() === '') {
      return chapters;
    }
    
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const filtered = chapters.filter(chapter => 
      chapter.chapter.toLowerCase().includes(normalizedQuery)
    );
    
    console.log('Filtered chapters count:', filtered.length);
    return filtered;
  }, [chapters, searchQuery, searchKey]); // Added searchKey to ensure re-computation

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'ONGOING':
        return 'warning';
      case 'NOT STARTED':
        return 'default';
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
    const value = event.target.value;
    console.log('Search query changed to:', value);
    setSearchQuery(value);
    setSearchKey(prev => prev + 1); // Increment the key to force re-filtering
  };
  
  const clearSearch = () => {
    setSearchQuery('');
    setSearchKey(prev => prev + 1); // Increment the key to force re-filtering
  };
  
  // Highlight search matches in text
  const highlightSearchMatch = (text: string) => {
    if (!searchQuery || searchQuery.trim() === '') {
      return text;
    }
    
    try {
      const escapeRegExp = (string: string) => {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      };
      
      const regex = new RegExp(`(${escapeRegExp(searchQuery.trim())})`, 'gi');
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
    } catch (error) {
      console.error('Error in highlighting text:', error);
      return text; // Fallback to regular text if regex fails
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

  // Calculate overall completed/allotted hours
  const totalCompletedHours = chapters.reduce((sum, chapter) => sum + chapter.completedHours, 0);
  const totalAllotedHours = chapters.reduce((sum, chapter) => sum + chapter.allotedHours, 0);

  // Check if a specific subject is selected (not "All subjects")
  const isSpecificSubject = subject && subject !== '';

  return (
    <Box key={`chapters-container-${searchKey}`}>
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
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {`Total Hours: ${totalCompletedHours}/${totalAllotedHours} (${Math.round((totalCompletedHours / totalAllotedHours) * 100) || 0}%)`}
                </Typography>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Chapter Details {searchQuery ? `(Filtered: ${filteredChapters.length}/${chapters.length})` : ''}
            </Typography>
            <TextField
              placeholder="Search chapters..."
              size="small"
              value={searchQuery}
              onChange={handleSearchChange}
              autoComplete="off"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={20} />
                  </InputAdornment>
                ),
                endAdornment: searchQuery ? (
                  <InputAdornment position="end">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {loading ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', mr: 0.5 }}>
                          <CircularProgress size={16} sx={{ mr: 0.5 }} />
                          <Typography variant="caption" color="text.secondary">Searching...</Typography>
                        </Box>
                      ) : searchQuery && filteredChapters.length === 0 ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', mr: 0.5 }}>
                          <Typography variant="caption" color="error.main">No results</Typography>
                        </Box>
                      ) : searchQuery ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', mr: 0.5 }}>
                          <Typography variant="caption" color="success.main">{filteredChapters.length} found</Typography>
                        </Box>
                      ) : null}
                      <IconButton 
                        size="small" 
                        onClick={clearSearch}
                        edge="end"
                        aria-label="clear search"
                      >
                        <X size={16} />
                      </IconButton>
                    </Box>
                  </InputAdornment>
                ) : null
              }}
              sx={{ width: '300px' }}
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
                <Grid item xs={12} sm={6} md={4} key={`${chapter.chapter}-${index}-${searchKey}`}>
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
                      <Box sx={{ minWidth: 60 }}>
                        <Typography variant="body2" color="text.secondary">
                          {`${chapter.progress}%`}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Subject: {subject}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <b>Total Hours: {chapter.completedHours}/{chapter.allotedHours}</b>
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Remaining Hours: {chapter.remainingHours}
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