'use client';

import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Email as EmailIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useRouter, usePathname } from 'next/navigation';
import { emailAPI } from '../services/api';
import toast from 'react-hot-toast';

const Navbar = () => {
  const router = useRouter();
  const pathname = usePathname();

  const handleFetchEmails = async () => {
    try {
      toast.loading('Fetching new emails...', { id: 'fetch-emails' });
      await emailAPI.fetchNewEmails();
      toast.success('Email fetch started in background', { id: 'fetch-emails' });
      
      // Refresh current page data after a delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      toast.error('Failed to fetch emails', { id: 'fetch-emails' });
      console.error('Error fetching emails:', error);
    }
  };

  return (
    <AppBar position="static" className="navbar-container" elevation={0}>
      <Toolbar sx={{ padding: '0 24px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
          <img 
            src="/logo.png" 
            alt="Logo" 
            style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '8px',
              marginRight: '12px'
            }} 
          />
        </Box>
        {/* <Typography 
          variant="h5" 
          component="div" 
          sx={{ 
            flexGrow: 1,
            fontWeight: 'bold',
            fontSize: '1.5rem',
            textShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          🤖 Inbox Jinie
        </Typography> */}
        <div className="animated-title" style={{
          flexGrow: 1,
          fontSize: '1.5rem',
          fontWeight: 'bold',
          textShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          🤖 Inbox Jinie
        </div>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            color="inherit"
            startIcon={<DashboardIcon />}
            onClick={() => router.push('/dashboard')}
            variant={pathname === '/dashboard' ? 'outlined' : 'text'}
            sx={{
              borderRadius: '20px',
              padding: '8px 20px',
              fontWeight: '600',
              textTransform: 'none',
              fontSize: '1rem',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.1)',
                transform: 'translateY(-2px)'
              },
              ...(pathname === '/dashboard' && {
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              })
            }}
          >
            Dashboard
          </Button>
          
          <Button
            color="inherit"
            startIcon={<EmailIcon />}
            onClick={() => router.push('/emails')}
            variant={pathname === '/emails' ? 'outlined' : 'text'}
            sx={{
              borderRadius: '20px',
              padding: '8px 20px',
              fontWeight: '600',
              textTransform: 'none',
              fontSize: '1rem',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.1)',
                transform: 'translateY(-2px)'
              },
              ...(pathname === '/emails' && {
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              })
            }}
          >
            Emails
          </Button>
          
          <IconButton
            color="inherit"
            onClick={handleFetchEmails}
            title="Fetch new emails"
            className="floating-icon"
            sx={{
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '50%',
              padding: '12px',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.2)',
                transform: 'translateY(-2px) rotate(180deg)',
                boxShadow: '0 5px 15px rgba(0,0,0,0.2)'
              }
            }}
          >
            <RefreshIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
