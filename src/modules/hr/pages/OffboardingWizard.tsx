import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Box, Button, Card, CardContent, Typography, Stepper, Step, StepLabel,
  Alert, List, ListItem, ListItemButton, ListItemText, Stack
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import { useOffboardCheck, useOffboardConfirm, useGetEmployees } from '../services/hrService';
import { StatusBadge } from '../../../components/StatusBadge';

const steps = ['Select Employee', 'Review Dependencies', 'Transfer Assets', 'Confirm Offboarding'];

export const OffboardingWizard: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [offboardData, setOffboardData] = useState<any>(null);

  const { data: employeesData } = useGetEmployees();
  const employees = employeesData?.employees;
  const offboardCheckMut = useOffboardCheck();
  const offboardConfirmMut = useOffboardConfirm();

  const handleEmployeeSelect = (empId: string) => {
    setSelectedEmployeeId(empId);
    offboardCheckMut.mutate(empId, {
      onSuccess: (data) => {
        setOffboardData(data);
        setActiveStep(1);
      },
    });
  };

  const handleConfirm = () => {
    offboardConfirmMut.mutate({ id: selectedEmployeeId, finalStatus: 'RESIGNED' }, {
      onSuccess: () => {
        setActiveStep(3);
      },
    });
  };

  const employee = employees?.find((e) => e.id === selectedEmployeeId);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/hr/employees')} size="small">
          Back
        </Button>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Offboarding Wizard
        </Typography>
      </Box>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {activeStep === 0 && (
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Select Employee to Offboard
            </Typography>
            {(!employees || employees.length === 0) && (
              <Typography color="textSecondary">No employees available.</Typography>
            )}
            <List>
              {employees?.filter((e) => e.status === 'ACTIVE' || e.status === 'PROBATION' || e.status === 'NOTICE_PERIOD')
                .map((emp) => (
                  <ListItem
                    key={emp.id}
                    disablePadding
                    sx={{ borderRadius: 1, mb: 0.5, border: '1px solid', borderColor: 'divider' }}
                  >
                    <ListItemButton
                      selected={selectedEmployeeId === emp.id}
                      onClick={() => handleEmployeeSelect(emp.id)}
                    >
                      <ListItemText
                        primary={`${emp.firstName} ${emp.lastName}`}
                        secondary={`${emp.id} • ${emp.departmentId ? 'Dept assigned' : 'No dept'}`}
                      />
                      <StatusBadge status={emp.status} />
                    </ListItemButton>
                  </ListItem>
                ))}
            </List>
          </CardContent>
        </Card>
      )}

      {activeStep === 1 && offboardData && (
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Dependency Check for {employee?.firstName} {employee?.lastName}
            </Typography>

            {offboardData.direct_reports && offboardData.direct_reports.length > 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                This employee has {offboardData.direct_reports.length} direct report(s) that need to be reassigned.
              </Alert>
            )}

            {offboardData.teams_leading && offboardData.teams_leading.length > 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                This employee leads {offboardData.teams_leading.length} team(s) that need a new lead.
              </Alert>
            )}

            {offboardData.departments_heading && offboardData.departments_heading.length > 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                This employee heads {offboardData.departments_heading.length} department(s) that need a new head.
              </Alert>
            )}

            {offboardData.blockers && offboardData.blockers.length > 0 && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Blockers: {offboardData.blockers.map((b: any) => b.reason).join(', ')}
              </Alert>
            )}

            {(!offboardData.direct_reports || offboardData.direct_reports.length === 0) &&
             (!offboardData.teams_leading || offboardData.teams_leading.length === 0) &&
             (!offboardData.departments_heading || offboardData.departments_heading.length === 0) && (
              <Alert severity="success" sx={{ mb: 2 }}>
                No dependencies found. Ready to offboard.
              </Alert>
            )}

            <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
              <Button variant="contained" color="primary" onClick={handleConfirm} disabled={offboardData.blockers?.length > 0}>
                Confirm Offboard
              </Button>
              <Button variant="outlined" onClick={() => setActiveStep(0)}>Cancel</Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      {activeStep === 2 && (
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography>Transfer assets (placeholder for future implementation).</Typography>
            <Button variant="contained" onClick={() => setActiveStep(3)} sx={{ mt: 2 }}>
              Skip to Confirm
            </Button>
          </CardContent>
        </Card>
      )}

      {activeStep === 3 && (
        <Card>
          <CardContent sx={{ p: 3, textAlign: 'center' }}>
            <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              Offboarding Complete
            </Typography>
            <Typography color="textSecondary" sx={{ mb: 3 }}>
              {employee?.firstName} {employee?.lastName} ({employee?.id}) has been offboarded successfully.
            </Typography>
            <Button variant="contained" onClick={() => navigate('/hr/employees')}>
              Return to Employees
            </Button>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default OffboardingWizard;
