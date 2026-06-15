import React, { useState } from 'react';
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
} from '@mui/material';

import BusinessIcon from '@mui/icons-material/Business';
import HomeIcon from '@mui/icons-material/Home';
import PersonIcon from '@mui/icons-material/Person';

import { useAppStore } from '../../../store/useAppStore';

type SettingsTab =
  | 'company'
  | 'address'
  | 'profile';

export const SettingsPage: React.FC = () => {
  const settings = useAppStore((state) => state.settings);
  const updateSettings = useAppStore((state) => state.updateSettings);

  const [activeTab, setActiveTab] = useState<SettingsTab>('company');

  const handleCompanyChange = (field: string, value: any) => {
    updateSettings('companySettings', { [field]: value });
  };

  const handleAddressChange = (field: string, value: any) => {
    updateSettings('businessAddress', { [field]: value });
  };

  const handleProfileChange = (field: string, value: any) => {
    updateSettings('profileSettings', { [field]: value });
  };

  const tabsList = [
    { id: 'company' as const, label: 'Company Settings', icon: <BusinessIcon /> },
    { id: 'address' as const, label: 'Business Address', icon: <HomeIcon /> },
    { id: 'profile' as const, label: 'Profile Settings', icon: <PersonIcon /> },
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

            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SettingsPage;
