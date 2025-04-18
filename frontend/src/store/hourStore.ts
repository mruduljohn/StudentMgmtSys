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
  initializeDefaultSubjectChapters,
  uploadHoursCSV as apiUploadHoursCSV
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
  examDate?: string;
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
  
  selectedHourIds = observable.array<string>([]);
  
  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }
  
  init = action(async () => {
    this.setLoading(true);
    
    try {
      // Fetch hours with pagination
      await this.fetchHours();
      
      // Fetch options for dropdowns
      await this.fetchOptions();
      
      // Fetch statistics
      await this.fetchStats();
      
      runInAction(() => {
        this.dataLoaded.set(true);
      });
    } catch (error) {
      runInAction(() => {
        console.error("Error initializing hour store:", error);
        this.error.set("Failed to initialize hour data");
      });
    } finally {
      this.setLoading(false);
    }
  });
  
  setLoading = action((loading: boolean) => {
    this.loading.set(loading);
  });
  
  setError = action((error: string | null) => {
    this.error.set(error);
  });
  
  setSearchQuery = action((query: string) => {
    this.searchQuery.set(query);
    this.currentPage.set(1); // Reset to first page when searching
  });
  
  setFilter = action((key: string, value: string | number | boolean) => {
    this.filters.set(key, value);
    this.currentPage.set(1); // Reset to first page when filtering
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
  });
  
  clearFilters = action(() => {
    this.filters.clear();
    this.searchQuery.set('');
    this.currentPage.set(1); // Reset to first page when clearing filters
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
    this.setLoading(true);
    
    try {
      // Request a larger page size to handle client-side sorting
      // This is a workaround for the API not sorting correctly
      const params: ApiParams = {
        page: 1, // Request first page with larger size
        limit: 1000, // Request more data to sort client-side
        // Still send sort parameters in case API gets fixed
        sortBy: this.sortField.get(),
        sortOrder: this.sortOrder.get(),
        search: this.searchQuery.get() || undefined
      };
      
      // Add filters to params
      this.filters.forEach((value, key) => {
        params[key] = value;
      });
      
      // Store the API response outside of any MobX actions
      const response = await fetchHours(params);
      
      // Apply client-side sorting and pagination
      const sortedHours = this.applySorting(response.hours);
      const currentPage = this.currentPage.get();
      const pageSize = this.pageSize.get();
      
      // Client-side pagination
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedHours = sortedHours.slice(startIndex, endIndex);
      
      // Calculate total pages based on the sorted data
      const totalPages = Math.ceil(sortedHours.length / pageSize);
      
      // Use runInAction to batch all observable mutations
      runInAction(() => {
        this.hours.replace(paginatedHours);
        this.totalHours.set(sortedHours.length);
        this.totalPages.set(totalPages);
      });
    } catch (error) {
      // Handle errors within runInAction as well
      runInAction(() => {
        console.error("Error fetching hours:", error);
        this.error.set("Failed to fetch hours");
      });
    } finally {
      this.setLoading(false);
    }
  });
  
  // Helper method to apply client-side sorting based on current sort settings
  applySorting = (hours: Hour[]): Hour[] => {
    const field = this.sortField.get();
    const order = this.sortOrder.get();
    
    console.log(`Applying client-side sorting: ${field} ${order}`);
    
    return [...hours].sort((a, b) => {
      // Handle different field types appropriately
      let valueA = a[field as keyof Hour];
      let valueB = b[field as keyof Hour];
      
      // Handle undefined or null values
      if (valueA === undefined || valueA === null) valueA = '';
      if (valueB === undefined || valueB === null) valueB = '';
      
      // Convert to strings for comparison if they're not numbers
      if (typeof valueA !== 'number') valueA = String(valueA).toLowerCase();
      if (typeof valueB !== 'number') valueB = String(valueB).toLowerCase();
      
      // Apply the sort order
      if (order === 'asc') {
        return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
      } else {
        return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
      }
    });
  };
  
  fetchHourById = action(async (id: string) => {
    this.setLoading(true);
    
    try {
      const hour = await getHourById(id);
      
      runInAction(() => {
        this.selectedHour.set(hour);
      });
      
      return hour;
    } catch (error) {
      runInAction(() => {
        console.error(`Error fetching hour with ID ${id}:`, error);
        this.error.set(`Failed to fetch hour with ID ${id}`);
      });
      return null;
    } finally {
      this.setLoading(false);
    }
  });
  
  addHour = action(async (hourData: Partial<Hour>) => {
    this.setLoading(true);
    
    try {
      const response = await apiAddHour(hourData);
      
      // Refresh the hours list
      await this.fetchHours();
      
      return response.hour;
    } catch (error) {
      runInAction(() => {
        console.error("Error adding hour:", error);
        this.error.set("Failed to add hour");
      });
      throw error;
    } finally {
      this.setLoading(false);
    }
  });
  
  updateHour = action(async (id: string, hourData: Partial<Hour>) => {
    this.setLoading(true);
    
    try {
      const response = await apiUpdateHour(id, hourData);
      
      // Refresh the hours list
      await this.fetchHours();
      
      // If the updated hour is the selected hour, update it
      if (this.selectedHour.get()?._id === id) {
        runInAction(() => {
          this.selectedHour.set(response.hour);
        });
      }
      
      return response.hour;
    } catch (error) {
      runInAction(() => {
        console.error(`Error updating hour with ID ${id}:`, error);
        this.error.set(`Failed to update hour with ID ${id}`);
      });
      throw error;
    } finally {
      this.setLoading(false);
    }
  });
  
  deleteHour = action(async (id: string) => {
    this.setLoading(true);
    
    try {
      await apiDeleteHour(id);
      
      // Refresh the hours list
      await this.fetchHours();
      
      // If the deleted hour is the selected hour, clear it
      if (this.selectedHour.get()?._id === id) {
        runInAction(() => {
          this.selectedHour.set(null);
        });
      }
      
      return true;
    } catch (error) {
      runInAction(() => {
        console.error(`Error deleting hour with ID ${id}:`, error);
        this.error.set(`Failed to delete hour with ID ${id}`);
      });
      throw error;
    } finally {
      this.setLoading(false);
    }
  });
  
  fetchStats = action(async (batch?: string) => {
    this.setLoading(true);
    
    try {
      const params = batch ? { batch } : undefined;
      const stats = await getHourStats(params);
      
      runInAction(() => {
        this.stats.set(stats);
      });
      
      return stats;
    } catch (error) {
      runInAction(() => {
        console.error("Error fetching hour stats:", error);
        this.error.set("Failed to fetch hour statistics");
      });
      return null;
    } finally {
      this.setLoading(false);
    }
  });
  
  fetchChapterStatus = action(async (batch?: string, subject?: string) => {
    this.setLoading(true);
    
    try {
      const params: { batch?: string; subject?: string } = {};
      if (batch) params.batch = batch;
      if (subject) params.subject = subject;
      
      return await getChapterStatus(params);
    } catch (error) {
      runInAction(() => {
        console.error("Error fetching chapter status:", error);
        this.error.set("Failed to fetch chapter status");
      });
      return [];
    } finally {
      this.setLoading(false);
    }
  });
  
  fetchOptions = action(async () => {
    this.setLoading(true);
    
    try {
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
      });
    } catch (error) {
      runInAction(() => {
        this.error.set(error instanceof Error ? error.message : 'Failed to fetch options');
      });
    } finally {
      this.setLoading(false);
    }
  });
  
  // Method to handle setting sort parameters and fetching in one action
  sortAndFetch = action(async (field: string, order: 'asc' | 'desc') => {
    // First update sort parameters
    this.sortField.set(field);
    this.sortOrder.set(order);
    
    // Then fetch with updated parameters
    await this.fetchHours();
  });
  
  // Method to handle setting page and fetching in one action  
  setPageAndFetch = action(async (page: number) => {
    // First update page
    this.currentPage.set(page);
    
    // Then fetch with updated parameters
    await this.fetchHours();
  });
  
  // Method to handle setting page size and fetching in one action
  setPageSizeAndFetch = action(async (size: number) => {
    // First update page size and reset to page 1
    this.pageSize.set(size);
    this.currentPage.set(1);
    
    // Then fetch with updated parameters
    await this.fetchHours();
  });
  
  // Upload hours from CSV
  uploadHoursCSV = action(async (file: File, mode: 'new' | 'update' | 'both' = 'both') => {
    this.setLoading(true);
    this.setError(null);
    
    try {
      const response = await apiUploadHoursCSV(file, mode);
      
      // Refresh hours data after successful upload
      await this.fetchHours();
      
      return response;
    } catch (error) {
      runInAction(() => {
        console.error("Error uploading hours CSV:", error);
        this.error.set("Failed to upload hours CSV");
      });
      throw error;
    } finally {
      this.setLoading(false);
    }
  });
  
  // Select an hour for bulk operations
  selectHour = action((hourId: string, selected: boolean) => {
    if (selected) {
      this.selectedHourIds.push(hourId);
    } else {
      const index = this.selectedHourIds.findIndex(id => id === hourId);
      if (index !== -1) {
        this.selectedHourIds.splice(index, 1);
      }
    }
  });
  
  // Select all hours for bulk operations
  selectAllHours = action((selected: boolean) => {
    if (selected) {
      // Get all hour IDs from the current page
      const hourIds = this.hours.map(hour => hour._id as string);
      this.selectedHourIds.replace(hourIds);
    } else {
      this.selectedHourIds.clear();
    }
  });
  
  // Clear all selections
  clearSelections = action(() => {
    this.selectedHourIds.clear();
  });
  
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
  
  get getSelectedHourIds() {
    return this.selectedHourIds;
  }
  
  get getSelectedHours() {
    return this.hours.filter(hour => 
      this.selectedHourIds.includes(hour._id as string)
    );
  }
}

const hourStore = new HourStore();

export function useHourStore() {
  return hourStore;
}

export default hourStore; 