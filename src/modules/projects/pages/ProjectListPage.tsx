import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  LinearProgress,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  Avatar,
  AvatarGroup,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import GridViewIcon from '@mui/icons-material/GridView';
import KanbanIcon from '@mui/icons-material/Dashboard';
import GanttIcon from '@mui/icons-material/FormatAlignLeft';

import { useAppStore } from '../../../store/useAppStore';

export const ProjectListPage: React.FC = () => {
  const navigate = useNavigate();
  const projects = useAppStore((state) => state.projects);
  const clients = useAppStore((state) => state.clients);
  const tasks = useAppStore((state) => state.tasks);
  const updateTaskStatus = useAppStore((state) => state.updateTaskStatus);

  // View toggle: 'grid', 'kanban', 'gantt'
  const [viewMode, setViewMode] = useState<'grid' | 'kanban' | 'gantt'>('grid');

  const handleViewChange = (
    _event: React.MouseEvent<HTMLElement>,
    nextView: 'grid' | 'kanban' | 'gantt' | null
  ) => {
    if (nextView !== null) {
      setViewMode(nextView);
    }
  };

  // Helper to find client name
  const getClientName = (clientId: string) => {
    return clients.find((c) => c.id === clientId)?.companyName || 'Unknown Client';
  };

  // Status color mapper
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Finished':
        return 'success';
      case 'On Hold':
        return 'warning';
      case 'Canceled':
        return 'error';
      default:
        return 'primary';
    }
  };

  // Kanban status columns
  const kanbanColumns = [
    { title: 'To Do', status: 'To Do' as const, color: '#e2e8f0' },
    { title: 'In Progress', status: 'In Progress' as const, color: '#e8f1fc' },
    { title: 'Review', status: 'Review' as const, color: '#fef3d6' },
    { title: 'Completed', status: 'Completed' as const, color: '#d6f0da' },
  ];

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header section with add button and view toggles */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Projects
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, width: { xs: '100%', sm: 'auto' }, justifyContent: 'space-between' }}>
          <ToggleButtonGroup value={viewMode} exclusive onChange={handleViewChange} size="small">
            <ToggleButton value="grid" aria-label="grid view">
              <GridViewIcon fontSize="small" sx={{ mr: 0.5 }} /> Grid
            </ToggleButton>
            <ToggleButton value="kanban" aria-label="kanban task board">
              <KanbanIcon fontSize="small" sx={{ mr: 0.5 }} /> Task Board
            </ToggleButton>
            <ToggleButton value="gantt" aria-label="gantt chart">
              <GanttIcon fontSize="small" sx={{ mr: 0.5 }} /> Gantt
            </ToggleButton>
          </ToggleButtonGroup>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/projects/create')}
          >
            Add Project
          </Button>
        </Box>
      </Box>

      {/* Grid Card View */}
      {viewMode === 'grid' && (
        <Grid container spacing={3}>
          {projects.map((project) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={project.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Box>
                      <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 700 }}>
                        {project.shortCode}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600, mt: 0.5, lineHeight: 1.3 }}>
                        {project.name}
                      </Typography>
                    </Box>
                    <Chip
                      label={project.status}
                      size="small"
                      color={getStatusColor(project.status)}
                      sx={{ fontSize: '0.75rem', fontWeight: 600 }}
                    />
                  </Box>

                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2, minHeight: 42 }}>
                    {project.summary}
                  </Typography>

                  <Grid container spacing={1} sx={{ mb: 2, fontSize: '0.8125rem' }}>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                        Client
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {getClientName(project.clientId)}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                        Deadline
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {project.deadline}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>
                        Progress
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>
                        {project.progress}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={project.progress}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Task Board (Kanban Columns) */}
      {viewMode === 'kanban' && (
        <Grid container spacing={2}>
          {kanbanColumns.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.status);
            return (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={col.status}>
                <Card sx={{ bgcolor: '#f8fafc', height: '70vh', display: 'flex', flexDirection: 'column' }}>
                  <Box
                    sx={{
                      px: 2,
                      py: 1.5,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderTop: `4px solid ${getStatusColor(col.status) === 'primary' ? '#206bc4' : getStatusColor(col.status) === 'success' ? '#2fb344' : '#f59f00'}`
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {col.title}
                    </Typography>
                    <Chip label={colTasks.length} size="small" sx={{ fontWeight: 600, fontSize: '0.75rem' }} />
                  </Box>
                  <Box sx={{ p: 1, flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {colTasks.map((task) => {
                      const proj = projects.find((p) => p.id === task.projectId);
                      return (
                        <Card
                          key={task.id}
                          elevation={1}
                          sx={{
                            p: 1.5,
                            cursor: 'pointer',
                            bgcolor: 'background.paper',
                            '&:hover': { boxShadow: 3 },
                          }}
                        >
                          <Typography variant="caption" color="primary" sx={{ display: 'block', mb: 0.5, fontWeight: 700 }}>
                            {proj?.shortCode || 'TASK'}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }} gutterBottom>
                            {task.title}
                          </Typography>
                          <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 1 }}>
                            Due: {task.dueDate}
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Chip
                              label={task.priority}
                              size="small"
                              color={task.priority === 'High' ? 'error' : task.priority === 'Medium' ? 'warning' : 'default'}
                              sx={{ height: 18, fontSize: '0.6875rem', fontWeight: 600 }}
                            />
                            <AvatarGroup max={2}>
                              {task.assignees.map((name, idx) => (
                                <Avatar
                                  key={idx}
                                  sx={{ width: 20, height: 20, fontSize: '0.625rem' }}
                                >
                                  {name.charAt(0)}
                                </Avatar>
                              ))}
                            </AvatarGroup>
                          </Box>
                          
                          {/* Status Toggles on Click */}
                          <Box sx={{ display: 'flex', gap: 0.5, mt: 1.5, flexWrap: 'wrap' }}>
                            {kanbanColumns
                              .filter((c) => c.status !== col.status)
                              .map((c) => (
                                <Button
                                  key={c.status}
                                  size="small"
                                  onClick={() => updateTaskStatus(task.id, c.status)}
                                  sx={{ fontSize: '0.625rem', p: 0.2, minWidth: 0 }}
                                >
                                  → {c.title.split(' ')[0]}
                                </Button>
                              ))}
                          </Box>
                        </Card>
                      );
                    })}
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Gantt Chart Timeline representation */}
      {viewMode === 'gantt' && (
        <Card sx={{ p: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 3 }}>
            Project Timeline (Gantt Chart)
          </Typography>
          <Box sx={{ overflowX: 'auto' }}>
            <Box sx={{ minWidth: 800 }}>
              {/* Table Gantt Header */}
              <Box sx={{ display: 'flex', borderBottom: '1px solid #e2e8f0', pb: 1, mb: 2, fontWeight: 600 }}>
                <Box sx={{ width: '250px' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }} color="textSecondary">
                    Project Name
                  </Typography>
                </Box>
                <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" sx={{ width: '8%' }} align="center">Jan</Typography>
                  <Typography variant="caption" sx={{ width: '8%' }} align="center">Feb</Typography>
                  <Typography variant="caption" sx={{ width: '8%' }} align="center">Mar</Typography>
                  <Typography variant="caption" sx={{ width: '8%' }} align="center">Apr</Typography>
                  <Typography variant="caption" sx={{ width: '8%' }} align="center">May</Typography>
                  <Typography variant="caption" sx={{ width: '8%' }} align="center">Jun</Typography>
                  <Typography variant="caption" sx={{ width: '8%' }} align="center">Jul</Typography>
                  <Typography variant="caption" sx={{ width: '8%' }} align="center">Aug</Typography>
                  <Typography variant="caption" sx={{ width: '8%' }} align="center">Sep</Typography>
                  <Typography variant="caption" sx={{ width: '8%' }} align="center">Oct</Typography>
                  <Typography variant="caption" sx={{ width: '8%' }} align="center">Nov</Typography>
                  <Typography variant="caption" sx={{ width: '8%' }} align="center">Dec</Typography>
                </Box>
              </Box>

              {/* Gantt Timelines */}
              {projects.slice(0, 10).map((proj, idx) => {
                // Calculate random margins to show timeline bars
                const barStart = 5 + (idx % 4) * 8;
                const barWidth = 20 + (idx % 3) * 15;
                return (
                  <Box key={proj.id} sx={{ display: 'flex', alignItems: 'center', py: 1.5, borderBottom: '1px solid #f1f5f9' }}>
                    <Box sx={{ width: '250px', pr: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                        {proj.name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {proj.shortCode} • {proj.startDate} to {proj.deadline}
                      </Typography>
                    </Box>
                    <Box sx={{ flexGrow: 1, position: 'relative', height: '24px', bgcolor: '#f8fafc', borderRadius: '4px' }}>
                      <Box
                        sx={{
                          position: 'absolute',
                          left: `${barStart}%`,
                          width: `${barWidth}%`,
                          height: '100%',
                          bgcolor: 'primary.main',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          pl: 1,
                          boxShadow: '0 2px 4px rgba(32, 107, 196, 0.2)',
                        }}
                      >
                        <Typography variant="caption" color="white" sx={{ fontWeight: 600 }}>
                          {proj.progress}%
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Card>
      )}
    </Box>
  );
};

export default ProjectListPage;
