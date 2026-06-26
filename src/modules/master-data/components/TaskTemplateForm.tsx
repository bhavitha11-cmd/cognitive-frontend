import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Grid, TextField } from '@mui/material';

const templateSchema = z.object({
  title: z.string().min(1, 'Task Title is required').max(300),
  description: z.string().optional(),
});

export type TemplateFormValues = z.infer<typeof templateSchema>;

interface TaskTemplateFormProps {
  formId: string;
  initialValues?: Partial<TemplateFormValues>;
  onSubmit: (data: TemplateFormValues) => void;
}

export const FORM_ID = 'task-template-form';

export const TaskTemplateForm: React.FC<TaskTemplateFormProps> = ({
  formId,
  initialValues,
  onSubmit,
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<TemplateFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(templateSchema) as any,
    defaultValues: {
      title: '',
      description: '',
      ...initialValues,
    },
  });

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} noValidate>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Task Title *"
                fullWidth
                size="small"
                error={!!errors.title}
                helperText={errors.title?.message}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Description"
                fullWidth
                size="small"
                multiline
                rows={3}
                error={!!errors.description}
                helperText={errors.description?.message}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            )}
          />
        </Grid>
      </Grid>
    </form>
  );
};
