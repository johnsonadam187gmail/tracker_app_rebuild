import axios from 'axios';
import type {
  User,
  ClassSchedule,
  ClassInstance,
  Attendance,
  ClassFeedback,
  Role,
  UserRole,
  GymLocation,
  ClassType,
  Term,
  TermTarget,
  Curriculum,
  Lesson,
  DashboardStats,
  FeedbackStats,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  teacherLogin: async (email: string, password: string) => {
    const response = await api.post('/auth/teacher-login', { email, password });
    return response.data;
  },
  verifySession: async () => {
    const response = await api.post('/auth/verify-session');
    return response.data;
  },
  checkPassword: async (uuid: string) => {
    const response = await api.get(`/auth/check-password/${uuid}`);
    return response.data;
  },
};

export const usersApi = {
  list: async () => {
    const response = await api.get<User[]>('/users/');
    return response.data;
  },
  get: async (uuid: string) => {
    const response = await api.get<User>(`/users/${uuid}`);
    return response.data;
  },
  create: async (data: Partial<User>) => {
    const response = await api.post('/users/', data);
    return response.data;
  },
  update: async (uuid: string, data: Partial<User>) => {
    const response = await api.put<User>(`/users/${uuid}`, data);
    return response.data;
  },
  search: async (query: string) => {
    const response = await api.get<User[]>(`/users/search?query=${query}`);
    return response.data;
  },
  uploadPhoto: async (uuid: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/users/${uuid}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  deletePhoto: async (uuid: string) => {
    const response = await api.delete(`/users/${uuid}/photo`);
    return response.data;
  },
};

export const classesApi = {
  list: async () => {
    const response = await api.get<ClassSchedule[]>('/classes/');
    return response.data;
  },
  get: async (id: number) => {
    const response = await api.get<ClassSchedule>(`/classes/${id}`);
    return response.data;
  },
  create: async (data: Partial<ClassSchedule>) => {
    const response = await api.post('/classes/', data);
    return response.data;
  },
  update: async (uuid: string, data: Partial<ClassSchedule>) => {
    const response = await api.put<ClassSchedule>(`/classes/${uuid}`, data);
    return response.data;
  },
};

export const classInstancesApi = {
  list: async (params?: { class_id?: number; date?: string }) => {
    const response = await api.get<ClassInstance[]>('/class-instances/', { params });
    return response.data;
  },
  getByDate: async (classId: number, date: string) => {
    const response = await api.get<ClassInstance>(`/class-instances/by-date/?class_id=${classId}&date=${date}`);
    return response.data;
  },
  create: async (data: Partial<ClassInstance>) => {
    const response = await api.post('/class-instances/', data);
    return response.data;
  },
  update: async (id: number, data: Partial<ClassInstance>) => {
    const response = await api.put<ClassInstance>(`/class-instances/${id}`, data);
    return response.data;
  },
};

export const attendanceApi = {
  getByUser: async (uuid: string) => {
    const response = await api.get<Attendance[]>(`/attendance/user/${uuid}`);
    return response.data;
  },
  getByClass: async (classId: number, date?: string) => {
    const response = await api.get<Attendance[]>(`/attendance/class/${classId}`, {
      params: { date },
    });
    return response.data;
  },
  checkIn: async (userUuid: string, classId: number, classInstanceId?: number) => {
    const response = await api.post('/attendance/check-in', {
      user_uuid: userUuid,
      class_id: classId,
      class_instance_id: classInstanceId,
    });
    return response.data;
  },
  direct: async (userUuid: string, classId: number, classInstanceId?: number, teacherUuid?: string) => {
    const response = await api.post('/attendance/direct', {
      user_uuid: userUuid,
      class_id: classId,
      class_instance_id: classInstanceId,
      teacher_uuid: teacherUuid,
    });
    return response.data;
  },
  confirm: async (id: number) => {
    const response = await api.post(`/attendance/${id}/confirm`);
    return response.data;
  },
  cancel: async (id: number) => {
    const response = await api.delete(`/attendance/${id}/cancel`);
    return response.data;
  },
  bulkConfirm: async (ids: number[]) => {
    const response = await api.post('/attendance/bulk-confirm', { ids });
    return response.data;
  },
};

export const feedbackApi = {
  submit: async (attendanceId: number, rating: string, comment?: string) => {
    const response = await api.post('/feedback/', {
      attendance_id: attendanceId,
      rating,
      comment,
    });
    return response.data;
  },
  getByUser: async (uuid: string) => {
    const response = await api.get<ClassFeedback[]>(`/feedback/user/${uuid}`);
    return response.data;
  },
  getByTeacher: async (uuid: string) => {
    const response = await api.get<ClassFeedback[]>(`/feedback/teacher/${uuid}`);
    return response.data;
  },
  getAdminStats: async (params?: { start_date?: string; end_date?: string; classes?: string; teachers?: string; rating?: string }) => {
    const response = await api.get<FeedbackStats>('/feedback/admin/comprehensive-stats', { params });
    return response.data;
  },
};

export const rolesApi = {
  list: async () => {
    const response = await api.get<Role[]>('/roles/');
    return response.data;
  },
  getUserRoles: async (uuid: string) => {
    const response = await api.get<UserRole[]>(`/roles/user/${uuid}`);
    return response.data;
  },
  updateUserRoles: async (uuid: string, roleIds: number[]) => {
    const response = await api.put(`/roles/user/${uuid}`, { role_ids: roleIds });
    return response.data;
  },
  getUserHistory: async (uuid: string) => {
    const response = await api.get<UserRole[]>(`/roles/user/${uuid}/history`);
    return response.data;
  },
  getUsersByRole: async (role: string) => {
    const response = await api.get<User[]>(`/roles/users/by-role/${role}`);
    return response.data;
  },
};

export const termsApi = {
  list: async () => {
    const response = await api.get<Term[]>('/terms/');
    return response.data;
  },
  create: async (data: Partial<Term>) => {
    const response = await api.post('/terms/', data);
    return response.data;
  },
};

export const termTargetsApi = {
  list: async () => {
    const response = await api.get<TermTarget[]>('/term-targets/');
    return response.data;
  },
  create: async (data: Partial<TermTarget>) => {
    const response = await api.post('/term-targets/', data);
    return response.data;
  },
};

export const curriculaApi = {
  list: async () => {
    const response = await api.get<Curriculum[]>('/curricula/');
    return response.data;
  },
  create: async (data: Partial<Curriculum>) => {
    const response = await api.post('/curricula/', data);
    return response.data;
  },
};

export const lessonsApi = {
  list: async (curriculumId?: number) => {
    const response = await api.get<Lesson[]>('/lessons/', { params: { curriculum_id: curriculumId } });
    return response.data;
  },
  create: async (data: Partial<Lesson>) => {
    const response = await api.post('/lessons/', data);
    return response.data;
  },
  update: async (id: number, data: Partial<Lesson>) => {
    const response = await api.put<Lesson>(`/lessons/${id}`, data);
    return response.data;
  },
  delete: async (id: number) => {
    const response = await api.delete(`/lessons/${id}`);
    return response.data;
  },
};

export const gymLocationsApi = {
  list: async () => {
    const response = await api.get<GymLocation[]>('/gym-locations/');
    return response.data;
  },
  create: async (data: Partial<GymLocation>) => {
    const response = await api.post('/gym-locations/', data);
    return response.data;
  },
};

export const classTypesApi = {
  list: async () => {
    const response = await api.get<ClassType[]>('/class-types/');
    return response.data;
  },
  create: async (data: Partial<ClassType>) => {
    const response = await api.post('/class-types/', data);
    return response.data;
  },
};

export const dashboardApi = {
  getStats: async (uuid: string) => {
    const response = await api.get<DashboardStats>(`/dashboard/stats/${uuid}`);
    return response.data;
  },
  getAttendanceTrend: async (uuid: string, days: number = 90) => {
    const response = await api.get(`/dashboard/attendance-trend/${uuid}?days=${days}`);
    return response.data;
  },
};

export const kioskApi = {
  verifyPin: async (pin: string) => {
    const response = await api.post('/kiosk/verify-pin', { pin });
    return response.data;
  },
  updatePin: async (currentPin: string, newPin: string) => {
    const response = await api.put('/kiosk/update-pin', { current_pin: currentPin, new_pin: newPin });
    return response.data;
  },
};

export default api;
