import React, { useState } from 'react';
import {
  Box, Button, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination, Chip, TextField, CircularProgress
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

import { useGetAuditLogs } from '../services/hrService';

export const AuditLogPage: React.FC = () => {
  const [entityType, setEntityType] = useState('');
  const [entityId, setEntityId] = useState('');
  const [action, setAction] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const auditMut = useGetAuditLogs();

  const handleSearch = () => {
    setPage(0);
    auditMut.mutate({
      entity_type: entityType || undefined,
      entity_id: entityId || undefined,
      action: action || undefined,
      page: 1,
      size: rowsPerPage,
    });
  };

  const logs = auditMut.data?.logs || [];
  const totalCount = auditMut.data?.total || 0;

  const getActionColor = (act: string) => {
    const a = act.toLowerCase();
    if (a.includes('create')) return 'success';
    if (a.includes('update') || a.includes('transfer')) return 'info';
    if (a.includes('delete') || a.includes('deactivate') || a.includes('terminate')) return 'error';
    if (a.includes('offboard')) return 'warning';
    return 'default';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Audit Logs
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleSearch}
          size="small"
        >
          Refresh
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            label="Entity Type"
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            size="small"
            sx={{ minWidth: 160 }}
          />
          <TextField
            label="Entity ID"
            value={entityId}
            onChange={(e) => setEntityId(e.target.value)}
            size="small"
            sx={{ minWidth: 160 }}
          />
          <TextField
            label="Action"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            size="small"
            sx={{ minWidth: 160 }}
          />
          <Button variant="contained" onClick={handleSearch} size="small" sx={{ alignSelf: 'flex-end' }}>
            Search
          </Button>
        </CardContent>
      </Card>

      <Card>
        {auditMut.isPending ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Timestamp</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Entity Type</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Entity ID</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>User</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>IP Address</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Details</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography color="textSecondary" sx={{ py: 4 }}>
                          No audit logs found. Use the search filters above.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log: any, index: number) => (
                      <TableRow key={log.id || index} hover>
                        <TableCell sx={{ fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                          {log.timestamp ? new Date(log.timestamp).toLocaleString() : '-'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={log.action}
                            size="small"
                            color={getActionColor(log.action)}
                            sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.8125rem' }}>{log.entity_type || '-'}</TableCell>
                        <TableCell sx={{ fontSize: '0.8125rem' }}>{log.entity_id || '-'}</TableCell>
                        <TableCell sx={{ fontSize: '0.8125rem' }}>{log.performed_by || '-'}</TableCell>
                        <TableCell sx={{ fontSize: '0.8125rem' }}>{log.ip_address || '-'}</TableCell>
                        <TableCell>
                          <Typography
                            variant="caption"
                            color="textSecondary"
                            sx={{
                              maxWidth: 200,
                              display: 'block',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {log.details ? JSON.stringify(log.details) : '-'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={totalCount}
              page={page}
              onPageChange={(_, newPage) => {
                setPage(newPage);
                auditMut.mutate({
                  entity_type: entityType || undefined,
                  entity_id: entityId || undefined,
                  action: action || undefined,
                  page: newPage + 1,
                  size: rowsPerPage,
                });
              }}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                const newSize = parseInt(e.target.value, 10);
                setRowsPerPage(newSize);
                setPage(0);
                auditMut.mutate({
                  entity_type: entityType || undefined,
                  entity_id: entityId || undefined,
                  action: action || undefined,
                  page: 1,
                  size: newSize,
                });
              }}
              rowsPerPageOptions={[10, 25, 50]}
            />
          </>
        )}
      </Card>
    </Box>
  );
};

export default AuditLogPage;
