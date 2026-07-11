import React, { useState } from 'react';
import { Box, IconButton, Typography, Avatar, Card } from '@mui/material';
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
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Node Card Display */}
      <Box sx={{ display: 'flex', alignItems: 'center', position: 'relative', pb: hasChildren && expanded ? 2.5 : 0 }}>
        <Card
          onClick={() => onNodeClick && onNodeClick(node.id)}
          sx={{
            px: 2,
            py: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            cursor: onNodeClick ? 'pointer' : 'default',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
            border: '1.5px solid #e2e8f0',
            borderRadius: 2,
            bgcolor: 'background.paper',
            '&:hover': onNodeClick ? {
              borderColor: 'primary.main',
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
              transform: 'translateY(-2px)',
            } : {},
            transition: 'all 0.2s ease-in-out',
            flexGrow: 0,
            minWidth: 200,
            maxWidth: 260,
            zIndex: 2,
          }}
        >
          {node.avatar ? (
            <Avatar src={node.avatar} sx={{ width: 32, height: 32, fontSize: '0.875rem' }} />
          ) : (
            <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem', bgcolor: 'primary.main', fontWeight: 600 }}>
              {node.label.charAt(0)}
            </Avatar>
          )}
          <Box sx={{ textAlign: 'left' }}>
            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.875rem', color: 'text.primary', lineHeight: 1.2 }}>
              {node.label}
            </Typography>
            {node.subLabel && (
              <Typography variant="caption" color="textSecondary" sx={{ display: 'block', fontSize: '0.75rem', mt: 0.25 }}>
                {node.subLabel}
              </Typography>
            )}
          </Box>
        </Card>

        {hasChildren && (
          <IconButton 
            size="small" 
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }} 
            sx={{ 
              position: 'absolute',
              bottom: 8, // Center vertically on the link line
              left: '50%',
              transform: 'translateX(-50%)',
              bgcolor: 'background.paper',
              border: '1.5px solid #cbd5e1',
              boxShadow: 1,
              width: 20,
              height: 20,
              p: 0,
              zIndex: 3,
              '&:hover': {
                bgcolor: 'action.hover',
                borderColor: 'primary.main',
              }
            }}
          >
            {expanded ? <KeyboardArrowDownIcon sx={{ fontSize: 14 }} /> : <KeyboardArrowRightIcon sx={{ fontSize: 14 }} />}
          </IconButton>
        )}
      </Box>

      {/* Children row */}
      {hasChildren && expanded && (
        <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start', gap: 3, pt: 0 }}>
          {node.children!.map((child, index) => {
            const isFirst = index === 0;
            const isLast = index === node.children!.length - 1;
            const isOnly = node.children!.length === 1;

            return (
              <Box key={child.id} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                {/* Horizontal line at top of child wrapper */}
                {!isOnly && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: isFirst ? '50%' : 0,
                      right: isLast ? '50%' : 0,
                      height: '2px',
                      bgcolor: '#cbd5e1',
                    }}
                  />
                )}
                {/* Vertical connector line for child */}
                <Box
                  sx={{
                    width: '2px',
                    height: '20px',
                    bgcolor: '#cbd5e1',
                    mb: 1.5,
                  }}
                />
                <TreeNodeComponent node={child} depth={depth + 1} onNodeClick={onNodeClick} />
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export const HierarchyTree: React.FC<HierarchyTreeProps> = ({ data, onNodeClick }) => {
  return (
    <Box sx={{ py: 2, overflowX: 'auto', width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', minWidth: 'max-content', px: 4 }}>
        <TreeNodeComponent node={data} depth={0} onNodeClick={onNodeClick} />
      </Box>
    </Box>
  );
};

export default HierarchyTree;
