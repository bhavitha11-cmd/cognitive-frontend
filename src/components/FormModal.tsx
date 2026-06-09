import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface FormModalProps {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onSubmit?: () => void;
  onClose: () => void;
  submitText?: string;
  cancelText?: string;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isSubmitDisabled?: boolean;
  formId?: string;
}

export const FormModal: React.FC<FormModalProps> = ({
  open,
  title,
  children,
  onSubmit,
  onClose,
  submitText = 'Save',
  cancelText = 'Cancel',
  maxWidth = 'sm',
  isSubmitDisabled = false,
  formId,
}) => {
  return (
    <Dialog open={open} onClose={onClose} disableRestoreFocus maxWidth={maxWidth} fullWidth>
      <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: 2, pb: 1 }}>
        {title}
        <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers sx={{ px: 3, py: 2.5 }}>
        <Box sx={{ mt: 1 }}>
          {children}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit" variant="outlined" size="small">
          {cancelText}
        </Button>
        {formId ? (
          <Button
            type="submit"
            form={formId}
            color="primary"
            variant="contained"
            disabled={isSubmitDisabled}
            size="small"
          >
            {submitText}
          </Button>
        ) : (
          onSubmit && (
            <Button
              onClick={onSubmit}
              color="primary"
              variant="contained"
              disabled={isSubmitDisabled}
              size="small"
            >
              {submitText}
            </Button>
          )
        )}
      </DialogActions>
    </Dialog>
  );
};

export default FormModal;
