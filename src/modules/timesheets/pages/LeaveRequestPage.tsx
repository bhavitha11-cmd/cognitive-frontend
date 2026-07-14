import React, { useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fab,
  FormControl,
  FormControlLabel,
  FormLabel,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Checkbox,
  Radio,
  RadioGroup,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';

import {
  useGetLeaveTypes,
  useGetMyLeaveBalances,
  useGetLeaveRequests,
  useApplyLeave,
  useCancelLeave,
  useUploadLeaveDocument,
} from '../services/leaveService';
import type { LeaveRequest, LeaveRequestCreate } from '../types';
import { parseError } from '../../../utils/api';

// ==========================================
// SCHEMA
// ==========================================

const applyLeaveSchema = z
  .object({
    leaveTypeId: z.string().min(1, 'Leave type is required'),
    fromDate: z.string().min(1, 'From date is required'),
    toDate: z.string().min(1, 'To date is required'),
    reason: z.string().optional(),
    isHalfDay: z.boolean().default(false),
    halfDaySession: z.enum(['FIRST_HALF', 'SECOND_HALF']).nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.isHalfDay) return true;
      if (!data.fromDate || !data.toDate) return true;
      return new Date(data.toDate) >= new Date(data.fromDate);
    },
    { message: 'To date must be on or after from date', path: ['toDate'] }
  )
  .refine(
    (data) => {
      if (data.isHalfDay && !data.halfDaySession) return false;
      return true;
    },
    { message: 'Session selection is required for half-day leaves', path: ['halfDaySession'] }
  );

type ApplyLeaveFormValues = z.infer<typeof applyLeaveSchema>;

// ==========================================
// STATUS CONFIG
// ==========================================

const STATUS_CONFIG: Record<
  LeaveRequest['status'],
  { label: string; color: 'warning' | 'success' | 'error' | 'default' }
> = {
  PENDING: { label: 'Pending', color: 'warning' },
  APPROVED: { label: 'Approved', color: 'success' },
  REJECTED: { label: 'Rejected', color: 'error' },
  CANCELLED: { label: 'Cancelled', color: 'default' },
};

const fmtDate = (d?: string) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const calcDays = (from: string, to: string): number => {
  if (!from || !to) return 0;
  const d1 = new Date(from);
  const d2 = new Date(to);
  if (d2 < d1) return 0;
  return Math.floor((d2.getTime() - d1.getTime()) / 86400000) + 1;
};

// ==========================================
// BALANCE CARD
// ==========================================

interface BalanceCardProps {
  name: string;
  code: string;
  color: string;
  remaining: number;
  used: number;
  totalAllowed: number;
  carriedForward: number;
}

const BalanceCard: React.FC<BalanceCardProps> = ({
  name,
  color,
  remaining,
  used,
  totalAllowed,
  carriedForward,
}) => {
  const pct = totalAllowed > 0 ? Math.min(100, (remaining / totalAllowed) * 100) : 0;
  return (
    <Card
      sx={{
        borderTop: `4px solid ${color}`,
        height: '100%',
        transition: 'box-shadow 0.2s',
        '&:hover': { boxShadow: 4 },
      }}
    >
      <CardContent sx={{ pb: '16px !important' }}>
        <Stack direction="row" sx={{ mb: 1, alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {name}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color, lineHeight: 1.2 }}>
              {remaining}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              days remaining
            </Typography>
          </Box>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              bgcolor: `${color}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BeachAccessIcon sx={{ color, fontSize: 18 }} />
          </Box>
        </Stack>

        {/* Progress bar */}
        <Box sx={{ mt: 1.5, mb: 1 }}>
          <Box sx={{ bgcolor: 'grey.100', borderRadius: 2, height: 6, overflow: 'hidden' }}>
            <Box
              sx={{
                width: `${pct}%`,
                height: '100%',
                bgcolor: color,
                borderRadius: 2,
                transition: 'width 0.5s ease',
              }}
            />
          </Box>
        </Box>

        <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
          <Typography variant="caption" color="text.secondary">
            Used: <strong>{used}</strong>
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Total: <strong>{totalAllowed}</strong>
            {carriedForward > 0 && ` (+${carriedForward} CF)`}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
};

// ==========================================
// APPLY LEAVE DIALOG
// ==========================================

interface ApplyLeaveDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ApplyLeaveDialog: React.FC<ApplyLeaveDialogProps> = ({ open, onClose, onSuccess }) => {
  const { data: leaveTypes = [] } = useGetLeaveTypes();
  const { data: balances = [] } = useGetMyLeaveBalances();
  const applyLeave = useApplyLeave();
  const uploadDoc = useUploadLeaveDocument();

  const [selectedFile, setSelectedFile] = useState<globalThis.File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    reset,
    setError,
    setValue,
    formState: { errors },
  } = useForm<ApplyLeaveFormValues>({
    resolver: zodResolver(applyLeaveSchema),
    defaultValues: {
      leaveTypeId: '',
      fromDate: '',
      toDate: '',
      reason: '',
      isHalfDay: false,
      halfDaySession: null,
    },
  });

  const watchedType = watch('leaveTypeId');
  const watchedFrom = watch('fromDate');
  const watchedTo = watch('toDate');
  const watchedIsHalfDay = watch('isHalfDay');

  React.useEffect(() => {
    if (watchedIsHalfDay && watchedFrom) {
      setValue('toDate', watchedFrom, { shouldValidate: true });
    }
  }, [watchedIsHalfDay, watchedFrom, setValue]);

  const days = watchedIsHalfDay ? 0.5 : calcDays(watchedFrom, watchedTo);

  const selectedLeaveType = useMemo(
    () => leaveTypes.find((lt) => lt.id === watchedType),
    [leaveTypes, watchedType]
  );

  const isExtraLeave = useMemo(() => {
    return selectedLeaveType?.requiresDocument ?? false;
  }, [selectedLeaveType]);

  const selectedBalance = useMemo(
    () => balances.find((b) => b.leaveTypeId === watchedType),
    [balances, watchedType]
  );

  const insufficientBalance = selectedBalance !== undefined && days > 0 && days > selectedBalance.remaining;

  const handleClose = () => {
    setSelectedFile(null);
    setUploadError(null);
    reset();
    onClose();
  };

  const onSubmit = async (values: ApplyLeaveFormValues) => {
    if (isExtraLeave) {
      if (!values.reason || !values.reason.trim()) {
        setError('reason', { type: 'manual', message: 'Reason is mandatory for extra leaves' });
        return;
      }
      if (!selectedFile) {
        setUploadError('Document upload is mandatory for extra leaves');
        return;
      }
    }

    setUploadError(null);

    try {
      let documentUrl: string | undefined = undefined;
      if (selectedFile) {
        documentUrl = await uploadDoc.mutateAsync(selectedFile);
      }

      const payload: LeaveRequestCreate = {
        leaveTypeId: values.leaveTypeId,
        fromDate: values.fromDate,
        toDate: values.toDate,
        reason: values.reason || undefined,
        documentUrl,
        isHalfDay: values.isHalfDay,
        halfDaySession: values.isHalfDay ? values.halfDaySession || undefined : undefined,
      };

      applyLeave.mutate(payload, {
        onSuccess: () => {
          setSelectedFile(null);
          setUploadError(null);
          reset();
          onSuccess();
        },
      });
    } catch (err: any) {
      setUploadError(parseError(err));
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Apply for Leave</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent sx={{ pt: 1 }}>
          <Grid container spacing={2}>
            {/* Leave Type */}
            <Grid size={{ xs: 12 }}>
              <Controller
                name="leaveTypeId"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth size="small" error={!!errors.leaveTypeId}>
                    <InputLabel shrink>Leave Type *</InputLabel>
                    <Select {...field} label="Leave Type *" displayEmpty notched>
                      <MenuItem value="" disabled>
                        <em>Select leave type</em>
                      </MenuItem>
                      {leaveTypes
                        .filter((lt) => lt.isActive)
                        .map((lt) => {
                          const bal = balances.find((b) => b.leaveTypeId === lt.id);
                          return (
                            <MenuItem key={lt.id} value={lt.id}>
                              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                <Box
                                  sx={{
                                    width: 10,
                                    height: 10,
                                    borderRadius: '50%',
                                    bgcolor: lt.color,
                                    flexShrink: 0,
                                  }}
                                />
                                <span>
                                  {lt.name}
                                  {bal !== undefined ? ` (${bal.remaining} days left)` : ''}
                                </span>
                              </Stack>
                            </MenuItem>
                          );
                        })}
                    </Select>
                    {errors.leaveTypeId && (
                      <FormHelperText>{errors.leaveTypeId.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            </Grid>

            {/* From Date */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="fromDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="From Date *"
                    type="date"
                    size="small"
                    fullWidth
                    error={!!errors.fromDate}
                    helperText={errors.fromDate?.message}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                )}
              />
            </Grid>

            {/* To Date */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="toDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="To Date *"
                    type="date"
                    size="small"
                    fullWidth
                    disabled={watchedIsHalfDay}
                    error={!!errors.toDate}
                    helperText={errors.toDate?.message}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                )}
              />
            </Grid>

            {/* Half Day Checkbox */}
            <Grid size={{ xs: 12 }}>
              <Controller
                name="isHalfDay"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={value}
                        onChange={(e) => {
                          onChange(e.target.checked);
                        }}
                      />
                    }
                    label="Apply for Half Day"
                  />
                )}
              />
            </Grid>

            {/* Half Day Session Radio Group */}
            {watchedIsHalfDay && (
              <Grid size={{ xs: 12 }}>
                <FormControl component="fieldset" error={!!errors.halfDaySession}>
                  <FormLabel component="legend" sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    Select Half Day Session *
                  </FormLabel>
                  <Controller
                    name="halfDaySession"
                    control={control}
                    render={({ field }) => (
                      <RadioGroup {...field} row>
                        <FormControlLabel
                          value="FIRST_HALF"
                          control={<Radio size="small" />}
                          label="First Half"
                        />
                        <FormControlLabel
                          value="SECOND_HALF"
                          control={<Radio size="small" />}
                          label="Second Half"
                        />
                      </RadioGroup>
                    )}
                  />
                  {errors.halfDaySession && (
                    <FormHelperText>{errors.halfDaySession.message}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
            )}

            {/* Auto-calculated days */}
            {days > 0 && (
              <Grid size={{ xs: 12 }}>
                <Alert
                  severity={insufficientBalance ? 'warning' : 'info'}
                  sx={{ py: 0.5 }}
                >
                  {days} working day{days !== 1 ? 's' : ''} selected.
                  {insufficientBalance &&
                    ` Warning: you only have ${selectedBalance?.remaining} day(s) remaining for this leave type.`}
                  {!insufficientBalance && selectedBalance !== undefined &&
                    ` ${selectedBalance.remaining} days available.`}
                </Alert>
              </Grid>
            )}

            {/* Reason */}
            <Grid size={{ xs: 12 }}>
              <Controller
                name="reason"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={isExtraLeave ? 'Reason *' : 'Reason (optional)'}
                    size="small"
                    fullWidth
                    multiline
                    rows={3}
                    error={!!errors.reason}
                    helperText={errors.reason?.message}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                )}
              />
            </Grid>

            {/* Document Upload for Extra Leaves */}
            {isExtraLeave && (
              <Grid size={{ xs: 12 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  Verification Document *
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <Button variant="outlined" component="label" size="small" sx={{ textTransform: 'none' }}>
                    Upload File
                    <input
                      type="file"
                      hidden
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          setSelectedFile(e.target.files[0]);
                          setUploadError(null);
                        }
                      }}
                    />
                  </Button>
                  <Typography variant="body2" color="text.secondary">
                    {selectedFile ? selectedFile.name : 'No file selected'}
                  </Typography>
                </Box>
                {uploadError && (
                  <FormHelperText error sx={{ mt: 0.5 }}>
                    {uploadError}
                  </FormHelperText>
                )}
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="outlined" color="inherit" size="small" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            size="small"
            disabled={applyLeave.isPending || uploadDoc.isPending}
          >
            {applyLeave.isPending || uploadDoc.isPending ? 'Submitting…' : 'Submit Application'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

// ==========================================
// MAIN PAGE
// ==========================================

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export const LeaveRequestPage: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<LeaveRequest | null>(null);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const showSnack = (message: string, severity: 'success' | 'error' = 'success') =>
    setSnackbar({ open: true, message, severity });

  const { data: leaveTypes = [] } = useGetLeaveTypes();
  const { data: balances = [], isLoading: balancesLoading } = useGetMyLeaveBalances(currentYear);
  const { data: requests = [], isLoading: requestsLoading } = useGetLeaveRequests({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    year: currentYear,
  });

  const cancelLeave = useCancelLeave();

  const handleCancelConfirm = () => {
    if (!cancelTarget) return;
    cancelLeave.mutate(cancelTarget.id, {
      onSuccess: () => {
        showSnack('Leave request cancelled.');
        setCancelTarget(null);
      },
      onError: (err) => {
        showSnack(parseError(err), 'error');
        setCancelTarget(null);
      },
    });
  };

  // Build balance cards data: join balances with leave types for color info
  const balanceCardData = useMemo(() => {
    return balances.map((bal) => {
      const lt = leaveTypes.find((t) => t.id === bal.leaveTypeId);
      return {
        ...bal,
        color: lt?.color ?? '#1976d2',
        name: bal.leaveTypeName ?? lt?.name ?? bal.leaveTypeCode ?? 'Leave',
        code: bal.leaveTypeCode ?? lt?.code ?? '',
      };
    });
  }, [balances, leaveTypes]);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            My Leaves
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View your leave balances and manage your leave applications
          </Typography>
        </Box>
      </Box>

      {/* Section 1 — Balance Cards */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
          Leave Balances — {currentYear}
        </Typography>

        {balancesLoading ? (
          <Typography variant="body2" color="text.secondary">
            Loading balances…
          </Typography>
        ) : balanceCardData.length === 0 ? (
          <Alert severity="info">No leave balances found for {currentYear}.</Alert>
        ) : (
          <Grid container spacing={2}>
            {balanceCardData.map((bal) => (
              <Grid key={bal.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <BalanceCard
                  name={bal.name}
                  code={bal.code}
                  color={bal.color}
                  remaining={bal.remaining}
                  used={bal.used}
                  totalAllowed={bal.totalAllowed}
                  carriedForward={bal.carriedForward}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Section 2 — Leave Requests Table */}
      <Card>
        <Box
          sx={{
            px: 2,
            pt: 2,
            pb: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Leave Applications
          </Typography>

          <Stack direction="row" spacing={1}>
            {STATUS_FILTERS.map((f) => (
              <Chip
                key={f.value}
                label={f.label}
                size="small"
                onClick={() => setStatusFilter(f.value)}
                color={statusFilter === f.value ? 'primary' : 'default'}
                variant={statusFilter === f.value ? 'filled' : 'outlined'}
                sx={{ cursor: 'pointer', fontWeight: 600 }}
              />
            ))}
          </Stack>
        </Box>

        {requestsLoading ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Loading requests…
            </Typography>
          </Box>
        ) : requests.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No leave applications found.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  {[
                    'Leave Type',
                    'From',
                    'To',
                    'Days',
                    'Reason',
                    'Status',
                    'Applied On',
                    'Actions',
                  ].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {requests.map((req) => {
                  const lt = leaveTypes.find((t) => t.id === req.leaveTypeId);
                  const statusCfg = STATUS_CONFIG[req.status];
                  return (
                    <TableRow key={req.id} hover>
                      <TableCell>
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                          {lt && (
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor: lt.color,
                                flexShrink: 0,
                              }}
                            />
                          )}
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {req.leaveTypeName ?? lt?.name ?? '—'}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{fmtDate(req.fromDate)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{fmtDate(req.toDate)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {req.totalDays}
                        </Typography>
                        {req.isHalfDay && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            ({req.halfDaySession === 'FIRST_HALF' ? 'First Half' : 'Second Half'})
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 180 }}>
                        <Tooltip title={req.reason ?? ''} placement="top">
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: 160,
                            }}
                          >
                            {req.reason || '—'}
                          </Typography>
                        </Tooltip>
                        {req.rejectionReason && (
                          <Typography variant="caption" color="error.main" display="block">
                            Reason: {req.rejectionReason}
                          </Typography>
                        )}
                        {req.documentUrl && (
                          <Box sx={{ mt: 0.5 }}>
                            <Button
                              variant="text"
                              size="small"
                              href={`${(import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1').replace('/api/v1', '')}${req.documentUrl}`}
                              target="_blank"
                              sx={{
                                textTransform: 'none',
                                fontSize: '0.7rem',
                                p: 0,
                                minWidth: 0,
                              }}
                            >
                              Attachment 📎
                            </Button>
                          </Box>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={statusCfg.label}
                          size="small"
                          color={statusCfg.color}
                          sx={{ fontWeight: 600, mb: 0.5 }}
                        />
                        {req.status === 'PENDING' && req.approvalSteps && req.approvalSteps.length > 0 && (
                          <Box sx={{ mt: 0.5 }}>
                            <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: '2px', alignItems: 'center' }}>
                              {req.approvalSteps.map((step: any, sIdx: number) => {
                                let label = `${step.level}. ${step.approver_role_name || 'Approver'}`;
                                if (step.assigned_approver_name) {
                                  label += ` (${step.assigned_approver_name})`;
                                }
                                let color = 'default';
                                if (step.status === 'APPROVED') color = 'success';
                                else if (step.status === 'PENDING') color = 'warning';
                                else if (step.status === 'REJECTED') color = 'error';
                                else if (step.status === 'SKIPPED') color = 'info';

                                return (
                                  <React.Fragment key={step.id}>
                                    <Tooltip title={`Status: ${step.status}`}>
                                      <Chip
                                        label={label}
                                        size="small"
                                        variant={step.status === 'PENDING' ? 'filled' : 'outlined'}
                                        color={color as any}
                                        sx={{ fontSize: '0.65rem', height: '18px' }}
                                      />
                                    </Tooltip>
                                    {sIdx < req.approvalSteps!.length - 1 && (
                                      <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
                                        ➔
                                      </Typography>
                                    )}
                                  </React.Fragment>
                                );
                              })}
                            </Stack>
                          </Box>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                          {fmtDate(req.appliedAt)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {(req.status === 'PENDING' || req.status === 'APPROVED') && (() => {
                          if (!req.fromDate) return false;
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          const parts = req.fromDate.split('-');
                          const targetDate = parts.length === 3 
                            ? new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10))
                            : new Date(req.fromDate);
                          return targetDate >= today;
                        })() && (
                          <Tooltip title="Cancel request">
                            <Button
                              size="small"
                              color="error"
                              variant="outlined"
                              startIcon={<CancelOutlinedIcon fontSize="small" />}
                              onClick={() => setCancelTarget(req)}
                              sx={{ fontSize: '0.7rem' }}
                            >
                              Cancel
                            </Button>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* Floating Apply Leave Button */}
      <Fab
        color="primary"
        variant="extended"
        sx={{ position: 'fixed', bottom: 32, right: 32, zIndex: 1200 }}
        onClick={() => setApplyDialogOpen(true)}
      >
        <AddIcon sx={{ mr: 1 }} />
        Apply Leave
      </Fab>

      {/* Apply Leave Dialog */}
      <ApplyLeaveDialog
        open={applyDialogOpen}
        onClose={() => setApplyDialogOpen(false)}
        onSuccess={() => {
          setApplyDialogOpen(false);
          showSnack('Leave application submitted successfully.');
        }}
      />

      {/* Cancel Confirmation Dialog */}
      <Dialog open={!!cancelTarget} onClose={() => setCancelTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Cancel Leave Request</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to cancel this{' '}
            <strong>{cancelTarget?.leaveTypeName ?? 'leave'}</strong> request (
            {fmtDate(cancelTarget?.fromDate)} – {fmtDate(cancelTarget?.toDate)})?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="outlined" color="inherit" size="small" onClick={() => setCancelTarget(null)}>
            Keep
          </Button>
          <Button
            variant="contained"
            color="error"
            size="small"
            onClick={handleCancelConfirm}
            disabled={cancelLeave.isPending}
          >
            Yes, Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LeaveRequestPage;
