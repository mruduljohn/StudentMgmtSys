import toast from 'react-hot-toast';

// Success notifications
export const showSuccessToast = (message: string) => {
  toast.success(message);
};

// Error notifications
export const showErrorToast = (message: string) => {
  toast.error(message);
};

// Loading notifications
export const showLoadingToast = (message: string) => {
  return toast.loading(message);
};

// Custom notifications with predefined messages
export const notifyCreate = (entity: string) => {
  toast.success(`${entity} created successfully`);
};

export const notifyUpdate = (entity: string) => {
  toast.success(`${entity} updated successfully`);
};

export const notifyDelete = (entity: string) => {
  toast.success(`${entity} deleted successfully`);
};

export const notifySave = (entity: string) => {
  toast.success(`${entity} saved successfully`);
};

export const notifyError = (operation: string, entity: string, error?: any) => {
  const message = error?.response?.data?.message || `Failed to ${operation} ${entity}`;
  toast.error(message);
};

export const notifyInProgress = (operation: string, entity: string) => {
  return toast.loading(`${operation} ${entity}...`);
};

// Generic CRUD operation notifications
export const notifyCrudOperation = (
  operation: 'create' | 'update' | 'delete' | 'save' | 'export' | 'import',
  entity: string,
  status: 'success' | 'error' | 'loading',
  error?: any
) => {
  const operationPast = {
    create: 'created',
    update: 'updated',
    delete: 'deleted',
    save: 'saved',
    export: 'exported',
    import: 'imported'
  }[operation];
  
  const operationPresent = {
    create: 'Creating',
    update: 'Updating',
    delete: 'Deleting',
    save: 'Saving',
    export: 'Exporting',
    import: 'Importing'
  }[operation];

  switch (status) {
    case 'success':
      toast.success(`${entity} ${operationPast} successfully`);
      break;
    case 'error':
      toast.error(error?.response?.data?.message || `Failed to ${operation} ${entity}`);
      break;
    case 'loading':
      return toast.loading(`${operationPresent} ${entity}...`);
    default:
      break;
  }
}; 