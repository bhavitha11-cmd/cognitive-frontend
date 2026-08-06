import React from 'react';
import { useParams, useNavigate } from 'react-router';
import { Box, Button, Card, CardContent, Grid, Typography, Avatar, Divider, Chip, Stack, CircularProgress } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MailIcon from '@mui/icons-material/Mail';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import EventIcon from '@mui/icons-material/Event';

import { useGetEmployee, useGetDepartments, useGetRoles } from '../services/hrService';
import { useHRStore } from '../store/useHRStore';
import { StatusBadge } from '../../../components/StatusBadge';
import { HierarchyTree } from '../../../components/HierarchyTree';
import type { TreeNode } from '../../../components/HierarchyTree';

export const EmployeeProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: employee, isLoading } = useGetEmployee(id);
  useGetDepartments();
  const { data: roles } = useGetRoles();

  const departments = useHRStore((state) => state.departments);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!employee) {
    return (
      <Box sx={{ textAlign: 'center', py: 5 }}>
        <Typography variant="h6" color="textSecondary">
          Employee record not found.
        </Typography>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/hr/employees')} sx={{ mt: 2 }}>
          Back to List
        </Button>
      </Box>
    );
  }

  const getDeptName = (deptId: string) => {
    if (!deptId) return 'N/A';
    return departments.find((d: any) => d.id === deptId)?.name || 'Unknown';
  };

  const getRoleNames = (roleIds: string[]) => {
    return roleIds.map((rid) => roles?.find((r) => r.id === rid)?.name || rid);
  };

  const buildSupervisorTree = (emp: any): TreeNode => {
    const itemRoles = getRoleNames(emp.roleIds).join(', ');
    return {
      id: emp.id,
      label: `${emp.firstName} ${emp.lastName}`,
      subLabel: `${getDeptName(emp.departmentId)} • ${itemRoles}`,
      avatar: emp.profilePhoto,
      children: [],
    };
  };

  const hierarchyTreeData = buildSupervisorTree(employee);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/hr/employees')}
          size="small"
        >
          Back
        </Button>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Employee Profile
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <Avatar
                src={employee.profilePhoto}
                sx={{ width: 110, height: 110, mb: 2.5, boxShadow: 3 }}
              >
                {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {employee.firstName} {employee.lastName}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                {employee.departmentId ? getDeptName(employee.departmentId) : 'No Department'}
              </Typography>
              <Box sx={{ mb: 3 }}>
                <StatusBadge status={employee.status} />
              </Box>

              <Divider sx={{ width: '100%', mb: 3 }} />

              <Stack spacing={2} sx={{ width: '100%', textAlign: 'left' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <MailIcon color="action" fontSize="small" />
                  <Typography variant="body2" noWrap sx={{ fontSize: '0.8125rem' }}>
                    {employee.email}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <PhoneAndroidIcon color="action" fontSize="small" />
                  <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
                    {employee.mobile}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <EventIcon color="action" fontSize="small" />
                  <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
                    Joined {employee.dateOfJoining}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Stack spacing={3}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }} color="primary">
                  Personal Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>Full Name</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {employee.firstName} {employee.middleName ? `${employee.middleName} ` : ''}{employee.lastName}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>Display Name</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{employee.displayName || '-'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>Gender</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{employee.gender}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>Date of Birth</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{employee.dateOfBirth}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>Official Email</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{employee.officialEmail || '-'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>Personal Email</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{employee.personalEmail || '-'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>Phone</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{employee.phone || '-'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>Alternate Phone</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{employee.alternatePhone || '-'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>Username</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{employee.username}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }} color="primary">
                  Employment Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6, sm: 4 }}>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>Employee ID</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{employee.employeeCode || employee.id}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4 }}>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>Department</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{getDeptName(employee.departmentId)}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4 }}>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>Employment Type</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{employee.employmentType}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }} color="primary">
                  Contact & Address
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>Emergency Contact</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {employee.emergencyContactName ? `${employee.emergencyContactName} (${employee.emergencyContactPhone || 'N/A'})` : '-'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>Address</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{employee.address || '-'}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }} color="primary">
                  Assigned Roles
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {getRoleNames(employee.roleIds).map((name, index) => (
                    <Chip key={index} label={name} color="primary" variant="outlined" sx={{ fontWeight: 600 }} />
                  ))}
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }} color="primary">
                  Reporting Hierarchy
                </Typography>
                <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <HierarchyTree
                    data={hierarchyTreeData}
                    onNodeClick={(clickedId) => {
                      if (clickedId !== employee.id) {
                        navigate(`/hr/employees/${clickedId}`);
                      }
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EmployeeProfilePage;
