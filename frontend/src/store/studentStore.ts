import { makeAutoObservable, runInAction, observable, action } from 'mobx';
import { Student, BatchConfig, RemarksConfig, FlagsConfig } from '../types';
import { 
  fetchStudents, 
  getStudentById, 
  addStudent as apiAddStudent, 
  updateStudent as apiUpdateStudent, 
  deleteStudent as apiDeleteStudent,
  uploadStudentCSV,
  getStudentStats,
  getAllConfigs,
  updateConfig
} from '../api';

// Define a type for student stats
interface StudentStats {
  totalStudents: number;
  genderDistribution: Array<{_id: string; count: number}>;
  batchDistribution: Array<{_id: string; count: number}>;
  hostelDistribution: Array<{_id: string; count: number}>;
  streamDistribution: Array<{_id: string; count: number}>;
  joinedStatusDistribution: Array<{_id: string; count: number}>;
  feeDueCount: number;
  averageNeetScore: number;
  averagePlus2Percentage: number;
}

// Define a type for API parameters
interface ApiParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  [key: string]: string | number | boolean | undefined;
}

// Add a static flag outside the class to prevent repeated API calls
let isDataFetchInProgress = false;
let hasDataBeenFetched = false;

class StudentStore {
  students = observable.array<Student>([]);
  allStudents = observable.array<Student>([]); // Store all students
  selectedStudent = observable.box<Student | null>(null);
  loading = observable.box(false);
  error = observable.box<string | null>(null);
  stats = observable.box<StudentStats | null>(null);
  dataLoaded = observable.box(false); // Flag to track if data has been loaded

  // Pagination (now handled in frontend)
  totalStudents = observable.box(0);
  currentPage = observable.box(1);
  pageSize = observable.box(10);
  totalPages = observable.box(0);

  // Filters
  searchQuery = observable.box('');
  filters = observable.map<string, string | number | boolean>({});
  
  // Sorting
  sortField = observable.box('slNo');
  sortOrder = observable.box<'asc' | 'desc'>('asc');

  // Configurations
  batchConfig = observable<BatchConfig>({
    batches: [],
    teachers: [],
    hostels: [],
    programs: [],
    streams: [],
  });

  remarksConfig = observable<RemarksConfig>({
    remarks: 'Remarks',
    remarks1: 'Remarks 1',
    remarks2: 'Remarks 2',
    remarks3: 'Remarks 3',
    remarks4: 'Remarks 4',
  });

  flagsConfig = observable<FlagsConfig>({
    flag1: 'Flag 1',
    flag2: 'Flag 2',
    flag3: 'Flag 3',
    flag4: 'Flag 4',
  });

  constructor() {
    makeAutoObservable(this);
  }

  // Initialize the store with data
  init = action(async () => {
    // Check if data has already been fetched
    if (this.dataLoaded.get()) {
      console.log("Using cached data - data already fetched");
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      // Load configurations first
      await this.fetchAllConfigs();
      
      // Then fetch all students
      await this.fetchAllStudents();
      
      // Set dataLoaded flag to true
      this.dataLoaded.set(true);
      this.loading.set(false);
    } catch (error) {
      console.error("Error initializing store:", error);
      this.error.set("Failed to load data");
      this.loading.set(false);
      throw error;
    }
  });

  setSearchQuery = action((query: string) => {
    this.searchQuery.set(query);
    this.currentPage.set(1); // Reset to first page when searching
    this.applyFiltersAndPagination(); // Apply filters and pagination to the allStudents array
  });

  setFilter = action((key: string, value: string | number | boolean) => {
    this.filters.set(key, value);
    this.currentPage.set(1); // Reset to first page when filtering
    this.applyFiltersAndPagination(); // Apply filters and pagination to the allStudents array
  });

  setFilters = action((filters: Record<string, string | number | boolean>) => {
    this.filters.clear();
    Object.entries(filters).forEach(([key, value]) => {
      this.filters.set(key, value);
    });
    this.currentPage.set(1); // Reset to first page when filtering
    this.applyFiltersAndPagination(); // Apply filters and pagination to the allStudents array
  });

  clearFilters = action(() => {
    this.filters.clear();
    this.searchQuery.set('');
    this.currentPage.set(1);
    this.applyFiltersAndPagination(); // Apply filters and pagination to the allStudents array
  });

  setPage = action((page: number) => {
    this.currentPage.set(page);
    this.applyFiltersAndPagination(); // Apply filters and pagination to the allStudents array
  });

  setPageSize = action((size: number) => {
    this.pageSize.set(size);
    this.currentPage.set(1); // Reset to first page when changing page size
    this.applyFiltersAndPagination(); // Apply filters and pagination to the allStudents array
  });
  
  setSorting = action((field: string, order: 'asc' | 'desc') => {
    this.sortField.set(field);
    this.sortOrder.set(order);
    this.applyFiltersAndPagination(); // Apply filters and pagination to the allStudents array
  });

  // Apply filters, sorting, and pagination to the allStudents array
  applyFiltersAndPagination = action(() => {
    let filteredStudents = [...this.allStudents];
    
    // Apply search query
    const searchQuery = this.searchQuery.get();
    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      filteredStudents = filteredStudents.filter(student => {
        return (
          student.name?.toLowerCase().includes(lowerCaseQuery) ||
          student.studentId?.toLowerCase().includes(lowerCaseQuery) ||
          student.phoneNumber?.toLowerCase().includes(lowerCaseQuery) ||
          student.batch?.toLowerCase().includes(lowerCaseQuery) ||
          student.stream?.toLowerCase().includes(lowerCaseQuery)
        );
      });
    }
    
    // Apply filters
    this.filters.forEach((value, key) => {
      if (value !== null && value !== undefined && value !== '') {
        filteredStudents = filteredStudents.filter(student => {
          const studentValue = student[key as keyof Student];
          
          // Handle special case for feeDue (0 means paid, anything else means not paid)
          if (key === 'feeDue') {
            if (value === '0') {
              return studentValue === 0;
            } else {
              return typeof studentValue === 'number' && studentValue > 0;
            }
          }
          
          return studentValue === value;
        });
      }
    });
    
    // Apply sorting
    const sortField = this.sortField.get();
    const sortOrder = this.sortOrder.get();
    
    filteredStudents.sort((a, b) => {
      const aValue = a[sortField as keyof Student];
      const bValue = b[sortField as keyof Student];
      
      if (aValue === bValue) return 0;
      
      if (aValue === null || aValue === undefined) return sortOrder === 'asc' ? -1 : 1;
      if (bValue === null || bValue === undefined) return sortOrder === 'asc' ? 1 : -1;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }
      
      return sortOrder === 'asc' 
        ? (aValue < bValue ? -1 : 1) 
        : (aValue < bValue ? 1 : -1);
    });
    
    // Update total counts
    this.totalStudents.set(filteredStudents.length);
    this.totalPages.set(Math.ceil(filteredStudents.length / this.pageSize.get()));
    
    // Apply pagination
    const startIndex = (this.currentPage.get() - 1) * this.pageSize.get();
    const endIndex = startIndex + this.pageSize.get();
    const paginatedStudents = filteredStudents.slice(startIndex, endIndex);
    
    // Update students array
    this.students.replace(paginatedStudents);
  });

  // Fetch all students at once
  fetchAllStudents = action(async () => {
    // Use static flags to prevent repeated API calls
    if (hasDataBeenFetched && this.allStudents.length > 0) {
      console.log("Data already fetched, using cached data");
      this.applyFiltersAndPagination();
      return { students: this.students, totalItems: this.totalStudents.get(), totalPages: this.totalPages.get() };
    }

    // If a fetch is already in progress, don't start another one
    if (isDataFetchInProgress) {
      console.log("Data fetch already in progress, waiting...");
      return { students: this.students, totalItems: this.totalStudents.get(), totalPages: this.totalPages.get() };
    }

    isDataFetchInProgress = true;
    this.loading.set(true);
    this.error.set(null);

    try {
      // Fetch all students without pagination
      const params: ApiParams = {
        limit: 10000, // Set a high limit to get all students
        sortBy: this.sortField.get(),
        sortOrder: this.sortOrder.get()
      };

      console.log("Fetching all students - ONE TIME ONLY");
      const response = await fetchStudents(params);
      
      runInAction(() => {
        this.allStudents.replace(response.students || []);
        this.totalStudents.set(response.totalItems || 0);
        this.loading.set(false);
        this.dataLoaded.set(true);
        
        // Apply initial filtering and pagination
        this.applyFiltersAndPagination();
      });
      
      // Set the static flag to indicate data has been fetched
      hasDataBeenFetched = true;
      isDataFetchInProgress = false;
      
      return response;
    } catch (error) {
      runInAction(() => {
        this.error.set('Failed to fetch students');
        this.loading.set(false);
      });
      console.error('Error fetching all students:', error);
      isDataFetchInProgress = false;
      throw error;
    }
  });

  // Keep the original fetchStudents method for backward compatibility
  fetchStudents = action(async () => {
    this.loading.set(true);
    
    try {
      // Prepare API parameters
      const params: ApiParams = {
        page: this.currentPage.get(),
        limit: this.pageSize.get(),
        sortBy: this.sortField.get(),
        sortOrder: this.sortOrder.get(),
        search: this.searchQuery.get()
      };
      
      // Add all filters to params
      this.filters.forEach((value, key) => {
        if (value !== null && value !== undefined && value !== '') {
          params[key] = value;
        }
      });
      
      console.log("Fetching students with params:", params);
      
      // Call the API
      const response = await fetchStudents(params);
      
      runInAction(() => {
        // Update the students array with the response
        this.students.replace(response.students || []);
        this.totalStudents.set(response.totalItems || 0);
        this.totalPages.set(response.totalPages || 0);
        this.loading.set(false);
      });
      
      return { 
        students: this.students, 
        totalItems: this.totalStudents.get(), 
        totalPages: this.totalPages.get() 
      };
    } catch (error) {
      runInAction(() => {
        this.error.set('Failed to fetch students');
        this.loading.set(false);
      });
      console.error('Error fetching students:', error);
      throw error;
    }
  });

  fetchStudentById = action(async (id: string) => {
    this.loading.set(true);
    this.error.set(null);

    try {
      const response = await getStudentById(id);
      
      runInAction(() => {
        this.selectedStudent.set(response.student || null);
        this.loading.set(false);
      });
      
      return response.student;
    } catch (error) {
      runInAction(() => {
        this.error.set('Failed to fetch student');
        this.loading.set(false);
      });
      console.error('Error fetching student:', error);
      throw error;
    }
  });

  addStudent = action(async (student: Partial<Student>) => {
    this.loading.set(true);
    this.error.set(null);

    try {
      const response = await apiAddStudent(student);
      
      runInAction(() => {
        // Add to allStudents array
        this.allStudents.push(response.student);
        // Re-apply filters and pagination
        this.applyFiltersAndPagination();
        this.loading.set(false);
      });
      
      return response.student;
    } catch (error) {
      runInAction(() => {
        this.error.set('Failed to add student');
        this.loading.set(false);
      });
      console.error('Error adding student:', error);
      throw error;
    }
  });

  updateStudent = action(async (id: string, student: Partial<Student>) => {
    this.loading.set(true);
    this.error.set(null);

    try {
      const response = await apiUpdateStudent(id, student);
      
      runInAction(() => {
        // Update in allStudents array
        const index = this.allStudents.findIndex(s => s.studentId === id);
        if (index >= 0) {
          this.allStudents[index] = { ...this.allStudents[index], ...response.student };
        }
        // Re-apply filters and pagination
        this.applyFiltersAndPagination();
        this.loading.set(false);
      });
      
      return response.student;
    } catch (error) {
      runInAction(() => {
        this.error.set('Failed to update student');
        this.loading.set(false);
      });
      console.error('Error updating student:', error);
      throw error;
    }
  });

  deleteStudent = action(async (id: string) => {
    this.loading.set(true);
    this.error.set(null);

    try {
      console.log(`Deleting student with ID: ${id}`);
      const response = await apiDeleteStudent(id);
      
      runInAction(() => {
        // Remove from allStudents array
        const index = this.allStudents.findIndex(s => s.studentId === id);
        if (index >= 0) {
          this.allStudents.splice(index, 1);
          console.log(`Successfully removed student with ID ${id} from store`);
        } else {
          console.warn(`Student with ID ${id} not found in store`);
        }
        
        // Re-apply filters and pagination
        this.applyFiltersAndPagination();
        this.loading.set(false);
      });
      
      return response;
    } catch (error) {
      console.error('Error deleting student:', error);
      
      runInAction(() => {
        this.error.set('Failed to delete student');
        this.loading.set(false);
      });
      
      throw error;
    }
  });

  uploadCSV = action(async (file: File) => {
    this.loading.set(true);
    this.error.set(null);

    try {
      const response = await uploadStudentCSV(file);
      
      runInAction(() => {
        this.loading.set(false);
        // Refresh all students after upload
        this.fetchAllStudents();
      });
      
      return response;
    } catch (error) {
      runInAction(() => {
        this.error.set('Failed to upload CSV');
        this.loading.set(false);
      });
      console.error('Error uploading CSV:', error);
      throw error;
    }
  });

  fetchStats = action(async () => {
    try {
      const response = await getStudentStats();
      
      runInAction(() => {
        this.stats.set(response.stats || null);
      });
      
      return response.stats;
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  });

  fetchAllConfigs = action(async () => {
    try {
      const response = await getAllConfigs();
      
      runInAction(() => {
        if (response.batchConfig) {
          this.batchConfig = response.batchConfig;
        }
        
        if (response.remarksConfig) {
          this.remarksConfig = response.remarksConfig;
        }
        
        if (response.flagsConfig) {
          this.flagsConfig = response.flagsConfig;
        }
      });
      
      return response;
    } catch (error) {
      console.error('Error fetching configs:', error);
      throw error;
    }
  });

  updateBatchConfig = action(async (config: BatchConfig) => {
    try {
      this.loading.set(true);
      
      // Update batches
      await updateConfig('batches', config.batches);
      
      // Update teachers
      await updateConfig('classTeachers', config.teachers);
      
      // Update hostels
      await updateConfig('hostels', config.hostels);
      
      // Update programs
      await updateConfig('programs', config.programs);
      
      // Update streams
      await updateConfig('streams', config.streams);
      
      // Update local state
      runInAction(() => {
        this.batchConfig = config;
        this.loading.set(false);
      });
      
      return true;
    } catch (error) {
      console.error('Error updating batch config:', error);
      runInAction(() => {
        this.error.set('Failed to update configuration');
        this.loading.set(false);
      });
      return false;
    }
  });

  updateRemarksConfig = action(async (config: RemarksConfig) => {
    try {
      this.loading.set(true);
      
      // Update remarks config in the backend
      await updateConfig('remarks', [config.remarks]);
      await updateConfig('remarks1', [config.remarks1]);
      await updateConfig('remarks2', [config.remarks2]);
      await updateConfig('remarks3', [config.remarks3]);
      await updateConfig('remarks4', [config.remarks4]);
      
      // Update local state
      runInAction(() => {
        this.remarksConfig = config;
        this.loading.set(false);
      });
      
      return true;
    } catch (error) {
      console.error('Error updating remarks config:', error);
      runInAction(() => {
        this.error.set('Failed to update remarks configuration');
        this.loading.set(false);
      });
      return false;
    }
  });

  updateFlagsConfig = action(async (config: FlagsConfig) => {
    try {
      this.loading.set(true);
      
      // Update flags config in the backend
      await updateConfig('flag1', [config.flag1]);
      await updateConfig('flag2', [config.flag2]);
      await updateConfig('flag3', [config.flag3]);
      await updateConfig('flag4', [config.flag4]);
      
      // Update local state
      runInAction(() => {
        this.flagsConfig = config;
        this.loading.set(false);
      });
      
      return true;
    } catch (error) {
      console.error('Error updating flags config:', error);
      runInAction(() => {
        this.error.set('Failed to update flags configuration');
        this.loading.set(false);
      });
      return false;
    }
  });

  // Add a method to fetch all filtered students without pagination
  fetchAllFilteredStudents = action(async (params: ApiParams): Promise<Student[]> => {
    this.loading.set(true);
    
    try {
      // Create a new params object with limit set to a large number to get all results
      const allParams = {
        ...params,
        page: 1,
        limit: 10000 // Set a large limit to get all students
      };
      
      console.log("Fetching all filtered students with params:", allParams);
      
      // Call the API
      const response = await fetchStudents(allParams);
      
      // Return the students array
      return response.students || [];
    } catch (error) {
      console.error('Error fetching all filtered students:', error);
      this.error.set('Failed to fetch all filtered students');
      return [];
    } finally {
      this.loading.set(false);
    }
  });

  // Computed getters
  get getStudents() {
    return this.students;
  }

  get getAllStudents() {
    return this.allStudents;
  }

  get getTotalStudents() {
    return this.totalStudents.get();
  }

  get getTotalAllStudents() {
    return this.allStudents.length;
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
}

// Create a singleton instance
const studentStore = new StudentStore();

// Hook for components to use the store
export function useStudentStore() {
  return studentStore;
}

export default StudentStore; 