import type {
  AuthResponse,
  User,
  Department,
  Course,
  Branch,
  Subject,
  Classroom,
  TimetableEntry,
  LectureSession,
  AttendanceRecord,
  StudentListItem,
  TeacherListItem,
  LeaveRequest,
  NotificationItem,
  InstituteSettings,
  GeofenceSettings,
  AuditLogItem,
  AIQueryResponse,
} from '@/types';

const API_BASE = '/api/v1';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export function getToken(): string | null {
  return localStorage.getItem('attendx_token');
}

export function setToken(token: string): void {
  localStorage.setItem('attendx_token', token);
}

export function clearToken(): void {
  localStorage.removeItem('attendx_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearToken();
    if (window.location.pathname !== '/login' && !window.location.pathname.startsWith('/auth')) {
      window.location.href = '/login';
    }
  }

  if (!response.ok) {
    let errDetail = 'Request failed';
    try {
      const errJson = await response.json();
      errDetail = errJson.detail || errJson.message || JSON.stringify(errJson);
    } catch {
      errDetail = response.statusText;
    }
    throw new ApiError(errDetail, response.status);
  }

  if (response.headers.get('content-type')?.includes('application/json')) {
    return (await response.json()) as T;
  }
  return (await response.text()) as unknown as T;
}

export const api = {
  // --- Auth ---
  login: (data: { identifier: string; password: string }) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  changePassword: (data: { current_password: string; new_password: string; confirm_new_password: string }) =>
    request<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  createStudentAccount: (data: any) =>
    request<{ message: string }>('/auth/create-account', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  forgotPassword: (data: { identifier: string }) =>
    request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  verifyOtp: (data: { email: string; otp: string }) =>
    request<{ message: string }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  resetPassword: (data: any) =>
    request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  logout: () => {
    clearToken();
    return request<{ message: string }>('/auth/logout', { method: 'POST' });
  },

  getMe: () => request<User>('/auth/me'),

  verifyStudentForActivation: (data: { student_id: string; email: string }) =>
    request<{ message: string; success: boolean }>('/auth/activate/verify-student', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  completeStudentActivation: (data: {
    student_id: string;
    email: string;
    otp: string;
    new_password: string;
    confirm_new_password: string;
  }) =>
    request<{ message: string; success: boolean }>('/auth/activate/complete', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  uploadProfileImage: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<{ avatar_url: string; message: string }>('/auth/profile-image', {
      method: 'POST',
      body: formData,
    });
  },

  deleteProfileImage: () =>
    request<{ avatar_url: null; message: string }>('/auth/profile-image', { method: 'DELETE' }),

  // --- Public Contact ---
  submitContact: (data: { name: string; email: string; subject: string; message: string }) =>
    request<{ success: boolean; message: string }>('/public/contact', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // --- Departments, Courses, Branches, Subjects, Classrooms ---
  getDepartments: () => request<Department[]>('/departments'),
  createDepartment: (data: { code: string; name: string; description?: string }) =>
    request<Department>('/departments', { method: 'POST', body: JSON.stringify(data) }),
  updateDepartment: (id: number, data: { name?: string; description?: string; is_active?: boolean }) =>
    request<Department>(`/departments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDepartment: (id: number) =>
    request<{ message: string }>(`/departments/${id}`, { method: 'DELETE' }),

  getCourses: (deptId?: number) =>
    request<Course[]>(deptId ? `/courses?department_id=${deptId}` : '/courses'),
  createCourse: (data: { code: string; name: string; department_id: number; duration_years: number; total_semesters: number }) =>
    request<Course>('/courses', { method: 'POST', body: JSON.stringify(data) }),
  updateCourse: (id: number, data: any) =>
    request<Course>(`/courses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCourse: (id: number) =>
    request<{ message: string }>(`/courses/${id}`, { method: 'DELETE' }),

  getBranches: (courseId?: number) =>
    request<Branch[]>(courseId ? `/branches?course_id=${courseId}` : '/branches'),
  createBranch: (data: { code: string; name: string; course_id: number }) =>
    request<Branch>('/branches', { method: 'POST', body: JSON.stringify(data) }),
  updateBranch: (id: number, data: any) =>
    request<Branch>(`/branches/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBranch: (id: number) =>
    request<{ message: string }>(`/branches/${id}`, { method: 'DELETE' }),

  getSubjects: (params?: { course_id?: number; branch_id?: number; semester?: number }) => {
    const qs = new URLSearchParams(params as any).toString();
    return request<Subject[]>(`/subjects${qs ? `?${qs}` : ''}`);
  },
  createSubject: (data: any) =>
    request<Subject>('/subjects', { method: 'POST', body: JSON.stringify(data) }),
  updateSubject: (id: number, data: any) =>
    request<Subject>(`/subjects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSubject: (id: number) =>
    request<{ message: string }>(`/subjects/${id}`, { method: 'DELETE' }),

  getClassrooms: () => request<Classroom[]>('/classrooms'),
  createClassroom: (data: any) =>
    request<Classroom>('/classrooms', { method: 'POST', body: JSON.stringify(data) }),
  updateClassroom: (id: number, data: any) =>
    request<Classroom>(`/classrooms/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteClassroom: (id: number) =>
    request<{ message: string }>(`/classrooms/${id}`, { method: 'DELETE' }),

  // --- Timetable ---
  getTimetable: (params?: any) => {
    const qs = new URLSearchParams(params || {}).toString();
    return request<TimetableEntry[]>(`/timetable${qs ? `?${qs}` : ''}`);
  },
  getMyTimetable: () => request<TimetableEntry[]>('/timetable/my-timetable'),
  createTimetableEntry: (data: any) =>
    request<TimetableEntry>('/timetable', { method: 'POST', body: JSON.stringify(data) }),
  deleteTimetableEntry: (id: number) =>
    request<{ message: string }>(`/timetable/${id}`, { method: 'DELETE' }),

  // --- Students & Teachers ---
  getStudents: (params?: any) => {
    const qs = new URLSearchParams(params || {}).toString();
    return request<StudentListItem[]>(`/students${qs ? `?${qs}` : ''}`);
  },
  createStudent: (data: any) =>
    request<StudentListItem>('/students', { method: 'POST', body: JSON.stringify(data) }),
  updateStudent: (profileId: number, data: any) =>
    request<StudentListItem>(`/students/${profileId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteStudent: (profileId: number) =>
    request<{ message: string }>(`/students/${profileId}`, { method: 'DELETE' }),
  toggleStudentStatus: (profileId: number, is_active: boolean) =>
    request<{ message: string }>(`/students/${profileId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ is_active }),
    }),

  getTeachers: (deptId?: number) =>
    request<TeacherListItem[]>(deptId ? `/teachers?department_id=${deptId}` : '/teachers'),
  createTeacher: (data: any) =>
    request<TeacherListItem>('/teachers', { method: 'POST', body: JSON.stringify(data) }),
  updateTeacher: (profileId: number, data: any) =>
    request<TeacherListItem>(`/teachers/${profileId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTeacher: (profileId: number) =>
    request<{ message: string }>(`/teachers/${profileId}`, { method: 'DELETE' }),
  toggleTeacherStatus: (profileId: number, is_active: boolean) =>
    request<{ message: string }>(`/teachers/${profileId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ is_active }),
    }),

  // --- Attendance Sessions & Verification ---
  getActiveSessions: () => request<LectureSession[]>('/attendance/sessions/active'),
  startSession: (data: { subject_id: number; duration_minutes: number; timetable_entry_id?: number }) =>
    request<LectureSession>('/attendance/sessions/start', { method: 'POST', body: JSON.stringify(data) }),
  closeSession: (sessionId: number) =>
    request<{ message: string }>(`/attendance/sessions/${sessionId}/close`, { method: 'POST' }),

  enrollFace: (samples: string[], studentUserId?: number, studentProfileId?: number) => {
    const params = new URLSearchParams();
    if (studentProfileId) params.append('student_profile_id', studentProfileId.toString());
    else if (studentUserId) params.append('student_user_id', studentUserId.toString());
    const qs = params.toString();
    const url = `/attendance/face-enroll${qs ? `?${qs}` : ''}`;
    return request<{ message: string; sample_count: number; quality_score: number }>(url, {
      method: 'POST',
      body: JSON.stringify({ samples }),
    });
  },

  resetFaceEnrollment: (studentProfileId: number) =>
    request<{ message: string }>(`/attendance/face-enroll/${studentProfileId}/reset`, { method: 'POST' }),

  verifyFaceAttendance: (data: { session_id: number; face_image: string; latitude?: number; longitude?: number; accuracy?: number }) =>
    request<AttendanceRecord>('/attendance/verify-face', { method: 'POST', body: JSON.stringify(data) }),

  generateQRToken: (sessionId: number, expiresInMinutes = 30) =>
    request<{ session_id: number; qr_token: string; expires_at: string; message: string }>('/attendance/qr/generate', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId, expires_in_minutes: expiresInMinutes }),
    }),

  verifyQRAttendance: (data: { qr_token: string; latitude?: number; longitude?: number; accuracy?: number }) =>
    request<AttendanceRecord>('/attendance/qr/verify', { method: 'POST', body: JSON.stringify(data) }),

  markManualAttendance: (data: { session_id: number; student_id: number; status: string; remarks?: string }) =>
    request<AttendanceRecord>('/attendance/manual', { method: 'POST', body: JSON.stringify(data) }),

  correctAttendance: (data: { record_id: number; new_status: string; reason: string }) =>
    request<AttendanceRecord>('/attendance/correct', { method: 'POST', body: JSON.stringify(data) }),

  getAttendanceHistory: (params?: any) => {
    const qs = new URLSearchParams(params || {}).toString();
    return request<AttendanceRecord[]>(`/attendance/history${qs ? `?${qs}` : ''}`);
  },

  processAbsences: (sessionId?: number) =>
    request<{ message: string }>('/attendance/process-absences', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId }),
    }),

  // --- Analytics ---
  getDashboardAnalytics: () => request<Record<string, any>>('/analytics/dashboard'),

  // --- Reports (Blob Downloaders) ---
  downloadReport: async (format: 'excel' | 'csv' | 'pdf', params?: any) => {
    const token = getToken();
    const qs = new URLSearchParams(params || {}).toString();
    const response = await fetch(`${API_BASE}/reports/${format}${qs ? `?${qs}` : ''}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error(`Report download failed: ${response.statusText}`);
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendx_report_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : format}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  // --- Leave Requests ---
  submitLeaveRequest: (data: { start_date: string; end_date: string; reason: string }) =>
    request<LeaveRequest>('/leave', { method: 'POST', body: JSON.stringify(data) }),
  getLeaveRequests: (statusFilter?: string) =>
    request<LeaveRequest[]>(`/leave${statusFilter ? `?status_filter=${statusFilter}` : ''}`),
  reviewLeaveRequest: (leaveId: number, data: { status: string; review_remarks?: string }) =>
    request<LeaveRequest>(`/leave/${leaveId}/review`, { method: 'PUT', body: JSON.stringify(data) }),

  // --- Notifications ---
  getNotifications: () => request<NotificationItem[]>('/notifications'),
  markNotificationRead: (notifId: number) =>
    request<{ message: string }>(`/notifications/${notifId}/read`, { method: 'PUT' }),
  sendSessionAlerts: (sessionId: number) =>
    request<{ message: string }>(`/notifications/send-session-alerts/${sessionId}`, { method: 'POST' }),
  broadcastNotification: (data: { title: string; message: string; target_role?: string }) =>
    request<{ message: string }>('/notifications/broadcast', { method: 'POST', body: JSON.stringify(data) }),

  // --- Settings & Audit ---
  getInstituteSettings: () => request<InstituteSettings>('/settings/institute'),
  updateInstituteSettings: (data: InstituteSettings) =>
    request<InstituteSettings>('/settings/institute', { method: 'PUT', body: JSON.stringify(data) }),

  getGeofenceSettings: () => request<GeofenceSettings>('/settings/geofence'),
  updateGeofenceSettings: (data: GeofenceSettings) =>
    request<GeofenceSettings>('/settings/geofence', { method: 'PUT', body: JSON.stringify(data) }),

  getAuditLogs: (params?: any) => {
    const qs = new URLSearchParams(params || {}).toString();
    return request<AuditLogItem[]>(`/audit${qs ? `?${qs}` : ''}`);
  },

  // --- AI Queries ---
  queryAI: (query: string) =>
    request<AIQueryResponse>('/ai/query', { method: 'POST', body: JSON.stringify({ query }) }),
};
