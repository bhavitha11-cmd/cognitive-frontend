import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  Divider,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Stack,
  Alert,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SendIcon from '@mui/icons-material/Send';
import AttachmentIcon from '@mui/icons-material/Attachment';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import HistoryIcon from '@mui/icons-material/History';
import ChatIcon from '@mui/icons-material/Chat';
import { useAuthStore } from '../../../store/useAuthStore';
import {
  useGetTicketDetails,
  useGetStatuses,
  useUpdateTicketStatus,
  useAddComment,
  useCheckIsHandler,
} from '../services/ticketService';

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'open':
      return 'info';
    case 'in progress':
      return 'warning';
    case 'on hold':
      return 'secondary';
    case 'resolved':
      return 'success';
    case 'closed':
      return 'default';
    default:
      return 'default';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority.toLowerCase()) {
    case 'critical':
      return 'error';
    case 'high':
      return 'warning';
    case 'medium':
      return 'info';
    case 'low':
      return 'default';
    default:
      return 'default';
  }
};

export const TicketDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const currentUser = useAuthStore((state) => state.user);
  const roleCodes = useAuthStore((state) => state.roleCodes || []);
  const isSuperAdmin = roleCodes.includes('ADMIN');

  // Queries
  const { data: ticket, isLoading, error } = useGetTicketDetails(id || '');
  const { data: statuses = [] } = useGetStatuses(true);
  const { data: isHandler = false } = useCheckIsHandler();

  // Mutations
  const updateStatusMutation = useUpdateTicketStatus();
  const addCommentMutation = useAddComment();

  // Local UI states
  const [commentText, setCommentText] = useState('');
  const [statusSelect, setStatusSelect] = useState('');
  const [statusReason, setStatusReason] = useState('');
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Set initial status selection when ticket loads
  React.useEffect(() => {
    if (ticket) {
      setStatusSelect(ticket.statusId);
    }
  }, [ticket]);

  const handleDownload = (filename: string) => {
    // Generate full backend download URL
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    const downloadUrl = `${baseUrl}/api/v1/tickets/document/${filename}`;
    window.open(downloadUrl, '_blank');
  };

  const handleStatusUpdate = async () => {
    if (!id || !statusSelect) return;
    try {
      await updateStatusMutation.mutateAsync({ ticketId: id, statusId: statusSelect });
      
      // If a reason is provided, post it as a status-change system comment
      if (statusReason.trim()) {
        const newStatus = statuses.find((s) => s.id === statusSelect);
        const statusText = newStatus ? newStatus.name : 'Updated';
        await addCommentMutation.mutateAsync({
          ticketId: id,
          comment: `[Status changed to ${statusText}] Reason: ${statusReason.trim()}`,
        });
        setStatusReason('');
      }
      
      setMsg({ text: 'Ticket status updated successfully', type: 'success' });
    } catch (err: any) {
      setMsg({ text: err?.response?.data?.detail || err?.message || 'Failed to update status', type: 'error' });
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !commentText.trim()) return;
    try {
      await addCommentMutation.mutateAsync({ ticketId: id, comment: commentText });
      setCommentText('');
    } catch (err: any) {
      setMsg({ text: err?.response?.data?.detail || err?.message || 'Failed to add comment', type: 'error' });
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !ticket) {
    return (
      <Box sx={{ p: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/tickets/my')} sx={{ mb: 2 }}>
          Back to Tickets
        </Button>
        <Alert severity="error">
          Failed to load ticket details: {(error as any)?.message || 'Ticket not found'}
        </Alert>
      </Box>
    );
  }

  const hasStatusUpdatePermission = isSuperAdmin || isHandler;

  return (
    <Box>
      {/* Header / Nav */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => {
            // Smart navigation back to where they came from
            if (hasStatusUpdatePermission) {
              navigate('/tickets/support');
            } else {
              navigate('/tickets/my');
            }
          }}
          sx={{ textTransform: 'none' }}
        >
          Back to Queue
        </Button>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {ticket.ticketNumber}
          </Typography>
          <Chip
            label={ticket.statusName}
            color={getStatusColor(ticket.statusName || '') as any}
            sx={{ fontWeight: 600 }}
          />
          <Chip
            label={ticket.priorityName}
            color={getPriorityColor(ticket.priorityName || '') as any}
            variant="outlined"
            sx={{ fontWeight: 600 }}
          />
        </Stack>
      </Box>

      {msg && (
        <Alert severity={msg.type} sx={{ mb: 3 }} onClose={() => setMsg(null)}>
          {msg.text}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Column: Ticket Details */}
        <Grid item xs={12} md={7}>
          <Card variant="outlined" sx={{ borderRadius: 2, mb: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                {ticket.subject}
              </Typography>

              <Grid container spacing={2} sx={{ mb: 4, bgcolor: '#f8fafc', p: 2, borderRadius: 1.5 }}>
                <Grid item xs={6} sm={4}>
                  <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                    Category
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {ticket.categoryName}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                    Type
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {ticket.ticketTypeName}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                    Raised By
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {ticket.raisedByName}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                    Date Raised
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {new Date(ticket.createdAt).toLocaleDateString()} {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                    Last Updated
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {new Date(ticket.updatedAt).toLocaleDateString()} {new Date(ticket.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                </Grid>
              </Grid>

              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Description
              </Typography>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', color: 'text.primary', mb: 4 }}>
                {ticket.description}
              </Typography>

              {/* Attachments Section */}
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                Attachments ({ticket.attachments.length})
              </Typography>
              {ticket.attachments.length > 0 ? (
                <List sx={{ bgcolor: '#f8fafc', borderRadius: 1.5, border: '1px solid #e2e8f0', p: 0 }}>
                  {ticket.attachments.map((att) => (
                    <ListItem
                      key={att.id}
                      secondaryAction={
                        <Button
                          size="small"
                          startIcon={<CloudDownloadIcon />}
                          onClick={() => handleDownload(att.filename)}
                          sx={{ textTransform: 'none' }}
                        >
                          Download
                        </Button>
                      }
                      sx={{ borderBottom: '1px solid #e2e8f0', '&:last-child': { borderBottom: 'none' } }}
                    >
                      <AttachmentIcon color="action" sx={{ mr: 1.5 }} />
                      <ListItemText
                        primary={att.filename}
                        primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="textSecondary">
                  No attachments uploaded.
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Action/Resolution Panel (For Handlers & Admins) */}
          {hasStatusUpdatePermission && (
            <Card variant="outlined" sx={{ borderRadius: 2, borderLeft: '4px solid #206bc4' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                  Update Ticket Status
                </Typography>
                 <Stack spacing={2}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                      <InputLabel id="status-update-label">Status</InputLabel>
                      <Select
                        labelId="status-update-label"
                        label="Status"
                        value={statusSelect}
                        onChange={(e) => setStatusSelect(e.target.value)}
                      >
                        {statuses.map((s) => (
                          <MenuItem key={s.id} value={s.id}>
                            {s.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Button
                      variant="contained"
                      onClick={handleStatusUpdate}
                      disabled={updateStatusMutation.isPending}
                      sx={{ textTransform: 'none', bgcolor: '#206bc4', px: 3 }}
                    >
                      Apply Status
                    </Button>
                  </Stack>
                  <TextField
                    fullWidth
                    size="small"
                    label="Reason for status change"
                    placeholder="Enter the reason or resolution details..."
                    value={statusReason}
                    onChange={(e) => setStatusReason(e.target.value)}
                  />
                </Stack>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Right Column: Interaction, Comments, and History */}
        <Grid item xs={12} md={5}>
          {/* Comments Panel */}
          <Card variant="outlined" sx={{ borderRadius: 2, mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <ChatIcon color="action" fontSize="small" />
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Comments & Activity Thread
                </Typography>
              </Stack>
              <Divider sx={{ mb: 2 }} />

              {/* Scrollable list of comments */}
              <Box sx={{ maxHeight: 300, overflowY: 'auto', mb: 3, pr: 1 }}>
                {ticket.comments.map((comment) => (
                  <Box
                    key={comment.id}
                    sx={{
                      mb: 2,
                      p: 1.5,
                      borderRadius: 1.5,
                      bgcolor: comment.commentedById === currentUser?.employeeId ? '#f0f7ff' : '#f8fafc',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        {comment.commentedByName}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {new Date(comment.createdAt).toLocaleDateString()} {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: 'text.primary', whiteSpace: 'pre-wrap' }}>
                      {comment.comment}
                    </Typography>
                  </Box>
                ))}
                {ticket.comments.length === 0 && (
                  <Typography variant="body2" color="textSecondary" sx={{ py: 3, textAlign: 'center' }}>
                    No comments posted yet.
                  </Typography>
                )}
              </Box>

              {/* Add Comment Form */}
              <Box component="form" onSubmit={handleCommentSubmit}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  placeholder="Type a comment or response..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  sx={{ mb: 1.5 }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    type="submit"
                    variant="contained"
                    endIcon={<SendIcon />}
                    disabled={!commentText.trim() || addCommentMutation.isPending}
                    sx={{ textTransform: 'none', bgcolor: '#206bc4', px: 3 }}
                  >
                    Post Comment
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Audit History Panel */}
          <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <HistoryIcon color="action" fontSize="small" />
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Ticket History & Audit Log
                </Typography>
              </Stack>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ maxHeight: 250, overflowY: 'auto', pr: 1 }}>
                <List size="small" disablePadding>
                  {ticket.history.map((hist) => {
                    let desc = hist.action;
                    if (hist.fieldName === 'status' && hist.previousValue && hist.newValue) {
                      desc = `Status changed from "${hist.previousValue}" to "${hist.newValue}"`;
                    }
                    return (
                      <ListItem key={hist.id} sx={{ py: 0.75, px: 0, borderBottom: '1px dashed #e2e8f0', '&:last-child': { borderBottom: 'none' } }}>
                        <ListItemText
                          primary={desc}
                          primaryTypographyProps={{ fontSize: '0.8rem', fontWeight: 600, color: 'text.primary' }}
                          secondary={
                            <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.25 }}>
                              By {hist.performedByName} on {new Date(hist.createdAt).toLocaleDateString()} {new Date(hist.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Typography>
                          }
                        />
                      </ListItem>
                    );
                  })}
                  {ticket.history.length === 0 && (
                    <Typography variant="body2" color="textSecondary" sx={{ py: 2, textAlign: 'center' }}>
                      No history items logged.
                    </Typography>
                  )}
                </List>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TicketDetailPage;
