'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Box, Typography, CircularProgress, Button } from '@mui/material';

export default function Home() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const handleSkip = () => {
    router.push('/dashboard');
  };

  return (
    <Container maxWidth="sm" sx={{ 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center' 
    }}>
      <Box sx={{ 
        textAlign: 'center',
        background: 'rgba(255, 255, 255, 0.1)',
        padding: 4,
        borderRadius: 3,
        backdropFilter: 'blur(10px)',
        minWidth: 400
      }}>
        <Typography 
          variant="h3" 
          className="animated-title"
          sx={{ 
            fontWeight: 'bold',
            mb: 2
          }}
        >
          🤖 AI Communication Assistant
        </Typography>
        
        <Typography 
          variant="h6" 
          color="white"
          sx={{ 
            mb: 4,
            opacity: 0.9
          }}
        >
          Redirecting to dashboard in {countdown} seconds...
        </Typography>

        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          gap: 3,
          mb: 3
        }}>
          <CircularProgress 
            variant="determinate" 
            value={(3 - countdown) * 33.33} 
            size={60}
            sx={{ color: 'white' }}
          />
          <Typography 
            variant="h2" 
            sx={{ 
              color: 'white',
              fontWeight: 'bold',
              minWidth: 60,
              textAlign: 'center'
            }}
          >
            {countdown}
          </Typography>
        </Box>

        <Button 
          variant="outlined" 
          onClick={handleSkip}
          sx={{ 
            color: 'white', 
            borderColor: 'rgba(255, 255, 255, 0.5)',
            '&:hover': {
              borderColor: 'white',
              background: 'rgba(255, 255, 255, 0.1)'
            }
          }}
        >
          Skip to Dashboard
        </Button>
      </Box>
    </Container>
  );
}
