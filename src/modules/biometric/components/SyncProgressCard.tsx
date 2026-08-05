import React from 'react';
import { Card, CardContent, Typography, Chip, Stack, Box, CircularProgress } from '@mui/material';
import type { SyncHistory } from '../types/syncHistory';

interface SyncProgressCardProps {
  syncHistory: SyncHistory;
}

export const SyncProgressCard: React.FC<SyncProgressCardProps> = ({ syncHistory }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS': return 'success';
      case 'PARTIAL': return 'warning';
      case 'FAILED': return 'error';
      case 'RUNNING': return 'info';
      default: return 'default';
    }
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Sync Progress: {syncHistory.device_name || syncHistory.device_id}</Typography>
          {syncHistory.status === 'RUNNING' ? (
            <Chip icon={<CircularProgress size={16} />} label="RUNNING" color="info" size="small" />
          ) : (
            <Chip label={syncHistory.status} color={getStatusColor(syncHistory.status)} size="small" />
          )}
        </Stack>
        
        <Stack direction="row" spacing={3}>
          <Box>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>Records Read</Typography>
            <Typography variant="body1">{syncHistory.records_read}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>Records Saved</Typography>
            <Typography variant="body1">{syncHistory.records_saved}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>Duplicates</Typography>
            <Typography variant="body1">{syncHistory.duplicates_found}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>Duration</Typography>
            <Typography variant="body1">{syncHistory.duration_seconds ? `${syncHistory.duration_seconds}s` : '-'}</Typography>
          </Box>
        </Stack>
        {syncHistory.status === 'FAILED' && syncHistory.error_message && (
          <Typography color="error" variant="body2" sx={{ mt: 2 }}>
            Error: {syncHistory.error_message}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};
