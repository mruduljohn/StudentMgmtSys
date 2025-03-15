import React from 'react';
import { observer } from 'mobx-react-lite';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Divider,
  CircularProgress,
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemText,
  Tabs,
  Tab
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
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useHourStore } from '../../store/hourStore';
import { useAuthStore } from '../../store/authStore';
import SubjectHoursBarGraph from './SubjectHoursBarGraph';
import BatchSubjectMultiBarGraph from './BatchSubjectMultiBarGraph';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B6B', '#6B66FF'];

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`stats-tabpanel-${index}`}
      aria-labelledby={`stats-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const HourStats: React.FC = observer(() => {
  const hourStore = useHourStore();
  const authStore = useAuthStore();
  const stats = hourStore.getStats;
  const [tabValue, setTabValue] = React.useState(0);
  const isAdmin = authStore.user?.role === 'ADMIN';
  const selectedBatch = hourStore.filters.get('batch') as string || '';

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (hourStore.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!stats) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" color="text.secondary">
          No statistics available
        </Typography>
      </Box>
    );
  }

  // Prepare data for charts
  const subjectData = stats.hoursBySubject.map((item, index) => ({
    name: item.subject,
    hours: item.totalHours,
    fill: COLORS[index % COLORS.length]
  }));

  const modeData = stats.hoursByMode.map((item, index) => ({
    name: item.mode,
    hours: item.totalHours,
    fill: COLORS[index % COLORS.length]
  }));

  const statusData = stats.hoursByStatus.map((item, index) => ({
    name: item.status,
    hours: item.totalHours,
    fill: COLORS[index % COLORS.length]
  }));

  const monthlyData = stats.hoursByMonth.map((item) => ({
    name: item.month,
    hours: item.totalHours
  }));

  return (
    <Box>
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Total Hours" />
            <CardContent>
              <Typography variant="h3" align="center">
                {stats.totalHours}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary" align="center">
                Hours Taught
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Chapters" />
            <CardContent>
              <Typography variant="h3" align="center">
                {stats.totalChapters}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary" align="center">
                Chapters Covered
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Completion" />
            <CardContent>
              <Typography variant="h3" align="center">
                {stats.completionRate}%
              </Typography>
              <Typography variant="subtitle1" color="text.secondary" align="center">
                Chapter Completion Rate
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs for different chart views */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="hour statistics tabs">
          <Tab label="Overview" id="stats-tab-0" aria-controls="stats-tabpanel-0" />
          <Tab label="Subject Hours" id="stats-tab-1" aria-controls="stats-tabpanel-1" />
          {isAdmin && <Tab label="Batch Analysis" id="stats-tab-2" aria-controls="stats-tabpanel-2" />}
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {/* Monthly Hours Chart */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Monthly Hours
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="hours" fill="#8884d8" name="Hours" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>

          {/* Subject Distribution */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Hours by Subject
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ height: 300, display: 'flex' }}>
                <ResponsiveContainer width="60%" height="100%">
                  <PieChart>
                    <Pie
                      data={subjectData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="hours"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {subjectData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <Box sx={{ width: '40%', overflowY: 'auto', maxHeight: 300 }}>
                  <List dense>
                    {subjectData.map((item, index) => (
                      <ListItem key={index}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            backgroundColor: item.fill,
                            mr: 1,
                            borderRadius: '50%'
                          }}
                        />
                        <ListItemText
                          primary={item.name}
                          secondary={`${item.hours} hours`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Mode Distribution */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Hours by Mode
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ height: 300, display: 'flex' }}>
                <ResponsiveContainer width="60%" height="100%">
                  <PieChart>
                    <Pie
                      data={modeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="hours"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {modeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <Box sx={{ width: '40%', overflowY: 'auto', maxHeight: 300 }}>
                  <List dense>
                    {modeData.map((item, index) => (
                      <ListItem key={index}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            backgroundColor: item.fill,
                            mr: 1,
                            borderRadius: '50%'
                          }}
                        />
                        <ListItemText
                          primary={item.name}
                          secondary={`${item.hours} hours`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Status Distribution */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Hours by Chapter Status
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ height: 300, display: 'flex' }}>
                <ResponsiveContainer width="60%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="hours"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <Box sx={{ width: '40%', overflowY: 'auto', maxHeight: 300 }}>
                  <List dense>
                    {statusData.map((item, index) => (
                      <ListItem key={index}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            backgroundColor: item.fill,
                            mr: 1,
                            borderRadius: '50%'
                          }}
                        />
                        <ListItemText
                          primary={item.name}
                          secondary={`${item.hours} hours`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {/* Subject Hours Bar Graph */}
        <SubjectHoursBarGraph batch={selectedBatch} />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {/* Batch-Subject Multi-Bar Graph (Admin Only) */}
        <BatchSubjectMultiBarGraph />
      </TabPanel>
    </Box>
  );
});

export default HourStats; 