import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Autocomplete, TextField, CircularProgress } from '@mui/material';
import { api } from '../../../utils/api';

interface TaskTemplateSearchItem {
  id: string;
  templateCode: string;
  title: string;
  description?: string;
}

interface TaskTitleDropdownProps {
  value: string;
  onChange: (title: string, description?: string) => void;
  error?: boolean;
  helperText?: string;
}

export const TaskTitleDropdown: React.FC<TaskTitleDropdownProps> = ({
  value,
  onChange,
  error,
  helperText,
}) => {
  const [options, setOptions] = useState<TaskTemplateSearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const loadedRef = useRef(false);
  const timerRef = useRef<any>(null);
  const requestIdRef = useRef(0);

  const fetchAll = useCallback(() => {
    if (loadedRef.current) return;
    const currentId = ++requestIdRef.current;
    setLoading(true);
    api
      .get('/task-templates/search', { params: { q: '' } })
      .then((response) => {
        if (currentId !== requestIdRef.current) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw: any[] = response.data?.data?.templates || [];
        setOptions(
          raw.map((t) => ({
            id: t.id,
            templateCode: t.template_code,
            title: t.title,
            description: t.description || undefined,
          }))
        );
        loadedRef.current = true;
      })
      .catch(() => {
        if (currentId === requestIdRef.current) setOptions([]);
      })
      .finally(() => {
        if (currentId === requestIdRef.current) setLoading(false);
      });
  }, []);

  const search = useCallback((q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      fetchAll();
      return;
    }
    const currentId = ++requestIdRef.current;
    setLoading(true);
    api
      .get('/task-templates/search', { params: { q: trimmed } })
      .then((response) => {
        if (currentId !== requestIdRef.current) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw: any[] = response.data?.data?.templates || [];
        setOptions(
          raw.map((t) => ({
            id: t.id,
            templateCode: t.template_code,
            title: t.title,
            description: t.description || undefined,
          }))
        );
      })
      .catch(() => {
        if (currentId === requestIdRef.current) setOptions([]);
      })
      .finally(() => {
        if (currentId === requestIdRef.current) setLoading(false);
      });
  }, [fetchAll]);

  useEffect(() => {
    if (open && !loadedRef.current) {
      fetchAll();
    }
  }, [open, fetchAll]);

  const handleInputChange = useCallback(
    (_: React.SyntheticEvent, newInputValue: string) => {
      onChange(newInputValue);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => search(newInputValue), 300);
    },
    [onChange, search]
  );

  const handleChange = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (_: React.SyntheticEvent, newValue: any) => {
      if (newValue && typeof newValue !== 'string') {
        onChange(newValue.title, newValue.description);
      }
    },
    [onChange]
  );

  return (
    <Autocomplete
      freeSolo
      options={options}
      inputValue={value}
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      getOptionLabel={(option) => (typeof option === 'string' ? option : option.title)}
      isOptionEqualToValue={(option, val) =>
        typeof val === 'string' ? option.title === val : option.id === val.id
      }
      onInputChange={handleInputChange}
      onChange={handleChange}
      filterOptions={(x) => x}
      noOptionsText={value.trim() ? 'No matching titles found — type your own' : 'Start typing to search...'}
      loading={loading}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Task Title *"
          placeholder="Search or type a custom title..."
          size="small"
          error={error}
          helperText={helperText}
          slotProps={{
            ...params.slotProps,
            inputLabel: { shrink: true },
            input: {
              ...params.slotProps?.input,
              endAdornment: (
                <>
                  {loading ? <CircularProgress color="inherit" size={14} /> : null}
                  {params.slotProps?.input?.endAdornment}
                </>
              ),
            },
          }}
        />
      )}
      renderOption={(props, option) => {
        const { key, ...rest } = props;
        return (
          <li key={key} {...rest}>
            <div>
              <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{option.title}</div>
              {option.description && (
                <div style={{ fontSize: '0.75rem', color: '#666', marginTop: 2 }}>
                  {option.description}
                </div>
              )}
              <div style={{ fontSize: '0.7rem', color: '#999', marginTop: 1 }}>
                {option.templateCode}
              </div>
            </div>
          </li>
        );
      }}
      sx={{ '& .MuiAutocomplete-option': { py: 1 } }}
    />
  );
};
