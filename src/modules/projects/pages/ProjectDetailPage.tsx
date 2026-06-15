import React from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  Box,
  Typography,
  Button,
  Chip,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import { useGetProject } from '../services/projectService';

const statusColor: Record<string, 'default' | 'info' | 'warning' | 'success' | 'error'> = {
  DRAFT: 'default',
  ACTIVE: 'info',
  ON_HOLD: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'error',
};

const priorityColor: Record<string, 'default' | 'info' | 'warning' | 'error' | 'success'> = {
  LOW: 'default',
  MEDIUM: 'info',
  HIGH: 'warning',
  CRITICAL: 'error',
};

const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: project, isLoading, isError } = useGetProject(id ?? '');

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !project) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Failed to load project details. Please try again.</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/projects')} sx={{ mt: 2 }}>
          Back to Projects
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/projects')}
          variant="outlined"
          size="small"
        >
          Back
        </Button>
        <Button
          variant="outlined"
          startIcon={<BarChartOutlinedIcon />}
          onClick={() => navigate(`/planning/projects/${id}/timeline`)}
          size="small"
        >
          Gantt Timeline
        </Button>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {project.name}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {project.projectCode}
          </Typography>
        </Box>
        <Chip
          label={project.status}
          color={statusColor[project.status] ?? 'default'}
          size="small"
          sx={{ fontWeight: 600 }}
        />
        <Chip
          label={project.priority}
          color={priorityColor[project.priority] ?? 'default'}
          size="small"
          variant="outlined"
        />
      </Box>

      {/* Details Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            Client
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {project.clientName ?? project.clientId}
          </Typography>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            Project Manager
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {project.projectManagerName ?? '—'}
          </Typography>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            Billing Type
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {project.billingType}
          </Typography>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            Billable
          </Typography>
          <Chip
            label={project.isBillable ? 'Yes' : 'No'}
            color={project.isBillable ? 'success' : 'default'}
            size="small"
          />
        </Paper>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            Planned Dates
          </Typography>
          <Typography variant="body1">
            {project.plannedStartDate ?? '—'} &rarr; {project.plannedEndDate ?? '—'}
          </Typography>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            Hours
          </Typography>
          <Typography variant="body1">
            <strong>{project.actualHours}h</strong> actual / {project.estimatedHours}h estimated
          </Typography>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            Tasks
          </Typography>
          <Typography variant="body1">
            <strong>{project.completedTaskCount}</strong> / {project.taskCount} completed
          </Typography>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            Invoice Status
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {project.invoiceStatus}
          </Typography>
        </Paper>
      </Box>

      {/* Description */}
      {project.description && (
        <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            Description
          </Typography>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
            {project.description}
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default ProjectDetailPage;
