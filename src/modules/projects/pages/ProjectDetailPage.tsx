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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LaunchIcon from '@mui/icons-material/Launch';
import { useGetProject } from '../services/projectService';

const statusColor: Record<string, 'default' | 'info' | 'warning' | 'success' | 'error'> = {
  'Yet To Start': 'default',
  'In Progress': 'info',
  'On Hold': 'warning',
  'Completed': 'success',
  'Cancelled': 'error',
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

  const parts = project.parts || [];

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
          Back to Projects
        </Button>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {project.name}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Project Overview (Read-Only Rollup Summary)
          </Typography>
        </Box>
        <Chip
          label={project.status}
          color={statusColor[project.status] ?? 'default'}
          size="small"
          sx={{ fontWeight: 600 }}
        />
      </Box>

      {/* Details Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2, mb: 4 }}>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            Client
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {project.clientName ?? '—'}
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
            Department
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {project.departmentName ?? '—'} {project.departmentCode ? `(${project.departmentCode})` : ''}
          </Typography>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            Total Parts
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 700 }}>
            {project.partCount}
          </Typography>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            Project Date Range
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {project.plannedStartDate ?? '—'} &rarr; {project.plannedEndDate ?? '—'}
          </Typography>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            Total Effort Hours
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            <strong>{project.actualHours}h</strong> actual / {project.estimatedHours}h planned
          </Typography>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2, gridColumn: { md: 'span 2' } }}>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            Overall Project Progress
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5 }}>
            <LinearProgress
              variant="determinate"
              value={project.progress}
              sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
              color={project.progress >= 100 ? 'success' : 'primary'}
            />
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {Math.round(project.progress)}%
            </Typography>
          </Box>
        </Paper>
      </Box>

      {/* Description */}
      {project.description && (
        <Paper variant="outlined" sx={{ p: 2, mb: 4 }}>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            Project Description
          </Typography>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
            {project.description}
          </Typography>
        </Paper>
      )}

      {/* Parts Table */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          Associated Parts ({parts.length})
        </Typography>

        {parts.length === 0 ? (
          <Alert severity="info">No parts defined for this project yet.</Alert>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Part Number</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Part Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Planned Start</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Planned End</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Planned Hours</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Actual Hours</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Progress</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {parts.map((part) => (
                  <TableRow key={part.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell sx={{ fontWeight: 700, fontFamily: 'monospace' }}>
                      {part.partNumber}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>
                      {part.partName}
                    </TableCell>
                    <TableCell>{part.plannedStartDate ?? '—'}</TableCell>
                    <TableCell>{part.plannedEndDate ?? '—'}</TableCell>
                    <TableCell align="right">{part.estimatedHours}h</TableCell>
                    <TableCell align="right">{part.actualHours}h</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 80 }}>
                        <LinearProgress
                          variant="determinate"
                          value={part.progress}
                          sx={{ width: 40, height: 6, borderRadius: 3 }}
                          color={part.progress >= 100 ? 'success' : 'primary'}
                        />
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                          {Math.round(part.progress)}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={part.status}
                        size="small"
                        color={statusColor[part.status] ?? 'default'}
                        sx={{ fontSize: '0.68rem', height: 20, fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<LaunchIcon />}
                        onClick={() => navigate(`/parts/${part.id}`)}
                        sx={{ py: 0.25, px: 1, textTransform: 'none', fontSize: '0.75rem' }}
                      >
                        View Tasks
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
};

export default ProjectDetailPage;
