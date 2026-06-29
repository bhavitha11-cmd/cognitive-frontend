import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Card, CardContent, Typography, Button } from '@mui/material';
import { ErrorOutlineOutlined as ErrorOutlineIcon } from '@mui/icons-material';

interface Props {
  children: ReactNode;
  title?: string;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
}

export class WidgetErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Widget error caught by boundary:", error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <Card sx={{ height: '100%', minHeight: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, border: '1px solid', borderColor: 'error.light' }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <ErrorOutlineIcon color="error" sx={{ fontSize: 36, mb: 1 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              {this.props.title || "Widget Load Failed"}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
              Unable to load widget data.
            </Typography>
            <Button size="small" variant="outlined" color="error" onClick={this.handleRetry}>
              Retry Load
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default WidgetErrorBoundary;
