import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Button,
  List,
  ListItem,
  ListItemText,
  Chip,
  Paper,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
} from 'recharts';
import { dashboardAPI, getSentimentColor, getPriorityColor, formatRelativeTime } from '../services/api';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentEmails, setRecentEmails] = useState([]);
  const [categoryStats, setCategoryStats] = useState([]);
  const [responseStats, setResponseStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, recentRes, categoryRes, responseRes] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getRecentEmails(5),
        dashboardAPI.getCategoryStats(),
        dashboardAPI.getResponseStats(),
      ]);

      setStats(statsRes.data);
      setRecentEmails(recentRes.data);
      setCategoryStats(categoryRes.data.categories);
      setResponseStats(responseRes.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box className="loading-spinner">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Prepare chart data
  const sentimentData = stats ? Object.entries(stats.sentiment_breakdown).map(([key, value]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value,
    color: getSentimentColor(key),
  })) : [];

  const priorityData = stats ? Object.entries(stats.priority_breakdown).map(([key, value]) => ({
    name: key === 'not_urgent' ? 'Not Urgent' : 'Urgent',
    value,
    color: getPriorityColor(key),
  })) : [];

  const hourlyData = stats ? stats.hourly_stats.slice(-12).map(item => ({
    hour: new Date(item.hour).getHours() + ':00',
    emails: item.count,
  })) : [];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }} className="dashboard-container">
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        mb: 4,
        background: 'rgba(255, 255, 255, 0.1)',
        padding: 3,
        borderRadius: 3,
        backdropFilter: 'blur(10px)'
      }}>
        <Typography 
          variant="h3" 
          className="animated-title"
          sx={{ 
            fontWeight: 'bold',
            textAlign: 'center',
            width: '100%'
          }}
        >
          🤖 AI Communication Dashboard
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card className="stat-card" sx={{ animationDelay: '0.1s' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                <Typography 
                  variant="h2" 
                  component="div"
                  sx={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontWeight: 'bold'
                  }}
                >
                  📧
                </Typography>
              </Box>
              <Typography color="textSecondary" gutterBottom sx={{ fontSize: '0.9rem', fontWeight: 500 }}>
                Total Emails (24h)
              </Typography>
              <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', color: '#333' }}>
                {stats?.total_emails_24h || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="stat-card" sx={{ animationDelay: '0.2s' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                <Typography variant="h2" component="div" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                  ✅
                </Typography>
              </Box>
              <Typography color="textSecondary" gutterBottom sx={{ fontSize: '0.9rem', fontWeight: 500 }}>
                Processed
              </Typography>
              <Typography variant="h3" component="div" className="status-processed" sx={{ fontWeight: 'bold' }}>
                {stats?.processed_emails || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="stat-card" sx={{ animationDelay: '0.3s' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                <Typography variant="h2" component="div" sx={{ color: '#ff9800', fontWeight: 'bold' }}>
                  ⏳
                </Typography>
              </Box>
              <Typography color="textSecondary" gutterBottom sx={{ fontSize: '0.9rem', fontWeight: 500 }}>
                Pending
              </Typography>
              <Typography variant="h3" component="div" className="status-pending" sx={{ fontWeight: 'bold' }}>
                {stats?.pending_emails || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="stat-card" sx={{ animationDelay: '0.4s' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                <Typography variant="h2" component="div" sx={{ color: '#f44336', fontWeight: 'bold' }}>
                  🚨
                </Typography>
              </Box>
              <Typography color="textSecondary" gutterBottom sx={{ fontSize: '0.9rem', fontWeight: 500 }}>
                Urgent
              </Typography>
              <Typography variant="h3" component="div" className="priority-urgent" sx={{ fontWeight: 'bold' }}>
                {stats?.urgent_emails || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Sentiment Analysis Chart */}
        <Grid item xs={12} md={6}>
          <Paper className="chart-container">
            <Typography variant="h6" gutterBottom>
              Sentiment Analysis
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Priority Distribution */}
        <Grid item xs={12} md={6}>
          <Paper className="chart-container">
            <Typography variant="h6" gutterBottom>
              Priority Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8">
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Hourly Email Traffic */}
        <Grid item xs={12} md={8}>
          <Paper className="chart-container">
            <Typography variant="h6" gutterBottom>
              Email Traffic (Last 12 Hours)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="emails" 
                  stroke="#1976d2" 
                  strokeWidth={2}
                  dot={{ fill: '#1976d2', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Response Statistics */}
        <Grid item xs={12} md={4}>
          <Paper className="chart-container">
            <Typography variant="h6" gutterBottom>
              Response Statistics
            </Typography>
            {responseStats && (
              <Box>
                <Typography variant="body2" gutterBottom>
                  Response Rate: {responseStats.response_rate.toFixed(1)}%
                </Typography>
                <Typography variant="body2" gutterBottom>
                  Avg Response Time: {responseStats.avg_response_time_hours}h
                </Typography>
                <Typography variant="body2" gutterBottom>
                  Responses Sent: {responseStats.responses_sent}
                </Typography>
                <Typography variant="body2">
                  AI Responses Generated: {responseStats.emails_with_responses}
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Recent Emails */}
        <Grid item xs={12}>
          <Paper className="chart-container">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Recent Emails
              </Typography>
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => window.location.href = '/emails'}
              >
                View All
              </Button>
            </Box>
            <List>
              {recentEmails.map((email) => (
                <ListItem 
                  key={email.id} 
                  divider
                  sx={{ cursor: 'pointer' }}
                  onClick={() => window.location.href = `/emails/${email.id}`}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" component="span">
                          {email.subject}
                        </Typography>
                        <Chip
                          label={email.priority}
                          size="small"
                          sx={{
                            backgroundColor: getPriorityColor(email.priority),
                            color: 'white',
                            fontSize: '0.7rem'
                          }}
                        />
                        <Chip
                          label={email.sentiment}
                          size="small"
                          sx={{
                            backgroundColor: getSentimentColor(email.sentiment),
                            color: 'white',
                            fontSize: '0.7rem'
                          }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="textSecondary">
                          From: {email.sender_email}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {formatRelativeTime(email.received_at)} • {email.processed ? 'Processed' : 'Pending'}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
