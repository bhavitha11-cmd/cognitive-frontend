import React from 'react';
import { Box, Typography, Grid, Card, CardContent } from '@mui/material';
import { useGetAllHealth } from '../../services/deviceHealthService';
import { HealthGauge } from '../../components/HealthGauge';

export const DeviceHealthPage: React.FC = () => {
  const { data: healthData, isLoading } = useGetAllHealth();

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>Device Health</Typography>
      
      {isLoading ? <Typography>Loading...</Typography> : (
        <Grid container spacing={3}>
          {healthData?.map(health => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={health.id}>
              <Card>
                <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h6">{health.device_name || health.device_id}</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Last Sync: {health.last_successful_sync_at ? new Date(health.last_successful_sync_at).toLocaleString() : 'Never'}
                    </Typography>
                  </Box>
                  <HealthGauge health={health} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default DeviceHealthPage;

