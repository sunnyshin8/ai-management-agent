'use client';

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
import { dashboardAPI, getSentimentColor, getPriorityColor, formatRelativeTime } from '../../services/api';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [recentEmails, setRecentEmails] = useState([]);
  const [responseStats, setResponseStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [statsRes, recentRes, responseRes] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getRecentEmails(5),
        dashboardAPI.getResponseStats(),
      ]);

      // Handle stats response
      if (statsRes && statsRes.data && !statsRes.error) {
        setStats(statsRes.data);
      } else {
        console.warn('Stats API failed:', statsRes.error);
        setStats({
          total_emails_24h: 0,
          processed_emails: 0,
          pending_emails: 0,
          urgent_emails: 0,
          sentiment_breakdown: { positive: 0, negative: 0, neutral: 0 },
          priority_breakdown: { urgent: 0, not_urgent: 0 },
          hourly_stats: []
        });
      }
      
      // Handle recent emails response
      if (recentRes && recentRes.data && !recentRes.error && Array.isArray(recentRes.data)) {
        setRecentEmails(recentRes.data);
      } else {
        console.warn('Recent emails API failed:', recentRes.error);
        setRecentEmails([]);
      }
      
      // Handle response stats response
      if (responseRes && responseRes.data && !responseRes.error) {
        setResponseStats(responseRes.data);
      } else {
        console.warn('Response stats API failed:', responseRes.error);
        setResponseStats({
          response_rate: 0,
          avg_response_time_hours: 0,
          responses_sent: 0,
          emails_with_responses: 0
        });
      }

      // If all APIs failed, show error
      if (statsRes.error && recentRes.error && responseRes.error) {
        setError('All dashboard services are currently unavailable. Please check your connection and try again.');
        toast.error('Dashboard services unavailable');
      } else if (statsRes.error || recentRes.error || responseRes.error) {
        // Partial failure - show warning but continue
        toast.error('Some dashboard data may be incomplete');
      }
      
    } catch (error) {
      console.error('Dashboard error:', error);
      setError(error.message || 'Failed to load dashboard data');
      toast.error('Failed to load dashboard data');
      
      // Set empty default data for graceful fallback
      setStats({
        total_emails_24h: 0,
        processed_emails: 0,
        pending_emails: 0,
        urgent_emails: 0,
        sentiment_breakdown: { positive: 0, negative: 0, neutral: 0 },
        priority_breakdown: { urgent: 0, not_urgent: 0 },
        hourly_stats: []
      });
      setRecentEmails([]);
      setResponseStats({
        response_rate: 0,
        avg_response_time_hours: 0,
        responses_sent: 0,
        emails_with_responses: 0
      });
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

  if (error && !stats) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: '400px',
          textAlign: 'center'
        }}>
          <Typography variant="h4" color="error" gutterBottom>
            ⚠️ Dashboard Error
          </Typography>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            {error}
          </Typography>
          <Button 
            variant="contained" 
            onClick={loadDashboardData}
            sx={{ mt: 2 }}
          >
            Retry
          </Button>
        </Box>
      </Container>
    );
  }

  // Prepare chart data with safe access
  const sentimentData = (stats && stats.sentiment_breakdown) ? Object.entries(stats.sentiment_breakdown).map(([key, value]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value: value || 0,
    color: getSentimentColor(key),
  })) : [];

  const priorityData = (stats && stats.priority_breakdown) ? Object.entries(stats.priority_breakdown).map(([key, value]) => ({
    name: key === 'not_urgent' ? 'Not Urgent' : 'Urgent',
    value: value || 0,
    color: getPriorityColor(key),
  })) : [];

  const hourlyData = (stats && stats.hourly_stats && Array.isArray(stats.hourly_stats)) ? stats.hourly_stats.slice(-12).map(item => ({
    hour: item.hour ? new Date(item.hour).getHours() + ':00' : 'N/A',
    emails: item.count || 0,
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
            {responseStats ? (
              <Box>
                <Typography variant="body2" gutterBottom>
                  Response Rate: {(responseStats.response_rate || 0).toFixed(1)}%
                </Typography>
                <Typography variant="body2" gutterBottom>
                  Avg Response Time: {responseStats.avg_response_time_hours || 0}h
                </Typography>
                <Typography variant="body2" gutterBottom>
                  Responses Sent: {responseStats.responses_sent || 0}
                </Typography>
                <Typography variant="body2">
                  AI Responses Generated: {responseStats.emails_with_responses || 0}
                </Typography>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" color="textSecondary">
                  No response data available
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
                onClick={() => router.push('/emails')}
              >
                View All
              </Button>
            </Box>
            {recentEmails && recentEmails.length > 0 ? (
              <List>
                {recentEmails.map((email) => (
                  <ListItem 
                    key={email.id} 
                    divider
                    sx={{ cursor: 'pointer' }}
                    onClick={() => router.push(`/emails/${email.id}`)}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1" component="span">
                            {email.subject || 'No Subject'}
                          </Typography>
                          <Chip
                            label={email.priority || 'normal'}
                            size="small"
                            sx={{
                              backgroundColor: getPriorityColor(email.priority),
                              color: 'white',
                              fontSize: '0.7rem'
                            }}
                          />
                          <Chip
                            label={email.sentiment || 'neutral'}
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
                            From: {email.sender_email || 'Unknown'}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {email.received_at ? formatRelativeTime(email.received_at) : 'Unknown time'} • {email.processed ? 'Processed' : 'Pending'}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" color="textSecondary">
                  No recent emails available
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
