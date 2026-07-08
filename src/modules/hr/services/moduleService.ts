import { useQuery } from '@tanstack/react-query';
import api from '../../../utils/api';
import type { Module } from '../types';

export const useGetModules = () => {
  return useQuery<Module[]>({
    queryKey: ['modules'],
    queryFn: async () => {
      const response = await api.get('/modules');
      return response.data.data?.modules || [];
    },
  });
};
