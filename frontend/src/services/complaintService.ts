
import { api, apiRequest } from './api';
import { supabase } from './supabase';
import { Complaint, ComplaintStatus, Department } from '../types';
import { mockDepartments } from '../data/mockData';

let cachedDepartments: Department[] | null = null;
let hasWarnedDepartmentFetch = false;

interface AnalyzeComplaintParams {
  imageUri: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface AIAnalysis {
  issue: string;
  category: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number | null;
  agent_decisions?: {
    department: string;
    routing_reason: string;
    safety_flag: boolean;
    requires_urgent_review: boolean;
    human_review_required: boolean;
    decision_log?: Record<string, any>;
  };
}

export interface AnalyzeComplaintResponse {
  message: string;
  image_url: string;
  department_id: string;
  ai_analysis: AIAnalysis;
}

interface SubmitComplaintParams {
  image_url: string;
  department_id: string;
  issue_type: string;
  description: string;
  severity: string;
  ai_analysis: AIAnalysis;
  latitude?: number | null;
  longitude?: number | null;
}

interface ComplaintListResponse {
  complaints: Complaint[];
}

interface ComplaintHistoryResponse {
  complaint_id: string;
  history: any[];
}

interface StatusUpdateResponse {
  message: string;
  complaint: Complaint;
}

export const complaintService = {
  // Get all departments
  async getDepartments(): Promise<Department[]> {
    if (cachedDepartments && cachedDepartments.length > 0) {
      return cachedDepartments;
    }

    try {
      const response = await api.get<{ departments: Department[] }>(
        '/departments',
        false
      );

      if (response?.departments?.length > 0) {
        cachedDepartments = response.departments.map((d: any) => ({
          id: d.id,
          name: d.name,
          code: d.name.substring(0, 4).toUpperCase(),
          iconName: 'Wrench',
          activeTicketsCount: 0,
        }));

        return cachedDepartments;
      }
    } catch {
      try {
        const { data } = await supabase.from('departments').select('*');

        if (data && data.length > 0) {
          cachedDepartments = data.map((d: any) => ({
            id: d.id,
            name: d.name,
            code: (d.code || d.name.substring(0, 4)).toUpperCase(),
            iconName: 'Wrench',
            activeTicketsCount: 0,
          }));

          return cachedDepartments;
        }
      } catch {
        // Department sources unavailable
      }

      if (!hasWarnedDepartmentFetch) {
        console.warn('Unable to fetch live departments.');
        hasWarnedDepartmentFetch = true;
      }
    }

    cachedDepartments = mockDepartments;
    return cachedDepartments;
  },

  // Get all complaints (Admin only)
  async getAllComplaints(): Promise<Complaint[]> {
    const response = await api.get<ComplaintListResponse>(
      '/admin/complaints'
    );

    return response.complaints;
  },

  // Get complaints belonging to a student
  async getUserComplaints(userId: string): Promise<Complaint[]> {
    const response = await api.get<ComplaintListResponse>(
      `/users/${encodeURIComponent(userId)}/complaints`
    );

    return response.complaints;
  },

  // Get one complaint with its status history
  async getComplaintById(complaintId: string): Promise<Complaint> {
    const [complaint, historyResponse] = await Promise.all([
      api.get<Complaint>(
        `/complaints/${encodeURIComponent(complaintId)}`
      ),
      api.get<ComplaintHistoryResponse>(
        `/complaints/${encodeURIComponent(complaintId)}/history`
      ),
    ]);

    return {
      ...complaint,
      history: historyResponse.history as Complaint['history'],
    };
  },

  // Stage 1: Upload image and receive AI predictions
  // This must NOT create a complaint.
  async analyzeComplaint(
    params: AnalyzeComplaintParams
  ): Promise<AnalyzeComplaintResponse> {
    const formData = new FormData();

    const filename =
      params.imageUri.split('/').pop() || 'complaint.jpg';

    const extension = filename.split('.').pop()?.toLowerCase();

    const mimeType =
      extension === 'png'
        ? 'image/png'
        : extension === 'webp'
        ? 'image/webp'
        : 'image/jpeg';

    formData.append(
      'file',
      {
        uri: params.imageUri,
        name: filename,
        type: mimeType,
      } as any
    );

    if (
      params.latitude !== null &&
      params.latitude !== undefined &&
      !isNaN(params.latitude)
    ) {
      formData.append('latitude', String(params.latitude));
    }

    if (
      params.longitude !== null &&
      params.longitude !== undefined &&
      !isNaN(params.longitude)
    ) {
      formData.append('longitude', String(params.longitude));
    }

    return apiRequest<AnalyzeComplaintResponse>(
      '/complaints/analyze',
      {
        method: 'POST',
        body: formData,
      }
    );
  },

  // Stage 2: Save the student's confirmed or edited complaint
  async submitComplaint(
    params: SubmitComplaintParams
  ): Promise<{ message: string; complaint: Complaint }> {
    return api.post<{ message: string; complaint: Complaint }>(
      '/complaints/',
      params
    );
  },

  // Update complaint status (Admin only)
  async updateComplaintStatus(
    complaintId: string,
    newStatus: ComplaintStatus,
    comment?: string,
    _updatedBy?: string
  ): Promise<Complaint> {
    const response = await api.patch<StatusUpdateResponse>(
      `/admin/complaints/${encodeURIComponent(complaintId)}/status`,
      {
        status: newStatus,
        comment,
      }
    );

    return response.complaint;
  },

  // Update complaint priority (Admin only)
  async updateComplaintPriority(
    complaintId: string,
    severity: string
  ): Promise<Complaint> {
    const response = await api.patch<StatusUpdateResponse>(
      `/admin/complaints/${encodeURIComponent(complaintId)}/priority`,
      { severity }
    );

    return response.complaint;
  },

  // Reassign department (Admin only)
  async reassignDepartment(
    complaintId: string,
    departmentId: string,
    _departmentName?: string
  ): Promise<Complaint> {
    const response = await api.patch<StatusUpdateResponse>(
      `/admin/complaints/${encodeURIComponent(complaintId)}/department`,
      { department_id: departmentId }
    );

    return response.complaint;
  },
};
