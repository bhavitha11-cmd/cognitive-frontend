import React from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip } from '@mui/material';
import { useGetSyncHistory } from '../../services/syncService';
import { SyncProgressCard } from '../../components/SyncProgressCard';

export const SyncHistoryPage: React.FC = () => {
  const { data: history, isLoading } = useGetSyncHistory();

  const runningSyncs = history?.filter(h => h.status === 'RUNNING') || [];

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>Sync History</Typography>
      
      {runningSyncs.length > 0 && (
        <Box sx={{ mb: 3 }}>
          {runningSyncs.map(sync => (
            <Box key={sync.id} sx={{ mb: 2 }}>
              <SyncProgressCard syncHistory={sync} />
            </Box>
          ))}
        </Box>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Device</TableCell>
              <TableCell>Sync Type</TableCell>
              <TableCell>Started At</TableCell>
              <TableCell>Records (Read/Saved)</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} align="center">Loading...</TableCell></TableRow>
            ) : history?.map(h => (
              <TableRow key={h.id}>
                <TableCell>{h.device_name || h.device_id}</TableCell>
                <TableCell>{h.sync_type}</TableCell>
                <TableCell>{new Date(h.started_at).toLocaleString()}</TableCell>
                <TableCell>{h.records_read} / {h.records_saved}</TableCell>
                <TableCell><Chip label={h.status} size="small" color={h.status === 'SUCCESS' ? 'success' : h.status === 'FAILED' ? 'error' : 'default'} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default SyncHistoryPage;

