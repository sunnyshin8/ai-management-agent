'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  Card,
  CardContent,
  // CircularProgress,
  // Pagination,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Email as EmailIcon,
  // Send as SendIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
} from '@mui/icons-material';
import { emailAPI, getSentimentColor, getPriorityColor, formatDateTime } from '../../services/api';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const EmailList = () => {
  const router = useRouter();
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    priority_filter: '',
    sentiment_filter: '',
    processed_filter: '',
    search: '',
  });
  const [pagination, setPagination] = useState({
    page: 0,
    pageSize: 25,
    total: 0,
  });

  useEffect(() => {
    loadEmails();
  }, [filters, pagination.page, pagination.pageSize]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadEmails = async () => {
    try {
      setLoading(true);
      const params = {
        skip: pagination.page * pagination.pageSize,
        limit: pagination.pageSize,
        ...filters,
      };
      
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '') {
          delete params[key];
        }
      });

      const response = await emailAPI.getEmails(params);
      setEmails(response.data);
    } catch (error) {
      toast.error('Failed to load emails');
      console.error('Error loading emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
    }));
    setPagination(prev => ({ ...prev, page: 0 })); // Reset to first page
  };

  const handleMarkProcessed = async (emailId) => {
    try {
      await emailAPI.markProcessed(emailId);
      toast.success('Email marked as processed');
      loadEmails();
    } catch (error) {
      toast.error('Failed to mark email as processed');
      console.error('Error marking processed:', error);
    }
  };

  const handleGenerateResponse = async (emailId) => {
    try {
      toast.loading('Generating AI response...', { id: 'generate-response' });
      await emailAPI.generateResponse(emailId);
      toast.success('AI response generated', { id: 'generate-response' });
      loadEmails();
    } catch (error) {
      toast.error('Failed to generate response', { id: 'generate-response' });
      console.error('Error generating response:', error);
    }
  };

  const columns = [
    {
      field: 'priority',
      headerName: 'Priority',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          sx={{
            backgroundColor: getPriorityColor(params.value),
            color: 'white',
            fontSize: '0.7rem',
            fontWeight: 'bold',
          }}
        />
      ),
    },
    {
      field: 'sentiment',
      headerName: 'Sentiment',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          sx={{
            backgroundColor: getSentimentColor(params.value),
            color: 'white',
            fontSize: '0.7rem',
          }}
        />
      ),
    },
    {
      field: 'sender_email',
      headerName: 'From',
      width: 200,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'subject',
      headerName: 'Subject',
      width: 300,
      renderCell: (params) => (
        <Typography 
          variant="body2" 
          sx={{ 
            cursor: 'pointer',
            '&:hover': { textDecoration: 'underline' }
          }}
          onClick={() => router.push(`/emails/${params.row.id}`)}
        >
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'category',
      headerName: 'Category',
      width: 150,
      renderCell: (params) => (
        <Chip
          label={params.value?.replace('_', ' ') || 'General'}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: 'received_at',
      headerName: 'Received',
      width: 150,
      renderCell: (params) => (
        <Typography variant="caption">
          {formatDateTime(params.value)}
        </Typography>
      ),
    },
    {
      field: 'processed',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {params.value ? (
            <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 20 }} />
          ) : (
            <PendingIcon sx={{ color: '#ff9800', fontSize: 20 }} />
          )}
        </Box>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => router.push(`/emails/${params.row.id}`)}
          >
            View
          </Button>
          {!params.row.ai_response && (
            <Button
              size="small"
              variant="contained"
              onClick={() => handleGenerateResponse(params.row.id)}
            >
              Generate
            </Button>
          )}
          {!params.row.processed && (
            <Button
              size="small"
              color="success"
              onClick={() => handleMarkProcessed(params.row.id)}
            >
              ✓
            </Button>
          )}
        </Box>
      ),
    },
  ];

  const filteredEmails = emails.filter(email => {
    const searchLower = filters.search.toLowerCase();
    return (
      email.subject.toLowerCase().includes(searchLower) ||
      email.sender_email.toLowerCase().includes(searchLower) ||
      email.body.toLowerCase().includes(searchLower)
    );
  });

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }} className="email-management-container">
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        background: 'rgba(255, 255, 255, 0.1)',
        padding: 3,
        borderRadius: 3,
        backdropFilter: 'blur(10px)'
      }}>
        <Typography 
          variant="h3" 
          className="animated-title"
          sx={{ fontWeight: 'bold' }}
        >
          📧 Email Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<EmailIcon className="floating-icon" />}
          onClick={() => emailAPI.fetchNewEmails().then(() => {
            toast.success('Fetching new emails...');
            setTimeout(loadEmails, 2000);
          })}
          sx={{
            borderRadius: '20px',
            padding: '12px 24px',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            textTransform: 'none',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
              transform: 'translateY(-3px)',
              boxShadow: '0 10px 25px rgba(102, 126, 234, 0.4)'
            }
          }}
        >
          Fetch New Emails
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Priority</InputLabel>
                <Select
                  value={filters.priority_filter}
                  onChange={(e) => handleFilterChange('priority_filter', e.target.value)}
                  label="Priority"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                  <MenuItem value="not_urgent">Not Urgent</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Sentiment</InputLabel>
                <Select
                  value={filters.sentiment_filter}
                  onChange={(e) => handleFilterChange('sentiment_filter', e.target.value)}
                  label="Sentiment"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="positive">Positive</MenuItem>
                  <MenuItem value="negative">Negative</MenuItem>
                  <MenuItem value="neutral">Neutral</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.processed_filter}
                  onChange={(e) => handleFilterChange('processed_filter', e.target.value)}
                  label="Status"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="true">Processed</MenuItem>
                  <MenuItem value="false">Pending</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                size="small"
                label="Search"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Search emails..."
              />
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setFilters({
                    priority_filter: '',
                    sentiment_filter: '',
                    processed_filter: '',
                    search: '',
                  });
                }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Email List */}
      <Card className="email-list-container">
        <Box sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={filteredEmails}
            columns={columns}
            pageSize={pagination.pageSize}
            rowsPerPageOptions={[10, 25, 50]}
            onPageSizeChange={(newPageSize) => 
              setPagination(prev => ({ ...prev, pageSize: newPageSize, page: 0 }))
            }
            loading={loading}
            disableSelectionOnClick
            getRowClassName={(params) => 
              params.row.priority === 'urgent' ? 'urgent-row' : ''
            }
            sx={{
              '& .urgent-row': {
                backgroundColor: '#ffebee',
                '&:hover': {
                  backgroundColor: '#ffcdd2 !important',
                },
              },
              '& .MuiDataGrid-cell:focus': {
                outline: 'none',
              },
            }}
          />
        </Box>
      </Card>
    </Container>
  );
};

export default EmailList;
