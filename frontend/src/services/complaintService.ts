import { initialMockComplaints, mockDepartments } from '../data/mockData';
import { AIAnalysis, Complaint, ComplaintSeverity, ComplaintStatus } from '../types';

// In-memory reactive state for interactive UI prototype
let localComplaints: Complaint[] = [...initialMockComplaints];

// Simulated AI Vision Model analysis generator (mirrors local Ollama Vision model behavior)
export function simulateAIVisionAnalysis(categoryHint?: string): AIAnalysis {
  const models = [
    {
      category: 'Electrical',
      issue: 'Exposed Electrical Wiring / Spark Hazard',
      description: 'Ollama Vision model detected loose insulation and bare conductor wiring in a high-traffic corridor.',
      severity: 'critical' as ComplaintSeverity,
      confidence: 0.94,
      detected_objects: ['copper conductor', 'damaged conduit', 'wall junction box'],
      recommended_action: 'Trip local MCB and dispatch emergency electrical maintenance team.',
      estimated_resolution_time: '2 - 4 hours',
    },
    {
      category: 'Plumbing',
      issue: 'Pipe Joint Leakage & Standing Water',
      description: 'Ollama Vision model detected continuous drip line from valve fixture causing slip hazard.',
      severity: 'medium' as ComplaintSeverity,
      confidence: 0.88,
      detected_objects: ['water leak', 'corroded valve', 'wet floor surface'],
      recommended_action: 'Replace rubber washer gasket and inspect pipe pressure.',
      estimated_resolution_time: '12 - 24 hours',
    },
    {
      category: 'General Maintenance',
      issue: 'Broken Furniture / Structural Damage',
      description: 'Ollama Vision model identified broken fastener joint with protruding sharp edges.',
      severity: 'high' as ComplaintSeverity,
      confidence: 0.91,
      detected_objects: ['fractured wood', 'bent bracket', 'exposed screw'],
      recommended_action: 'Replace or weld frame before regular classroom occupancy.',
      estimated_resolution_time: '24 hours',
    },
    {
      category: 'IT & Network',
      issue: 'Network Equipment Fault Indicator',
      description: 'Ollama Vision model recognized amber error LED blinking on enterprise ceiling access point.',
      severity: 'low' as ComplaintSeverity,
      confidence: 0.86,
      detected_objects: ['AP fixture', 'blinking amber LED', 'ethernet cable'],
      recommended_action: 'Remote reboot PoE switch port or verify DHCP pool.',
      estimated_resolution_time: '6 hours',
    },
    {
      category: 'Hostel & Sanitation',
      issue: 'Drain Blockage & Overflow',
      description: 'Ollama Vision model identified clogged floor drain with standing soapy water.',
      severity: 'high' as ComplaintSeverity,
      confidence: 0.93,
      detected_objects: ['blocked drain grate', 'surface scum', 'standing water'],
      recommended_action: 'Deploy drainage snake and sanitize surrounding area.',
      estimated_resolution_time: '8 hours',
    },
  ];

  if (categoryHint) {
    const match = models.find((m) => m.category.toLowerCase().includes(categoryHint.toLowerCase()));
    if (match) return match;
  }

  const randomIdx = Math.floor(Math.random() * models.length);
  return models[randomIdx];
}

export const complaintService = {
  async getAllComplaints(): Promise<Complaint[]> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return [...localComplaints];
  },

  async getUserComplaints(userId: string): Promise<Complaint[]> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return localComplaints.filter((c) => c.user_id === userId);
  },

  async getComplaintById(id: string): Promise<Complaint | null> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const item = localComplaints.find((c) => c.id === id);
    return item ? { ...item } : null;
  },

  async submitComplaint(params: {
    userId: string;
    userName: string;
    userEmail: string;
    departmentId: string;
    locationName: string;
    imageUri: string;
    issueType: string;
    description: string;
    severity?: ComplaintSeverity;
    simulateAI?: boolean;
  }): Promise<{ complaint: Complaint; aiAnalysis: AIAnalysis }> {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const selectedDept = mockDepartments.find((d) => d.id === params.departmentId) || mockDepartments[2];
    const aiAnalysis = simulateAIVisionAnalysis(selectedDept.name);

    const newComplaint: Complaint = {
      id: `CMP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      user_id: params.userId,
      userName: params.userName,
      userEmail: params.userEmail,
      department_id: selectedDept.id,
      department_name: selectedDept.name,
      location_name: params.locationName,
      image_url: params.imageUri,
      issue_type: params.issueType || aiAnalysis.issue,
      description: params.description || aiAnalysis.description,
      severity: params.severity || aiAnalysis.severity,
      status: 'submitted',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ai_analysis: aiAnalysis,
      history: [
        {
          id: `hist-${Date.now()}-1`,
          complaint_id: '',
          status: 'submitted',
          comment: 'Complaint submitted by student with photo proof.',
          updated_by: `${params.userName} (Student)`,
          updated_by_role: 'system',
          created_at: new Date().toISOString(),
        },
        {
          id: `hist-${Date.now()}-2`,
          complaint_id: '',
          status: 'submitted',
          comment: `AI Vision analyzed: ${aiAnalysis.issue}. Auto-classified as ${aiAnalysis.severity.toUpperCase()} priority.`,
          updated_by: 'SnapIT AI Assistant (Ollama Vision)',
          updated_by_role: 'system',
          created_at: new Date().toISOString(),
        },
      ],
    };

    newComplaint.history?.forEach((h) => (h.complaint_id = newComplaint.id));
    localComplaints = [newComplaint, ...localComplaints];

    return {
      complaint: newComplaint,
      aiAnalysis,
    };
  },

  async updateComplaintStatus(
    complaintId: string,
    newStatus: ComplaintStatus,
    comment: string,
    adminName: string = 'Dr. Nandit (Admin)'
  ): Promise<Complaint> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const index = localComplaints.findIndex((c) => c.id === complaintId);
    if (index === -1) throw new Error('Complaint not found.');

    const target = localComplaints[index];
    const updatedHistory = [
      ...(target.history || []),
      {
        id: `hist-${Date.now()}`,
        complaint_id: target.id,
        status: newStatus,
        comment: comment.trim() || `Status changed to ${newStatus.replace('_', ' ')}`,
        updated_by: adminName,
        updated_by_role: 'admin' as const,
        created_at: new Date().toISOString(),
      },
    ];

    const updated: Complaint = {
      ...target,
      status: newStatus,
      updated_at: new Date().toISOString(),
      history: updatedHistory,
    };

    localComplaints[index] = updated;
    return updated;
  },

  async updateComplaintPriority(complaintId: string, newSeverity: ComplaintSeverity): Promise<Complaint> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const index = localComplaints.findIndex((c) => c.id === complaintId);
    if (index === -1) throw new Error('Complaint not found.');

    localComplaints[index] = {
      ...localComplaints[index],
      severity: newSeverity,
      updated_at: new Date().toISOString(),
    };
    return localComplaints[index];
  },

  async reassignDepartment(
    complaintId: string,
    departmentId: string,
    departmentName: string
  ): Promise<Complaint> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const index = localComplaints.findIndex((c) => c.id === complaintId);
    if (index === -1) throw new Error('Complaint not found.');

    localComplaints[index] = {
      ...localComplaints[index],
      department_id: departmentId,
      department_name: departmentName,
      updated_at: new Date().toISOString(),
    };
    return localComplaints[index];
  },

  resetMockData() {
    localComplaints = [...initialMockComplaints];
  },
};
