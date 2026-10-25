export const UserRole = {
  ADMIN: 'ADMIN' as const,
  TEACHER: 'TEACHER' as const,
  STUDENT: 'STUDENT' as const,
};
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export interface User {
  id: number;
  user_code: string;
  identifier?: string;
  full_name: string;
  email: string;
  role: UserRole;
  phone_number?: string;
  avatar_url?: string;
  is_active: boolean;
  must_change_password: boolean;
  created_at: string;
  details?: Record<string, any>;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user_id: number;
  user_code: string;
  full_name: string;
  email: string;
  role: UserRole;
  must_change_password: boolean;
}

export interface Department {
  id: number;
  code: string;
  name: string;
  description?: string;
  is_active: boolean;
}

export interface Course {
  id: number;
  code: string;
  name: string;
  department_id: number;
  duration_years: number;
  total_semesters: number;
  is_active: boolean;
}

export interface Branch {
  id: number;
  code: string;
  name: string;
  course_id: number;
  is_active: boolean;
}

export interface Subject {
  id: number;
  code: string;
  name: string;
  course_id: number;
  branch_id?: number;
  department_id: number;
  semester: number;
  credits: number;
  is_active: boolean;
}

export interface Classroom {
  id: number;
  room_number: string;
  building: string;
  floor?: string;
  capacity: number;
  is_active: boolean;
}

export interface TimetableEntry {
  id: number;
  weekday: number;
  start_time: string;
  end_time: string;
  subject_id: number;
  teacher_id: number;
  classroom_id: number;
  course_id: number;
  branch_id: number;
  semester: number;
  is_active: boolean;
  subject_name?: string;
  teacher_name?: string;
  classroom_number?: string;
}

export interface LectureSession {
  session_id: number;
  subject_id: number;
  subject_name: string;
  teacher_id: number;
  teacher_name: string;
  date: string;
  start_time: string;
  end_time: string;
  status: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  session_code: string;
  attendance_count?: number;
}

export interface AttendanceRecord {
  id: number;
  session_id: number;
  student_id: number;
  student_code: string;
  student_name: string;
  roll_number: string;
  student_roll?: string;
  course_name?: string;
  branch_name?: string;
  subject_code: string;
  subject_name: string;
  date: string;
  start_time: string;
  end_time: string;
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED';
  verification_method: 'FACE' | 'QR' | 'MANUAL' | 'CORRECTION';
  recorded_at: string;
  timestamp?: string;
  remarks?: string;
  is_corrected: boolean;
  gps_verified?: boolean;
}

export interface StudentListItem {
  id: number;
  profile_id: number;
  student_id: string;
  roll_number: string;
  full_name: string;
  email: string;
  phone_number?: string;
  course_id: number;
  branch_id: number;
  department_id: number;
  semester: number;
  course_name?: string;
  branch_name?: string;
  is_active: boolean;
  face_enrolled: boolean;
  parent_name?: string;
  parent_phone?: string;
  parent_email?: string;
  address?: string;
  created_at: string;
}

export interface TeacherListItem {
  id: number;
  profile_id: number;
  employee_code: string;
  full_name: string;
  email: string;
  phone_number?: string;
  department_id: number;
  department_name?: string;
  designation: string;
  qualification?: string;
  is_active: boolean;
  created_at: string;
}

export interface LeaveRequest {
  id: number;
  student_id: number;
  student_code: string;
  student_name: string;
  roll_number: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewed_by_name?: string;
  review_remarks?: string;
  reviewed_at?: string;
  created_at: string;
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
}

export interface InstituteSettings {
  institute_name: string;
  address: string;
  timezone: string;
  contact_email: string;
  contact_phone: string;
  late_threshold_minutes: number;
  qr_expiry_minutes: number;
  face_session_minutes: number;
  daily_cutoff_time: string;
}

export interface GeofenceSettings {
  latitude: number;
  longitude: number;
  radius_meters: number;
  accuracy_threshold_meters: number;
  is_enabled: boolean;
}

export interface AuditLogItem {
  id: number;
  actor_id?: number;
  actor_role?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: string;
  ip_address?: string;
  timestamp: string;
}

export interface AIQueryResponse {
  query: string;
  answer: string;
  evidence: Array<Record<string, any>>;
  follow_up_questions: string[];
}
