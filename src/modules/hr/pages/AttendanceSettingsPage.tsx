import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Box, Card, CardContent, Button, Grid, TextField, Typography, Alert, Snackbar } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';

import { useHRStore } from '../store/useHRStore';

const attendanceSchema = z.object({
  officeStartTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Please enter time in HH:MM format'),
  officeEndTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Please enter time in HH:MM format'),
  halfDayHour: z.number().min(1, 'Must be at least 1 hour').max(12, 'Cannot exceed 12 hours'),
  lateMarkAfterMinutes: z.number().min(0, 'Cannot be negative').max(120, 'Buffer cannot exceed 2 hours'),
});

type AttendanceSettingsForm = z.infer<typeof attendanceSchema>;

export const AttendanceSettingsPage: React.FC = () => {
  const settings = useHRStore((state) => state.attendanceSettings);
  const updateSettings = useHRStore((state) => state.updateAttendanceSettings);

  const [showAlert, setShowAlert] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AttendanceSettingsForm>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: {
      officeStartTime: settings.officeStartTime,
      officeEndTime: settings.officeEndTime,
      halfDayHour: settings.halfDayHour,
      lateMarkAfterMinutes: settings.lateMarkAfterMinutes,
    },
  });

  const onSubmit = (data: AttendanceSettingsForm) => {
    updateSettings(data);
    setShowAlert(true);
  };

  return (
    <Box sx={{ maxWidth: 600 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Attendance Settings
        </Typography>
      </Box>

      <Card>
        <CardContent sx={{ p: 4 }}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="officeStartTime"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Office Start Time *"
                      placeholder="HH:MM (24-hour)"
                      fullWidth
                      size="small"
                      error={!!errors.officeStartTime}
                      helperText={errors.officeStartTime?.message}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="officeEndTime"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Office End Time *"
                      placeholder="HH:MM (24-hour)"
                      fullWidth
                      size="small"
                      error={!!errors.officeEndTime}
                      helperText={errors.officeEndTime?.message}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="halfDayHour"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="number"
                      label="Half Day Limit (Hours) *"
                      placeholder="e.g. 4"
                      fullWidth
                      size="small"
                      error={!!errors.halfDayHour}
                      helperText={errors.halfDayHour?.message}
                      onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="lateMarkAfterMinutes"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="number"
                      label="Late Buffer Limit (Minutes) *"
                      placeholder="e.g. 15"
                      fullWidth
                      size="small"
                      error={!!errors.lateMarkAfterMinutes}
                      helperText={errors.lateMarkAfterMinutes?.message}
                      onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    size="small"
                  >
                    Save Settings
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>

      <Snackbar
        open={showAlert}
        autoHideDuration={3000}
        onClose={() => setShowAlert(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          Attendance settings updated successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AttendanceSettingsPage;
