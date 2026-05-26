import { apiClient } from "../client";

export interface CropMonitoringRecord {
  _id: string;
  policyId: string | { _id: string; [key: string]: unknown };
  farmId: string | { _id: string; [key: string]: unknown };
  assessorId: string | { _id: string; [key: string]: unknown };
  monitoringNumber: number;
  monitoringDate: string;
  status: "IN_PROGRESS" | "COMPLETED";
  observations?: string[];
  photoUrls?: string[];
  notes?: string;
  weatherData?: unknown;
  ndviData?: unknown;
  droneAnalysisPdfs?: {
    _id?: string;
    pdfType: string;
    pdfUrl: string;
    droneAnalysisData?: any;
    uploadedAt: string;
  }[];
  reportGenerated?: boolean;
  reportGeneratedAt?: string;
  totalRecommendedCycles?: number;
  recommendedNextMonitoringDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

async function resolveAndFlattenCycles(parents: any[]): Promise<CropMonitoringRecord[]> {
  if (!Array.isArray(parents)) return [];
  const allCycles: CropMonitoringRecord[] = [];
  
  const detailedParents = await Promise.all(
    parents.map(async (parent: any) => {
      if (parent && parent._id) {
        try {
          return await cropMonitoringService.getById(parent._id);
        } catch (err) {
          console.error(`Failed to fetch crop monitoring details for ${parent._id}:`, err);
          return parent;
        }
      }
      return parent;
    })
  );

  detailedParents.forEach((parent: any) => {
    if (parent && parent.monitoringCycles && Array.isArray(parent.monitoringCycles)) {
      allCycles.push(...parent.monitoringCycles);
    } else if (parent && parent.monitoringNumber) {
      allCycles.push(parent);
    }
  });

  return allCycles;
}

export const cropMonitoringService = {
  /** Get a single monitoring record (parent with cycles) */
  getById: async (id: string): Promise<any> => {
    return apiClient.get<any>(`/crop-monitoring/${id}`);
  },

  /** List all monitoring tasks (returns fields with active policies) */
  listTasks: async (): Promise<any[]> => {
    return apiClient.get<any[]>("/crop-monitoring");
  },

  /** All cycles across the platform (Admin only) */
  listAllAdmin: async (): Promise<CropMonitoringRecord[]> => {
    const parents = await apiClient.get<any[]>("/crop-monitoring/records/all");
    return resolveAndFlattenCycles(parents);
  },

  /** Get all monitoring records for a specific policy */
  getByPolicy: async (policyId: string): Promise<CropMonitoringRecord[]> => {
    const parents = await apiClient.get<any[]>(
      `/crop-monitoring/policy/${policyId}`,
    );
    return resolveAndFlattenCycles(parents);
  },

  /** Start a new monitoring cycle for a policy */
  startCycle: async (policyId: string): Promise<CropMonitoringRecord> => {
    return apiClient.post<CropMonitoringRecord>("/crop-monitoring/start", {
      policyId,
    });
  },

  /** Update a monitoring cycle with observations, notes, photos, etc. */
  updateCycle: async (
    id: string,
    updateData: {
      observations?: string[];
      photoUrls?: string[];
      notes?: string;
      ndviData?: object;
    },
  ): Promise<CropMonitoringRecord> => {
    return apiClient.put<CropMonitoringRecord>(
      `/crop-monitoring/${id}`,
      updateData,
    );
  },

  /** Generate the monitoring report (finalises the cycle) */
  generateReport: async (id: string): Promise<CropMonitoringRecord> => {
    return apiClient.post<CropMonitoringRecord>(
      `/crop-monitoring/${id}/generate-report`,
    );
  },

  /** Upload a photo for a monitoring record */
  uploadPhoto: async (
    monitoringId: string,
    file: File,
  ): Promise<{ id: string; url: string }> => {
    const formData = new FormData();
    formData.append("file", file);

    return apiClient.upload<{ id: string; url: string }>(
      `/photos/upload?type=ASSESSMENT&entityId=${monitoringId}`,
      formData,
    );
  },

  /** Upload drone analysis PDF for a monitoring cycle */
  uploadDronePdf: async (
    monitoringId: string,
    pdfType: string,
    file: File,
  ): Promise<any> => {
    const formData = new FormData();
    formData.append("file", file);

    return apiClient.upload<any>(
      `/crop-monitoring/${monitoringId}/upload-drone-pdf?pdfType=${pdfType}`,
      formData,
    );
  },

  /** Process an uploaded drone PDF to extract data */
  processDronePdf: async (monitoringId: string, pdfType: string): Promise<any> => {
    return apiClient.post<any>(
      `/crop-monitoring/${monitoringId}/process-drone-pdf`,
      { pdfType }
    );
  },

  /** Get all uploaded PDFs for a monitoring cycle */
  getUploadedPdfs: async (monitoringId: string): Promise<any[]> => {
    return apiClient.get<any[]>(`/crop-monitoring/${monitoringId}/pdfs`);
  },

  /** Delete a specific PDF from a monitoring cycle */
  deletePdf: async (monitoringId: string, pdfType: string): Promise<any> => {
    return apiClient.delete<any>(
      `/crop-monitoring/${monitoringId}/pdfs/${pdfType}`,
    );
  },
};
