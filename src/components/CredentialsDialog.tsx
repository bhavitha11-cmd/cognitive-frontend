import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Alert,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import CheckIcon from '@mui/icons-material/Check';

interface CredentialsDialogProps {
  open: boolean;
  onClose: () => void;
  employeeName: string;
  username: string;
  email: string;
  password?: string;
  employeeCode: string;
}

export const CredentialsDialog: React.FC<CredentialsDialogProps> = ({
  open,
  onClose,
  employeeName,
  username,
  email,
  password,
  employeeCode,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCopyAll = () => {
    const text = `Employee Account Created!\n` +
      `---------------------------\n` +
      `Name: ${employeeName}\n` +
      `Employee Code: ${employeeCode}\n` +
      `Username: ${username}\n` +
      `Login Email: ${email}\n` +
      `Password: ${password || '********'}\n` +
      `---------------------------`;
    handleCopy(text, 'all');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
        Account Created Successfully
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          Account credentials generated for <strong>{employeeName}</strong>. Copy these details and send them to the employee.
        </Typography>

        <Alert severity="warning" sx={{ mb: 2.5, '& .MuiAlert-message': { fontSize: '0.75rem', fontWeight: 600 } }}>
          For security, the password will not be shown again.
        </Alert>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Employee Code"
            value={employeeCode}
            size="small"
            fullWidth
            slotProps={{
              input: {
                readOnly: true,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => handleCopy(employeeCode, 'code')}>
                      {copiedField === 'code' ? <CheckIcon fontSize="small" color="success" /> : <ContentCopyIcon fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          <TextField
            label="Username"
            value={username}
            size="small"
            fullWidth
            slotProps={{
              input: {
                readOnly: true,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => handleCopy(username, 'username')}>
                      {copiedField === 'username' ? <CheckIcon fontSize="small" color="success" /> : <ContentCopyIcon fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          <TextField
            label="Login Email"
            value={email}
            size="small"
            fullWidth
            slotProps={{
              input: {
                readOnly: true,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => handleCopy(email, 'email')}>
                      {copiedField === 'email' ? <CheckIcon fontSize="small" color="success" /> : <ContentCopyIcon fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          {password && (
            <TextField
              label="Temporary Password"
              value={password}
              type={showPassword ? 'text' : 'password'}
              size="small"
              fullWidth
              slotProps={{
                input: {
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowPassword(!showPassword)} sx={{ mr: 0.5 }}>
                        {showPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                      </IconButton>
                      <IconButton size="small" onClick={() => handleCopy(password, 'password')}>
                        {copiedField === 'password' ? <CheckIcon fontSize="small" color="success" /> : <ContentCopyIcon fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, pt: 1, justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          color="secondary"
          size="small"
          startIcon={copiedField === 'all' ? <CheckIcon /> : <ContentCopyIcon />}
          onClick={handleCopyAll}
        >
          {copiedField === 'all' ? 'Copied' : 'Copy All'}
        </Button>
        <Button variant="contained" onClick={onClose} size="small" color="primary">
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CredentialsDialog;
