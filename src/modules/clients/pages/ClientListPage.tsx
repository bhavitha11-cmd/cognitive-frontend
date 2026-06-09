import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Box,
  Button,
  Card,
  Grid,
  InputAdornment,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  Chip,
  IconButton,
  Avatar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import { useAppStore } from '../../../store/useAppStore';

export const ClientListPage: React.FC = () => {
  const navigate = useNavigate();
  const clients = useAppStore((state) => state.clients);

  // States for search and filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filter clients
  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.companyName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'allowed' && client.loginAllowed) ||
      (statusFilter === 'denied' && !client.loginAllowed);

    const matchesCategory =
      categoryFilter === 'all' || client.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Paginated data
  const paginatedClients = filteredClients.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box>
      {/* Header and Add Button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Clients
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate('/clients/create')}
        >
          Add Client
        </Button>
      </Box>

      {/* Filter Toolbar */}
      <Card sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              placeholder="Search by client, company, or email..."
              variant="outlined"
              size="small"
              fullWidth
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 2.5 }}>
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
              size="small"
              fullWidth
              displayEmpty
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="allowed">Login Allowed</MenuItem>
              <MenuItem value="denied">Login Denied</MenuItem>
            </Select>
          </Grid>
          <Grid size={{ xs: 6, md: 2.5 }}>
            <Select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(0);
              }}
              size="small"
              fullWidth
              displayEmpty
            >
              <MenuItem value="all">All Categories</MenuItem>
              <MenuItem value="SaaS Enterprise">SaaS Enterprise</MenuItem>
            </Select>
          </Grid>
        </Grid>
      </Card>

      {/* Clients Data Table */}
      <Card>
        <TableContainer>
          <Table sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow>
                <TableCell>Client Details</TableCell>
                <TableCell>Company Name</TableCell>
                <TableCell>Contact Mobile</TableCell>
                <TableCell>Country</TableCell>
                <TableCell>Login Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedClients.map((client) => (
                <TableRow key={client.id} hover>
                  {/* Name and Email details */}
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar
                        sx={{
                          bgcolor: 'primary.main',
                          width: 38,
                          height: 38,
                          fontSize: '0.9rem',
                          fontWeight: 600,
                        }}
                      >
                        {client.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {client.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {client.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  {/* Company Name */}
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {client.companyName}
                    </Typography>
                    {client.website && (
                      <Typography variant="caption" color="primary">
                        {client.website}
                      </Typography>
                    )}
                  </TableCell>

                  {/* Contact Mobile */}
                  <TableCell>
                    <Typography variant="body2" color="textSecondary">
                      {client.mobile}
                    </Typography>
                  </TableCell>

                  {/* Country */}
                  <TableCell>
                    <Typography variant="body2">{client.country}</Typography>
                  </TableCell>

                  {/* Status chip */}
                  <TableCell>
                    {client.loginAllowed ? (
                      <Chip label="Allowed" size="small" color="success" sx={{ fontSize: '0.75rem', fontWeight: 600 }} />
                    ) : (
                      <Chip label="Denied" size="small" color="error" sx={{ fontSize: '0.75rem', fontWeight: 600 }} />
                    )}
                  </TableCell>

                  {/* Action Buttons */}
                  <TableCell align="right">
                    <IconButton size="small" sx={{ color: 'text.secondary' }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {filteredClients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="textSecondary" sx={{ py: 3 }}>
                      No clients match the search/filter criteria.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredClients.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>
    </Box>
  );
};

export default ClientListPage;
