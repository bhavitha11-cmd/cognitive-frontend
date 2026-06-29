import React from 'react';
import { Card, CardContent, Skeleton, Box } from '@mui/material';

export const CardSkeleton: React.FC = () => (
  <Card sx={{ height: '100%' }}>
    <CardContent sx={{ p: 2, textAlign: 'center' }}>
      <Skeleton variant="text" width="60%" height={20} sx={{ mx: 'auto', mb: 1 }} />
      <Skeleton variant="rectangular" width="80%" height={32} sx={{ mx: 'auto', borderRadius: 1 }} />
    </CardContent>
  </Card>
);

export const ChartSkeleton: React.FC = () => (
  <Card sx={{ p: 2, height: '100%', minHeight: 300, display: 'flex', flexDirection: 'column' }}>
    <Skeleton variant="text" width="40%" height={24} sx={{ mb: 2 }} />
    <Skeleton variant="rectangular" width="100%" height="80%" sx={{ flexGrow: 1, borderRadius: 1 }} />
  </Card>
);

export const TableSkeleton: React.FC = () => (
  <Card sx={{ p: 2, height: '100%', minHeight: 250 }}>
    <Skeleton variant="text" width="30%" height={24} sx={{ mb: 2 }} />
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Skeleton variant="rectangular" width="100%" height={30} sx={{ borderRadius: 0.5 }} />
      <Skeleton variant="rectangular" width="100%" height={25} sx={{ borderRadius: 0.5 }} />
      <Skeleton variant="rectangular" width="100%" height={25} sx={{ borderRadius: 0.5 }} />
      <Skeleton variant="rectangular" width="100%" height={25} sx={{ borderRadius: 0.5 }} />
      <Skeleton variant="rectangular" width="100%" height={25} sx={{ borderRadius: 0.5 }} />
    </Box>
  </Card>
);

export const ListSkeleton: React.FC = () => (
  <Card sx={{ p: 2, height: '100%', minHeight: 250 }}>
    <Skeleton variant="text" width="35%" height={24} sx={{ mb: 2 }} />
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Skeleton variant="circular" width={24} height={24} />
        <Skeleton variant="rectangular" width="80%" height={16} sx={{ borderRadius: 0.5 }} />
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Skeleton variant="circular" width={24} height={24} />
        <Skeleton variant="rectangular" width="70%" height={16} sx={{ borderRadius: 0.5 }} />
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Skeleton variant="circular" width={24} height={24} />
        <Skeleton variant="rectangular" width="75%" height={16} sx={{ borderRadius: 0.5 }} />
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Skeleton variant="circular" width={24} height={24} />
        <Skeleton variant="rectangular" width="60%" height={16} sx={{ borderRadius: 0.5 }} />
      </Box>
    </Box>
  </Card>
);
