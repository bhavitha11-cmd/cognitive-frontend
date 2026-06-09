import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Box,
  Button,
  Card,
  Grid,
  InputAdornment,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  Chip,
  IconButton,
  Avatar,
  AvatarGroup,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import { useAppStore } from '../../../store/useAppStore';

export const TaskListPage: React.FC = () => {
  const navigate = useNavigate();
  const tasks = useAppStore((state) => state.tasks);
  const projects = useAppStore((state) => state.projects);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Get project details
  const getProjectCode = (projectId: string) => {
    return projects.find((p) => p.id === projectId)?.shortCode || 'PRJ';
  };

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesProject = projectFilter === 'all' || task.projectId === projectFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesProject;
  });

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'error';
      case 'Medium':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'success';
      case 'Review':
        return 'info';
      case 'In Progress':
        return 'primary';
      default:
        return 'secondary';
    }
  };

  const paginatedTasks = filteredTasks.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Tasks
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate('/tasks/create')}
        >
          Add Task
        </Button>
      </Box>

      {/* Filter toolbar */}
      <Card sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              placeholder="Search tasks by title..."
              variant="outlined"
              size="small"
              fullWidth
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Grid>
          <Grid size={{ xs: 4, md: 3 }}>
            <Select
              value={projectFilter}
              onChange={(e) => {
                setProjectFilter(e.target.value);
                setPage(0);
              }}
              size="small"
              fullWidth
              displayEmpty
            >
              <MenuItem value="all">All Projects</MenuItem>
              {projects.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.shortCode} - {p.name}
                </MenuItem>
              ))}
            </Select>
          </Grid>
          <Grid size={{ xs: 4, md: 3 }}>
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
              size="small"
              fullWidth
              displayEmpty
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="To Do">To Do</MenuItem>
              <MenuItem value="In Progress">In Progress</MenuItem>
              <MenuItem value="Review">Review</MenuItem>
              <MenuItem value="Completed">Completed</MenuItem>
            </Select>
          </Grid>
          <Grid size={{ xs: 4, md: 3 }}>
            <Select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPage(0);
              }}
              size="small"
              fullWidth
              displayEmpty
            >
              <MenuItem value="all">All Priorities</MenuItem>
              <MenuItem value="High">High</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="Low">Low</MenuItem>
            </Select>
          </Grid>
        </Grid>
      </Card>

      {/* Tasks Table */}
      <Card>
        <TableContainer>
          <Table sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow>
                <TableCell>Task Title</TableCell>
                <TableCell>Project Code</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Assignees</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedTasks.map((task) => (
                <TableRow key={task.id} hover>
                  <TableCell sx={{ maxWidth: 220 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                      {task.title}
                    </Typography>
                    <Typography variant="caption" color="textSecondary" noWrap sx={{ display: 'block' }}>
                      {task.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getProjectCode(task.projectId)}
                      size="small"
                      sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={task.priority}
                      size="small"
                      color={getPriorityColor(task.priority)}
                      sx={{ fontWeight: 600, fontSize: '0.75rem', height: 22 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={task.status}
                      size="small"
                      color={getStatusColor(task.status)}
                      sx={{ fontWeight: 600, fontSize: '0.75rem', height: 22 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{task.dueDate}</Typography>
                  </TableCell>
                  <TableCell>
                    <AvatarGroup max={3}>
                      {task.assignees.map((name, idx) => (
                        <Tooltip key={idx} title={name}>
                          <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem', bgcolor: 'primary.main' }}>
                            {name.charAt(0)}
                          </Avatar>
                        </Tooltip>
                      ))}
                    </AvatarGroup>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small">
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {filteredTasks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" color="textSecondary" sx={{ py: 3 }}>
                      No tasks found matching the criteria.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredTasks.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>
    </Box>
  );
};

export default TaskListPage;
