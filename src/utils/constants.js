export const PAGE_SIZE_OPTIONS = [
    { value: '5', label: '5' },
    { value: '10', label: '10' },
    { value: '15', label: '15' },
    { value: '20', label: '20' },
    { value: '25', label: '25' },
    { value: '50', label: '50' },
    { value: '100', label: '100' }
  ];
  
  export const PAGE_SIZE_OPTION_VALUES = PAGE_SIZE_OPTIONS.map(option => option.value);
  
  export const DEFAULT_PAGE_SIZE = '10';
  
  export const DEFAULT_HIDDEN_COLUMNS = [
    'Event',
    'Program stage',
    'Stored by',
    'Created by',
    'Last updated by',
    'Last updated on',
    'Scheduled date',
    'Date of enrollment in the system',
    'Date of Report',
    'Tracked entity instance',
    'Program instance',
    'Geometry',
    'Longitude',
    'Latitude',
    'Organisation unit name hierarchy',
    'Organisation unit code'
  ];