import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  TextField,
  Divider,
  Button,
  IconButton,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Stack,
} from '@mui/material';

import BusinessIcon from '@mui/icons-material/Business';
import HomeIcon from '@mui/icons-material/Home';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import InfoIcon from '@mui/icons-material/Info';

import { useAppStore } from '../../../store/useAppStore';
import api, { parseError } from '../../../utils/api';
import {
  useGetWorkflows,
  useCreateWorkflow,
  useConfigureWorkflowSteps,
  useActivateWorkflow,
} from '../services/approvalService';
import type { ApprovalWorkflow, ApprovalStep } from '../services/approvalService';
import { useGetRoles } from '../../hr/services/hrService';
import {
  useGetLeaveTypes,
  useCreateLeaveType,
  useUpdateLeaveType,
} from '../../timesheets/services/leaveService';
import TicketSettings from '../components/TicketSettings';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { CalendarConfigPage } from '../../master-data/pages/CalendarConfigPage';

type SettingsTab =
  | 'company'
  | 'address'
  | 'profile'
  | 'email'
  | 'approval'
  | 'leave'
  | 'tickets'
  | 'calendar';

export const SettingsPage: React.FC = () => {
  const settings = useAppStore((state) => state.settings);
  const updateSettings = useAppStore((state) => state.updateSettings);

  const [activeTab, setActiveTab] = useState<SettingsTab>('company');

  // Approval Engine States
  const { data: roles = [] } = useGetRoles();
  const { data: workflows = [], refetch: refetchWorkflows } = useGetWorkflows();
  const createWorkflowMutation = useCreateWorkflow();
  const configureStepsMutation = useConfigureWorkflowSteps();
  const activateWorkflowMutation = useActivateWorkflow();

  const [selectedWorkflow, setSelectedWorkflow] = useState<ApprovalWorkflow | null>(null);
  const [workflowSteps, setWorkflowSteps] = useState<ApprovalStep[]>([]);
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [newWorkflowModule, setNewWorkflowModule] = useState('LEAVE');

  // Leave Settings States
  const { data: leaveTypes = [], refetch: refetchLeaveTypes } = useGetLeaveTypes();
  const createLeaveTypeMutation = useCreateLeaveType();
  const updateLeaveTypeMutation = useUpdateLeaveType();

  const [showAddLeaveType, setShowAddLeaveType] = useState(false);
  const [editingLeaveType, setEditingLeaveType] = useState<any | null>(null);

  const [leaveTypeName, setLeaveTypeName] = useState('');
  const [leaveTypeCode, setLeaveTypeCode] = useState('');
  const [leaveTypeDays, setLeaveTypeDays] = useState(0);
  const [leaveTypeRequiresDoc, setLeaveTypeRequiresDoc] = useState(false);
  const [leaveTypeColor, setLeaveTypeColor] = useState('#3B82F6');
  const [leaveTypeDesc, setLeaveTypeDesc] = useState('');
  const [leaveTypeError, setLeaveTypeError] = useState<string | null>(null);
  const [showAddWorkflow, setShowAddWorkflow] = useState(false);
  const [workflowError, setWorkflowError] = useState<string | null>(null);

  // Email Configuration States
  const [configs, setConfigs] = useState<any[]>([]);
  const [loadingConfigs, setLoadingConfigs] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [testRecipient, setTestRecipient] = useState('');
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testingUnsaved, setTestingUnsaved] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    provider: 'microsoft_graph',
    sender_email: '',
    is_active: false,
    smtp_host: 'outlook.office365.com',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    smtp_use_tls: true,
    tenant_id: '',
    client_id: '',
    client_secret: '',
  });

  const [alert, setAlert] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: '',
  });

  const handleCompanyChange = (field: string, value: any) => {
    updateSettings('companySettings', { [field]: value });
  };

  const handleAddressChange = (field: string, value: any) => {
    updateSettings('businessAddress', { [field]: value });
  };

  const handleProfileChange = (field: string, value: any) => {
    updateSettings('profileSettings', { [field]: value });
  };

  const fetchConfigs = async () => {
    setLoadingConfigs(true);
    try {
      const response = await api.get('/settings/email-configurations');
      if (response.data.success) {
        setConfigs(response.data.data.configurations || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch email configurations:', err);
      setAlert({ type: 'error', message: parseError(err) });
    } finally {
      setLoadingConfigs(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'email') {
      fetchConfigs();
      setAlert({ type: null, message: '' });
      setIsEditing(false);
    }
  }, [activeTab]);

  const handleNew = () => {
    setFormData({
      id: '',
      name: '',
      provider: 'microsoft_graph',
      sender_email: '',
      is_active: false,
      smtp_host: 'outlook.office365.com',
      smtp_port: 587,
      smtp_username: '',
      smtp_password: '',
      smtp_use_tls: true,
      tenant_id: '',
      client_id: '',
      client_secret: '',
    });
    setTestRecipient('');
    setAlert({ type: null, message: '' });
    setIsEditing(true);
  };

  const handleEdit = (config: any) => {
    setFormData({
      id: config.id,
      name: config.name,
      provider: config.provider,
      sender_email: config.sender_email,
      is_active: config.is_active,
      smtp_host: config.smtp_host || 'outlook.office365.com',
      smtp_port: config.smtp_port || 587,
      smtp_username: config.smtp_username || '',
      smtp_password: '', // masked for security
      smtp_use_tls: config.smtp_use_tls !== undefined ? config.smtp_use_tls : true,
      tenant_id: config.tenant_id || '',
      client_id: config.client_id || '',
      client_secret: '', // masked for security
    });
    setTestRecipient('');
    setAlert({ type: null, message: '' });
    setIsEditing(true);
  };

  const handleActivate = async (id: string) => {
    setActionLoading(true);
    setAlert({ type: null, message: '' });
    try {
      const response = await api.post(`/settings/email-configurations/${id}/activate`);
      if (response.data.success) {
        setAlert({ type: 'success', message: response.data.message });
        fetchConfigs();
      }
    } catch (err: any) {
      setAlert({ type: 'error', message: parseError(err) });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete configuration "${name}"?`)) {
      return;
    }
    setActionLoading(true);
    setAlert({ type: null, message: '' });
    try {
      const response = await api.delete(`/settings/email-configurations/${id}`);
      if (response.data.success) {
        setAlert({ type: 'success', message: `Configuration "${name}" deleted.` });
        fetchConfigs();
      }
    } catch (err: any) {
      setAlert({ type: 'error', message: parseError(err) });
    } finally {
      setActionLoading(false);
    }
  };

  const handleTestSaved = async (id: string) => {
    setTestingId(id);
    setAlert({ type: null, message: '' });
    try {
      const response = await api.post(`/settings/email-configurations/${id}/test`);
      if (response.data.success) {
        setAlert({
          type: 'success',
          message: `Test successful! A verification email has been sent to: ${response.data.data.recipient}`,
        });
        fetchConfigs();
      } else {
        setAlert({
          type: 'error',
          message: `Test failed: ${response.data.message}`,
        });
      }
    } catch (err: any) {
      setAlert({ type: 'error', message: `Test connection failed: ${parseError(err)}` });
    } finally {
      setTestingId(null);
    }
  };

  const handleTestUnsaved = async () => {
    if (!formData.sender_email) {
      setAlert({ type: 'error', message: 'Sender email is required to run test connection.' });
      return;
    }
    setTestingUnsaved(true);
    setAlert({ type: null, message: '' });
    try {
      const payload = {
        name: formData.name || 'Test Configuration',
        provider: formData.provider,
        sender_email: formData.sender_email,
        smtp_host: formData.smtp_host,
        smtp_port: formData.smtp_port ? Number(formData.smtp_port) : null,
        smtp_username: formData.smtp_username,
        smtp_password: formData.smtp_password || null,
        smtp_use_tls: formData.smtp_use_tls,
        tenant_id: formData.tenant_id,
        client_id: formData.client_id,
        client_secret: formData.client_secret || null,
        test_recipient: testRecipient || null,
      };
      const response = await api.post('/settings/email-configurations/test', payload);
      if (response.data.success) {
        setAlert({
          type: 'success',
          message: `Test connection successful! Verification email sent to: ${response.data.data.recipient}`,
        });
      } else {
        setAlert({
          type: 'error',
          message: `Test failed: ${response.data.message}`,
        });
      }
    } catch (err: any) {
      setAlert({ type: 'error', message: `Test connection failed: ${parseError(err)}` });
    } finally {
      setTestingUnsaved(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setAlert({ type: null, message: '' });
    try {
      const payload: any = {
        name: formData.name,
        provider: formData.provider,
        sender_email: formData.sender_email,
        is_active: formData.is_active,
      };

      if (formData.provider === 'smtp') {
        payload.smtp_host = formData.smtp_host;
        payload.smtp_port = formData.smtp_port ? Number(formData.smtp_port) : null;
        payload.smtp_username = formData.smtp_username;
        if (formData.smtp_password) {
          payload.smtp_password = formData.smtp_password;
        }
        payload.smtp_use_tls = formData.smtp_use_tls;
      } else {
        payload.tenant_id = formData.tenant_id;
        payload.client_id = formData.client_id;
        if (formData.client_secret) {
          payload.client_secret = formData.client_secret;
        }
      }

      let response;
      if (formData.id) {
        response = await api.put(`/settings/email-configurations/${formData.id}`, payload);
      } else {
        response = await api.post('/settings/email-configurations', payload);
      }

      if (response.data.success) {
        setAlert({
          type: 'success',
          message: `Email configuration "${formData.name}" saved successfully.`,
        });
        setIsEditing(false);
        fetchConfigs();
      }
    } catch (err: any) {
      setAlert({ type: 'error', message: parseError(err) });
    } finally {
      setActionLoading(false);
    }
  };

  const tabsList = [
    { id: 'company' as const, label: 'Company Settings', icon: <BusinessIcon /> },
    { id: 'address' as const, label: 'Business Address', icon: <HomeIcon /> },
    { id: 'profile' as const, label: 'Profile Settings', icon: <PersonIcon /> },
    { id: 'email' as const, label: 'Email Integration', icon: <EmailIcon /> },
    { id: 'approval' as const, label: 'Approval Workflows', icon: <CheckCircleIcon /> },
    { id: 'leave' as const, label: 'Leave Settings', icon: <InfoIcon /> },
    { id: 'tickets' as const, label: 'Ticket Management', icon: <ConfirmationNumberIcon /> },
    { id: 'calendar' as const, label: 'Calendar Configuration', icon: <CalendarMonthIcon /> },
  ];

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
        Settings
      </Typography>

      <Grid container spacing={3}>
        {/* Left vertical settings tabs */}
        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <List disablePadding>
              {tabsList.map((tab) => (
                <ListItem disablePadding key={tab.id}>
                  <ListItemButton
                    selected={activeTab === tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    sx={{
                      py: 1.5,
                      '&.Mui-selected': {
                        borderLeft: '4px solid #206bc4',
                        bgcolor: 'primary.light',
                        color: 'primary.main',
                        '& .MuiListItemIcon-root': { color: 'primary.main' },
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36, color: 'text.secondary' }}>{tab.icon}</ListItemIcon>
                    <ListItemText primary={<Typography sx={{ fontSize: '0.875rem', fontWeight: 500 }}>{tab.label}</Typography>} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Card>
        </Grid>

        {/* Right Settings Form Details */}
        <Grid size={{ xs: 12, md: 9 }}>
          <Card sx={{ minHeight: 450 }}>
            <CardContent sx={{ p: 3 }}>
              {alert.type && (
                <Alert severity={alert.type} sx={{ mb: 3 }} onClose={() => setAlert({ type: null, message: '' })}>
                  {alert.message}
                </Alert>
              )}

              {/* Tab 1: Company Settings */}
              {activeTab === 'company' && (
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }} gutterBottom>
                    Company Settings
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Company Name"
                        value={settings.companySettings.companyName}
                        onChange={(e) => handleCompanyChange('companyName', e.target.value)}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Contact Person"
                        value={settings.companySettings.contactPerson}
                        onChange={(e) => handleCompanyChange('contactPerson', e.target.value)}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Email Address"
                        value={settings.companySettings.email}
                        onChange={(e) => handleCompanyChange('email', e.target.value)}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Phone Number"
                        value={settings.companySettings.phone}
                        onChange={(e) => handleCompanyChange('phone', e.target.value)}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        label="Website"
                        value={settings.companySettings.website}
                        onChange={(e) => handleCompanyChange('website', e.target.value)}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Tab 2: Business Address */}
              {activeTab === 'address' && (
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }} gutterBottom>
                    Business Address
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        label="Address"
                        value={settings.businessAddress.address}
                        onChange={(e) => handleAddressChange('address', e.target.value)}
                        fullWidth
                        multiline
                        rows={2}
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="City"
                        value={settings.businessAddress.city}
                        onChange={(e) => handleAddressChange('city', e.target.value)}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="State"
                        value={settings.businessAddress.state}
                        onChange={(e) => handleAddressChange('state', e.target.value)}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Postal Code"
                        value={settings.businessAddress.postalCode}
                        onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Country"
                        value={settings.businessAddress.country}
                        onChange={(e) => handleAddressChange('country', e.target.value)}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Tab 3: Profile Settings */}
              {activeTab === 'profile' && (
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }} gutterBottom>
                    Profile Settings
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Your Name"
                        value={settings.profileSettings.name}
                        onChange={(e) => handleProfileChange('name', e.target.value)}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Email Address"
                        value={settings.profileSettings.email}
                        onChange={(e) => handleProfileChange('email', e.target.value)}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        label="Contact Phone"
                        value={settings.profileSettings.phone}
                        onChange={(e) => handleProfileChange('phone', e.target.value)}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Tab 4: Email Integration */}
              {activeTab === 'email' && (
                <Box>
                  {!isEditing ? (
                    // Configuration List View
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                          Microsoft 365 Email Integrations
                        </Typography>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={handleNew}
                          disabled={actionLoading}
                          sx={{ textTransform: 'none', bgcolor: '#206bc4' }}
                        >
                          Add Mailbox
                        </Button>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Configure Microsoft 365 accounts to send transactional emails directly from your company mailboxes.
                      </Typography>
                      <Divider sx={{ mb: 3 }} />

                      {loadingConfigs ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                          <CircularProgress size={32} />
                        </Box>
                      ) : configs.length === 0 ? (
                        <Box sx={{ py: 6, textAlignment: 'center', border: '1px dashed #e2e8f0', borderRadius: 2 }}>
                          <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center' }}>
                            No mailboxes configured. Click "Add Mailbox" to connect a Microsoft 365 account.
                          </Typography>
                        </Box>
                      ) : (
                        <TableContainer component={Paper} elevation={0} variant="outlined">
                          <Table size="small">
                            <TableHead sx={{ bgcolor: '#f8fafc' }}>
                              <TableRow>
                                <TableCell sx={{ fontWeight: 600 }}>Mailbox Name</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Provider</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Sender Address</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Connection Status</TableCell>
                                <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {configs.map((config) => (
                                <TableRow key={config.id} hover>
                                  <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        {config.name}
                                      </Typography>
                                      {config.is_active && (
                                        <Chip label="Active" size="small" color="primary" sx={{ height: 20, fontSize: '0.7rem' }} />
                                      )}
                                    </Box>
                                  </TableCell>
                                  <TableCell>
                                    {config.provider === 'microsoft_graph' ? 'Microsoft Graph (OAuth)' : 'SMTP Server'}
                                  </TableCell>
                                  <TableCell>{config.sender_email}</TableCell>
                                  <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      {config.connection_status === 'connected' && (
                                        <Tooltip title={`Last tested: ${config.last_tested_at ? new Date(config.last_tested_at).toLocaleString() : 'N/A'}`}>
                                          <Chip
                                            icon={<CheckCircleIcon style={{ color: '#2e7d32', fontSize: 14 }} />}
                                            label="Connected"
                                            size="small"
                                            sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', height: 22, fontWeight: 500 }}
                                          />
                                        </Tooltip>
                                      )}
                                      {config.connection_status === 'failed' && (
                                        <Tooltip
                                          title={
                                            <Box>
                                              <Typography variant="caption" display="block">Connection failed. Error detail:</Typography>
                                              <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{config.error_message}</Typography>
                                            </Box>
                                          }
                                          arrow
                                        >
                                          <Chip
                                            icon={<ErrorIcon style={{ color: '#d32f2f', fontSize: 14 }} />}
                                            label="Failed"
                                            size="small"
                                            sx={{ bgcolor: '#ffebee', color: '#d32f2f', height: 22, fontWeight: 500, cursor: 'help' }}
                                          />
                                        </Tooltip>
                                      )}
                                      {config.connection_status === 'untested' && (
                                        <Chip
                                          label="Untested"
                                          size="small"
                                          sx={{ bgcolor: '#f1f5f9', color: '#64748b', height: 22, fontWeight: 500 }}
                                        />
                                      )}
                                    </Box>
                                  </TableCell>
                                  <TableCell align="right">
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                                      {!config.is_active && (
                                        <Button
                                          size="small"
                                          variant="text"
                                          disabled={actionLoading}
                                          onClick={() => handleActivate(config.id)}
                                          sx={{ fontSize: '0.75rem', py: 0, textTransform: 'none' }}
                                        >
                                          Set Active
                                        </Button>
                                      )}
                                      <Tooltip title="Test Connection">
                                        <IconButton
                                          size="small"
                                          onClick={() => handleTestSaved(config.id)}
                                          disabled={testingId !== null || actionLoading}
                                        >
                                          {testingId === config.id ? <CircularProgress size={16} /> : <RefreshIcon fontSize="small" />}
                                        </IconButton>
                                      </Tooltip>
                                      <Tooltip title="Edit">
                                        <IconButton size="small" onClick={() => handleEdit(config)} disabled={actionLoading}>
                                          <EditIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                      <Tooltip title="Delete">
                                        <IconButton
                                          size="small"
                                          onClick={() => handleDelete(config.id, config.name)}
                                          disabled={config.is_active || actionLoading}
                                        >
                                          <DeleteIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                    </Box>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}
                    </Box>
                  ) : (
                    // Add/Edit Form View
                    <Box component="form" onSubmit={handleSave}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <IconButton size="small" onClick={() => setIsEditing(false)} disabled={actionLoading}>
                          <ArrowBackIcon />
                        </IconButton>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                          {formData.id ? 'Edit Mailbox Connection' : 'Connect Microsoft 365 Mailbox'}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, ml: 4 }}>
                        {formData.id ? 'Modify parameters for this email mailbox connection.' : 'Configure connection details for Azure App OAuth or secure SMTP.'}
                      </Typography>
                      <Divider sx={{ mb: 3 }} />

                      <Grid container spacing={3}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            label="Configuration Name"
                            placeholder="e.g. Primary Company Mailbox"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            fullWidth
                            size="small"
                            disabled={actionLoading}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <FormControl fullWidth size="small" required>
                            <InputLabel id="provider-label">Connection Protocol</InputLabel>
                            <Select
                              labelId="provider-label"
                              label="Connection Protocol"
                              value={formData.provider}
                              onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                              disabled={actionLoading}
                            >
                              <MenuItem value="microsoft_graph">Microsoft Graph API (Recommended)</MenuItem>
                              <MenuItem value="smtp">SMTP (Office 365 Server)</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            label="Sender Email Address"
                            placeholder="e.g. notifications@yourcompany.com"
                            value={formData.sender_email}
                            onChange={(e) => setFormData({ ...formData, sender_email: e.target.value })}
                            required
                            fullWidth
                            size="small"
                            type="email"
                            disabled={actionLoading}
                            helperText="This email will be used as the From address."
                          />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex', alignItems: 'center' }}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={formData.is_active}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                disabled={actionLoading}
                              />
                            }
                            label="Set as active mailbox configuration"
                          />
                        </Grid>

                        {/* Microsoft Graph API Credentials */}
                        {formData.provider === 'microsoft_graph' && (
                          <React.Fragment>
                            <Grid size={{ xs: 12 }}>
                              <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 1, border: '1px solid #e2e8f0', display: 'flex', gap: 1.5 }}>
                                <InfoIcon color="primary" sx={{ mt: 0.2 }} />
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Microsoft Graph API Prerequisites:</Typography>
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    Requires an Azure AD app registration with <strong>Mail.Send</strong> application permission granted in Microsoft Entra Admin Center.
                                  </Typography>
                                </Box>
                              </Box>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <TextField
                                label="Tenant ID (Directory ID)"
                                value={formData.tenant_id}
                                onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value })}
                                required
                                fullWidth
                                size="small"
                                disabled={actionLoading}
                              />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <TextField
                                label="Client ID (Application ID)"
                                value={formData.client_id}
                                onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                                required
                                fullWidth
                                size="small"
                                disabled={actionLoading}
                              />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                              <TextField
                                label="Client Secret"
                                type="password"
                                placeholder={formData.id ? '••••••••' : 'Azure Client Secret Key'}
                                value={formData.client_secret}
                                onChange={(e) => setFormData({ ...formData, client_secret: e.target.value })}
                                required={!formData.id}
                                fullWidth
                                size="small"
                                disabled={actionLoading}
                                helperText={formData.id ? 'Leave blank to retain current saved secret key.' : ''}
                              />
                            </Grid>
                          </React.Fragment>
                        )}

                        {/* SMTP Credentials */}
                        {formData.provider === 'smtp' && (
                          <React.Fragment>
                            <Grid size={{ xs: 12, sm: 8 }}>
                              <TextField
                                label="SMTP Server Host"
                                value={formData.smtp_host}
                                onChange={(e) => setFormData({ ...formData, smtp_host: e.target.value })}
                                required
                                fullWidth
                                size="small"
                                disabled={actionLoading}
                              />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                              <TextField
                                label="SMTP Port"
                                value={formData.smtp_port}
                                onChange={(e) => setFormData({ ...formData, smtp_port: Number(e.target.value) || '' })}
                                required
                                fullWidth
                                size="small"
                                type="number"
                                disabled={actionLoading}
                              />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <TextField
                                label="SMTP Username"
                                placeholder="Username (often same as sender email)"
                                value={formData.smtp_username}
                                onChange={(e) => setFormData({ ...formData, smtp_username: e.target.value })}
                                required
                                fullWidth
                                size="small"
                                disabled={actionLoading}
                              />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <TextField
                                label="SMTP Password"
                                type="password"
                                placeholder={formData.id ? '••••••••' : 'Mailbox password'}
                                value={formData.smtp_password}
                                onChange={(e) => setFormData({ ...formData, smtp_password: e.target.value })}
                                required={!formData.id}
                                fullWidth
                                size="small"
                                disabled={actionLoading}
                                helperText={formData.id ? 'Leave blank to retain current saved password.' : ''}
                              />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                              <FormControlLabel
                                control={
                                  <Switch
                                    checked={formData.smtp_use_tls}
                                    onChange={(e) => setFormData({ ...formData, smtp_use_tls: e.target.checked })}
                                    disabled={actionLoading}
                                  />
                                }
                                label="Use STARTTLS Secure Connection"
                              />
                            </Grid>
                          </React.Fragment>
                        )}
                      </Grid>

                      {/* Connection Test Section */}
                      <Box sx={{ mt: 4, p: 2, border: '1px solid #e2e8f0', borderRadius: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                          Verify Mailbox Connectivity
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                          Test sending a real email using these connection parameters before saving them to the database.
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                          <TextField
                            label="Test Recipient Email"
                            placeholder="Recipient email address"
                            size="small"
                            type="email"
                            value={testRecipient}
                            onChange={(e) => setTestRecipient(e.target.value)}
                            disabled={testingUnsaved || actionLoading}
                            sx={{ minWidth: 260 }}
                            helperText="Defaults to your account email if left blank."
                          />
                          <Button
                            variant="outlined"
                            size="medium"
                            onClick={handleTestUnsaved}
                            disabled={testingUnsaved || actionLoading}
                            sx={{ textTransform: 'none', height: 40 }}
                            startIcon={testingUnsaved ? <CircularProgress size={16} /> : <RefreshIcon />}
                          >
                            {testingUnsaved ? 'Testing...' : 'Test Connection'}
                          </Button>
                        </Box>
                      </Box>

                      {/* Footer actions */}
                      <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                        <Button
                          variant="text"
                          onClick={() => setIsEditing(false)}
                          disabled={actionLoading || testingUnsaved}
                          sx={{ textTransform: 'none' }}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="contained"
                          type="submit"
                          disabled={actionLoading || testingUnsaved}
                          sx={{ textTransform: 'none', bgcolor: '#206bc4' }}
                          startIcon={actionLoading ? <CircularProgress size={16} color="inherit" /> : null}
                        >
                          {actionLoading ? 'Saving...' : 'Save Configuration'}
                        </Button>
                      </Box>
                    </Box>
                  )}
                </Box>
              )}

              {/* Tab 5: Approval Workflows */}
              {activeTab === 'approval' && (
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }} gutterBottom>
                    Approval Workflows
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Configure multi-level approval workflows for ERP modules (such as Leaves). The system resolves approvers dynamically based on the resolution scopes and the applicant's role.
                  </Typography>
                  <Divider sx={{ mb: 3 }} />

                  {workflowError && (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setWorkflowError(null)}>
                      {workflowError}
                    </Alert>
                  )}

                  {!selectedWorkflow ? (
                    <Box>
                      {/* Workflows List */}
                      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          Workflow Definitions
                        </Typography>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={() => setShowAddWorkflow(true)}
                          sx={{ textTransform: 'none', bgcolor: '#206bc4' }}
                        >
                          New Workflow
                        </Button>
                      </Box>

                      {showAddWorkflow && (
                        <Card sx={{ mb: 3, bgcolor: '#f8f9fa' }}>
                          <CardContent>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                              Create Approval Workflow
                            </Typography>
                            <Grid container spacing={2} sx={{ alignItems: 'center' }}>
                              <Grid size={{ xs: 12, sm: 5 }}>
                                <TextField
                                  label="Workflow Name"
                                  size="small"
                                  fullWidth
                                  value={newWorkflowName}
                                  onChange={(e) => setNewWorkflowName(e.target.value)}
                                />
                              </Grid>
                              <Grid size={{ xs: 12, sm: 4 }}>
                                <FormControl fullWidth size="small">
                                  <InputLabel>Module Type</InputLabel>
                                  <Select
                                    value={newWorkflowModule}
                                    label="Module Type"
                                    onChange={(e) => setNewWorkflowModule(e.target.value)}
                                  >
                                    <MenuItem value="LEAVE">Leave Management</MenuItem>
                                    <MenuItem value="TIMESHEET">Timesheet Approval</MenuItem>
                                    <MenuItem value="ATTENDANCE_CORRECTION">Attendance Correction</MenuItem>
                                  </Select>
                                </FormControl>
                              </Grid>
                              <Grid size={{ xs: 12, sm: 3 }} sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                  variant="contained"
                                  size="small"
                                  sx={{ bgcolor: '#206bc4', textTransform: 'none' }}
                                  onClick={async () => {
                                    if (!newWorkflowName.trim()) return;
                                    try {
                                      await createWorkflowMutation.mutateAsync({
                                        name: newWorkflowName,
                                        moduleType: newWorkflowModule,
                                      });
                                      setNewWorkflowName('');
                                      setShowAddWorkflow(false);
                                      refetchWorkflows();
                                    } catch (err: any) {
                                      setWorkflowError(parseError(err));
                                    }
                                  }}
                                >
                                  Create
                                </Button>
                                <Button
                                  variant="text"
                                  size="small"
                                  onClick={() => setShowAddWorkflow(false)}
                                  sx={{ textTransform: 'none' }}
                                >
                                  Cancel
                                </Button>
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      )}

                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Module</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Version</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {workflows.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                  No workflows configured yet.
                                </TableCell>
                              </TableRow>
                            ) : (
                              workflows.map((wf) => (
                                <TableRow key={wf.id}>
                                  <TableCell sx={{ fontWeight: 500 }}>{wf.name}</TableCell>
                                  <TableCell>
                                    <Chip label={wf.moduleType} size="small" variant="outlined" color="primary" />
                                  </TableCell>
                                  <TableCell>v{wf.version}</TableCell>
                                  <TableCell>
                                    {wf.isActive ? (
                                      <Chip label="Active" color="success" size="small" />
                                    ) : (
                                      <Chip label="Draft" color="default" size="small" variant="outlined" />
                                    )}
                                  </TableCell>
                                  <TableCell align="right">
                                    <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                                      {!wf.isActive && (
                                        <Button
                                          size="small"
                                          variant="text"
                                          sx={{ textTransform: 'none', color: '#2e7d32' }}
                                          onClick={async () => {
                                            try {
                                              await activateWorkflowMutation.mutateAsync(wf.id);
                                              refetchWorkflows();
                                            } catch (err: any) {
                                              setWorkflowError(parseError(err));
                                            }
                                          }}
                                        >
                                          Activate
                                        </Button>
                                      )}
                                      <Button
                                        size="small"
                                        variant="text"
                                        sx={{ textTransform: 'none' }}
                                        onClick={() => {
                                          setSelectedWorkflow(wf);
                                          setWorkflowSteps(wf.steps || []);
                                        }}
                                      >
                                        Configure Steps
                                      </Button>
                                    </Stack>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  ) : (
                    <Box>
                      {/* Step Configuration Panel */}
                      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton size="small" onClick={() => setSelectedWorkflow(null)}>
                          <ArrowBackIcon fontSize="small" />
                        </IconButton>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          Configure Steps: {selectedWorkflow.name} (v{selectedWorkflow.version})
                        </Typography>
                      </Box>

                      <Alert severity="info" sx={{ mb: 3 }}>
                        Specify the approval levels. Continuous sequential levels starting from 1 are required.
                      </Alert>

                      <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                        <Table size="small">
                          <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                            <TableRow>
                              <TableCell sx={{ width: '80px', fontWeight: 600 }}>Level</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Applicant Role</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Approver Role</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Resolution Scope</TableCell>
                              <TableCell align="right" sx={{ width: '80px', fontWeight: 600 }}>Actions</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {workflowSteps.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                  No steps added. Click "Add Step" below to configure approvals.
                                </TableCell>
                              </TableRow>
                            ) : (
                              workflowSteps.map((step, idx) => (
                                <TableRow key={idx}>
                                  <TableCell>
                                    <TextField
                                      type="number"
                                      size="small"
                                      value={step.level}
                                      onChange={(e) => {
                                        const val = Number(e.target.value);
                                        const updated = [...workflowSteps];
                                        updated[idx].level = val;
                                        setWorkflowSteps(updated);
                                      }}
                                      fullWidth
                                      slotProps={{ htmlInput: { min: 1 } }}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <FormControl fullWidth size="small">
                                      <Select
                                        value={step.requesterRoleId}
                                        onChange={(e) => {
                                          const updated = [...workflowSteps];
                                          updated[idx].requesterRoleId = e.target.value;
                                          setWorkflowSteps(updated);
                                        }}
                                      >
                                        {roles.map((r) => (
                                          <MenuItem key={r.id} value={r.id}>
                                            {r.name}
                                          </MenuItem>
                                        ))}
                                      </Select>
                                    </FormControl>
                                  </TableCell>
                                  <TableCell>
                                    <FormControl fullWidth size="small">
                                      <Select
                                        value={step.approverRoleId}
                                        onChange={(e) => {
                                          const updated = [...workflowSteps];
                                          updated[idx].approverRoleId = e.target.value;
                                          setWorkflowSteps(updated);
                                        }}
                                      >
                                        {roles.map((r) => (
                                          <MenuItem key={r.id} value={r.id}>
                                            {r.name}
                                          </MenuItem>
                                        ))}
                                      </Select>
                                    </FormControl>
                                  </TableCell>
                                  <TableCell>
                                    <FormControl fullWidth size="small">
                                      <Select
                                        value={step.resolutionScope}
                                        onChange={(e) => {
                                          const updated = [...workflowSteps];
                                          updated[idx].resolutionScope = e.target.value as any;
                                          setWorkflowSteps(updated);
                                        }}
                                      >
                                        <MenuItem value="REPORTING_HIERARCHY">Reporting Hierarchy</MenuItem>
                                        <MenuItem value="TEAM_ASSIGNMENT">Team Assignment</MenuItem>
                                        <MenuItem value="DEPARTMENT_ASSIGNMENT">Department Assignment</MenuItem>
                                        <MenuItem value="GLOBAL">Global Pool</MenuItem>
                                      </Select>
                                    </FormControl>
                                  </TableCell>
                                  <TableCell align="right">
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => {
                                        const updated = workflowSteps.filter((_, sIdx) => sIdx !== idx);
                                        setWorkflowSteps(updated);
                                      }}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={() => {
                            const nextLevel =
                              workflowSteps.length > 0
                                ? Math.max(...workflowSteps.map((s) => s.level)) + 1
                                : 1;
                            setWorkflowSteps([
                              ...workflowSteps,
                              {
                                requesterRoleId: roles[0]?.id || '',
                                level: nextLevel,
                                approverRoleId: roles[0]?.id || '',
                                resolutionScope: 'REPORTING_HIERARCHY',
                              },
                            ]);
                          }}
                          sx={{ textTransform: 'none' }}
                        >
                          Add Step
                        </Button>
                        <Stack direction="row" spacing={2}>
                          <Button
                            variant="text"
                            size="small"
                            onClick={() => setSelectedWorkflow(null)}
                            sx={{ textTransform: 'none' }}
                          >
                            Back
                          </Button>
                          <Button
                            variant="contained"
                            size="small"
                            onClick={async () => {
                              try {
                                await configureStepsMutation.mutateAsync({
                                  workflowId: selectedWorkflow.id,
                                  steps: workflowSteps,
                                });
                                setSelectedWorkflow(null);
                                refetchWorkflows();
                              } catch (err: any) {
                                setWorkflowError(parseError(err));
                              }
                            }}
                            sx={{ textTransform: 'none', bgcolor: '#206bc4' }}
                          >
                            Save Steps
                          </Button>
                        </Stack>
                      </Box>
                    </Box>
                  )}
                </Box>
              )}

              {/* Tab 6: Leave Settings */}
              {activeTab === 'leave' && (
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }} gutterBottom>
                    Leave Settings
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Manage leave categories, yearly allocations, and dynamic document upload requirements. Changes to allocations will apply when employees' balances are initialized.
                  </Typography>
                  <Divider sx={{ mb: 3 }} />

                  {leaveTypeError && (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setLeaveTypeError(null)}>
                      {leaveTypeError}
                    </Alert>
                  )}

                  {!editingLeaveType && !showAddLeaveType ? (
                    <Box>
                      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          Leave Categories
                        </Typography>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={() => {
                            setLeaveTypeName('');
                            setLeaveTypeCode('');
                            setLeaveTypeDays(12);
                            setLeaveTypeRequiresDoc(false);
                            setLeaveTypeColor('#3B82F6');
                            setLeaveTypeDesc('');
                            setShowAddLeaveType(true);
                          }}
                          sx={{ textTransform: 'none', bgcolor: '#206bc4' }}
                        >
                          Add Category
                        </Button>
                      </Box>

                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Code</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Yearly Days</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Requires Document</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Carry Forward</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {leaveTypes.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                  No leave categories configured.
                                </TableCell>
                              </TableRow>
                            ) : (
                              leaveTypes.map((lt) => (
                                <TableRow key={lt.id}>
                                  <TableCell>
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
                                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        {lt.name}
                                      </Typography>
                                    </Stack>
                                  </TableCell>
                                  <TableCell sx={{ fontWeight: 600 }}>{lt.code}</TableCell>
                                  <TableCell>{lt.daysPerYear} days</TableCell>
                                  <TableCell>
                                    {lt.requiresDocument ? (
                                      <Chip label="Yes" color="primary" size="small" variant="outlined" />
                                    ) : (
                                      <Chip label="No" color="default" size="small" variant="outlined" />
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {lt.isCarryForward ? `Yes (max ${lt.maxCarryForwardDays}d)` : 'No'}
                                  </TableCell>
                                  <TableCell>
                                    {lt.isActive ? (
                                      <Chip label="Active" color="success" size="small" />
                                    ) : (
                                      <Chip label="Inactive" color="default" size="small" variant="outlined" />
                                    )}
                                  </TableCell>
                                  <TableCell align="right">
                                    <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                                      <Button
                                        size="small"
                                        variant="text"
                                        onClick={() => {
                                          setEditingLeaveType(lt);
                                          setLeaveTypeName(lt.name);
                                          setLeaveTypeCode(lt.code);
                                          setLeaveTypeDays(lt.daysPerYear);
                                          setLeaveTypeRequiresDoc(lt.requiresDocument);
                                          setLeaveTypeColor(lt.color);
                                          setLeaveTypeDesc(lt.description || '');
                                        }}
                                        sx={{ textTransform: 'none' }}
                                      >
                                        Edit
                                      </Button>
                                      <Button
                                        size="small"
                                        variant="text"
                                        color={lt.isActive ? 'error' : 'primary'}
                                        onClick={async () => {
                                          try {
                                            await updateLeaveTypeMutation.mutateAsync({
                                              id: lt.id,
                                              isActive: !lt.isActive,
                                            });
                                            refetchLeaveTypes();
                                          } catch (err: any) {
                                            setLeaveTypeError(parseError(err));
                                          }
                                        }}
                                        sx={{ textTransform: 'none' }}
                                      >
                                        {lt.isActive ? 'Deactivate' : 'Activate'}
                                      </Button>
                                    </Stack>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  ) : (
                    <Box sx={{ maxWidth: 600 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 3 }}>
                        {editingLeaveType ? `Edit Category: ${editingLeaveType.name}` : 'New Leave Category'}
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            label="Category Name"
                            size="small"
                            fullWidth
                            value={leaveTypeName}
                            onChange={(e) => setLeaveTypeName(e.target.value)}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            label="Category Code (e.g. SL)"
                            size="small"
                            fullWidth
                            disabled={!!editingLeaveType}
                            value={leaveTypeCode}
                            onChange={(e) => setLeaveTypeCode(e.target.value)}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            label="Yearly Days Allowed"
                            type="number"
                            size="small"
                            fullWidth
                            value={leaveTypeDays}
                            onChange={(e) => setLeaveTypeDays(Number(e.target.value))}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            label="Theme Color (Hex)"
                            size="small"
                            fullWidth
                            value={leaveTypeColor}
                            onChange={(e) => setLeaveTypeColor(e.target.value)}
                          />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <TextField
                            label="Description"
                            size="small"
                            fullWidth
                            multiline
                            rows={2}
                            value={leaveTypeDesc}
                            onChange={(e) => setLeaveTypeDesc(e.target.value)}
                          />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={leaveTypeRequiresDoc}
                                onChange={(e) => setLeaveTypeRequiresDoc(e.target.checked)}
                              />
                            }
                            label="Require Reason and Verification Document Upload"
                          />
                        </Grid>
                      </Grid>

                      <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                        <Button
                          variant="text"
                          onClick={() => {
                            setEditingLeaveType(null);
                            setShowAddLeaveType(false);
                          }}
                          sx={{ textTransform: 'none' }}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="contained"
                          sx={{ bgcolor: '#206bc4', textTransform: 'none' }}
                          onClick={async () => {
                            if (!leaveTypeName.trim() || !leaveTypeCode.trim()) return;
                            try {
                              if (editingLeaveType) {
                                await updateLeaveTypeMutation.mutateAsync({
                                  id: editingLeaveType.id,
                                  name: leaveTypeName,
                                  daysPerYear: leaveTypeDays,
                                  requiresDocument: leaveTypeRequiresDoc,
                                  color: leaveTypeColor,
                                  description: leaveTypeDesc,
                                });
                              } else {
                                await createLeaveTypeMutation.mutateAsync({
                                  code: leaveTypeCode,
                                  name: leaveTypeName,
                                  daysPerYear: leaveTypeDays,
                                  isPaid: true,
                                  isCarryForward: false,
                                  maxCarryForwardDays: 0,
                                  requiresApproval: true,
                                  requiresDocument: leaveTypeRequiresDoc,
                                  color: leaveTypeColor,
                                  description: leaveTypeDesc,
                                });
                              }
                              setEditingLeaveType(null);
                              setShowAddLeaveType(false);
                              refetchLeaveTypes();
                            } catch (err: any) {
                              setLeaveTypeError(parseError(err));
                            }
                          }}
                        >
                          Save Category
                        </Button>
                      </Box>
                    </Box>
                  )}
                </Box>
              )}

              {activeTab === 'tickets' && (
                <TicketSettings />
              )}

              {/* Tab: Calendar Configuration — full functional embed from Master Data */}
              {activeTab === 'calendar' && (
                <Box sx={{ mx: -3, mt: -3 }}>
                  <CalendarConfigPage />
                </Box>
              )}

            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SettingsPage;
