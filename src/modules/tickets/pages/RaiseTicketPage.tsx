import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  CircularProgress,
  Stack,
  IconButton,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DeleteIcon from '@mui/icons-material/Delete';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';

import {
  useGetCategories,
  useGetTicketTypes,
  useGetPriorities,
  useRaiseTicket,
} from '../services/ticketService';
import { api } from '../../../utils/api';

export const RaiseTicketPage: React.FC = () => {
  const navigate = useNavigate();

  // Form states
  const [categoryId, setCategoryId] = useState('');
  const [ticketTypeId, setTicketTypeId] = useState('');
  const [priorityId, setPriorityId] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  
  // Error state
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Queries
  const { data: categories = [], isLoading: loadingCats } = useGetCategories(true);
  const { data: priorities = [], isLoading: loadingPrios } = useGetPriorities(true);
  
  // Dependent ticket types query
  const { data: ticketTypes = [], isLoading: loadingTypes } = useGetTicketTypes(
    categoryId ? categoryId : undefined,
    true
  );

  // Reset ticket type if category changes
  useEffect(() => {
    setTicketTypeId('');
  }, [categoryId]);

  const raiseTicketMutation = useRaiseTicket();



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId || !ticketTypeId || !priorityId || !subject.trim() || !description.trim()) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    setErrorMsg(null);

    try {
      await raiseTicketMutation.mutateAsync({
        categoryId,
        ticketTypeId,
        priorityId,
        subject,
        description,
        attachments: [],
      });

      navigate('/tickets/my');
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.detail || err?.message || 'Failed to submit ticket');
    }
  };

  const isSubmitting = raiseTicketMutation.isPending;

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/tickets/my')}
          sx={{ textTransform: 'none', mb: 2 }}
        >
          Back to My Tickets
        </Button>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <ConfirmationNumberIcon color="primary" sx={{ fontSize: 28 }} />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Raise New Support Ticket
          </Typography>
        </Stack>
      </Box>

      {errorMsg && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrorMsg(null)}>
          {errorMsg}
        </Alert>
      )}

      <Card variant="outlined" sx={{ borderRadius: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Category selector */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth required>
                  <InputLabel id="category-label">Category</InputLabel>
                  <Select
                    labelId="category-label"
                    label="Category"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    disabled={loadingCats}
                  >
                    {categories.map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Type selector (dependent on category) */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth required disabled={!categoryId || loadingTypes}>
                  <InputLabel id="type-label">Ticket Type</InputLabel>
                  <Select
                    labelId="type-label"
                    label="Ticket Type"
                    value={ticketTypeId}
                    onChange={(e) => setTicketTypeId(e.target.value)}
                  >
                    {ticketTypes.map((t) => (
                      <MenuItem key={t.id} value={t.id}>
                        {t.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Subject */}
              <Grid size={12}>
                <TextField
                  fullWidth
                  required
                  label="Subject"
                  placeholder="Summarize your issue..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </Grid>

              {/* Priority selector */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth required>
                  <InputLabel id="priority-label">Priority</InputLabel>
                  <Select
                    labelId="priority-label"
                    label="Priority"
                    value={priorityId}
                    onChange={(e) => setPriorityId(e.target.value)}
                    disabled={loadingPrios}
                  >
                    {priorities.map((p) => (
                      <MenuItem key={p.id} value={p.id}>
                        {p.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Description */}
              <Grid size={12}>
                <TextField
                  fullWidth
                  required
                  multiline
                  rows={6}
                  label="Detailed Description"
                  placeholder="Provide all relevant details here..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </Grid>

              {/* Action Buttons */}
              <Grid size={12}>
                <Stack direction="row" spacing={3} sx={{ justifyContent: 'center', mt: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/tickets/my')}
                    disabled={isSubmitting}
                    sx={{ textTransform: 'none', px: 4 }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={isSubmitting}
                    sx={{ textTransform: 'none', bgcolor: '#206bc4', px: 4 }}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
                  </Button>
                </Stack>
              </Grid>

            </Grid>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default RaiseTicketPage;
