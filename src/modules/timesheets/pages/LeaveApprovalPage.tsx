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
  Tab,
  Tabs,
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

import { useGetPendingApprovals, useGetApprovalHistory, useActionApprovalStep } from '../../settings/services/approvalService';
import type { PendingApprovalInstance } from '../../settings/services/approvalService';
import { parseError } from '../../../utils/api';

// ==========================================
// REJECT DIALOG
// ==========================================

const rejectSchema = z.object({
  rejectionReason: z.string().min(5, 'Please provide a reason (at least 5 characters)'),
});

type RejectFormValues = z.infer<typeof rejectSchema>;

interface RejectDialogProps {
  open: boolean;
  request: PendingApprovalInstance | null;
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
      <DialogTitle sx={{ fontWeight: 700 }}>Reject Approval Request</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent sx={{ pt: 1 }}>
          {request && (
            <Alert severity="info" sx={{ mb: 2, py: 0.5 }}>
              <strong>{request.requesterName ?? 'Employee'}</strong> — {request.detailsSummary}
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
                placeholder="Explain why this request is being rejected…"
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
  { value: 'all', label: 'All Modules' },
  { value: 'LEAVE', label: 'Leaves' },
  { value: 'TIMESHEET', label: 'Timesheets' },
];

// ==========================================
// MAIN PAGE
// ==========================================

export const LeaveApprovalPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [quickFilter, setQuickFilter] = useState<string>('all');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [rejectTarget, setRejectTarget] = useState<PendingApprovalInstance | null>(null);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const showSnack = (message: string, severity: 'success' | 'error' = 'success') =>
    setSnackbar({ open: true, message, severity });

  const { data: pendingApprovals = [], isLoading: pendingLoading, refetch: refetchPending } = useGetPendingApprovals();
  const { data: historyApprovals = [], isLoading: historyLoading } = useGetApprovalHistory();
  const actionMutation = useActionApprovalStep();

  const currentApprovals = activeTab === 'pending' ? pendingApprovals : historyApprovals;
  const isLoading = activeTab === 'pending' ? pendingLoading : historyLoading;

  // Client-side filter for module type and employee search
  const filteredApprovals = useMemo(() => {
    let data = [...currentApprovals];

    if (quickFilter !== 'all') {
      data = data.filter((r) => r.moduleType === quickFilter || (quickFilter === 'TIMESHEET' && (r.moduleType === 'TIME SHEET' || r.moduleType === 'TIME_ENTRY')));
    }

    if (employeeSearch.trim()) {
      const q = employeeSearch.trim().toLowerCase();
      data = data.filter(
        (r) =>
          r.requesterName?.toLowerCase().includes(q) ||
          r.requesterCode?.toLowerCase().includes(q)
      );
    }

    return data;
  }, [currentApprovals, quickFilter, employeeSearch]);

  const handleApprove = (req: PendingApprovalInstance) => {
    actionMutation.mutate(
      { instanceId: req.id, action: 'APPROVED' },
      {
        onSuccess: () => {
          showSnack(`Request approved successfully.`);
          refetchPending();
        },
        onError: (err) => showSnack(parseError(err), 'error'),
      }
    );
  };

  const handleRejectConfirm = (id: string, reason: string) => {
    actionMutation.mutate(
      { instanceId: id, action: 'REJECTED', comments: reason },
      {
        onSuccess: () => {
          showSnack('Request rejected.');
          setRejectTarget(null);
          refetchPending();
        },
        onError: (err) => {
          showSnack(parseError(err), 'error');
          setRejectTarget(null);
        },
      }
    );
  };

  const pendingCount = pendingApprovals.length;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Inbox Approvals
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
            Review and action your pending approval queue resolved by configuration rules.
          </Typography>
        </Box>
      </Box>

      {/* Tabs Header */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)}>
          <Tab label={`Pending Queue (${pendingCount})`} value="pending" sx={{ fontWeight: 700 }} />
          <Tab label="Approval History" value="history" sx={{ fontWeight: 700 }} />
        </Tabs>
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
              Loading requests…
            </Typography>
          </Box>
        ) : filteredApprovals.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {activeTab === 'pending' ? 'No pending approval requests found.' : 'No approval history found.'}
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  {[
                    'Employee',
                    'Module',
                    'Workflow Detail',
                    'Level',
                    'Approver Role Target',
                    'Status',
                    activeTab === 'pending' ? 'Actions' : 'Action Details & Remarks',
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
                {filteredApprovals.map((req) => {
                  const isActioning =
                    actionMutation.isPending &&
                    (actionMutation.variables as any)?.instanceId === req.id;
                  return (
                    <TableRow key={req.id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {req.requesterName ?? '—'}
                          </Typography>
                          {req.requesterCode && (
                            <Typography variant="caption" color="text.secondary">
                              {req.requesterCode}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={req.moduleType} size="small" variant="outlined" color="primary" />
                      </TableCell>
                      <TableCell sx={{ maxWidth: 240 }}>
                        <Typography variant="body2" color="text.primary">
                          {req.detailsSummary || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          Level {req.level}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{req.approverRoleName ?? '—'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={req.status}
                          size="small"
                          color={req.status === 'APPROVED' ? 'success' : req.status === 'REJECTED' ? 'error' : 'warning'}
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell>
                        {activeTab === 'pending' ? (
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
                        ) : (
                          <Box>
                            {req.actionedAt && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                {new Date(req.actionedAt).toLocaleString()}
                              </Typography>
                            )}
                            {req.comments && (
                              <Typography variant="body2" color="text.primary" sx={{ fontStyle: 'italic' }}>
                                "{req.comments}"
                              </Typography>
                            )}
                          </Box>
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
        isPending={actionMutation.isPending}
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
