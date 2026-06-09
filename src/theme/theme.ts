import { createTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    sidebar: {
      background: string;
      text: string;
      hover: string;
      active: string;
      activeText: string;
    };
  }
  interface PaletteOptions {
    sidebar?: {
      background?: string;
      text?: string;
      hover?: string;
      active?: string;
      activeText?: string;
    };
  }
}

export const theme = createTheme({
  palette: {
    primary: {
      main: '#206bc4',
      light: '#e8f1fc',
      dark: '#184f90',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#626973',
      light: '#f1f2f4',
      dark: '#484e57',
    },
    success: {
      main: '#2fb344',
      light: '#d6f0da',
    },
    warning: {
      main: '#f59f00',
      light: '#fef3d6',
    },
    error: {
      main: '#d63939',
      light: '#fbebeb',
    },
    info: {
      main: '#4299e1',
      light: '#eef6fc',
    },
    background: {
      default: '#f4f6fa',
      paper: '#ffffff',
    },
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
    },
    sidebar: {
      background: '#0e1628', // Dark left sidebar
      text: '#94a3b8',
      hover: 'rgba(255, 255, 255, 0.05)',
      active: '#206bc4', // Blue highlight
      activeText: '#ffffff',
    },
    divider: '#e2e8f0',
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    h1: { fontSize: '2.25rem', fontWeight: 600, color: '#1e293b' },
    h2: { fontSize: '1.875rem', fontWeight: 600, color: '#1e293b' },
    h3: { fontSize: '1.5rem', fontWeight: 600, color: '#1e293b' },
    h4: { fontSize: '1.25rem', fontWeight: 600, color: '#1e293b' },
    h5: { fontSize: '1rem', fontWeight: 600, color: '#1e293b' },
    h6: { fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' },
    subtitle1: { fontSize: '1rem', fontWeight: 500 },
    subtitle2: { fontSize: '0.875rem', fontWeight: 500 },
    body1: { fontSize: '0.875rem', lineHeight: 1.5 },
    body2: { fontSize: '0.75rem', lineHeight: 1.43 },
    button: { textTransform: 'none', fontWeight: 500, fontSize: '0.875rem' },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    ...Array(19).fill('none'), // fill rest of shadows array up to 25 items
  ] as any,
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '6px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
          '&.MuiButton-containedPrimary:hover': {
            backgroundColor: '#184f90',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e2e8f0',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          backgroundColor: '#f8fafc',
          color: '#475569',
          padding: '12px 16px',
        },
        root: {
          padding: '12px 16px',
          borderColor: '#f1f5f9',
        },
      },
    },
    MuiTablePagination: {
      styleOverrides: {
        root: {
          borderTop: '1px solid #f1f5f9',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: '6px',
          backgroundColor: '#ffffff',
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#cbd5e1',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#206bc4',
            borderWidth: '1.5px',
          },
        },
        notchedOutline: {
          borderColor: '#e2e8f0',
        },
      },
    },
  },
});
