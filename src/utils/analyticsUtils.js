/**
 * Utility functions for working with analytics data
 */

/**
 * Filter out hidden columns from analytics data
 * @param {Array} analyticsData - 2D array with headers in first row
 * @param {Array} hiddenColumns - Array of column names to hide
 * @returns {Array} Filtered analytics data
 */
export const filterHiddenColumns = (analyticsData, hiddenColumns = []) => {
    if (!analyticsData || analyticsData.length === 0) return [];
    
    // Get the headers (first row)
    const headers = analyticsData[0];
    
    // Create an array of indices for visible columns (columns not in hiddenColumns)
    const visibleIndices = headers.map((header, index) => 
      hiddenColumns.includes(header) ? -1 : index
    ).filter(index => index !== -1);
    
    // Filter the headers and data rows to include only visible columns
    return analyticsData.map(row => 
      visibleIndices.map(index => row[index])
    );
  };
  
  /**
   * Sort analytics data by a specific column
   * @param {Array} analyticsData - 2D array with headers in first row
   * @param {number} columnIndex - Index of column to sort by
   * @param {string} direction - Sort direction ('asc' or 'desc')
   * @returns {Array} Sorted analytics data (keeps header row at index 0)
   */
  export const sortAnalyticsData = (analyticsData, columnIndex, direction = 'asc') => {
    if (!analyticsData || analyticsData.length <= 1) return analyticsData;
    
    // Extract header and data rows
    const headerRow = analyticsData[0];
    const dataRows = [...analyticsData.slice(1)];
    
    // Sort data rows
    const sortedDataRows = dataRows.sort((a, b) => {
      const aValue = a[columnIndex];
      const bValue = b[columnIndex];
      
      // Handle numeric sorting
      if (!isNaN(aValue) && !isNaN(bValue)) {
        return direction === 'asc'
          ? Number(aValue) - Number(bValue)
          : Number(bValue) - Number(aValue);
      }
      
      // Handle date sorting - check if values are valid dates
      const aDate = new Date(aValue);
      const bDate = new Date(bValue);
      if (!isNaN(aDate) && !isNaN(bDate)) {
        return direction === 'asc'
          ? aDate - bDate
          : bDate - aDate;
      }
      
      // Default string sorting
      const aString = String(aValue || '').toLowerCase();
      const bString = String(bValue || '').toLowerCase();
      
      return direction === 'asc'
        ? aString.localeCompare(bString)
        : bString.localeCompare(aString);
    });
    
    // Return header row followed by sorted data rows
    return [headerRow, ...sortedDataRows];
  };
  
  /**
   * Filter analytics data based on search text across all columns
   * @param {Array} analyticsData - 2D array with headers in first row
   * @param {string} searchTerm - Text to search for
   * @returns {Array} Filtered analytics data (keeps header row at index 0)
   */
  export const searchAnalyticsData = (analyticsData, searchTerm) => {
    if (!analyticsData || analyticsData.length <= 1 || !searchTerm) return analyticsData;
    
    const headerRow = analyticsData[0];
    const dataRows = analyticsData.slice(1);
    
    // Filter data rows that match search term in any column
    const filteredDataRows = dataRows.filter(row => 
      row.some(cell => 
        cell !== null && String(cell).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    
    return [headerRow, ...filteredDataRows];
  };
  
  /**
   * Apply column-specific filters to analytics data
   * @param {Array} analyticsData - 2D array with headers in first row
   * @param {Object} columnFilters - Object mapping column indices to filter values
   * @returns {Array} Filtered analytics data (keeps header row at index 0)
   */
  export const applyColumnFilters = (analyticsData, columnFilters = {}) => {
    if (!analyticsData || analyticsData.length <= 1) return analyticsData;
    if (Object.keys(columnFilters).length === 0) return analyticsData;
    
    const headerRow = analyticsData[0];
    const dataRows = analyticsData.slice(1);
    
    // Filter data rows that match all specified column filters
    const filteredDataRows = dataRows.filter(row => 
      Object.entries(columnFilters).every(([columnIndex, filterValue]) => {
        if (!filterValue) return true;
        const cellValue = row[columnIndex];
        return cellValue !== null && 
               String(cellValue).toLowerCase().includes(filterValue.toLowerCase());
      })
    );
    
    return [headerRow, ...filteredDataRows];
  };
  
  /**
   * Get a paginated subset of analytics data
   * @param {Array} analyticsData - 2D array with headers in first row
   * @param {number} page - Current page (1-based)
   * @param {number} pageSize - Number of items per page
   * @returns {Array} Paginated analytics data (keeps header row at index 0)
   */
  export const paginateAnalyticsData = (analyticsData, page, pageSize) => {
    if (!analyticsData || analyticsData.length <= 1) return analyticsData;
    
    const headerRow = analyticsData[0];
    const dataRows = analyticsData.slice(1);
    
    // Calculate start and end indices for current page
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    // Get rows for current page
    const pageRows = dataRows.slice(startIndex, endIndex);
    
    return [headerRow, ...pageRows];
  };
  
  /**
   * Get all unique values from a specific column in analytics data
   * @param {Array} analyticsData - 2D array with headers in first row
   * @param {number} columnIndex - Index of column to get values from
   * @returns {Array} Array of unique values in the column
   */
  export const getUniqueColumnValues = (analyticsData, columnIndex) => {
    if (!analyticsData || analyticsData.length <= 1) return [];
    
    // Get all values from the specified column (skip header row)
    const values = analyticsData.slice(1).map(row => row[columnIndex]);
    
    // Filter out nulls and duplicates
    return [...new Set(values.filter(value => value !== null))];
  };
  
  /**
   * Format cell value based on data type for display
   * @param {any} value - Cell value to format
   * @returns {string} Formatted value for display
   */
  export const formatCellValue = (value) => {
    if (value === null || value === undefined) return '';
    
    // Format dates (if value is a valid date string)
    const date = new Date(value);
    if (String(value).match(/^\d{4}-\d{2}-\d{2}/) && !isNaN(date)) {
      return date.toLocaleDateString();
    }
    
    // Format numbers with separators
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    
    // Default to string representation
    return String(value);
  };
  
  /**
   * Check if a column appears to contain date values
   * @param {Array} analyticsData - 2D array with headers in first row
   * @param {number} columnIndex - Index of column to check
   * @returns {boolean} True if column appears to contain dates
   */
  export const isDateColumn = (analyticsData, columnIndex) => {
    if (!analyticsData || analyticsData.length <= 2) return false;
    
    // Take a sample of data rows (skip header)
    const sampleRows = analyticsData.slice(1, Math.min(11, analyticsData.length));
    const sampleValues = sampleRows.map(row => row[columnIndex]).filter(v => v !== null);
    
    // Check if most values match date format (YYYY-MM-DD)
    const datePattern = /^\d{4}-\d{2}-\d{2}/;
    const dateCount = sampleValues.filter(value => 
      datePattern.test(String(value)) && !isNaN(new Date(value))
    ).length;
    
    return dateCount > (sampleValues.length / 2);
  };
  
  /**
   * Check if a column appears to contain numeric values
   * @param {Array} analyticsData - 2D array with headers in first row
   * @param {number} columnIndex - Index of column to check
   * @returns {boolean} True if column appears to contain numbers
   */
  export const isNumericColumn = (analyticsData, columnIndex) => {
    if (!analyticsData || analyticsData.length <= 2) return false;
    
    // Take a sample of data rows (skip header)
    const sampleRows = analyticsData.slice(1, Math.min(11, analyticsData.length));
    const sampleValues = sampleRows.map(row => row[columnIndex]).filter(v => v !== null);
    
    // Check if most values are numbers
    const numberCount = sampleValues.filter(value => 
      !isNaN(value) && typeof value !== 'boolean'
    ).length;
    
    return numberCount > (sampleValues.length / 2);
  };