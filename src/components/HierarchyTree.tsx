import React, { useState } from 'react';
import { Box, Collapse, IconButton, Typography, Avatar, Card } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';

export interface TreeNode {
  id: string;
  label: string;
  subLabel?: string;
  avatar?: string;
  children?: TreeNode[];
}

interface HierarchyTreeProps {
  data: TreeNode;
  onNodeClick?: (nodeId: string) => void;
}

const TreeNodeComponent: React.FC<{
  node: TreeNode;
  depth: number;
  onNodeClick?: (nodeId: string) => void;
}> = ({ node, depth, onNodeClick }) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <Box sx={{ pl: depth === 0 ? 0 : 4, borderLeft: depth === 0 ? 'none' : '1px dashed #cbd5e1', ml: depth === 0 ? 0 : 2, my: 0.5 }}>
      {/* Node Card Display */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {hasChildren ? (
          <IconButton size="small" onClick={() => setExpanded(!expanded)} sx={{ p: 0.5 }}>
            {expanded ? <KeyboardArrowDownIcon fontSize="small" /> : <KeyboardArrowRightIcon fontSize="small" />}
          </IconButton>
        ) : (
          <Box sx={{ width: 28 }} /> // alignment spacer
        )}

        <Card
          onClick={() => onNodeClick && onNodeClick(node.id)}
          sx={{
            px: 2,
            py: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            cursor: onNodeClick ? 'pointer' : 'default',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            border: '1px solid #e2e8f0',
            bgcolor: 'background.paper',
            '&:hover': onNodeClick ? {
              borderColor: 'primary.main',
              boxShadow: 2,
            } : {},
            flexGrow: 0,
            minWidth: 220,
          }}
        >
          {node.avatar ? (
            <Avatar src={node.avatar} sx={{ width: 28, height: 28, fontSize: '0.75rem' }} />
          ) : (
            <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem', bgcolor: 'primary.main' }}>
              {node.label.charAt(0)}
            </Avatar>
          )}
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8125rem' }}>
              {node.label}
            </Typography>
            {node.subLabel && (
              <Typography variant="caption" color="textSecondary" sx={{ display: 'block', fontSize: '0.6875rem' }}>
                {node.subLabel}
              </Typography>
            )}
          </Box>
        </Card>
      </Box>

      {/* Collapsible Children Nodes */}
      {hasChildren && (
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
            {node.children!.map((child) => (
              <TreeNodeComponent
                key={child.id}
                node={child}
                depth={depth + 1}
                onNodeClick={onNodeClick}
              />
            ))}
          </Box>
        </Collapse>
      )}
    </Box>
  );
};

export const HierarchyTree: React.FC<HierarchyTreeProps> = ({ data, onNodeClick }) => {
  return (
    <Box sx={{ py: 1 }}>
      <TreeNodeComponent node={data} depth={0} onNodeClick={onNodeClick} />
    </Box>
  );
};

export default HierarchyTree;
