import React from 'react';
import { Card, CardContent, Typography, Box, List, ListItem, ListItemText, CircularProgress, Divider } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import type { ConnectionTestResult as TestResultType } from '../types/deviceHealth';

interface ConnectionTestResultProps {
  result: TestResultType | null;
  isLoading: boolean;
}

export const ConnectionTestResult: React.FC<ConnectionTestResultProps> = ({ result, isLoading }) => {
  if (isLoading) {
    return (
      <Card variant="outlined" sx={{ mt: 2, display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Card>
    );
  }

  if (!result) return null;

  const isSuccess = result.status === 'connected';

  return (
    <Card variant="outlined" sx={{ mt: 2, borderColor: isSuccess ? 'success.main' : 'error.main' }}>
      <Box sx={{ bgcolor: isSuccess ? 'success.light' : 'error.light', color: isSuccess ? 'success.contrastText' : 'error.contrastText', p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        {isSuccess ? <CheckCircleIcon /> : <ErrorIcon />}
        <Typography variant="h6">{isSuccess ? 'Connection Successful' : 'Connection Failed'}</Typography>
      </Box>
      <CardContent>
        {isSuccess ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Device Model</Typography>
              <Typography variant="body1">{result.device_model || 'N/A'}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Firmware Version</Typography>
              <Typography variant="body1">{result.firmware_version || 'N/A'}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Device Time</Typography>
              <Typography variant="body1">{result.device_time || 'N/A'}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Registered Users</Typography>
              <Typography variant="body1">{result.registered_users ?? 'N/A'}</Typography>
            </Box>
          </Box>
        ) : (
          <Box>
            <Typography variant="body1" color="error" gutterBottom>
              {result.message}
            </Typography>
            {result.error_code && (
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }} gutterBottom>
                Error Code: {result.error_code}
              </Typography>
            )}
            
            {result.suggestions && result.suggestions.length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LightbulbIcon fontSize="small" color="warning" /> Suggestions
                </Typography>
                <List dense>
                  {result.suggestions.map((sug, idx) => (
                    <ListItem key={idx}>
                      <ListItemText primary={sug} />
                    </ListItem>
                  ))}
                </List>
              </>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
