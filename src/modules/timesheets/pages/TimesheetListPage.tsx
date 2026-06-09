import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Box,
  Button,
  Card,
  Grid,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
  Chip,
  IconButton,
  Avatar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import { useAppStore } from '../../../store/useAppStore';
import { mockEmployees } from '../../../utils/mockData';

export const TimesheetListPage: React.FC = () => {
  const navigate = useNavigate();
  const timesheets = useAppStore((state) => state.timesheets);
  const projects = useAppStore((state) => state.projects);
  const tasks = useAppStore((state) => state.tasks);

  // Filters
  const [projectFilter, setProjectFilter] = useState('all');
  const [employeeFilter, setEmployeeFilter] = useState('all');

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Helper resolvers
  const getProjectCode = (projectId: string) => {
    return projects.find((p) => p.id === projectId)?.shortCode || 'PRJ';
  };

  const getTaskTitle = (taskId: string) => {
    return tasks.find((t) => t.id === taskId)?.title || 'General Work';
  };

  // Filter logs
  const filteredLogs = timesheets.filter((log) => {
    const matchesProject = projectFilter === 'all' || log.projectId === projectFilter;
    const matchesEmployee = employeeFilter === 'all' || log.employeeId === employeeFilter;
    return matchesProject && matchesEmployee;
  });

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatDateTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const paginatedLogs = filteredLogs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Timesheets
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate('/timesheets/create')}
        >
          Log Time
        </Button>
      </Box>

      {/* Filter toolbar */}
      <Card sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 6, md: 3 }}>
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
          <Grid size={{ xs: 6, md: 3 }}>
            <Select
              value={employeeFilter}
              onChange={(e) => {
                setEmployeeFilter(e.target.value);
                setPage(0);
              }}
              size="small"
              fullWidth
              displayEmpty
            >
              <MenuItem value="all">All Employees</MenuItem>
              {mockEmployees.map((emp) => (
                <MenuItem key={emp.id} value={emp.id}>
                  {emp.name} ({emp.role})
                </MenuItem>
              ))}
            </Select>
          </Grid>
        </Grid>
      </Card>

      {/* Timesheets Table */}
      <Card>
        <TableContainer>
          <Table sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Project Code</TableCell>
                <TableCell>Task</TableCell>
                <TableCell>Time Interval</TableCell>
                <TableCell>Hours Logged</TableCell>
                <TableCell>Memo</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedLogs.map((log) => (
                <TableRow key={log.id} hover>
                  {/* Employee Info */}
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem', bgcolor: 'primary.main' }}>
                        {log.employeeName.charAt(0)}
                      </Avatar>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {log.employeeName}
                      </Typography>
                    </Box>
                  </TableCell>

                  {/* Project Code */}
                  <TableCell>
                    <Chip
                      label={getProjectCode(log.projectId)}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                    />
                  </TableCell>

                  {/* Task */}
                  <TableCell sx={{ maxWidth: 180 }}>
                    <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
                      {getTaskTitle(log.taskId)}
                    </Typography>
                  </TableCell>

                  {/* Interval */}
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
                      {formatDateTime(log.startTime)}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      to {formatDateTime(log.endTime)}
                    </Typography>
                  </TableCell>

                  {/* Hours */}
                  <TableCell>
                    <Typography variant="body2" color="primary.dark" sx={{ fontWeight: 700 }}>
                      {log.totalHours} hrs
                    </Typography>
                  </TableCell>

                  {/* Memo */}
                  <TableCell sx={{ maxWidth: 200 }}>
                    <Typography variant="caption" color="textSecondary" noWrap sx={{ display: 'block' }}>
                      {log.memo}
                    </Typography>
                  </TableCell>

                  {/* Actions */}
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
              {filteredLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" color="textSecondary" sx={{ py: 3 }}>
                      No timesheet entries found matching the criteria.
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
          count={filteredLogs.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>
    </Box>
  );
};

export default TimesheetListPage;
