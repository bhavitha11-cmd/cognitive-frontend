import React, { useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
} from '@mui/material';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import FilterListIcon from '@mui/icons-material/FilterList';

import { useGetAllLeaveRequests, useApproveLeave } from '../services/leaveService';
import type { LeaveRequest } from '../types';
import { parseError } from '../../../utils/api';

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
  const date = new Date(d.includes('T') ? d : d + 'T12:00:00');
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const fmtDateShort = (d?: string) => {
  if (!d) return '—';
  const date = new Date(d.includes('T') ? d : d + 'T12:00:00');
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

// ==========================================
// REJECT DIALOG
// ==========================================

const rejectSchema = z.object({
  rejectionReason: z.string().min(5, 'Please provide a reason (at least 5 characters)'),
});

type RejectFormValues = z.infer<typeof rejectSchema>;

interface RejectDialogProps {
  open: boolean;
  request: LeaveRequest | null;
  onClose: () => void;
  onConfirm: (id: string, reason: string) => void;
  isPending: boolean;
}

const RejectDialog: React.FC<RejectDialogProps> = ({
  open,
  request,
  onClose,
  onConfirm,
  isPending,
}) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RejectFormValues>({
    resolver: zodResolver(rejectSchema),
    defaultValues: { rejectionReason: '' },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = (values: RejectFormValues) => {
    if (!request) return;
    onConfirm(request.id, values.rejectionReason);
    reset();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Reject Leave Request</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent sx={{ pt: 1 }}>
          {request && (
            <Alert severity="info" sx={{ mb: 2, py: 0.5 }}>
              <strong>{request.employeeName ?? 'Employee'}</strong> — {request.leaveTypeName}{' '}
              ({fmtDateShort(request.fromDate)} – {fmtDateShort(request.toDate)},{' '}
              {request.totalDays} day{request.totalDays !== 1 ? 's' : ''})
            </Alert>
          )}
          <Controller
            name="rejectionReason"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Rejection Reason *"
                size="small"
                fullWidth
                multiline
                rows={3}
                error={!!errors.rejectionReason}
                helperText={errors.rejectionReason?.message}
                slotProps={{ inputLabel: { shrink: true } }}
                placeholder="Explain why this leave request is being rejected…"
              />
            )}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="outlined" color="inherit" size="small" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="error"
            size="small"
            disabled={isPending}
          >
            {isPending ? 'Rejecting…' : 'Reject'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

// ==========================================
// FILTER CHIPS
// ==========================================

const QUICK_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'this_month', label: 'This Month' },
];

// ==========================================
// MAIN PAGE
// ==========================================

export const LeaveApprovalPage: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const [quickFilter, setQuickFilter] = useState<string>('PENDING');
  const [employeeSearch, setEmployeeSearch] = useState('');

  const [rejectTarget, setRejectTarget] = useState<LeaveRequest | null>(null);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const showSnack = (message: string, severity: 'success' | 'error' = 'success') =>
    setSnackbar({ open: true, message, severity });

  const queryParams = useMemo(() => {
    if (quickFilter === 'PENDING') return { status: 'PENDING', year: currentYear };
    if (quickFilter === 'all') return { year: currentYear };
    return { year: currentYear };
  }, [quickFilter, currentYear]);

  const { data: requests = [], isLoading } = useGetAllLeaveRequests(queryParams);
  const approveLeave = useApproveLeave();

  // Client-side filter for "this_month" and employee search
  const filteredRequests = useMemo(() => {
    let data = [...requests];

    if (quickFilter === 'this_month') {
      data = data.filter((r) => {
        const d = new Date(r.fromDate);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });
    }

    if (employeeSearch.trim()) {
      const q = employeeSearch.trim().toLowerCase();
      data = data.filter(
        (r) =>
          r.employeeName?.toLowerCase().includes(q) ||
          r.employeeCode?.toLowerCase().includes(q)
      );
    }

    return data;
  }, [requests, quickFilter, employeeSearch, currentMonth, currentYear]);

  const handleApprove = (req: LeaveRequest) => {
    approveLeave.mutate(
      { id: req.id, action: 'APPROVED' },
      {
        onSuccess: () => showSnack(`Leave approved for ${req.employeeName ?? 'employee'}.`),
        onError: (err) => showSnack(parseError(err), 'error'),
      }
    );
  };

  const handleRejectConfirm = (id: string, reason: string) => {
    approveLeave.mutate(
      { id, action: 'REJECTED', rejectionReason: reason },
      {
        onSuccess: () => {
          showSnack('Leave request rejected.');
          setRejectTarget(null);
        },
        onError: (err) => {
          showSnack(parseError(err), 'error');
          setRejectTarget(null);
        },
      }
    );
  };

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Leave Approvals
            </Typography>
            {pendingCount > 0 && (
              <Chip
                label={`${pendingCount} pending`}
                color="warning"
                size="small"
                sx={{ fontWeight: 700 }}
              />
            )}
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Review and action employee leave requests
          </Typography>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ p: 2, mb: 3 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <FilterListIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
            {QUICK_FILTERS.map((f) => (
              <Chip
                key={f.value}
                label={f.label}
                size="small"
                onClick={() => setQuickFilter(f.value)}
                color={quickFilter === f.value ? 'primary' : 'default'}
                variant={quickFilter === f.value ? 'filled' : 'outlined'}
                sx={{ cursor: 'pointer', fontWeight: 600 }}
              />
            ))}
          </Stack>

          <TextField
            size="small"
            placeholder="Search by employee name or code…"
            value={employeeSearch}
            onChange={(e) => setEmployeeSearch(e.target.value)}
            sx={{ minWidth: 260 }}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Stack>
      </Card>

      {/* Table */}
      <Card>
        {isLoading ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Loading leave requests…
            </Typography>
          </Box>
        ) : filteredRequests.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No leave requests found.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  {[
                    'Employee',
                    'Leave Type',
                    'From',
                    'To',
                    'Days',
                    'Reason',
                    'Applied On',
                    'Status',
                    'Actions',
                  ].map((h) => (
                    <TableCell
                      key={h}
                      sx={{ fontWeight: 700, fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                    >
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRequests.map((req) => {
                  const statusCfg = STATUS_CONFIG[req.status];
                  const isActioning =
                    approveLeave.isPending &&
                    (approveLeave.variables as any)?.id === req.id;
                  return (
                    <TableRow key={req.id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {req.employeeName ?? '—'}
                          </Typography>
                          {req.employeeCode && (
                            <Typography variant="caption" color="text.secondary">
                              {req.employeeCode}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{req.leaveTypeName ?? '—'}</Typography>
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
                      </TableCell>
                      <TableCell sx={{ maxWidth: 160 }}>
                        <Tooltip title={req.reason ?? ''} placement="top">
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: 140,
                            }}
                          >
                            {req.reason || '—'}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                          {fmtDate(req.appliedAt)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={statusCfg.label}
                          size="small"
                          color={statusCfg.color}
                          sx={{ fontWeight: 600 }}
                        />
                        {req.rejectionReason && (
                          <Tooltip title={req.rejectionReason} placement="top">
                            <Typography
                              variant="caption"
                              color="error.main"
                              sx={{ display: 'block', cursor: 'help', mt: 0.25 }}
                            >
                              See reason
                            </Typography>
                          </Tooltip>
                        )}
                      </TableCell>
                      <TableCell>
                        {req.status === 'PENDING' && (
                          <Stack direction="row" spacing={0.5}>
                            <Tooltip title="Approve">
                              <Button
                                size="small"
                                variant="outlined"
                                color="success"
                                startIcon={<CheckCircleOutlinedIcon fontSize="small" />}
                                disabled={isActioning}
                                onClick={() => handleApprove(req)}
                                sx={{ fontSize: '0.7rem', minWidth: 0, px: 1 }}
                              >
                                Approve
                              </Button>
                            </Tooltip>
                            <Tooltip title="Reject">
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                startIcon={<CancelOutlinedIcon fontSize="small" />}
                                disabled={isActioning}
                                onClick={() => setRejectTarget(req)}
                                sx={{ fontSize: '0.7rem', minWidth: 0, px: 1 }}
                              >
                                Reject
                              </Button>
                            </Tooltip>
                          </Stack>
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

      {/* Reject Dialog */}
      <RejectDialog
        open={!!rejectTarget}
        request={rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleRejectConfirm}
        isPending={approveLeave.isPending}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
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

export default LeaveApprovalPage;
