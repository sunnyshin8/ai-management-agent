'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Send as SendIcon,
  AutoAwesome as AutoAwesomeIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { emailAPI, getSentimentColor, getPriorityColor, formatDateTime } from '../../../services/api';
import toast from 'react-hot-toast';

const EmailDetail = () => {
  const { id } = useParams();
  const router = useRouter();
  const [email, setEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingResponse, setGeneratingResponse] = useState(false);
  const [sendingResponse, setSendingResponse] = useState(false);
  const [responseDialog, setResponseDialog] = useState(false);
  const [editedResponse, setEditedResponse] = useState('');

  useEffect(() => {
    loadEmail();
  }, [id]);

  const loadEmail = async () => {
    try {
      setLoading(true);
      const response = await emailAPI.getEmail(id);
      setEmail(response.data);
      setEditedResponse(response.data.ai_response || '');
    } catch (error) {
      toast.error('Failed to load email details');
      console.error('Error loading email:', error);
      router.push('/emails');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateResponse = async () => {
    try {
      setGeneratingResponse(true);
      await emailAPI.generateResponse(email.id);
      toast.success('AI response generated successfully');
      loadEmail();
    } catch (error) {
      toast.error('Failed to generate response');
      console.error('Error generating response:', error);
    } finally {
      setGeneratingResponse(false);
    }
  };

  const handleSendResponse = async (customResponse = null) => {
    try {
      setSendingResponse(true);
      await emailAPI.sendResponse(email.id, customResponse);
      toast.success('Response sent successfully');
      setResponseDialog(false);
      loadEmail();
    } catch (error) {
      toast.error('Failed to send response');
      console.error('Error sending response:', error);
    } finally {
      setSendingResponse(false);
    }
  };

  const handleMarkProcessed = async () => {
    try {
      await emailAPI.markProcessed(email.id);
      toast.success('Email marked as processed');
      loadEmail();
    } catch (error) {
      toast.error('Failed to mark email as processed');
      console.error('Error marking processed:', error);
    }
  };

  const parseJsonField = (field) => {
    try {
      return field ? JSON.parse(field) : [];
    } catch {
      return [];
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

  if (!email) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h6">Email not found</Typography>
      </Container>
    );
  }

  const contactDetails = parseJsonField(email.contact_details);
  const requirements = parseJsonField(email.requirements);
  const sentimentIndicators = parseJsonField(email.sentiment_indicators);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/emails')}
          sx={{ mr: 2 }}
        >
          Back to Emails
        </Button>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          Email Details
        </Typography>
        {!email.processed && (
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckCircleIcon />}
            onClick={handleMarkProcessed}
          >
            Mark as Processed
          </Button>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Email Information */}
        <Grid item xs={12} md={8}>
          <Card className="email-detail-container">
            {/* Email Header */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Chip
                  label={email.priority}
                  sx={{
                    backgroundColor: getPriorityColor(email.priority),
                    color: 'white',
                    fontWeight: 'bold',
                  }}
                />
                <Chip
                  label={email.sentiment}
                  sx={{
                    backgroundColor: getSentimentColor(email.sentiment),
                    color: 'white',
                  }}
                />
                <Chip
                  label={email.category?.replace('_', ' ') || 'General'}
                  variant="outlined"
                />
                {email.processed && (
                  <Chip label="Processed" color="success" />
                )}
              </Box>

              <Typography variant="h5" gutterBottom>
                {email.subject}
              </Typography>
              
              <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                From: <strong>{email.sender_email}</strong>
              </Typography>
              
              <Typography variant="caption" color="textSecondary">
                Received: {formatDateTime(email.received_at)}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Email Body */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Email Content
              </Typography>
              <Box className="email-body">
                {email.body}
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* AI Response Section */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  AI Generated Response
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {!email.ai_response && (
                    <Button
                      variant="contained"
                      startIcon={<AutoAwesomeIcon />}
                      onClick={handleGenerateResponse}
                      disabled={generatingResponse}
                    >
                      {generatingResponse ? 'Generating...' : 'Generate Response'}
                    </Button>
                  )}
                  {email.ai_response && !email.response_sent && (
                    <>
                      <Button
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={() => setResponseDialog(true)}
                      >
                        Edit & Send
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={<SendIcon />}
                        onClick={() => handleSendResponse()}
                        disabled={sendingResponse}
                      >
                        {sendingResponse ? 'Sending...' : 'Send Response'}
                      </Button>
                    </>
                  )}
                  {email.response_sent && (
                    <Chip label="Response Sent" color="success" />
                  )}
                </Box>
              </Box>

              {email.ai_response ? (
                <Box className="email-body" sx={{ backgroundColor: '#e3f2fd' }}>
                  {email.ai_response}
                </Box>
              ) : (
                <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic' }}>
                  No AI response generated yet. Click "Generate Response" to create one.
                </Typography>
              )}

              {email.response_sent_at && (
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                  Response sent: {formatDateTime(email.response_sent_at)}
                </Typography>
              )}
            </Box>
          </Card>
        </Grid>

        {/* Analysis Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Sentiment Analysis */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Sentiment Analysis
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="body2">Score:</Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 'bold',
                    color: getSentimentColor(email.sentiment)
                  }}
                >
                  {(email.sentiment_score * 100).toFixed(1)}%
                </Typography>
              </Box>
              {sentimentIndicators.length > 0 && (
                <Box>
                  <Typography variant="body2" gutterBottom>
                    Indicators:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {sentimentIndicators.slice(0, 5).map((indicator, index) => (
                      <Chip
                        key={index}
                        label={indicator}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Contact Details */}
          {contactDetails && Object.keys(contactDetails).length > 0 && (
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Contact Details
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Primary Email:</strong> {contactDetails.primary_email}
                </Typography>
                {contactDetails.phone_numbers?.length > 0 && (
                  <Typography variant="body2" gutterBottom>
                    <strong>Phone:</strong> {contactDetails.phone_numbers.join(', ')}
                  </Typography>
                )}
                {contactDetails.alternate_emails?.length > 0 && (
                  <Typography variant="body2">
                    <strong>Alt Emails:</strong> {contactDetails.alternate_emails.join(', ')}
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}

          {/* Requirements */}
          {requirements.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Customer Requirements
                </Typography>
                <List dense>
                  {requirements.map((requirement, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemText
                        primary={requirement}
                        primaryTypographyProps={{
                          variant: 'body2',
                          sx: { fontSize: '0.9rem' }
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Edit Response Dialog */}
      <Dialog
        open={responseDialog}
        onClose={() => setResponseDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit AI Response</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={12}
            value={editedResponse}
            onChange={(e) => setEditedResponse(e.target.value)}
            placeholder="Edit the AI response before sending..."
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResponseDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => handleSendResponse(editedResponse)}
            disabled={sendingResponse || !editedResponse.trim()}
          >
            {sendingResponse ? 'Sending...' : 'Send Response'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EmailDetail;
