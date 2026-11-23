
export type UserRole = 'student' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  authUserId?: string;
  rollNumber?: string;
  department?: string;
  hostelBlock?: string;
  roomNumber?: string;
  avatarUrl?: string;
  phone?: string;
}

export type ComplaintStatus =
  | 'submitted'
  | 'under_review'
  | 'assigned'
  | 'in_progress'
  | 'resolved'
  | 'rejected';

export type ComplaintSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface AIAnalysis {
  category: string;
  issue: string;
  description: string;
  severity: ComplaintSeverity;
  confidence?: number;
  detected_objects?: string[];
  recommended_action?: string;
  estimated_resolution_time?: string;
}

export interface ComplaintHistoryItem {
  id: string;
  complaint_id: string;
  status?: ComplaintStatus;        // normalised by backend (new_status → status)
  old_status?: string;             // raw DB field
  new_status?: string;             // raw DB field
  comment?: string;
  updated_by: string;
  updated_by_role?: 'admin' | 'system';
  created_at: string;
}

export interface Complaint {
  id: string;
  user_id: string;
  userName?: string;
  userEmail?: string;
  department_id: string;
  department_name: string;
  location_id?: string;
  location_name?: string;
  latitude?: number;
  longitude?: number;
  image_url: string;
  issue_type: string;
  description: string;
  severity: ComplaintSeverity;
  status: ComplaintStatus;
  ai_analysis?: AIAnalysis;
  created_at: string;
  updated_at: string;
  history?: ComplaintHistoryItem[];
}

export interface Department {
  id: string;
  name: string;
  code: string;
  iconName: string;
  activeTicketsCount: number;
}
