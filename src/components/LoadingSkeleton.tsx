import { Box, Skeleton, Card, CardContent, Grid } from '@mui/material';

export const TableSkeleton = ({ rows = 5 }) => (
  <Box sx={{ width: '100%', p: 2 }}>
    <Skeleton variant="rectangular" height={50} sx={{ mb: 2, borderRadius: 1 }} />
    {Array.from({ length: rows }).map((_, idx) => (
      <Skeleton key={idx} variant="rectangular" height={40} sx={{ mb: 1, borderRadius: 0.5 }} />
    ))}
  </Box>
);

export const CardSkeleton = () => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Skeleton variant="text" width="60%" height={24} sx={{ mb: 1 }} />
      <Skeleton variant="rectangular" height={36} width="40%" sx={{ mb: 2, borderRadius: 1 }} />
      <Skeleton variant="text" width="80%" height={16} />
    </CardContent>
  </Card>
);

export const DashboardSkeleton = () => (
  <Box sx={{ p: 3 }}>
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {Array.from({ length: 4 }).map((_, idx) => (
        <Grid size={{ xs: 12, sm: 6, md: 3 }} key={idx}>
          <CardSkeleton />
        </Grid>
      ))}
    </Grid>
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 8 }}>
        <Card sx={{ p: 2, mb: 3 }}>
          <Skeleton variant="text" width="30%" height={32} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={250} sx={{ borderRadius: 1 }} />
        </Card>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Card sx={{ p: 2 }}>
          <Skeleton variant="text" width="50%" height={32} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={250} sx={{ borderRadius: 1 }} />
        </Card>
      </Grid>
    </Grid>
  </Box>
);

export const FormSkeleton = () => (
  <Box sx={{ p: 3 }}>
    <Skeleton variant="text" width="40%" height={40} sx={{ mb: 4 }} />
    <Grid container spacing={3}>
      {Array.from({ length: 6 }).map((_, idx) => (
        <Grid size={{ xs: 12, sm: 6 }} key={idx}>
          <Skeleton variant="text" width="30%" height={20} sx={{ mb: 1 }} />
          <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 1 }} />
        </Grid>
      ))}
    </Grid>
    <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
      <Skeleton variant="rectangular" width={100} height={40} sx={{ borderRadius: 1 }} />
      <Skeleton variant="rectangular" width={100} height={40} sx={{ borderRadius: 1 }} />
    </Box>
  </Box>
);
