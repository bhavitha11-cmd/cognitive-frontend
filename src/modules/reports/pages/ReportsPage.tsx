import React, { useState, useMemo } from 'react';
import { Grid, Card, CardContent, Typography, Box, Tabs, Tab, Table, TableBody, TableCell, TableHead, TableRow, Chip, Button, CircularProgress, Alert, TextField, MenuItem, Divider } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { useGetPlanVsActual, useGetUtilization, useGetDepartmentLoad, useGetClientPerformance, useGetScopeDistribution } from '../../dashboard/services/dashboardService';
import { EmptyState } from '../../../components/EmptyState';

const PIE_COLORS = ['#206bc4', '#2fb344', '#f59f00', '#d63939', '#4299e1', '#ae3ec9', '#17a2b8', '#6c757d'];

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <Box role="tabpanel" hidden={value !== index} sx={{ pt: 3 }}>
    {value === index && children}
  </Box>
);

const ExportButton: React.FC<{ onClick?: () => void }> = ({ onClick }) => (
  <Button variant="outlined" size="small" startIcon={<FileDownloadIcon />} onClick={onClick}>
    Export CSV
  </Button>
);

export const ReportsPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  const { data: planVsActual, isLoading: planLoading } = useGetPlanVsActual();
  const { data: utilization, isLoading: utilLoading } = useGetUtilization(fromDate || undefined, toDate || undefined);
  const { data: deptLoad = [], isLoading: deptLoading } = useGetDepartmentLoad();
  const { data: clientPerf, isLoading: clientLoading } = useGetClientPerformance();
  const { data: scopeData = [], isLoading: scopeLoading } = useGetScopeDistribution();

  const isLoading = planLoading || utilLoading || deptLoading || clientLoading || scopeLoading;

  const filteredProjects = useMemo(() => {
    if (!planVsActual?.projects) return [];
    return planVsActual.projects;
  }, [planVsActual]);

  const deptNames = useMemo(() => {
    const names = new Set(deptLoad.map((d) => d.department));
    return Array.from(names);
  }, [deptLoad]);

  const filteredDeptLoad = useMemo(() => {
    if (!deptFilter) return deptLoad;
    return deptLoad.filter((d) => d.department === deptFilter);
  }, [deptLoad, deptFilter]);

  const uniqueCats = useMemo(() => {
    const cats = new Set(scopeData.map((s) => s.departmentCategory || 'Uncategorized'));
    return Array.from(cats);
  }, [scopeData]);

  const scopeSummary = useMemo(() => {
    const map = new Map<string, { estimated: number; actual: number }>();
    scopeData.forEach((s) => {
      const cat = s.departmentCategory || 'Uncategorized';
      if (!map.has(cat)) {
        map.set(cat, { estimated: 0, actual: 0 });
      }
      const e = map.get(cat)!;
      e.estimated += s.estimatedHours;
      e.actual += s.actualHours;
    });
    return Array.from(map.entries()).map(([name, vals]) => ({ name, ...vals }));
  }, [scopeData]);

  const sortedClients = useMemo(() => {
    if (!clientPerf?.clients) return [];
    return [...clientPerf.clients].sort((a, b) => b.onTimeDeliveryPct - a.onTimeDeliveryPct);
  }, [clientPerf]);

  const overrunColor = (pct: number): 'success' | 'warning' | 'error' => {
    if (pct <= 10) return 'success';
    if (pct <= 30) return 'warning';
    return 'error';
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Analytics Reports
        </Typography>
      </Box>

      <Tabs value={tabValue} onChange={(_e, v) => setTabValue(v)} sx={{ mb: 1, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Plan vs Actual" />
        <Tab label="Employee Utilization" />
        <Tab label="Department Load" />
        <Tab label="Client Performance" />
        <Tab label="Scope Distribution" />
      </Tabs>

      <TabPanel value={tabValue} index={0}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <ExportButton />
        </Box>
        {filteredProjects.length > 0 ? (
          <>
            <Box sx={{ width: '100%', height: 300, mb: 3 }}>
              <ResponsiveContainer width="100%" height={300} minWidth={0} minHeight={0}>
                <BarChart data={filteredProjects} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="partNumber" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="estimatedHours" fill="#206bc4" radius={[4, 4, 0, 0]} name="Estimated" />
                  <Bar dataKey="actualHours" fill="#f59f00" radius={[4, 4, 0, 0]} name="Actual" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Part Number</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Client</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Estimated</TableCell>
                  <TableCell>Actual</TableCell>
                  <TableCell>Overrun %</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredProjects.map((p) => (
                  <TableRow key={p.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{p.partNumber}</TableCell>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>{p.clientName || '-'}</TableCell>
                    <TableCell><Chip label={p.status} size="small" /></TableCell>
                    <TableCell>{p.estimatedHours}h</TableCell>
                    <TableCell>{p.actualHours}h</TableCell>
                    <TableCell>
                      <Chip label={`${p.overrunPercentage.toFixed(1)}%`} size="small" color={overrunColor(p.overrunPercentage)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        ) : (
          <EmptyState title="No data" description="No project data available." />
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField label="From Date" type="date" size="small" InputLabelProps={{ shrink: true }} value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          <TextField label="To Date" type="date" size="small" InputLabelProps={{ shrink: true }} value={toDate} onChange={(e) => setToDate(e.target.value)} />
          <ExportButton />
        </Box>
        {utilization && utilization.employees.length > 0 ? (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Hours Logged</TableCell>
                <TableCell>Billable Hours</TableCell>
                <TableCell>Tasks</TableCell>
                <TableCell>Utilization</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {utilization.employees.map((emp) => (
                <TableRow key={emp.id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{emp.employeeName}</TableCell>
                  <TableCell>{emp.departmentName || '-'}</TableCell>
                  <TableCell>{emp.totalHoursLogged}h</TableCell>
                  <TableCell>{emp.billableHours}h</TableCell>
                  <TableCell>{emp.taskCount}</TableCell>
                  <TableCell>
                    <Chip label={`${emp.utilizationPercentage.toFixed(0)}%`} size="small" color={emp.utilizationPercentage >= 80 ? 'success' : emp.utilizationPercentage >= 50 ? 'warning' : 'error'} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState title="No data" description="No utilization data for the selected period." />
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField select label="Department" size="small" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} sx={{ minWidth: 200 }}>
            <MenuItem value="">All Departments</MenuItem>
            {deptNames.map((name) => (
              <MenuItem key={name} value={name}>{name}</MenuItem>
            ))}
          </TextField>
          <ExportButton />
        </Box>
        {filteredDeptLoad.length > 0 ? (
          <>
            <Box sx={{ width: '100%', height: 300, mb: 3 }}>
              <ResponsiveContainer width="100%" height={300} minWidth={0} minHeight={0}>
                <BarChart data={filteredDeptLoad} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="department" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="estimatedHours" fill="#206bc4" radius={[4, 4, 0, 0]} name="Estimated" />
                  <Bar dataKey="actualHours" fill="#f59f00" radius={[4, 4, 0, 0]} name="Actual" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Department</TableCell>
                  <TableCell>Estimated Hours</TableCell>
                  <TableCell>Actual Hours</TableCell>
                  <TableCell>Tasks</TableCell>
                  <TableCell>Overrun %</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredDeptLoad.map((d) => (
                  <TableRow key={d.department} hover>
                    <TableCell sx={{ fontWeight: 500 }}>{d.department}</TableCell>
                    <TableCell>{d.estimatedHours}h</TableCell>
                    <TableCell>{d.actualHours}h</TableCell>
                    <TableCell>{d.taskCount}</TableCell>
                    <TableCell>
                      <Chip label={`${d.overrunPercentage.toFixed(1)}%`} size="small" color={overrunColor(d.overrunPercentage)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        ) : (
          <EmptyState title="No data" description="No department load data available." />
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <ExportButton />
        </Box>
        {sortedClients.length > 0 ? (
          <>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {sortedClients.slice(0, 2).map((c) => (
                <Grid size={{ xs: 12, md: 6 }} key={c.id}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{c.name}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        On-Time Delivery: {c.onTimeDeliveryPct.toFixed(1)}%
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Projects: {c.totalProjects} ({c.activeProjects} active, {c.completedProjects} completed)
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Client</TableCell>
                  <TableCell>Total Projects</TableCell>
                  <TableCell>Active</TableCell>
                  <TableCell>Completed</TableCell>
                  <TableCell>Delayed</TableCell>
                  <TableCell>Estimated Hours</TableCell>
                  <TableCell>Actual Hours</TableCell>
                  <TableCell>On-Time %</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedClients.map((c) => (
                  <TableRow key={c.id} hover>
                    <TableCell sx={{ fontWeight: 500 }}>{c.name}</TableCell>
                    <TableCell>{c.totalProjects}</TableCell>
                    <TableCell>{c.activeProjects}</TableCell>
                    <TableCell>{c.completedProjects}</TableCell>
                    <TableCell>{c.delayedProjects}</TableCell>
                    <TableCell>{c.totalEstimatedHours}h</TableCell>
                    <TableCell>{c.totalActualHours}h</TableCell>
                    <TableCell>
                      <Chip label={`${c.onTimeDeliveryPct.toFixed(1)}%`} size="small" color={c.onTimeDeliveryPct >= 80 ? 'success' : c.onTimeDeliveryPct >= 50 ? 'warning' : 'error'} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        ) : (
          <EmptyState title="No data" description="No client performance data available." />
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={4}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <ExportButton />
        </Box>
        {scopeSummary.length > 0 ? (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ width: '100%', height: 300 }}>
                <ResponsiveContainer width="100%" height={300} minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie data={scopeSummary} cx="50%" cy="50%" outerRadius={80} dataKey="actual" label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`} labelLine={false}>
                      {scopeSummary.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Category</TableCell>
                    <TableCell>Estimated Hours</TableCell>
                    <TableCell>Actual Hours</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {scopeSummary.map((s) => (
                    <TableRow key={s.name} hover>
                      <TableCell sx={{ fontWeight: 500 }}>{s.name}</TableCell>
                      <TableCell>{s.estimated}h</TableCell>
                      <TableCell>{s.actual}h</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Grid>
          </Grid>
        ) : (
          <EmptyState title="No data" description="No scope distribution data available." />
        )}
      </TabPanel>
    </Box>
  );
};

export default ReportsPage;
