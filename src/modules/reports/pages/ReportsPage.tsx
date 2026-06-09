import React from 'react';
import { Card, Grid, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, LinearProgress } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAppStore } from '../../../store/useAppStore';

export const ReportsPage: React.FC = () => {
  const projects = useAppStore((state) => state.projects);
  const tasks = useAppStore((state) => state.tasks);

  // Calculate allocation metrics
  const projectReportData = projects.slice(0, 5).map((p) => {
    const projTasks = tasks.filter((t) => t.projectId === p.id);
    const completedTasks = projTasks.filter((t) => t.status === 'Completed').length;
    return {
      name: p.shortCode,
      tasks: projTasks.length,
      completed: completedTasks,
    };
  });

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Reports
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Project completion status chart */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card sx={{ p: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
              Project Task Breakdown (Completed vs Total)
            </Typography>
            <Box sx={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={projectReportData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="tasks" fill="#64748b" name="Total Tasks" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completed" fill="#206bc4" name="Completed Tasks" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </Grid>

        {/* Project progress report table */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ px: 2.5, py: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Project Progress Report
              </Typography>
            </Box>
            <TableContainer sx={{ flexGrow: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Code</TableCell>
                    <TableCell>Project Name</TableCell>
                    <TableCell>Progress</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {projects.slice(0, 6).map((proj) => (
                    <TableRow key={proj.id} hover>
                      <TableCell sx={{ py: 1.8 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {proj.shortCode}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.8 }}>
                        <Typography variant="body2">{proj.name}</Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.8, width: 150 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: '100%' }}>
                            <LinearProgress variant="determinate" value={proj.progress} sx={{ height: 6, borderRadius: 3 }} />
                          </Box>
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            {proj.progress}%
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReportsPage;
