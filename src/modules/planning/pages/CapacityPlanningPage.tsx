import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Alert,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import { Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Line, ComposedChart } from 'recharts';
import { useGetEmployees } from '../../hr/services/hrService';
import { useGetEmployeeCapacity, useGetEmployeeSchedules, useUpdateSchedule } from '../services/planningService';
import type { EmployeeSchedule } from '../types';

const getUtilColor = (pct: number): 'success' | 'warning' | 'error' => {
  if (pct <= 80) return 'success';
  if (pct <= 100) return 'warning';
  return 'error';
};

const getUtilLabel = (pct: number): string => {
  if (pct <= 80) return 'OK';
  if (pct <= 100) return 'Warning';
  return 'Overloaded';
};

const CapacityPlanningPage: React.FC = () => {
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const [employeeId, setEmployeeId] = useState('');
  const [fromDate, setFromDate] = useState(firstOfMonth.toISOString().slice(0, 10));
  const [toDate, setToDate] = useState(lastOfMonth.toISOString().slice(0, 10));
  const [loaded, setLoaded] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<EmployeeSchedule | null>(null);
  const [editHours, setEditHours] = useState(0);

  const { data: employees } = useGetEmployees();
  const { data: capacity, isLoading: capLoading, isError: capError } = useGetEmployeeCapacity(
    loaded ? employeeId : '',
    loaded ? fromDate : '',
    loaded ? toDate : '',
  );
  const { data: schedules, isLoading: _schedLoading } = useGetEmployeeSchedules(
    loaded ? employeeId : '',
    loaded ? fromDate : '',
    loaded ? toDate : '',
  );
  const updateSchedule = useUpdateSchedule();

  const chartData = capacity?.weeks.map((w) => ({
    week: w.weekStartDate.slice(5),
    availableHours: w.availableHours,
    scheduledHours: w.scheduledHours,
    utilizationPct: w.utilizationPct,
    utilizationColor: w.utilizationPct > 100 ? '#d32f2f' : w.utilizationPct > 80 ? '#ed6c02' : '#2e7d32',
  })) ?? [];

  const handleLoad = () => {
    if (!employeeId || !fromDate || !toDate) return;
    setLoaded(true);
  };

  const handleEditSchedule = (sched: EmployeeSchedule) => {
    setEditingSchedule(sched);
    setEditHours(sched.availableHours);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingSchedule) return;
    updateSchedule.mutate(
      { id: editingSchedule.id, data: { availableHours: editHours } },
      {
        onSuccess: () => {
          setEditDialogOpen(false);
          setEditingSchedule(null);
        },
      },
    );
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
        Capacity Planning
      </Typography>

      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <TextField
            select
            label="Employee"
            value={employeeId}
            onChange={(e) => { setEmployeeId(e.target.value); setLoaded(false); }}
            sx={{ minWidth: 220 }}
          >
            {employees?.map((emp: any) => (
              <MenuItem key={emp.id} value={emp.id}>
                {emp.firstName} {emp.lastName} ({emp.employeeCode || emp.email})
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="From Date"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="To Date"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <Button variant="contained" onClick={handleLoad} disabled={!employeeId || !fromDate || !toDate}>
            Load
          </Button>
        </Box>
      </Paper>

      {loaded && capLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {loaded && capError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load capacity data. Please try again.
        </Alert>
      )}

      {loaded && capacity && chartData.length > 0 && (
        <>
          <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {capacity.employeeName} — Weekly Capacity
            </Typography>
            <ResponsiveContainer width="100%" height={320} minWidth={0} minHeight={0}>
              <ComposedChart data={chartData}>
                <XAxis dataKey="week" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="availableHours" fill="#2e7d32" name="Available Hours" radius={[2, 2, 0, 0]} />
                <Bar dataKey="scheduledHours" fill="#1976d2" name="Scheduled Hours" radius={[2, 2, 0, 0]} />
                <Line type="monotone" dataKey="utilizationPct" stroke="#ed6c02" name="Utilization %" strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </Paper>

          <Paper variant="outlined" sx={{ mb: 3 }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Week Start Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Available Hours</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Scheduled Hours</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Utilization %</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {capacity.weeks.map((week) => (
                    <TableRow key={week.weekStartDate}>
                      <TableCell>{week.weekStartDate}</TableCell>
                      <TableCell>{week.availableHours}</TableCell>
                      <TableCell>{week.scheduledHours}</TableCell>
                      <TableCell>{week.utilizationPct.toFixed(1)}%</TableCell>
                      <TableCell>
                        <Chip
                          label={getUtilLabel(week.utilizationPct)}
                          color={getUtilColor(week.utilizationPct)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => {
                            const sched = schedules?.find((s) => s.weekStartDate === week.weekStartDate);
                            if (sched) {
                              handleEditSchedule(sched);
                            }
                          }}
                          disabled={!schedules?.some((s) => s.weekStartDate === week.weekStartDate)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}

      {loaded && capacity && chartData.length === 0 && !capLoading && (
        <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="textSecondary">No capacity data available for the selected period.</Typography>
        </Paper>
      )}

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Edit Available Hours</DialogTitle>
        <DialogContent>
          {editingSchedule && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Week: {editingSchedule.weekStartDate}
              </Typography>
              <TextField
                fullWidth
                type="number"
                label="Available Hours"
                value={editHours}
                onChange={(e) => setEditHours(Number(e.target.value))}
                slotProps={{ htmlInput: { min: 0, max: 168 } }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveEdit}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={updateSchedule.isPending}
          >
            {updateSchedule.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CapacityPlanningPage;
