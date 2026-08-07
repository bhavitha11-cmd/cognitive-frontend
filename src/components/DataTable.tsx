import React, { useState, useEffect, useMemo } from 'react';
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
  IconButton,
  Popover,
  TextField,
  FormControlLabel,
  Button,
  Divider,
  List,
  ListItem,
} from '@mui/material';
import FilterIcon from '@mui/icons-material/FilterList';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import SearchIcon from '@mui/icons-material/Search';

export interface Column<T> {
  id: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  getValue?: (row: T) => string | number | boolean | null | undefined;
  type?: 'string' | 'number' | 'date';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T) => void;
  
  // Selection / Bulk Actions
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  bulkActions?: React.ReactNode;
  
  // Pagination (Optional - if omitted, DataTable does client-side paging, filtering, and sorting)
  page?: number;
  rowsPerPage?: number;
  totalCount?: number;
  onPageChange?: (newPage: number) => void;
  onRowsPerPageChange?: (newRowsPerPage: number) => void;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  selectedIds = [],
  onSelectionChange,
  bulkActions,
  page,
  rowsPerPage,
  totalCount,
  onPageChange,
  onRowsPerPageChange,
}: DataTableProps<T>) {
  // Local sorting/filtering state
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);
  
  // columnFilters: Record<string, string[]> contains list of allowed unique string values for each column.
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});
  
  // columnSearch: Record<string, string> search text inside the checklist popup for each column.
  const [columnSearch, setColumnSearch] = useState<Record<string, string>>({});

  // Popover state
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [activeColId, setActiveColId] = useState<string | null>(null);
  
  // Temporary selected unique values inside the open filter checklist
  const [tempSelected, setTempSelected] = useState<string[]>([]);
  const [tempFromDate, setTempFromDate] = useState<string>('');
  const [tempToDate, setTempToDate] = useState<string>('');

  // Internal pagination states (used if props are not supplied)
  const [localPage, setLocalPage] = useState(0);
  const [localRowsPerPage, setLocalRowsPerPage] = useState(10);

  const isClientSidePagination = page === undefined;

  const currentPage = isClientSidePagination ? localPage : page!;
  const currentRowsPerPage = isClientSidePagination ? localRowsPerPage : rowsPerPage!;

  // Reset page to 0 if the filtered data size changes
  useEffect(() => {
    if (isClientSidePagination) {
      setLocalPage(0);
    }
  }, [columnFilters, isClientSidePagination]);

  const isSelected = (id: string) => selectedIds.includes(id);

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>, visibleData: T[]) => {
    if (!onSelectionChange) return;
    if (event.target.checked) {
      const newSelecteds = visibleData.map((n) => keyExtractor(n));
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

  function extractTextFromReactNode(node: React.ReactNode): string {
    if (node == null || typeof node === 'boolean') return '';
    if (typeof node === 'string' || typeof node === 'number') return String(node).trim();
    if (Array.isArray(node)) {
      return node.map(extractTextFromReactNode).filter(Boolean).join(' ').trim();
    }
    if (React.isValidElement(node)) {
      const props = node.props as any;
      if (!props) return '';
      const typeName = typeof node.type === 'string' ? node.type : (node.type as any)?.name || (node.type as any)?.displayName || '';
      if (typeName.includes('Avatar')) {
        return '';
      }
      if (props.label != null && (typeof props.label === 'string' || typeof props.label === 'number')) {
        return String(props.label).trim();
      }
      if (props.children) {
        return extractTextFromReactNode(props.children);
      }
    }
    return '';
  }

  const getCellValueString = (row: T, col: Column<T>): string => {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const r = row as any;

    // 1. Try col.getValue if provided
    if (col.getValue) {
      const val = col.getValue(row);
      if (val != null) {
        const s = String(val).trim();
        if (s && !UUID_REGEX.test(s)) return s;
      }
    }

    // 2. Try col.render text extraction if provided
    if (col.render) {
      try {
        const rendered = col.render(row);
        const textFromRender = extractTextFromReactNode(rendered).trim();
        if (textFromRender && !UUID_REGEX.test(textFromRender)) {
          return textFromRender;
        }
      } catch (err) {
        // Fallback
      }
    }

    // 3. Entity Fallback Check
    if (
      col.id === 'id' ||
      col.id === 'employeeId' ||
      col.id === 'employee_id' ||
      col.id === 'employeeCode' ||
      col.id === 'employee_code'
    ) {
      if (r.employeeCode || r.employee_code) return String(r.employeeCode || r.employee_code);
    }

    if (
      col.id === 'name' ||
      col.id === 'employeeName' ||
      col.id === 'userName' ||
      col.id === 'assignedTo' ||
      col.id === 'manager' ||
      col.id === 'user'
    ) {
      const nameStr = `${r.firstName || r.first_name || ''} ${r.lastName || r.last_name || ''}`.trim();
      if (nameStr) return nameStr;
      if (r.displayName && !UUID_REGEX.test(r.displayName)) return String(r.displayName);
      if (r.display_name && !UUID_REGEX.test(r.display_name)) return String(r.display_name);
      if (r.name && !UUID_REGEX.test(r.name)) return String(r.name);
      if (r.username) return String(r.username);
      if (r.email || r.officialEmail || r.official_email) return String(r.email || r.officialEmail || r.official_email);
      if (r.employeeCode || r.employee_code) return String(r.employeeCode || r.employee_code);
    }

    if (col.id === 'departmentId' || col.id === 'department_id' || col.id === 'department') {
      if (r.departmentName || r.department_name || r.department?.name) {
        return String(r.departmentName || r.department_name || r.department?.name);
      }
    }

    if (col.id === 'clientId' || col.id === 'client_id' || col.id === 'clientName') {
      if (r.clientName || r.client_name || r.client?.name) {
        return String(r.clientName || r.client_name || r.client?.name);
      }
    }

    if (col.id === 'projectId' || col.id === 'project_id' || col.id === 'projectName') {
      if (r.projectName || r.project_name || r.project?.name) {
        return String(r.projectName || r.project_name || r.project?.name);
      }
    }

    if (col.id === 'designationId' || col.id === 'designation_id' || col.id === 'designation') {
      if (r.designationName || r.designation_name || r.designation?.name) {
        return String(r.designationName || r.designation_name || r.designation?.name);
      }
    }

    if (col.id === 'teamId' || col.id === 'team_id' || col.id === 'team') {
      if (r.teamName || r.team_name || r.team?.team_name) {
        return String(r.teamName || r.team_name || r.team?.team_name);
      }
    }

    // 4. General Property Lookup
    const val = r[col.id];
    const strVal = (val != null && typeof val !== 'object') ? String(val).trim() : '';

    if (strVal && !UUID_REGEX.test(strVal)) {
      return strVal;
    }

    // 5. Final fallback if strVal is UUID or empty: NEVER RETURN A RAW UUID!
    const baseId = col.id.endsWith('Id') ? col.id.slice(0, -2) : col.id;
    const nameProp = baseId + 'Name';
    if (r[nameProp] && typeof r[nameProp] === 'string' && !UUID_REGEX.test(r[nameProp])) {
      return r[nameProp];
    }
    if (r[baseId] && typeof r[baseId] === 'string' && !UUID_REGEX.test(r[baseId])) {
      return r[baseId];
    }
    if (r[baseId] && typeof r[baseId] === 'object' && r[baseId]?.name) {
      return String(r[baseId].name);
    }
    if (r.email) return String(r.email);
    if (r.employeeCode || r.employee_code) return String(r.employeeCode || r.employee_code);

    if (UUID_REGEX.test(strVal)) {
      return strVal.slice(0, 8);
    }

    return strVal;
  };

  const getCellValueRaw = (row: T, col: Column<T>): any => {
    if (col.getValue) {
      return col.getValue(row);
    }
    return (row as any)[col.id];
  };

  // 1. Process data: Filter and Sort
  const processedData = useMemo(() => {
    // A. Filter
    let result = [...data];
    for (const colId of Object.keys(columnFilters)) {
      const allowed = columnFilters[colId];
      if (!allowed || allowed.length === 0) continue;
      const col = columns.find((c) => c.id === colId);
      if (!col) continue;

      const isDateFilter = col.type === 'date' || allowed.some(val => val.startsWith('FROM:') || val.startsWith('TO:'));

      if (isDateFilter) {
        const fromVal = allowed.find(val => val.startsWith('FROM:'))?.replace('FROM:', '');
        const toVal = allowed.find(val => val.startsWith('TO:'))?.replace('TO:', '');

        const fromTime = fromVal ? new Date(fromVal).getTime() : null;
        const toTime = toVal ? new Date(toVal).getTime() : null;

        result = result.filter((row) => {
          const rawVal = getCellValueRaw(row, col);
          if (!rawVal) return false;
          const rowTime = new Date(rawVal).getTime();
          if (isNaN(rowTime)) return false;

          if (fromTime && rowTime < fromTime) return false;
          if (toTime && rowTime > toTime + 86399999) return false; // inclusive of whole end day
          return true;
        });
      } else {
        result = result.filter((row) => allowed.includes(getCellValueString(row, col)));
      }
    }
    
    // B. Sort
    if (sortColumn && sortDirection) {
      const col = columns.find((c) => c.id === sortColumn);
      if (col) {
        result.sort((a, b) => {
          let compare = 0;
          if (col.type === 'date') {
            const rawA = getCellValueRaw(a, col);
            const rawB = getCellValueRaw(b, col);
            const timeA = rawA ? new Date(rawA).getTime() : 0;
            const timeB = rawB ? new Date(rawB).getTime() : 0;
            compare = (isNaN(timeA) ? 0 : timeA) - (isNaN(timeB) ? 0 : timeB);
          } else {
            const valA = getCellValueString(a, col);
            const valB = getCellValueString(b, col);
            compare = valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
          }
          return sortDirection === 'asc' ? compare : -compare;
        });
      }
    }
    
    return result;
  }, [data, columnFilters, sortColumn, sortDirection, columns]);

  const currentTotalCount = isClientSidePagination ? processedData.length : totalCount!;

  const displayData = useMemo(() => {
    if (isClientSidePagination) {
      return processedData.slice(currentPage * currentRowsPerPage, (currentPage + 1) * currentRowsPerPage);
    }
    return data;
  }, [processedData, data, isClientSidePagination, currentPage, currentRowsPerPage]);

  const enableSelection = !!onSelectionChange;
  const numSelected = selectedIds.length;

  // Filter Popover handlers
  const handleFilterClick = (event: React.MouseEvent<HTMLButtonElement>, colId: string) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setActiveColId(colId);
    
    const col = columns.find((c) => c.id === colId);
    if (!col) return;
    
    const currentFilter = columnFilters[colId] || [];
    
    if (col.type === 'date') {
      const from = currentFilter.find(val => val.startsWith('FROM:'))?.replace('FROM:', '') || '';
      const to = currentFilter.find(val => val.startsWith('TO:'))?.replace('TO:', '') || '';
      setTempFromDate(from);
      setTempToDate(to);
    } else {
      const uniqueVals = Array.from(
        new Set(data.map((row) => getCellValueString(row, col)))
      ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
      setTempSelected(currentFilter.length > 0 ? currentFilter : uniqueVals);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
    setActiveColId(null);
  };

  const handleClearFilter = () => {
    if (!activeColId) return;
    const nextFilters = { ...columnFilters };
    delete nextFilters[activeColId];
    setColumnFilters(nextFilters);
    setTempFromDate('');
    setTempToDate('');
    handleClose();
  };

  const handleApplyFilter = () => {
    if (!activeColId) return;
    const col = columns.find((c) => c.id === activeColId);
    
    if (col && col.type === 'date') {
      const dateFilters = [
        tempFromDate ? `FROM:${tempFromDate}` : '',
        tempToDate ? `TO:${tempToDate}` : '',
      ].filter(Boolean);
      
      const nextFilters = { ...columnFilters };
      if (dateFilters.length > 0) {
        nextFilters[activeColId] = dateFilters;
      } else {
        delete nextFilters[activeColId];
      }
      setColumnFilters(nextFilters);
    } else {
      setColumnFilters({
        ...columnFilters,
        [activeColId]: tempSelected,
      });
    }
    handleClose();
  };

  // Compute unique values for checklist in currently open popover
  const currentUniqueValues = useMemo(() => {
    if (!activeColId) return [];
    const col = columns.find((c) => c.id === activeColId);
    if (!col) return [];
    return Array.from(
      new Set(data.map((row) => getCellValueString(row, col)))
    ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  }, [data, activeColId, columns]);

  const filteredUniqueValues = useMemo(() => {
    const search = (columnSearch[activeColId || ''] || '').toLowerCase();
    if (!search) return currentUniqueValues;
    return currentUniqueValues.filter((v) => v.toLowerCase().includes(search));
  }, [currentUniqueValues, columnSearch, activeColId]);

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
                    indeterminate={numSelected > 0 && numSelected < displayData.length}
                    checked={displayData.length > 0 && numSelected === displayData.length}
                    onChange={(e) => handleSelectAllClick(e, displayData)}
                  />
                </TableCell>
              )}
              {columns.map((column) => {
                const isFiltered = !!columnFilters[column.id];
                const isSorted = sortColumn === column.id;

                return (
                  <TableCell
                    key={column.id}
                    align={column.align || 'left'}
                    sx={{ fontWeight: 700, py: 1.5 }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: column.align === 'right' ? 'flex-end' : 'flex-start',
                        gap: 0.5,
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.875rem' }}>
                        {column.label}
                      </Typography>
                      
                      {isSorted && (
                        sortDirection === 'asc' ? (
                          <ArrowUpwardIcon sx={{ fontSize: '0.9rem', color: 'primary.main' }} />
                        ) : (
                          <ArrowDownwardIcon sx={{ fontSize: '0.9rem', color: 'primary.main' }} />
                        )
                      )}
                      
                      <IconButton
                        size="small"
                        onClick={(e) => handleFilterClick(e, column.id)}
                        color={isFiltered ? 'primary' : 'default'}
                        sx={{
                          p: 0.2,
                          '&:hover': { bgcolor: 'action.hover' },
                        }}
                      >
                        <FilterIcon
                          sx={{
                            fontSize: '0.85rem',
                            opacity: isFiltered ? 1 : 0.35,
                            '&:hover': { opacity: 1 },
                          }}
                        />
                      </IconButton>
                    </Box>
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>
          <TableBody>
            {displayData.map((row) => {
              const id = keyExtractor(row);
              const isItemSelected = isSelected(id);

              return (
                <TableRow
                  hover
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.closest('button') || target.closest('a') || target.closest('input[type="checkbox"]') || target.closest('.MuiSelect-select')) {
                      return;
                    }
                    if (onRowClick) {
                      onRowClick(row);
                    } else if (enableSelection) {
                      handleClick(id);
                    }
                  }}
                  role="checkbox"
                  aria-checked={isItemSelected}
                  tabIndex={-1}
                  key={id}
                  selected={isItemSelected}
                  sx={{ cursor: (onRowClick || enableSelection) ? 'pointer' : 'default' }}
                >
                  {enableSelection && (
                    <TableCell padding="checkbox">
                      <Checkbox color="primary" checked={isItemSelected} />
                    </TableCell>
                  )}
                  {columns.map((column) => (
                    <TableCell key={column.id} align={column.align || 'left'}>
                      {column.render ? column.render(row) : getCellValueString(row, column)}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
            {displayData.length === 0 && (
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
        count={currentTotalCount}
        rowsPerPage={currentRowsPerPage}
        page={currentPage}
        onPageChange={(_, newPage) => {
          if (isClientSidePagination) {
            setLocalPage(newPage);
          } else {
            onPageChange!(newPage);
          }
        }}
        onRowsPerPageChange={(e) => {
          const val = parseInt(e.target.value, 10);
          if (isClientSidePagination) {
            setLocalRowsPerPage(val);
            setLocalPage(0);
          } else {
            onRowsPerPageChange!(val);
          }
        }}
      />

      {/* Excel-like Filter Popover */}
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        slotProps={{
          paper: {
            sx: { width: 260, p: 1.5, maxHeight: 400, display: 'flex', flexDirection: 'column' },
          },
        }}
      >
        {activeColId && (
          <>
            {/* Sort Buttons */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 1 }}>
              <Button
                size="small"
                startIcon={<ArrowUpwardIcon fontSize="small" />}
                sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                onClick={() => {
                  setSortColumn(activeColId);
                  setSortDirection('asc');
                  handleClose();
                }}
              >
                {columns.find((c) => c.id === activeColId)?.type === 'date'
                  ? 'Sort Oldest to Newest'
                  : 'Sort A to Z / Smallest to Largest'}
              </Button>
              <Button
                size="small"
                startIcon={<ArrowDownwardIcon fontSize="small" />}
                sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                onClick={() => {
                  setSortColumn(activeColId);
                  setSortDirection('desc');
                  handleClose();
                }}
              >
                {columns.find((c) => c.id === activeColId)?.type === 'date'
                  ? 'Sort Newest to Oldest'
                  : 'Sort Z to A / Largest to Smallest'}
              </Button>
            </Box>

            <Divider sx={{ my: 1 }} />

            {columns.find((c) => c.id === activeColId)?.type === 'date' ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, my: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                  Date Range Filter
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                    From Date
                  </Typography>
                  <TextField
                    type="date"
                    size="small"
                    fullWidth
                    value={tempFromDate}
                    onChange={(e) => setTempFromDate(e.target.value)}
                  />
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                    To Date
                  </Typography>
                  <TextField
                    type="date"
                    size="small"
                    fullWidth
                    value={tempToDate}
                    onChange={(e) => setTempToDate(e.target.value)}
                  />
                </Box>
              </Box>
            ) : (
              <>
                {/* Checklist Values Search */}
                <TextField
                  size="small"
                  placeholder="Search values..."
                  fullWidth
                  value={columnSearch[activeColId] || ''}
                  onChange={(e) =>
                    setColumnSearch({ ...columnSearch, [activeColId]: e.target.value })
                  }
                  slotProps={{
                    input: {
                      startAdornment: <SearchIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />,
                    },
                  }}
                  sx={{ mb: 1 }}
                />

                {/* Scrollable Checklist */}
                <Box sx={{ maxHeight: 180, overflowY: 'auto', mb: 1.5 }}>
                  <List dense sx={{ p: 0 }}>
                    {/* Select All Option */}
                    <ListItem disablePadding>
                      <FormControlLabel
                        control={
                          <Checkbox
                            size="small"
                            checked={
                              tempSelected.length === currentUniqueValues.length &&
                              currentUniqueValues.length > 0
                            }
                            indeterminate={
                              tempSelected.length > 0 &&
                              tempSelected.length < currentUniqueValues.length
                            }
                            onChange={(e) => {
                              if (e.target.checked) {
                                setTempSelected(currentUniqueValues);
                              } else {
                                setTempSelected([]);
                              }
                            }}
                          />
                        }
                        label={<Typography variant="body2">(Select All)</Typography>}
                        sx={{ width: '100%', ml: 0 }}
                      />
                    </ListItem>
                    
                    {filteredUniqueValues.map((val) => {
                      const isChecked = tempSelected.includes(val);
                      return (
                        <ListItem key={val} disablePadding>
                          <FormControlLabel
                            control={
                              <Checkbox
                                size="small"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setTempSelected([...tempSelected, val]);
                                  } else {
                                    setTempSelected(tempSelected.filter((v) => v !== val));
                                  }
                                }}
                              />
                            }
                            label={
                              <Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {val === '' ? '(Blanks)' : val}
                              </Typography>
                            }
                            sx={{ width: '100%', ml: 0 }}
                          />
                        </ListItem>
                      );
                    })}
                    {filteredUniqueValues.length === 0 && (
                      <Typography variant="caption" color="textSecondary" sx={{ display: 'block', textAlign: 'center', py: 1 }}>
                        No matching values.
                      </Typography>
                    )}
                  </List>
                </Box>
              </>
            )}

            <Divider sx={{ my: 1 }} />

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
              <Button size="small" color="inherit" onClick={handleClearFilter} sx={{ textTransform: 'none' }}>
                Clear Filter
              </Button>
              <Button size="small" variant="contained" onClick={handleApplyFilter} sx={{ textTransform: 'none' }}>
                OK
              </Button>
            </Box>
          </>
        )}
      </Popover>
    </Box>
  );
}

export default DataTable;
