import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Box, Card, CardContent, Typography, CircularProgress, ToggleButton, ToggleButtonGroup } from '@mui/material';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';

import { useGetOrgTree, useGetRoleTree, useGetEmployees, useGetDepartments } from '../services/hrService';
import { HierarchyTree } from '../../../components/HierarchyTree';
import type { TreeNode } from '../../../components/HierarchyTree';

export const OrganizationChartPage: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'employee' | 'role'>('employee');

  useGetEmployees();
  useGetDepartments();

  const { data: empTree, isLoading: empLoading } = useGetOrgTree();
  const { data: roleTree, isLoading: roleLoading } = useGetRoleTree();

  const handleViewModeChange = (_: React.MouseEvent<HTMLElement>, newMode: 'employee' | 'role') => {
    if (newMode) setViewMode(newMode);
  };

  if (empLoading || roleLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  const adaptTreeNode = (node: any): TreeNode => ({
    id: node.id,
    label: node.label || node.name || node.employee_name || '',
    subLabel: node.subLabel || node.designation || node.role_name || '',
    avatar: node.avatar || node.profile_photo_url,
    children: node.children ? node.children.map(adaptTreeNode) : [],
  });

  const treeData = viewMode === 'employee' ? empTree : roleTree;
  const treeNode = treeData && treeData.length > 0 ? adaptTreeNode(treeData[0]) : null;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Organization Chart
        </Typography>
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={handleViewModeChange}
          size="small"
        >
          <ToggleButton value="employee">
            <SupervisorAccountIcon sx={{ mr: 0.5 }} fontSize="small" />
            Employee Hierarchy
          </ToggleButton>
          <ToggleButton value="role">
            <AccountTreeIcon sx={{ mr: 0.5 }} fontSize="small" />
            Role Hierarchy
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Card>
        <CardContent sx={{ p: 3 }}>
          {treeNode ? (
            <HierarchyTree
              data={treeNode}
              onNodeClick={(nodeId) => {
                if (viewMode === 'employee') {
                  navigate(`/hr/employees/${nodeId}`);
                }
              }}
            />
          ) : (
            <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 4 }}>
              No organization data available. Add employees and roles to build the hierarchy.
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default OrganizationChartPage;
