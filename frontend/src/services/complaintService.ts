import { api, apiRequest } from './api';
import { Complaint, ComplaintStatus, Department } from '../types';
import { mockDepartments } from '../data/mockData';

interface UploadComplaintParams {
  imageUri: string;
  latitude?: number | null;
  longitude?: number | null;
}

interface UploadComplaintResponse {
  message: string;
  complaint: Complaint;
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
  // Get all departments (live from backend with fallback)
  async getDepartments(): Promise<Department[]> {
    try {
      const response = await api.get<{ departments: Department[] }>(
        '/departments',
        false
      );
      if (response?.departments && response.departments.length > 0) {
        return response.departments.map((d: any) => ({
          id: d.id,
          name: d.name,
          code: d.name.substring(0, 4).toUpperCase(),
          iconName: 'Wrench',
          activeTicketsCount: 0,
        }));
      }
    } catch (e) {
      console.warn('Failed to fetch departments from backend, using default list');
    }
    return mockDepartments;
  },

  // Get all complaints (Admin only)
  async getAllComplaints(): Promise<Complaint[]> {
    const response = await api.get<ComplaintListResponse>(
      '/admin/complaints'
    );

    return response.complaints;
  },

  // Get complaints belonging to a particular student
  async getUserComplaints(userId: string): Promise<Complaint[]> {
    const response = await api.get<ComplaintListResponse>(
      `/users/${encodeURIComponent(userId)}/complaints`
    );

    return response.complaints;
  },

  // Get one complaint along with its status history
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

  // Upload a complaint photo with optional GPS coordinates
  async submitComplaint(
    params: UploadComplaintParams
  ): Promise<UploadComplaintResponse> {
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

    const response = await apiRequest<UploadComplaintResponse>(
      '/complaints/upload',
      {
        method: 'POST',
        body: formData,
      }
    );

    return response;
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
