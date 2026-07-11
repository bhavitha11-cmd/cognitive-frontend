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
  TableHead,
  TableRow,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import { useGetPart, useGetPartStats } from '../services/projectService';

const statusColor: Record<string, 'default' | 'info' | 'warning' | 'success' | 'error'> = {
  'Yet To Start': 'default',
  'In Progress': 'info',
  'On Hold': 'warning',
  'Completed': 'success',
  'Cancelled': 'error',
};

const priorityColor: Record<string, 'default' | 'info' | 'warning' | 'error' | 'success'> = {
  LOW: 'default',
  MEDIUM: 'info',
  HIGH: 'warning',
  CRITICAL: 'error',
};

const PartDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: part, isLoading, isError } = useGetPart(id ?? '');
  const { data: stats, isLoading: statsLoading } = useGetPartStats(id ?? '');

  if (isLoading || statsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !part) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Failed to load part details. Please try again.</Alert>
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
          onClick={() => {
            if (part.parentProjectId) {
              navigate(`/projects/${part.parentProjectId}`);
            } else {
              navigate('/projects');
            }
          }}
          variant="outlined"
          size="small"
        >
          Back to Project
        </Button>
        <Button
          variant="outlined"
          startIcon={<BarChartOutlinedIcon />}
          onClick={() => navigate(`/planning/projects/${id}/timeline`)}
          size="small"
        >
          Gantt Timeline
        </Button>
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 3 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {part.partName}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Part Number: {part.partNumber} | Package: {part.name}
            </Typography>
          </Box>

          {/* Department-wise Hours Breakdown (Horizontal Widgets Row) */}
          {stats?.department_stats && stats.department_stats.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, pl: 3, borderLeft: '1px solid', borderColor: 'divider' }}>
              {stats.department_stats.map((dept: any) => (
                <Box
                  key={dept.department_category}
                  sx={{
                    bgcolor: 'grey.50',
                    border: '1px solid',
                    borderColor: 'grey.200',
                    borderRadius: '6px',
                    px: 1.5,
                    py: 0.5,
                    display: 'flex',
                    flexDirection: 'column',
                    minWidth: 90,
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main', textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: 0.5 }}>
                    {dept.department_category}
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.72rem', mt: 0.25 }}>
                    {dept.planned_hours}h <span style={{ fontWeight: 400 }}>plan</span>
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.72rem' }}>
                    {dept.actual_hours}h <span style={{ fontWeight: 400 }}>actual</span>
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>
        <Chip
          label={part.status}
          color={statusColor[part.status] ?? 'default'}
          size="small"
          sx={{ fontWeight: 600 }}
        />
        <Chip
          label={part.priority}
          color={priorityColor[part.priority] ?? 'default'}
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
            {part.clientName ?? part.clientId}
          </Typography>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            Project Manager
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {part.projectManagerName ?? '—'}
          </Typography>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            Part Name
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {part.partName || '—'}
          </Typography>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            Department
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {part.departmentName ?? '—'} {part.departmentCode ? `(${part.departmentCode})` : ''}
          </Typography>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            Billable
          </Typography>
          <Chip
            label={part.isBillable ? 'Yes' : 'No'}
            color={part.isBillable ? 'success' : 'default'}
            size="small"
          />
        </Paper>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            Planned Dates
          </Typography>
          <Typography variant="body1">
            {part.plannedStartDate ?? '—'} &rarr; {part.plannedEndDate ?? '—'}
          </Typography>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            Actual Dates
          </Typography>
          <Typography variant="body1">
            {part.actualStartDate ?? '—'} &rarr; {part.actualEndDate ?? '—'}
          </Typography>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            Hours
          </Typography>
          <Typography variant="body1">
            <strong>{part.actualHours}h</strong> actual / {part.estimatedHours}h estimated
          </Typography>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            Tasks
          </Typography>
          <Typography variant="body1">
            <strong>{part.completedTaskCount}</strong> / {part.taskCount} completed
          </Typography>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            Invoice Status
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {part.invoiceStatus}
          </Typography>
        </Paper>
      </Box>

      {/* Teams Involved Summary */}
      <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
          Teams Involved ({stats?.total_teams_involved ?? 0})
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
          {stats?.teams_involved && stats.teams_involved.length > 0 ? (
            stats.teams_involved.map((t: string) => (
              <Chip key={t} label={t} size="small" color="primary" variant="outlined" />
            ))
          ) : (
            <Typography variant="body2" color="textSecondary">No teams involved yet.</Typography>
          )}
        </Box>
      </Paper>

      {/* Description */}
      {part.description && (
        <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            Description
          </Typography>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
            {part.description}
          </Typography>
        </Paper>
      )}

      {/* Team Effort Breakdown Table */}
      {stats?.team_stats && stats.team_stats.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
            Team Effort Breakdown
          </Typography>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Team Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Tasks</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Planned (hrs)</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Actual (hrs)</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Completed (hrs)</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Remaining (hrs)</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Completion %</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stats.team_stats.map((row: any) => (
                  <TableRow key={row.team_name} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell component="th" scope="row" sx={{ fontWeight: 500 }}>
                      {row.team_name}
                    </TableCell>
                    <TableCell align="right">{row.task_count}</TableCell>
                    <TableCell align="right">{row.planned_hours}</TableCell>
                    <TableCell align="right">{row.actual_hours}</TableCell>
                    <TableCell align="right">{row.completed_hours}</TableCell>
                    <TableCell align="right">{row.remaining_hours}</TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {row.completion_pct}%
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default PartDetailPage;
