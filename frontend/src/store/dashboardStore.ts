import { makeAutoObservable, runInAction, observable, action } from 'mobx';
import { getDashboardPDFs, uploadDashboardPDFs, deleteDashboardPDF } from '../api';

interface DashboardPDF {
  title: string;
  filePath: string;
  description?: string;
  uploadedAt?: Date;
}

class DashboardStore {
  dashboardPDFs = observable.array<DashboardPDF>([]);
  loading = observable.box(false);
  error = observable.box<string | null>(null);

  constructor() {
    makeAutoObservable(this);
  }

  // Fetch all dashboard PDFs
  fetchDashboardPDFs = action(async () => {
    this.loading.set(true);
    this.error.set(null);

    try {
      const pdfs = await getDashboardPDFs();
      
      runInAction(() => {
        this.dashboardPDFs.replace(pdfs || []);
        this.loading.set(false);
      });
      
      return pdfs;
    } catch (error) {
      console.error('Error fetching dashboard PDFs:', error);
      runInAction(() => {
        this.error.set('Failed to fetch dashboard PDFs');
        this.loading.set(false);
      });
      throw error;
    }
  });

  // Upload dashboard PDFs with files
  uploadDashboardPDFs = action(async (formData: FormData) => {
    this.loading.set(true);
    this.error.set(null);

    try {
      const response = await uploadDashboardPDFs(formData);
      
      runInAction(() => {
        this.dashboardPDFs.replace(response.dashboardPDFs || []);
        this.loading.set(false);
      });
      
      return response;
    } catch (error) {
      console.error('Error uploading dashboard PDFs:', error);
      runInAction(() => {
        this.error.set('Failed to upload dashboard PDFs');
        this.loading.set(false);
      });
      throw error;
    }
  });

  // Delete a dashboard PDF
  deleteDashboardPDF = action(async (filePath: string) => {
    this.loading.set(true);
    this.error.set(null);

    try {
      const response = await deleteDashboardPDF(filePath);
      
      runInAction(() => {
        this.dashboardPDFs.replace(response.dashboardPDFs || []);
        this.loading.set(false);
      });
      
      return response;
    } catch (error) {
      console.error('Error deleting dashboard PDF:', error);
      runInAction(() => {
        this.error.set('Failed to delete dashboard PDF');
        this.loading.set(false);
      });
      throw error;
    }
  });

  // Get all dashboard PDFs
  get getDashboardPDFs(): DashboardPDF[] {
    return this.dashboardPDFs;
  }

  // Check if dashboard is loading
  get isLoading(): boolean {
    return this.loading.get();
  }

  // Get error message if any
  get getError(): string | null {
    return this.error.get();
  }
}

// Create a singleton instance
const dashboardStore = new DashboardStore();

// Hook for components to use the store
export function useDashboardStore() {
  return dashboardStore;
} 