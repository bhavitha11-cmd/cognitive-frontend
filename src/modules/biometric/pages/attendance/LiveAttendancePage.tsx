import React from 'react';
import { Box, Card, CardContent, Typography, Grid, Avatar, Chip, CircularProgress, IconButton } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useGetLiveAttendance } from '../../services/liveAttendanceService';

export const LiveAttendancePage: React.FC = () => {
  const { data: attendance, isLoading, refetch } = useGetLiveAttendance();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'IN': return 'success';
      case 'OUT': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Live Attendance</Typography>
        <IconButton onClick={() => refetch()}><RefreshIcon /></IconButton>
      </Box>

      {isLoading ? <CircularProgress /> : (
        <Grid container spacing={3}>
          {attendance?.map(record => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={record.employee_id}>
              <Card>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar>{record.employee_name.charAt(0)}</Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1">{record.employee_name}</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>{record.employee_code}</Typography>
                    <Typography variant="caption" sx={{ display: 'block' }}>{record.device_name || 'N/A'}</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Chip label={record.current_status} color={getStatusColor(record.current_status)} size="small" />
                    {record.last_punch_time && (
                      <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                        {new Date(record.last_punch_time).toLocaleTimeString()}
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default LiveAttendancePage;
