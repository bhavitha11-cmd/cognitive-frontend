import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import EditCalendarIcon from '@mui/icons-material/EditCalendar';

import {
  useGetImpactAnalysis,
  useApplyScheduleReview,
  useRejectScheduleReview,
} from '../services/projectService';
import { parseError } from '../../../utils/api';

export const ScheduleReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryId = id ?? '';

  const queryClient = useQueryClient();
  const { data: impact, isLoading, isError, error } = useGetImpactAnalysis(queryId);
  const applyMutation = useApplyScheduleReview();
  const rejectMutation = useRejectScheduleReview();

  // State for editable dates
  const [isEditMode, setIsEditMode] = useState(false);
  const [projStartDate, setProjStartDate] = useState('');
  const [projEndDate, setProjEndDate] = useState('');
  const [taskDates, setTaskDates] = useState<Record<string, { start: string; end: string }>>({});

  // State for rejection dialog
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [rejectError, setRejectError] = useState('');

  // Helper to format an ISO date string to YYYY-MM-DD for <input type="date">
  const toInputDate = (d: string | null | undefined): string => {
    if (!d) return '';
    return d.split('T')[0];
  };

  // Initialize dates when impact data loads
  useEffect(() => {
    if (impact) {
      if (impact.project) {
        setProjStartDate(toInputDate(impact.project.proposedStartDate ?? impact.project.currentStartDate));
        setProjEndDate(toInputDate(impact.project.proposedEndDate ?? impact.project.currentEndDate));
      }
      const initialTaskDates: Record<string, { start: string; end: string }> = {};
      impact.affectedTasks.forEach((task) => {
        initialTaskDates[task.taskId] = {
          start: toInputDate(task.proposedStartDate ?? task.currentStartDate),
          end: toInputDate(task.proposedEndDate ?? task.currentEndDate),
        };
      });
      setTaskDates(initialTaskDates);
    }
  }, [impact]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 2 }}>
        <CircularProgress color="warning" />
        <Typography variant="body1" color="text.secondary">
          Generating impact analysis...
        </Typography>
      </Box>
    );
  }

  if (isError || !impact) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {parseError(error) || 'Failed to load schedule review details.'}
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/dashboard/private')} variant="outlined">
          Back to Dashboard
        </Button>
      </Box>
    );
  }

  const { project, affectedTasks, holidayName, holidayDate } = impact;

  const handleApply = async () => {
    const projectUpdates = project ? [
      {
        id: project.projectId,
        plannedStartDate: projStartDate || toInputDate(project.proposedStartDate) || null,
        plannedEndDate: projEndDate || toInputDate(project.proposedEndDate) || null,
      }
    ] : [];

    const taskUpdates = Object.entries(taskDates).map(([taskId, dates]) => {
      const taskImpact = affectedTasks.find(t => t.taskId === taskId);
      return {
        id: taskId,
        plannedStartDate: dates.start || toInputDate(taskImpact?.proposedStartDate) || null,
        plannedEndDate: dates.end || toInputDate(taskImpact?.proposedEndDate) || null,
      };
    });

    await applyMutation.mutateAsync(
      {
        reviewId: queryId,
        data: { projectUpdates, taskUpdates },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['dashboard', 'pending-schedule-reviews'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard'] });
          navigate('/dashboard/private');
        },
      }
    );
  };

  const handleReject = async () => {
    if (!rejectionNotes.trim()) {
      setRejectError('Please provide a reason for rejecting the proposed schedule.');
      return;
    }
    setRejectError('');
    await rejectMutation.mutateAsync(
      {
        reviewId: queryId,
        notes: rejectionNotes,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['dashboard', 'pending-schedule-reviews'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard'] });
          setIsRejectDialogOpen(false);
          navigate('/dashboard/private');
        },
      }
    );
  };

  const handleApplyProposed = async () => {
    // Populate state with proposed dates
    if (impact?.project) {
      setProjStartDate(toInputDate(impact.project.proposedStartDate));
      setProjEndDate(toInputDate(impact.project.proposedEndDate));
    }
    const newTaskDates: Record<string, { start: string; end: string }> = {};
    (impact?.affectedTasks ?? []).forEach(task => {
      newTaskDates[task.taskId] = {
        start: toInputDate(task.proposedStartDate),
        end: toInputDate(task.proposedEndDate),
      };
    });
    setTaskDates(newTaskDates);

    // Submit directly with proposed values (state update is async)
    const projectUpdates = impact?.project ? [{
      id: impact.project.projectId,
      plannedStartDate: toInputDate(impact.project.proposedStartDate) || null,
      plannedEndDate: toInputDate(impact.project.proposedEndDate) || null,
    }] : [];

    const taskUpdates = (impact?.affectedTasks ?? []).map(task => ({
      id: task.taskId,
      plannedStartDate: toInputDate(task.proposedStartDate) || null,
      plannedEndDate: toInputDate(task.proposedEndDate) || null,
    }));

    await applyMutation.mutateAsync(
      {
        reviewId: queryId,
        data: { projectUpdates, taskUpdates },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['dashboard', 'pending-schedule-reviews'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard'] });
          navigate('/dashboard/private');
        },
      }
    );
  };

  const updateTaskDate = (taskId: string, field: 'start' | 'end', value: string) => {
    setTaskDates((prev) => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        [field]: value,
      },
    }));
  };

  const hasChanges = isEditMode && project && (
    projStartDate !== toInputDate(project.proposedStartDate) ||
    projEndDate !== toInputDate(project.proposedEndDate) ||
    affectedTasks.some(t => {
      const current = taskDates[t.taskId];
      return current && (current.start !== toInputDate(t.proposedStartDate) || current.end !== toInputDate(t.proposedEndDate));
    })
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/dashboard/private')}
          variant="outlined"
          size="small"
        >
          Back
        </Button>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Schedule Impact Review
        </Typography>
      </Box>

      {/* Alert / Warning */}
      <Alert
        severity="warning"
        icon={<ReportProblemIcon />}
        sx={{ mb: 3, borderLeft: '5px solid', borderColor: 'warning.main' }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          Emergency Holiday Declared: {holidayName} ({new Date(holidayDate).toLocaleDateString()})
        </Typography>
        <Typography variant="body2">
          An emergency holiday has been scheduled. Existing project/task dates will <strong>NOT</strong> be automatically shifted. Please review the proposed schedule below and decide whether to apply it, modify it, or keep your existing plan.
        </Typography>
      </Alert>

      {applyMutation.isError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {parseError(applyMutation.error)}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Project Impact Card */}
        {project && (
          <Grid size={{ xs: 12 }}>
            <Card variant="outlined">
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Project: {project.projectName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Delivery Risk: <Chip label={project.deliveryRisk} color={project.deliveryRisk === 'HIGH' ? 'error' : project.deliveryRisk === 'MEDIUM' ? 'warning' : 'success'} size="small" sx={{ fontWeight: 600 }} />
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      startIcon={<EditCalendarIcon />}
                      variant={isEditMode ? 'contained' : 'outlined'}
                      color="primary"
                      size="small"
                      onClick={() => setIsEditMode(!isEditMode)}
                    >
                      {isEditMode ? 'Done Modifying' : 'Modify Schedule'}
                    </Button>
                  </Box>
                </Box>
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={4}>
                  {/* Current Dates */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>
                        CURRENT PLAN
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 3 }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">START DATE</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {new Date(project.currentStartDate).toLocaleDateString()}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">END DATE</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                            {new Date(project.currentEndDate).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>

                  {/* Proposed Dates */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Paper variant="outlined" sx={{ p: 2, borderColor: isEditMode ? 'primary.main' : 'warning.main', bgcolor: isEditMode ? 'transparent' : 'warning.lighter' }}>
                      <Typography variant="subtitle2" color={isEditMode ? 'primary.main' : 'warning.dark'} sx={{ fontWeight: 600, mb: 1 }}>
                        {isEditMode ? 'EDIT PROPOSED PLAN' : 'PROPOSED PLAN (RECOMMENDED)'}
                      </Typography>
                      {isEditMode ? (
                        <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                          <TextField
                            label="Start Date"
                            type="date"
                            size="small"
                            value={projStartDate}
                            onChange={(e) => setProjStartDate(e.target.value)}
                            slotProps={{ inputLabel: { shrink: true } }}
                          />
                          <TextField
                            label="End Date"
                            type="date"
                            size="small"
                            value={projEndDate}
                            onChange={(e) => setProjEndDate(e.target.value)}
                            slotProps={{ inputLabel: { shrink: true } }}
                          />
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', gap: 3 }}>
                          <Box>
                            <Typography variant="caption" color="text.secondary">START DATE</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {new Date(project.proposedStartDate).toLocaleDateString()}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">END DATE</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600, color: 'warning.dark' }}>
                              {new Date(project.proposedEndDate).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Affected Tasks List */}
        <Grid size={{ xs: 12 }}>
          <Card variant="outlined">
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Affected Tasks ({affectedTasks.length})
              </Typography>
              {isEditMode && (
                <Typography variant="caption" color="primary" sx={{ fontWeight: 600 }}>
                  Editing Mode Active — You can override start/end dates directly in the table cells.
                </Typography>
              )}
            </Box>
            <Divider />
            {affectedTasks.length > 0 ? (
              <Box sx={{ overflow: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Task Name</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Assignee</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Current Schedule</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Proposed Schedule</TableCell>
                      {isEditMode && <TableCell sx={{ fontWeight: 600 }}>Overrides</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {affectedTasks.map((task) => {
                      const dates = taskDates[task.taskId] || { start: '', end: '' };
                      return (
                        <TableRow key={task.taskId} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {task.taskName}
                            </Typography>
                            {task.dependencyInfo && (
                              <Typography variant="caption" color="error.main" sx={{ display: 'block' }}>
                                {task.dependencyInfo}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>{task.assignedEmployeeName || 'Unassigned'}</TableCell>
                          <TableCell>
                            <Chip label={task.currentStatus} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ fontSize: '0.8rem' }}>
                              {new Date(task.currentStartDate).toLocaleDateString()} - {new Date(task.currentEndDate).toLocaleDateString()}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'warning.dark', fontWeight: 500, fontSize: '0.8rem' }}>
                              <CalendarTodayIcon sx={{ fontSize: 14 }} />
                              {new Date(task.proposedStartDate).toLocaleDateString()} - {new Date(task.proposedEndDate).toLocaleDateString()}
                            </Box>
                          </TableCell>
                          {isEditMode && (
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <TextField
                                  type="date"
                                  size="small"
                                  value={dates.start}
                                  onChange={(e) => updateTaskDate(task.taskId, 'start', e.target.value)}
                                  variant="standard"
                                  sx={{ '& input': { fontSize: '0.8rem' } }}
                                />
                                <TextField
                                  type="date"
                                  size="small"
                                  value={dates.end}
                                  onChange={(e) => updateTaskDate(task.taskId, 'end', e.target.value)}
                                  variant="standard"
                                  sx={{ '& input': { fontSize: '0.8rem' } }}
                                />
                              </Box>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Box>
            ) : (
              <Box sx={{ p: 4, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Typography color="text.secondary">No tasks directly overlap with the emergency holiday.</Typography>
              </Box>
            )}
          </Card>
        </Grid>

        {/* Action Buttons Footer */}
        <Grid size={{ xs: 12 }} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <Button
            variant="outlined"
            color="error"
            startIcon={<CancelIcon />}
            onClick={() => setIsRejectDialogOpen(true)}
            disabled={applyMutation.isPending || rejectMutation.isPending}
          >
            Keep Existing Schedule (Reject Proposal)
          </Button>

          <Button
            variant="contained"
            color={hasChanges ? 'primary' : 'warning'}
            startIcon={<CheckCircleIcon />}
            onClick={hasChanges ? handleApply : handleApplyProposed}
            disabled={applyMutation.isPending || rejectMutation.isPending}
            sx={{ px: 4, py: 1, fontWeight: 700 }}
          >
            {applyMutation.isPending ? 'Applying...' : hasChanges ? 'Apply Modified Schedule' : 'Apply Proposed Schedule'}
          </Button>
        </Grid>
      </Grid>

      {/* Reject Confirmation Dialog */}
      <Dialog open={isRejectDialogOpen} onClose={() => { setIsRejectDialogOpen(false); setRejectError(''); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Reject Proposed Schedule Changes</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            By rejecting the proposed schedule shifts, your existing project and task deadlines will remain unchanged. This decision will be logged for audit purposes.
          </Typography>
          {rejectError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {rejectError}
            </Alert>
          )}
          {rejectMutation.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {parseError(rejectMutation.error) || 'Failed to reject the proposal. Please try again.'}
            </Alert>
          )}
          <TextField
            label="Rejection reason (required)"
            multiline
            rows={3}
            fullWidth
            required
            value={rejectionNotes}
            onChange={(e) => { setRejectionNotes(e.target.value); if (rejectError) setRejectError(''); }}
            placeholder="e.g. Schedule is tight but team agreed to overtime to cover the holiday."
            error={!!rejectError && !rejectionNotes.trim()}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => { setIsRejectDialogOpen(false); setRejectError(''); }}>Cancel</Button>
          <Button
            onClick={handleReject}
            color="error"
            variant="contained"
            disabled={rejectMutation.isPending}
          >
            {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ScheduleReviewPage;
