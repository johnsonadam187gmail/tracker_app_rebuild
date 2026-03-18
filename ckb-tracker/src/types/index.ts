export type Rank = 'White' | 'Blue' | 'Purple' | 'Brown' | 'Black';

export type AttendanceStatus = 'pending' | 'confirmed';

export type FeedbackRating = 'thumbs_up' | 'thumbs_down';

export interface User {
  user_uuid: string;
  first_name: string;
  last_name: string;
  email: string;
  password_hash?: string;
  rank?: Rank;
  last_graded_date?: string;
  comments?: string;
  nicknames?: string;
  profile_image_url?: string;
  is_current: boolean;
  effective_date: string;
  end_date?: string;
  created_date: string;
  updated_date: string;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
}

export interface UserRole {
  id: number;
  user_uuid: string;
  role_id: number;
  is_current: boolean;
  effective_date: string;
  end_date?: string;
  created_date: string;
  updated_date: string;
  role?: Role;
}

export interface ClassSchedule {
  id: number;
  class_uuid: string;
  class_name: string;
  day?: string;
  time?: string;
  description?: string;
  points: number;
  gym_id?: number;
  class_type_id?: number;
  is_current: boolean;
  effective_date: string;
  end_date?: string;
  created_date: string;
  gym?: GymLocation;
  class_type?: ClassType;
}

export interface ClassInstance {
  id: number;
  class_id: number;
  class_date: string;
  teacher_uuid?: string;
  lesson_id?: number;
  created_at: string;
  updated_at: string;
  class_schedule?: ClassSchedule;
  teacher?: User;
  lesson?: Lesson;
}

export interface GymLocation {
  id: number;
  name: string;
  address?: string;
}

export interface ClassType {
  id: number;
  name: string;
}

export interface Curriculum {
  id: number;
  class_id: number;
  name?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: number;
  curriculum_id: number;
  title: string;
  description?: string;
  lesson_plan_url?: string;
  video_folder_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Attendance {
  id: number;
  user_uuid: string;
  class_id: number;
  class_instance_id?: number;
  teacher_uuid?: string;
  user_role_id?: number;
  attendance_date: string;
  created_at: string;
  status: AttendanceStatus;
  confirmed_by?: string;
  confirmed_at?: string;
  user?: User;
  class_schedule?: ClassSchedule;
}

export interface ClassFeedback {
  id: number;
  user_uuid: string;
  attendance_id: number;
  class_instance_id: number;
  rating?: FeedbackRating;
  comment?: string;
  created_at: string;
  updated_at: string;
}

export interface Term {
  id: number;
  term_name: string;
  start_date: string;
  end_date: string;
  created_at: string;
}

export interface TermTarget {
  id: number;
  term_id: number;
  rank: Rank;
  target: number;
}

export interface KioskAuth {
  id: number;
  pin_hash: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  totalClasses: number;
  totalPoints: number;
  classesThisMonth: number;
  lastClassDaysAgo: number | null;
}

export interface AttendanceTrend {
  date: string;
  count: number;
  points: number;
}

export interface FeedbackStats {
  totalFeedback: number;
  positiveCount: number;
  negativeCount: number;
  positivePercent: number;
}
