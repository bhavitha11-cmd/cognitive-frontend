import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Records Found',
  description = 'There are no items to display in this view at the moment.',
  actionText,
  onAction,
  icon = <InboxOutlinedIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.5 }} />,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        px: 3,
        textAlign: 'center',
      }}
    >
      <Box sx={{ mb: 2 }}>{icon}</Box>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3, maxWidth: 400 }}>
        {description}
      </Typography>
      {actionText && onAction && (
        <Button variant="contained" color="primary" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </Box>
  );
};
