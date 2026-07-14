import React from 'react';
import { useNavigate } from 'react-router';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Stack,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useGetMyTickets } from '../services/ticketService';

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

export const MyTicketsPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: tickets = [], isLoading, error } = useGetMyTickets();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <ConfirmationNumberIcon color="primary" sx={{ fontSize: 28 }} />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            My Tickets
          </Typography>
        </Stack>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/tickets/raise')}
          sx={{ textTransform: 'none', fontWeight: 600, bgcolor: '#206bc4' }}
        >
          Raise Ticket
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load tickets: {(error as any).message || 'Error'}
        </Alert>
      )}

      <Card variant="outlined" sx={{ borderRadius: 2 }}>
        <CardContent sx={{ p: 0 }}>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Ticket Code</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Subject</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Priority</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Created At</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow key={ticket.id} hover>
                    <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                      {ticket.ticketNumber}
                    </TableCell>
                    <TableCell>{ticket.categoryName}</TableCell>
                    <TableCell>{ticket.ticketTypeName}</TableCell>
                    <TableCell sx={{ fontWeight: 500, maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ticket.subject}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={ticket.priorityName}
                        size="small"
                        color={getPriorityColor(ticket.priorityName || '') as any}
                        variant="outlined"
                        sx={{ fontWeight: 600, height: 22, fontSize: '0.75rem' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={ticket.statusName}
                        size="small"
                        color={getStatusColor(ticket.statusName || '') as any}
                        sx={{ fontWeight: 600, height: 22, fontSize: '0.75rem' }}
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(ticket.createdAt).toLocaleDateString()} {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<VisibilityIcon fontSize="small" />}
                        onClick={() => navigate(`/tickets/${ticket.id}`)}
                        sx={{ textTransform: 'none', py: 0.25 }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {tickets.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                      <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                        No tickets raised yet.
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        If you have any support issues, click the "Raise Ticket" button above to submit a request.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default MyTicketsPage;
