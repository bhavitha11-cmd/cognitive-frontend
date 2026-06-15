import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Alert,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Stack,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useGetProject } from '../../projects/services/projectService';
import { useGetGanttData, useScheduleProject, useGetProjectDependencies, useCreateDependency, useDeleteDependency } from '../services/planningService';

const statusBarColor: Record<string, string> = {
  NOT_STARTED: '#9e9e9e',
  IN_PROGRESS: '#1976d2',
  COMPLETED: '#2e7d32',
  ON_HOLD: '#ed6c02',
  CANCELLED: '#d32f2f',
};

const weekWidth = 64;
const rowHeight = 36;

const ProjectTimelinePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [tabIndex, setTabIndex] = useState(0);
  const [depDialogOpen, setDepDialogOpen] = useState(false);
  const [depTaskId, setDepTaskId] = useState('');
  const [depDependsOnTaskId, setDepDependsOnTaskId] = useState('');

  const { data: project, isLoading: projectLoading, isError: projectError } = useGetProject(id ?? '');
  const { data: ganttData, isLoading: ganttLoading, isError: ganttError } = useGetGanttData(id ?? '');
  const { data: dependencies, isLoading: depsLoading } = useGetProjectDependencies(id ?? '');
  const scheduleMutation = useScheduleProject();
  const createDepMutation = useCreateDependency();
  const deleteDepMutation = useDeleteDependency();

  const tasks = ganttData?.tasks ?? [];
  const deps = dependencies ?? [];

  const { weeks, taskRows } = useMemo(() => {
    if (!tasks.length) return { weeks: [], taskRows: [] };

    const allDates = tasks.flatMap((t) => {
      const dates: string[] = [];
      if (t.scheduledStartDate) dates.push(t.scheduledStartDate);
      if (t.plannedStartDate) dates.push(t.plannedStartDate);
      if (t.scheduledEndDate) dates.push(t.scheduledEndDate);
      if (t.plannedEndDate) dates.push(t.plannedEndDate);
      return dates;
    });

    if (!allDates.length) return { weeks: [], taskRows: [] };

    const sorted = allDates.filter(Boolean).sort();
    const startDate = new Date(sorted[0]);
    const endDate = new Date(sorted[sorted.length - 1]);

    const weeksArr: string[] = [];
    const cursor = new Date(startDate);
    cursor.setDate(cursor.getDate() - cursor.getDay());
    while (cursor <= endDate) {
      weeksArr.push(cursor.toISOString().slice(0, 10));
      cursor.setDate(cursor.getDate() + 7);
    }

    if (!weeksArr.length) weeksArr.push(startDate.toISOString().slice(0, 10));

    const taskRowsArr = tasks.map((task) => {
      const taskStart = task.scheduledStartDate || task.plannedStartDate || weeksArr[0];
      const taskEnd = task.scheduledEndDate || task.plannedEndDate || weeksArr[weeksArr.length - 1];
      const startIdx = weeksArr.findIndex((w) => w >= taskStart);
      const endIdx = weeksArr.findLastIndex((w) => w <= taskEnd);
      return {
        task,
        startCol: startIdx >= 0 ? startIdx : 0,
        span: startIdx >= 0 && endIdx >= startIdx ? endIdx - startIdx + 1 : 1,
        progressWidth: task.progress,
      };
    });

    return { weeks: weeksArr, taskRows: taskRowsArr };
  }, [tasks]);

  const handleSchedule = () => {
    if (!id) return;
    scheduleMutation.mutate(id);
  };

  const handleAddDependency = () => {
    if (!depTaskId || !depDependsOnTaskId) return;
    createDepMutation.mutate(
      { taskId: depTaskId, dependsOnTaskId: depDependsOnTaskId },
      {
        onSuccess: () => {
          setDepDialogOpen(false);
          setDepTaskId('');
          setDepDependsOnTaskId('');
        },
      },
    );
  };

  const handleDeleteDependency = (depId: string) => {
    deleteDepMutation.mutate(depId);
  };

  const isLoading = projectLoading || ganttLoading;

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (projectError || !project) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Failed to load project. Please try again.</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/projects')} sx={{ mt: 2 }}>
          Back to Projects
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(`/projects/${id}`)} variant="outlined" size="small">
          Back
        </Button>
        <Typography variant="h5" sx={{ fontWeight: 700, flexGrow: 1 }}>
          {project.name} — Timeline
        </Typography>
        <Button
          variant="contained"
          startIcon={<AutoFixHighIcon />}
          onClick={handleSchedule}
          disabled={scheduleMutation.isPending}
        >
          {scheduleMutation.isPending ? 'Scheduling...' : 'Auto Schedule'}
        </Button>
      </Box>

      {scheduleMutation.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to auto-schedule. Please try again.
        </Alert>
      )}

      {ganttError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load timeline data.
        </Alert>
      )}

      <Paper variant="outlined" sx={{ mb: 2 }}>
        <Tabs value={tabIndex} onChange={(_e, v) => setTabIndex(v)}>
          <Tab label="Gantt View" />
          <Tab label="List View" />
        </Tabs>
      </Paper>

      {tabIndex === 0 && (
        <Paper variant="outlined" sx={{ overflow: 'auto', mb: 3 }}>
          {!tasks.length ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="textSecondary">No tasks found for this project.</Typography>
            </Box>
          ) : (
            <Box sx={{ minWidth: weeks.length * weekWidth + 280 }}>
              <Box sx={{ display: 'flex' }}>
                <Box sx={{ width: 280, flexShrink: 0, borderRight: 1, borderColor: 'divider' }}>
                  <Box sx={{ height: 48, display: 'flex', alignItems: 'center', px: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Task</Typography>
                  </Box>
                  {taskRows.map((row) => (
                    <Box
                      key={row.task.id}
                      sx={{
                        height: rowHeight,
                        display: 'flex',
                        alignItems: 'center',
                        px: 2,
                        borderBottom: 1,
                        borderColor: 'divider',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                      onClick={() => navigate(`/tasks/${row.task.id}`)}
                    >
                      <Box sx={{ overflow: 'hidden' }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {row.task.taskCode}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                          {row.task.title}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
                <Box sx={{ flex: 1, overflow: 'auto' }}>
                  <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50', height: 48 }}>
                    {weeks.map((week) => (
                      <Box
                        key={week}
                        sx={{ width: weekWidth, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: 1, borderColor: 'divider' }}
                      >
                        <Typography variant="caption" sx={{ fontSize: 10, textAlign: 'center' }}>
                          {week.slice(5)}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                  {taskRows.map((row) => (
                    <Box
                      key={row.task.id}
                      sx={{ height: rowHeight, display: 'flex', alignItems: 'center', borderBottom: 1, borderColor: 'divider', position: 'relative' }}
                    >
                      {Array.from({ length: weeks.length }).map((_, idx) => (
                        <Box
                          key={idx}
                          sx={{ width: weekWidth, flexShrink: 0, borderRight: 1, borderColor: 'divider', height: '100%' }}
                        />
                      ))}
                      {row.span > 0 && (
                        <Tooltip
                          title={
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.task.taskCode} — {row.task.title}</Typography>
                              <Typography variant="caption">Status: {row.task.status}</Typography><br />
                              <Typography variant="caption">Progress: {row.task.progress}%</Typography><br />
                              <Typography variant="caption">Est: {row.task.estimatedHours}h / Actual: {row.task.actualHours}h</Typography><br />
                              {row.task.assignees.map((a) => (
                                <Typography key={a.employeeId} variant="caption">{a.employeeName} ({a.assignedHours}h)</Typography>
                              ))}
                            </Box>
                          }
                          arrow
                          placement="top"
                        >
                          <Box
                            sx={{
                              position: 'absolute',
                              left: row.startCol * weekWidth + 2,
                              width: row.span * weekWidth - 4,
                              height: rowHeight - 8,
                              borderRadius: 1,
                              bgcolor: statusBarColor[row.task.status] || '#9e9e9e',
                              display: 'flex',
                              alignItems: 'center',
                              cursor: 'pointer',
                              overflow: 'hidden',
                              '&:hover': { opacity: 0.85 },
                            }}
                            onClick={() => navigate(`/tasks/${row.task.id}`)}
                          >
                            <Box
                              sx={{
                                height: '100%',
                                width: `${row.progressWidth}%`,
                                bgcolor: 'rgba(255,255,255,0.25)',
                                transition: 'width 0.2s',
                              }}
                            />
                            <Typography
                              variant="caption"
                              sx={{
                                position: 'absolute',
                                left: 4,
                                color: 'white',
                                fontSize: 10,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: 'calc(100% - 8px)',
                              }}
                            >
                              {row.task.assignees.map((a) => a.employeeName).filter(Boolean).join(', ')}
                            </Typography>
                          </Box>
                        </Tooltip>
                      )}
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          )}
        </Paper>
      )}

      {tabIndex === 1 && (
        <Paper variant="outlined" sx={{ mb: 3 }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Task Code</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Title</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Priority</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Scheduled Start</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Scheduled End</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Progress</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Est Hours</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Actual Hours</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Assignees</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow
                    key={task.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/tasks/${task.id}`)}
                  >
                    <TableCell>{task.taskCode}</TableCell>
                    <TableCell>{task.title}</TableCell>
                    <TableCell>
                      <Chip label={task.status} size="small" color={
                        task.status === 'IN_PROGRESS' ? 'info' :
                        task.status === 'COMPLETED' ? 'success' :
                        task.status === 'ON_HOLD' ? 'warning' :
                        task.status === 'CANCELLED' ? 'error' : 'default'
                      } />
                    </TableCell>
                    <TableCell>
                      <Chip label={task.priority} size="small" variant="outlined" color={
                        task.priority === 'HIGH' || task.priority === 'CRITICAL' ? 'error' :
                        task.priority === 'MEDIUM' ? 'warning' : 'default'
                      } />
                    </TableCell>
                    <TableCell>{task.scheduledStartDate || task.plannedStartDate || '—'}</TableCell>
                    <TableCell>{task.scheduledEndDate || task.plannedEndDate || '—'}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 48, bgcolor: 'grey.200', borderRadius: 1, height: 8, overflow: 'hidden' }}>
                          <Box sx={{ width: `${task.progress}%`, bgcolor: 'primary.main', height: '100%' }} />
                        </Box>
                        <Typography variant="caption">{task.progress}%</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{task.estimatedHours}</TableCell>
                    <TableCell>{task.actualHours}</TableCell>
                    <TableCell>
                      {task.assignees.map((a) => a.employeeName).filter(Boolean).join(', ') || '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Dependencies</Typography>
          <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={() => setDepDialogOpen(true)}>
            Add Dependency
          </Button>
        </Box>
        {depsLoading ? (
          <CircularProgress size={24} />
        ) : !deps.length ? (
          <Typography color="textSecondary" variant="body2">No dependencies defined.</Typography>
        ) : (
          <Stack spacing={1}>
            {deps.map((dep) => (
              <Box key={dep.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                <Chip label={dep.taskCode || dep.taskId} size="small" color="primary" variant="outlined" />
                <Typography variant="body2">→</Typography>
                <Chip label={dep.dependsOnTaskCode || dep.dependsOnTaskId} size="small" color="secondary" variant="outlined" />
                <Typography variant="caption" color="textSecondary">({dep.dependencyType})</Typography>
                <IconButton size="small" color="error" onClick={() => handleDeleteDependency(dep.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Stack>
        )}
      </Paper>

      <Dialog open={depDialogOpen} onClose={() => setDepDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Dependency</DialogTitle>
        <DialogContent>
          <TextField
            select
            fullWidth
            label="Task"
            value={depTaskId}
            onChange={(e) => setDepTaskId(e.target.value)}
            sx={{ mt: 2, mb: 2 }}
          >
            {tasks.map((t) => (
              <MenuItem key={t.id} value={t.id}>{t.taskCode} — {t.title}</MenuItem>
            ))}
          </TextField>
          <TextField
            select
            fullWidth
            label="Depends On Task"
            value={depDependsOnTaskId}
            onChange={(e) => setDepDependsOnTaskId(e.target.value)}
          >
            {tasks
              .filter((t) => t.id !== depTaskId)
              .map((t) => (
                <MenuItem key={t.id} value={t.id}>{t.taskCode} — {t.title}</MenuItem>
              ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDepDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddDependency} variant="contained" disabled={!depTaskId || !depDependsOnTaskId || createDepMutation.isPending}>
            {createDepMutation.isPending ? 'Adding...' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectTimelinePage;
