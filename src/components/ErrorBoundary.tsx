import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            bgcolor: '#f4f6fa',
            p: 3,
          }}
        >
          <Paper
            elevation={2}
            sx={{
              p: 4,
              maxWidth: 500,
              textAlign: 'center',
              borderRadius: 2,
              border: '1px solid #e2e8f0',
            }}
          >
            <WarningAmberIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
              Something went wrong.
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              {this.state.error?.message || 'An unexpected runtime error occurred.'}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={this.handleReload}
              sx={{ px: 4 }}
            >
              Reload Page
            </Button>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}
