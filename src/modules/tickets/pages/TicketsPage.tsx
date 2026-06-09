import React from 'react';
import { Card, CardContent, Grid, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Button } from '@mui/material';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import QueryBuilderIcon from '@mui/icons-material/QueryBuilder';

export const TicketsPage: React.FC = () => {
  const ticketStats = [
    { title: 'Open Tickets', count: 0, color: '#d63939', icon: <ConfirmationNumberIcon /> },
    { title: 'In Progress Tickets', count: 0, color: '#f59f00', icon: <QueryBuilderIcon /> },
    { title: 'Resolved Tickets', count: 12, color: '#2fb344', icon: <CheckCircleIcon /> },
  ];

  const mockTickets = [
    { id: 'TCK-101', subject: 'Billing error on invoice #32', client: 'Acme Corporation', priority: 'High', status: 'Resolved', date: '2026-05-20' },
    { id: 'TCK-102', subject: 'Integration API timeout issue', client: 'Globex Corporation', priority: 'Medium', status: 'Resolved', date: '2026-05-22' },
    { id: 'TCK-103', subject: 'Unable to edit company phone number', client: 'Veer Industries', priority: 'Low', status: 'Resolved', date: '2026-05-24' },
    { id: 'TCK-104', subject: 'SSO Login Configuration fail', client: 'Hooli Inc', priority: 'High', status: 'Resolved', date: '2026-05-28' },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Tickets
        </Typography>
        <Button variant="contained" color="primary">
          Create Ticket
        </Button>
      </Box>

      {/* Ticket Stat Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {ticketStats.map((stat, idx) => (
          <Grid size={{ xs: 12, sm: 4 }} key={idx}>
            <Card>
              <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="textSecondary" gutterBottom sx={{ fontWeight: 600 }}>
                    {stat.title}
                  </Typography>
                  <Typography variant="h4" sx={{ color: stat.color, fontWeight: 700 }}>
                    {stat.count}
                  </Typography>
                </Box>
                <Box sx={{ color: stat.color, bgcolor: `${stat.color}15`, p: 1.5, borderRadius: 2 }}>
                  {stat.icon}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Tickets Table */}
      <Card sx={{ p: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
          Support Tickets History
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Ticket ID</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Client Name</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mockTickets.map((ticket) => (
                <TableRow key={ticket.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {ticket.id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {ticket.subject}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="textSecondary">
                      {ticket.client}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={ticket.priority}
                      size="small"
                      color={ticket.priority === 'High' ? 'error' : ticket.priority === 'Medium' ? 'warning' : 'default'}
                      sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={ticket.status}
                      size="small"
                      color="success"
                      sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="textSecondary">
                      {ticket.date}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
};

export default TicketsPage;
