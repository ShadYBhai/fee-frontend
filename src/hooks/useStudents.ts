import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as studentsApi from '@/api/students.api';
import type { CreateStudentInput, UpdateStudentInput } from '@/types/student';

export const STUDENTS_KEY = ['students'] as const;

export function useStudents(params?: { batch_id?: string; status?: 'ACTIVE' | 'INACTIVE'; page?: number }) {
  return useQuery({
    queryKey: [...STUDENTS_KEY, params],
    queryFn: () => studentsApi.listStudents(params),
  });
}

export function useStudent(id: string) {
  return useQuery({
    queryKey: [...STUDENTS_KEY, id],
    queryFn: () => studentsApi.getStudent(id),
    enabled: !!id,
  });
}

export function useCreateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateStudentInput) => studentsApi.createStudent(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: STUDENTS_KEY });
      toast.success('Student added successfully!');
    },
    onError: (err: { displayMessage?: string }) =>
      toast.error(err.displayMessage ?? 'Could not add student.'),
  });
}

export function useUpdateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStudentInput }) =>
      studentsApi.updateStudent(id, data),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: STUDENTS_KEY });
      qc.invalidateQueries({ queryKey: [...STUDENTS_KEY, id] });
      toast.success('Student updated.');
    },
    onError: (err: { displayMessage?: string }) =>
      toast.error(err.displayMessage ?? 'Could not update student.'),
  });
}

export function useDeactivateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => studentsApi.deactivateStudent(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: STUDENTS_KEY });
      toast.success('Student deactivated.');
    },
    onError: (err: { displayMessage?: string }) =>
      toast.error(err.displayMessage ?? 'Could not deactivate student.'),
  });
}
