import { api } from '@/lib/axios';
import type { Student, CreateStudentInput, UpdateStudentInput } from '@/types/student';

interface ListParams { batch_id?: string; status?: 'ACTIVE' | 'INACTIVE'; page?: number; limit?: number; }

export const listStudents = (params?: ListParams) =>
  api.get<{ data: Student[]; pagination: unknown }>('/students', { params }).then((r) => r.data);

export const getStudent = (id: string) =>
  api.get<{ data: Student }>(`/students/${id}`).then((r) => r.data.data);

export const createStudent = (data: CreateStudentInput) =>
  api.post<{ data: Student }>('/students', data).then((r) => r.data.data);

export const updateStudent = (id: string, data: UpdateStudentInput) =>
  api.patch<{ data: Student }>(`/students/${id}`, data).then((r) => r.data.data);

export const deactivateStudent = (id: string) =>
  api.patch(`/students/${id}/deactivate`).then((r) => r.data);
