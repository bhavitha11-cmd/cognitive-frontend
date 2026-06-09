import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Checkbox,
  Box,
  Typography,
  Toolbar,
  alpha,
} from '@mui/material';

export interface Column<T> {
  id: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  
  // Selection / Bulk Actions
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  bulkActions?: React.ReactNode;
  
  // Pagination
  page: number;
  rowsPerPage: number;
  totalCount: number;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (newRowsPerPage: number) => void;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  selectedIds = [],
  onSelectionChange,
  bulkActions,
  page,
  rowsPerPage,
  totalCount,
  onPageChange,
  onRowsPerPageChange,
}: DataTableProps<T>) {
  const isSelected = (id: string) => selectedIds.includes(id);

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!onSelectionChange) return;
    if (event.target.checked) {
      const newSelecteds = data.map((n) => keyExtractor(n));
      onSelectionChange(newSelecteds);
      return;
    }
    onSelectionChange([]);
  };

  const handleClick = (id: string) => {
    if (!onSelectionChange) return;
    const selectedIndex = selectedIds.indexOf(id);
    let newSelected: string[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedIds, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedIds.slice(1));
    } else if (selectedIndex === selectedIds.length - 1) {
      newSelected = newSelected.concat(selectedIds.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selectedIds.slice(0, selectedIndex),
        selectedIds.slice(selectedIndex + 1),
      );
    }
    onSelectionChange(newSelected);
  };

  const enableSelection = !!onSelectionChange;
  const numSelected = selectedIds.length;

  return (
    <Box sx={{ width: '100%' }}>
      {/* Selected Action Toolbar */}
      {enableSelection && numSelected > 0 && (
        <Toolbar
          sx={{
            px: 2,
            mb: 1.5,
            borderRadius: '6px',
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography color="inherit" variant="subtitle2" sx={{ fontWeight: 600 }}>
            {numSelected} selected
          </Typography>
          <Box>{bulkActions}</Box>
        </Toolbar>
      )}

      {/* Main Table Grid */}
      <TableContainer>
        <Table sx={{ minWidth: 750 }} size="medium">
          <TableHead>
            <TableRow>
              {enableSelection && (
                <TableCell padding="checkbox">
                  <Checkbox
                    color="primary"
                    indeterminate={numSelected > 0 && numSelected < data.length}
                    checked={data.length > 0 && numSelected === data.length}
                    onChange={handleSelectAllClick}
                  />
                </TableCell>
              )}
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align || 'left'}
                  sx={{ fontWeight: 700 }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row) => {
              const id = keyExtractor(row);
              const isItemSelected = isSelected(id);

              return (
                <TableRow
                  hover
                  onClick={() => enableSelection && handleClick(id)}
                  role="checkbox"
                  aria-checked={isItemSelected}
                  tabIndex={-1}
                  key={id}
                  selected={isItemSelected}
                  sx={{ cursor: enableSelection ? 'pointer' : 'default' }}
                >
                  {enableSelection && (
                    <TableCell padding="checkbox">
                      <Checkbox color="primary" checked={isItemSelected} />
                    </TableCell>
                  )}
                  {columns.map((column) => {
                    return (
                      <TableCell key={column.id} align={column.align || 'left'}>
                        {column.render ? column.render(row) : (row as any)[column.id]}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length + (enableSelection ? 1 : 0)} align="center">
                  <Typography variant="body2" color="textSecondary" sx={{ py: 3 }}>
                    No records found.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination Controls */}
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={totalCount}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(_, newPage) => onPageChange(newPage)}
        onRowsPerPageChange={(e) => onRowsPerPageChange(parseInt(e.target.value, 10))}
      />
    </Box>
  );
}

export default DataTable;
