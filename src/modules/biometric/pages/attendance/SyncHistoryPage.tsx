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

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: 'action.hover' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Device</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Sync Type</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Started At</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Read from Device</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>New Saved</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Already Saved (Duplicates)</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                  Loading history...
                </TableCell>
              </TableRow>
            ) : history?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                  No sync history entries found.
                </TableCell>
              </TableRow>
            ) : (
              history?.map((h) => (
                <TableRow key={h.id} hover>
                  <TableCell>{h.device_name || h.device_id}</TableCell>
                  <TableCell>
                    <Chip label={h.sync_type} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{new Date(h.started_at).toLocaleString()}</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'primary.main' }}>
                    {h.records_read.toLocaleString()} records
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: h.records_saved > 0 ? 'success.main' : 'text.secondary' }}>
                    {h.records_saved.toLocaleString()} new
                  </TableCell>
                  <TableCell color="text.secondary">
                    {h.duplicates_found ? h.duplicates_found.toLocaleString() : (h.records_read - h.records_saved).toLocaleString()} (Already in DB)
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={h.status}
                      size="small"
                      color={
                        h.status === 'SUCCESS'
                          ? 'success'
                          : h.status === 'FAILED'
                          ? 'error'
                          : h.status === 'CANCELLED'
                          ? 'warning'
                          : 'info'
                      }
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default SyncHistoryPage;

