import React, { useEffect, useRef, useState } from 'react';
import { Grid, TextField, InputAdornment, FormControl, Select, MenuItem } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

export interface FilterOption {
  value: string;
  label?: string;
  options: { value: string; label: string }[];
  onChange: (val: string) => void;
  placeholder?: string;
}

interface SearchFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder?: string;
  filters?: FilterOption[];
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filters = [],
}) => {
  // Keep the input responsive (controlled locally); debounce the emitted value
  // so we don't fire one request per keystroke.
  const [localValue, setLocalValue] = useState(searchQuery);
  const onSearchChangeRef = useRef(onSearchChange);
  onSearchChangeRef.current = onSearchChange;

  // Sync local value if the query is changed/reset from the parent.
  useEffect(() => {
    setLocalValue(searchQuery);
  }, [searchQuery]);

  const handleInputChange = (value: string) => {
    setLocalValue(value);
  };

  useEffect(() => {
    // Skip emitting when already in sync with the parent (e.g. external reset).
    if (localValue === searchQuery) return;
    const handle = setTimeout(() => {
      onSearchChangeRef.current(localValue);
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localValue]);

  // Determine sizes dynamically
  const filterCount = filters.length;
  const searchGridSize = filterCount === 0 ? 12 : filterCount === 1 ? 8 : filterCount === 2 ? 6 : 4;
  const filterGridSize = filterCount === 0 ? 0 : filterCount === 1 ? 4 : filterCount === 2 ? 3 : 2.6;

  return (
    <Grid container spacing={2} sx={{ alignItems: 'center' }}>
      {/* Text Search Input */}
      <Grid size={{ xs: 12, md: searchGridSize }}>
        <TextField
          placeholder={searchPlaceholder}
          variant="outlined"
          size="small"
          fullWidth
          value={localValue}
          onChange={(e) => handleInputChange(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            },
          }}
        />
      </Grid>

      {/* Dynamic Dropdown Filters */}
      {filters.map((filter, index) => (
        <Grid size={{ xs: 12, sm: 6, md: filterGridSize }} key={index}>
          <FormControl fullWidth size="small">
            <Select
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value as string)}
              displayEmpty
            >
              {filter.placeholder && (
                <MenuItem value="all">{filter.placeholder}</MenuItem>
              )}
              {filter.options.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      ))}
    </Grid>
  );
};

export default SearchFilters;
