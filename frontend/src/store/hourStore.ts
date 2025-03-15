import { makeAutoObservable, runInAction, observable, action } from 'mobx';
import { Hour, HourStats } from '../types';
import {
  fetchHours,
  getHourById,
  addHour as apiAddHour,
  updateHour as apiUpdateHour,
  deleteHour as apiDeleteHour,
  getHourStats,
  getChapterStatus,
  getHourOptions,
  getSubjectChapters,
  initializeDefaultSubjectChapters
} from '../api';

interface ApiParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  batch?: string;
  subject?: string;
  chapter?: string;
  mode?: string;
  classTeacher?: string;
  chapterStatus?: string;
  [key: string]: string | number | boolean | undefined;
}

class HourStore {
  hours = observable.array<Hour>([]);
  selectedHour = observable.box<Hour | null>(null);
  loading = observable.box(false);
  error = observable.box<string | null>(null);
  stats = observable.box<HourStats | null>(null);
  dataLoaded = observable.box(false);
  
  totalHours = observable.box(0);
  currentPage = observable.box(1);
  pageSize = observable.box(10);
  totalPages = observable.box(0);
  
  searchQuery = observable.box('');
  filters = observable.map<string, string | number | boolean>({});
  
  sortField = observable.box('createdAt');
  sortOrder = observable.box<'asc' | 'desc'>('desc');
  
  options = observable({
    subjects: [] as string[],
    batches: [] as string[],
    modes: [] as string[],
    classTeachers: [] as string[],
    statuses: ['NOT STARTED', 'ONGOING', 'COMPLETED'],
    subjectChapters: {} as Record<string, string[]>
  });
  
  constructor() {
    makeAutoObservable(this);
  }
  
  init = action(async () => {
    this.loading.set(true);
    
    try {
      // Fetch hours with pagination
      await this.fetchHours();
      
      // Fetch options for dropdowns
      await this.fetchOptions();
      
      // Fetch statistics
      await this.fetchStats();
      
      this.dataLoaded.set(true);
    } catch (error) {
      console.error("Error initializing hour store:", error);
      this.error.set("Failed to initialize hour data");
    } finally {
      this.loading.set(false);
    }
  });
  
  setSearchQuery = action((query: string) => {
    this.searchQuery.set(query);
    this.currentPage.set(1); // Reset to first page when searching
  });
  
  setFilter = action((key: string, value: string | number | boolean) => {
    this.filters.set(key, value);
    this.currentPage.set(1); // Reset to first page when filtering
    this.fetchHours(); // Automatically fetch hours after setting filter
  });
  
  setFilters = action((filters: Record<string, string | number | boolean>) => {
    // Clear existing filters
    this.filters.clear();
    
    // Set new filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        this.filters.set(key, value);
      }
    });
    
    this.currentPage.set(1); // Reset to first page when filtering
    this.fetchHours(); // Automatically fetch hours after setting filters
  });
  
  clearFilters = action(() => {
    this.filters.clear();
    this.searchQuery.set('');
    this.currentPage.set(1); // Reset to first page when clearing filters
    this.fetchHours(); // Automatically fetch hours after clearing filters
  });
  
  setPage = action((page: number) => {
    this.currentPage.set(page);
  });
  
  setPageSize = action((size: number) => {
    this.pageSize.set(size);
    this.currentPage.set(1); // Reset to first page when changing page size
  });
  
  setSorting = action((field: string, order: 'asc' | 'desc') => {
    this.sortField.set(field);
    this.sortOrder.set(order);
  });
  
  fetchHours = action(async () => {
    this.loading.set(true);
    
    try {
      const params: ApiParams = {
        page: this.currentPage.get(),
        limit: this.pageSize.get(),
        sortBy: this.sortField.get(),
        sortOrder: this.sortOrder.get(),
        search: this.searchQuery.get() || undefined
      };
      
      // Add filters to params
      this.filters.forEach((value, key) => {
        params[key] = value;
      });
      
      const response = await fetchHours(params);
      
      runInAction(() => {
        this.hours.replace(response.hours);
        this.totalHours.set(response.totalHours);
        this.totalPages.set(response.totalPages);
      });
    } catch (error) {
      console.error("Error fetching hours:", error);
      this.error.set("Failed to fetch hours");
    } finally {
      this.loading.set(false);
    }
  });
  
  fetchHourById = action(async (id: string) => {
    this.loading.set(true);
    
    try {
      const hour = await getHourById(id);
      
      runInAction(() => {
        this.selectedHour.set(hour);
      });
      
      return hour;
    } catch (error) {
      console.error(`Error fetching hour with ID ${id}:`, error);
      this.error.set(`Failed to fetch hour with ID ${id}`);
      return null;
    } finally {
      this.loading.set(false);
    }
  });
  
  addHour = action(async (hourData: Partial<Hour>) => {
    this.loading.set(true);
    
    try {
      const response = await apiAddHour(hourData);
      
      // Refresh the hours list
      await this.fetchHours();
      
      return response.hour;
    } catch (error) {
      console.error("Error adding hour:", error);
      this.error.set("Failed to add hour");
      throw error;
    } finally {
      this.loading.set(false);
    }
  });
  
  updateHour = action(async (id: string, hourData: Partial<Hour>) => {
    this.loading.set(true);
    
    try {
      const response = await apiUpdateHour(id, hourData);
      
      // Refresh the hours list
      await this.fetchHours();
      
      // If the updated hour is the selected hour, update it
      if (this.selectedHour.get()?._id === id) {
        this.selectedHour.set(response.hour);
      }
      
      return response.hour;
    } catch (error) {
      console.error(`Error updating hour with ID ${id}:`, error);
      this.error.set(`Failed to update hour with ID ${id}`);
      throw error;
    } finally {
      this.loading.set(false);
    }
  });
  
  deleteHour = action(async (id: string) => {
    this.loading.set(true);
    
    try {
      await apiDeleteHour(id);
      
      // Refresh the hours list
      await this.fetchHours();
      
      // If the deleted hour is the selected hour, clear it
      if (this.selectedHour.get()?._id === id) {
        this.selectedHour.set(null);
      }
      
      return true;
    } catch (error) {
      console.error(`Error deleting hour with ID ${id}:`, error);
      this.error.set(`Failed to delete hour with ID ${id}`);
      throw error;
    } finally {
      this.loading.set(false);
    }
  });
  
  fetchStats = action(async (batch?: string) => {
    this.loading.set(true);
    
    try {
      const params = batch ? { batch } : undefined;
      const stats = await getHourStats(params);
      
      runInAction(() => {
        this.stats.set(stats);
      });
      
      return stats;
    } catch (error) {
      console.error("Error fetching hour stats:", error);
      this.error.set("Failed to fetch hour statistics");
      return null;
    } finally {
      this.loading.set(false);
    }
  });
  
  fetchChapterStatus = action(async (batch?: string, subject?: string) => {
    this.loading.set(true);
    
    try {
      const params: { batch?: string; subject?: string } = {};
      if (batch) params.batch = batch;
      if (subject) params.subject = subject;
      
      return await getChapterStatus(params);
    } catch (error) {
      console.error("Error fetching chapter status:", error);
      this.error.set("Failed to fetch chapter status");
      return [];
    } finally {
      this.loading.set(false);
    }
  });
  
  fetchOptions = action(async () => {
    try {
      this.loading.set(true);
      
      // Fetch hour options
      const options = await getHourOptions();
      
      // Fetch subject chapters
      let subjectChapters = {};
      try {
        subjectChapters = await getSubjectChapters();
      } catch (error) {
        console.error('Error fetching subject chapters, initializing defaults:', error);
        try {
          await initializeDefaultSubjectChapters();
          subjectChapters = await getSubjectChapters();
        } catch (initError) {
          console.error('Failed to initialize subject chapters:', initError);
        }
      }
      
      runInAction(() => {
        this.options.subjects = options.subjects || [];
        this.options.batches = options.batches || [];
        this.options.modes = options.modes || [];
        this.options.classTeachers = options.classTeachers || [];
        this.options.subjectChapters = subjectChapters || {};
        this.loading.set(false);
      });
    } catch (error) {
      runInAction(() => {
        this.error.set(error instanceof Error ? error.message : 'Failed to fetch options');
        this.loading.set(false);
      });
    }
  });
  
  // Computed properties
  get getHours() {
    return this.hours;
  }
  
  get getTotalHours() {
    return this.totalHours.get();
  }
  
  get getCurrentPage() {
    return this.currentPage.get();
  }
  
  get getPageSize() {
    return this.pageSize.get();
  }
  
  get getTotalPages() {
    return this.totalPages.get();
  }
  
  get getSortField() {
    return this.sortField.get();
  }
  
  get getSortOrder() {
    return this.sortOrder.get();
  }
  
  get getStats() {
    return this.stats.get();
  }
  
  get isLoading() {
    return this.loading.get();
  }
  
  get getError() {
    return this.error.get();
  }
  
  get isDataLoaded() {
    return this.dataLoaded.get();
  }
  
  get getOptions() {
    return this.options;
  }
}

// Create a singleton instance
const hourStore = new HourStore();

// Hook for components to use the store
export function useHourStore() {
  return hourStore;
}

export default hourStore; 