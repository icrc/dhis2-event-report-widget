import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Table,
  TableHead,
  TableRowHead,
  TableCellHead,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  NoticeBox,
  Button,
  InputField,
  CircularLoader,
  SingleSelectField,
  SingleSelectOption,
  Box,
  Card,
  Checkbox
} from '@dhis2/ui';

// Import React Icons for UI elements
import { FiFilter, FiDownload, FiRefreshCw, FiSettings, FiArrowUp, FiArrowDown } from 'react-icons/fi';

// Import custom hooks and utilities
import { useDataStore } from '../hooks/useDataStore';
import { useAnalytics } from '../hooks/useAnalytics';
import { useEventReports } from '../hooks/useEventReports';
import { useConfiguration } from '../contexts/ConfigurationContext';

// Import CSS module
import styles from '../EventReportViewer.module.css';

/**
 * Default columns to hide in the event report view
 * Can be overridden by user configuration
 */
const DEFAULT_HIDDEN_COLUMNS = [
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

/**
 * EventReportViewer Component
 * Displays analytics data for a specific dashboard's event report
 */
const EventReportViewer = ({ dashboardId }) => {
  // Utilize custom hooks for data management
  const { getDashboardConfiguration, saveConfiguration } = useDataStore();
  const { fetchAnalytics, analyticsData, loading: analyticsLoading, error: analyticsError, exportToCSV } = useAnalytics();
  const { getEventReportDetails, getAnalyticsParams, loading: reportsLoading } = useEventReports();
  const { globalConfig } = useConfiguration();

  // Component state management
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [columnFilters, setColumnFilters] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pageSize, setPageSize] = useState('10'); // String value for page size
  const [hiddenColumns, setHiddenColumns] = useState(DEFAULT_HIDDEN_COLUMNS);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [sortConfig, setSortConfig] = useState({ columnIndex: null, direction: 'asc' });

  // Available page sizes as strings (required by DHIS2 UI)
  const pageSizeOptions = ['10', '20', '50', '100'];

  // Retrieve dashboard-specific configuration
  const dashboardConfig = useMemo(() => 
    getDashboardConfiguration(dashboardId), 
    [dashboardId, getDashboardConfiguration]
  );

  // Set page size and hidden columns from config when available
  useEffect(() => {
    if (dashboardConfig) {
      if (dashboardConfig.pageSize) {
        // Convert to string for DHIS2 UI compatibility
        setPageSize(String(dashboardConfig.pageSize));
      }
      
      if (dashboardConfig.hiddenColumns) {
        setHiddenColumns(dashboardConfig.hiddenColumns);
      } else {
        setHiddenColumns(DEFAULT_HIDDEN_COLUMNS);
      }
    }
  }, [dashboardConfig]);

  // Get event report details for the current configuration
  const eventReportDetails = useMemo(() => {
    if (!dashboardConfig?.eventReportId) return null;
    return getEventReportDetails(dashboardConfig.eventReportId);
  }, [dashboardConfig, getEventReportDetails]);

  // Fetch analytics when configuration changes
  useEffect(() => {
    if (dashboardConfig?.eventReportId) {
      // Get the report ID from configuration
      const reportId = dashboardConfig.eventReportId;
      
      // Get analytics parameters from the event report
      const reportParams = getAnalyticsParams(reportId);
      
      if (reportParams) {
        // Customize page size from configuration if available
        if (dashboardConfig.pageSize) {
          reportParams.pageSize = dashboardConfig.pageSize;
        }
        
        // Customize period from configuration if available
        if (dashboardConfig.period) {
          reportParams.period = dashboardConfig.period;
        }
        
        // Fetch analytics with the parameters
        fetchAnalytics(reportParams, reportId);
      }
    }
  }, [dashboardConfig, getAnalyticsParams, fetchAnalytics]);

  // Filter out hidden columns and their corresponding data
  const filteredAnalyticsData = useMemo(() => {
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
  }, [analyticsData, hiddenColumns]);

  // Handle search term change
  const handleSearchChange = useCallback((value) => {
    setSearchTerm(value);
    setPage(1); // Reset to first page when search changes
  }, []);

  // Handle column filter change
  const handleColumnFilterChange = useCallback((columnIndex, value) => {
    setColumnFilters(prev => ({
      ...prev,
      [columnIndex]: value
    }));
    setPage(1); // Reset to first page when filters change
  }, []);

  // Handle refresh button click
  const handleRefresh = useCallback(async () => {
    if (!dashboardConfig?.eventReportId) return;
    
    setIsRefreshing(true);
    try {
      // Get report parameters and refresh the data
      const reportId = dashboardConfig.eventReportId;
      const reportParams = getAnalyticsParams(reportId);
      
      if (reportParams) {
        if (dashboardConfig.pageSize) {
          reportParams.pageSize = dashboardConfig.pageSize;
        }
        
        if (dashboardConfig.period) {
          reportParams.period = dashboardConfig.period;
        }
        
        await fetchAnalytics(reportParams, reportId);
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [dashboardConfig, getAnalyticsParams, fetchAnalytics]);

  // Handle page change
  const handlePageChange = useCallback(({ page }) => {
    setPage(page);
  }, []);

  // Handle page size change with string values
  const handlePageSizeChange = useCallback(({ pageSize }) => {
    setPageSize(pageSize);
    setPage(1);
  }, []);

  // Export data to CSV
  const handleExport = useCallback(() => {
    if (!analyticsData) return;
    
    const filename = `event_report_${dashboardId || 'export'}_${new Date().toISOString().slice(0,10)}.csv`;
    exportToCSV(analyticsData, filename);
  }, [analyticsData, dashboardId, exportToCSV]);

  // Toggle column visibility
  const toggleColumnVisibility = useCallback((columnName) => {
    setHiddenColumns(prev => {
      const isCurrentlyHidden = prev.includes(columnName);
      const newHiddenColumns = isCurrentlyHidden
        ? prev.filter(col => col !== columnName)
        : [...prev, columnName];
      
      // Save updated hidden columns to configuration
      if (dashboardConfig && dashboardId) {
        saveConfiguration(dashboardId, {
          ...dashboardConfig,
          hiddenColumns: newHiddenColumns
        });
      }
      
      return newHiddenColumns;
    });
  }, [dashboardConfig, dashboardId, saveConfiguration]);

  // Reset column visibility to defaults
  const resetColumnVisibility = useCallback(() => {
    setHiddenColumns(DEFAULT_HIDDEN_COLUMNS);
    
    // Save default hidden columns to configuration
    if (dashboardConfig && dashboardId) {
      saveConfiguration(dashboardId, {
        ...dashboardConfig,
        hiddenColumns: DEFAULT_HIDDEN_COLUMNS
      });
    }
  }, [dashboardConfig, dashboardId, saveConfiguration]);

  // Handle column sort
  const handleSort = useCallback((columnIndex) => {
    setSortConfig(prev => {
      if (prev.columnIndex === columnIndex) {
        // Toggle direction if same column
        return {
          columnIndex,
          direction: prev.direction === 'asc' ? 'desc' : 'asc'
        };
      } else {
        // New column, default to ascending
        return {
          columnIndex,
          direction: 'asc'
        };
      }
    });
  }, []);

  // Apply sorting to data
  const sortedData = useMemo(() => {
    if (!filteredAnalyticsData || filteredAnalyticsData.length <= 1) return [];
    
    // Skip header row for sorting
    const dataToSort = [...filteredAnalyticsData.slice(1)];
    
    // If no sort configuration, return unsorted data
    if (sortConfig.columnIndex === null) return dataToSort;
    
    return dataToSort.sort((a, b) => {
      const aValue = a[sortConfig.columnIndex];
      const bValue = b[sortConfig.columnIndex];
      
      // Handle numeric sorting
      if (!isNaN(aValue) && !isNaN(bValue)) {
        return sortConfig.direction === 'asc'
          ? Number(aValue) - Number(bValue)
          : Number(bValue) - Number(aValue);
      }
      
      // Handle date sorting - check if values are valid dates
      const aDate = new Date(aValue);
      const bDate = new Date(bValue);
      if (!isNaN(aDate) && !isNaN(bDate)) {
        return sortConfig.direction === 'asc'
          ? aDate - bDate
          : bDate - aDate;
      }
      
      // Default string sorting
      const aString = String(aValue || '').toLowerCase();
      const bString = String(bValue || '').toLowerCase();
      
      return sortConfig.direction === 'asc'
        ? aString.localeCompare(bString)
        : bString.localeCompare(aString);
    });
  }, [filteredAnalyticsData, sortConfig]);

  // Pagination and filtering logic
  const filteredData = useMemo(() => {
    if (!sortedData.length) return [];

    return sortedData.filter(row => {
      // Search across all columns
      const matchesSearch = searchTerm 
        ? row.some(cell => 
            cell !== null && String(cell).toLowerCase().includes(searchTerm.toLowerCase())
          )
        : true;

      // Column-specific filtering
      const matchesColumnFilters = Object.entries(columnFilters).every(
        ([columnIndex, filterValue]) => {
          if (!filterValue) return true;
          const cellValue = row[columnIndex];
          return cellValue !== null && 
                 String(cellValue).toLowerCase().includes(filterValue.toLowerCase());
        }
      );

      return matchesSearch && matchesColumnFilters;
    });
  }, [sortedData, searchTerm, columnFilters]);

  // Paginate filtered data
  const paginatedData = useMemo(() => {
    // Convert pageSize to number for calculation
    const pageSizeNum = parseInt(pageSize, 10);
    const startIndex = (page - 1) * pageSizeNum;
    return filteredData.slice(startIndex, startIndex + pageSizeNum);
  }, [filteredData, page, pageSize]);

  // Get full set of columns from analytics data for column selector
  const allColumns = useMemo(() => {
    if (!analyticsData || analyticsData.length === 0) return [];
    return analyticsData[0] || [];
  }, [analyticsData]);

  // Loading state for initial data loading
  const isLoading = analyticsLoading || reportsLoading;

  // Render loading state
  if (isLoading && !isRefreshing) {
    return (
      <Box height="200px" display="flex" alignItems="center" justifyContent="center">
        <CircularLoader />
      </Box>
    );
  }

  // Render error state
  if (analyticsError) {
    return (
      <NoticeBox error title="Error Loading Event Report">
        <p>{analyticsError.message || 'An unexpected error occurred'}</p>
        <Button small onClick={handleRefresh} style={{ marginTop: '8px' }}>
          Try Again
        </Button>
      </NoticeBox>
    );
  }

  // Render no configuration state
  if (!dashboardConfig?.eventReportId) {
    return (
      <NoticeBox title="No Event Report Configured">
        <p>Please configure an event report for this dashboard.</p>
      </NoticeBox>
    );
  }

  // Render no data state
  if (!filteredAnalyticsData || filteredAnalyticsData.length <= 1) {
    return (
      <NoticeBox title="No Data Available">
        <p>No data found for the selected event report.</p>
        <Button small onClick={handleRefresh} style={{ marginTop: '8px' }}>
          Refresh
        </Button>
      </NoticeBox>
    );
  }

  // Calculate page count with numeric page size
  const pageCount = Math.ceil(filteredData.length / parseInt(pageSize, 10));

  return (
    <Card>
      <div className={styles.container}>
        {/* Event Report Title */}
        {eventReportDetails && (
          <h2 className={styles.header}>
            {eventReportDetails.displayName || eventReportDetails.name}
          </h2>
        )}

        {/* Control Section */}
        <div className={styles.controlsRow}>
          <div className={styles.searchField}>
            <InputField
              placeholder="Search..."
              value={searchTerm}
              onChange={({ value }) => handleSearchChange(value)}
              dense
            />
          </div>
          
          <div className={styles.buttonGroup}>
            <Button 
              onClick={() => setShowFilters(!showFilters)}
              small
              icon={<FiFilter />}
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
            
            <Button 
              onClick={handleExport}
              small
              icon={<FiDownload />}
            >
              Export CSV
            </Button>
            
            <Button 
              onClick={handleRefresh}
              small
              loading={isRefreshing}
              icon={<FiRefreshCw />}
            >
              Refresh
            </Button>
            
            {/* Column Selector Button */}
            <Button
              small
              icon={<FiSettings />}
              onClick={() => setShowColumnSelector(!showColumnSelector)}
            >
              Columns
            </Button>
          </div>
        </div>

        {/* Column Selector */}
        {showColumnSelector && (
          <div className={styles.columnSelector}>
            <div className={styles.columnSelectorHeader}>
              <h3>Configure Visible Columns</h3>
              <Button small onClick={resetColumnVisibility}>Reset to Default</Button>
            </div>
            <div className={styles.columnOptions}>
              {allColumns.map((column, index) => (
                <div key={index} className={styles.columnOption}>
                  <Checkbox
                    checked={!hiddenColumns.includes(column)}
                    label={column}
                    onChange={() => toggleColumnVisibility(column)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters Section */}
        {showFilters && filteredAnalyticsData[0] && (
          <div className={styles.filtersRow}>
            {filteredAnalyticsData[0].map((header, index) => (
              <div key={index} className={styles.filterField}>
                <InputField
                  label={`Filter by ${header}`}
                  value={columnFilters[index] || ''}
                  onChange={({ value }) => handleColumnFilterChange(index, value)}
                  dense
                />
              </div>
            ))}
          </div>
        )}

        {/* Results Summary */}
        <div className={styles.resultsSummary}>
          Showing {paginatedData.length} of {filteredData.length} results
          {searchTerm && ` (filtered from ${filteredAnalyticsData.length - 1} total)`}
        </div>

        {/* Data Table */}
        {isRefreshing ? (
          <div className={styles.loadingOverlay}>
            <div className={styles.dimmedContent}>
              <Table>
                <TableHead>
                  <TableRowHead>
                    {filteredAnalyticsData[0].map((header, index) => (
                      <TableCellHead key={index}>{header}</TableCellHead>
                    ))}
                  </TableRowHead>
                </TableHead>
                <TableBody>
                  {paginatedData.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <TableCell key={cellIndex}>{cell !== null ? cell : ''}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className={styles.centerLoader}>
              <CircularLoader />
            </div>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <Table>
              <TableHead>
                <TableRowHead>
                  {filteredAnalyticsData[0].map((header, index) => (
                    <TableCellHead 
                      key={index}
                      onClick={() => handleSort(index)}
                      className={styles.sortableHeader}
                    >
                      <div className={styles.headerContent}>
                        {header}
                        {sortConfig.columnIndex === index && (
                          <span className={styles.sortIcon}>
                            {sortConfig.direction === 'asc' ? <FiArrowUp /> : <FiArrowDown />}
                          </span>
                        )}
                      </div>
                    </TableCellHead>
                  ))}
                </TableRowHead>
              </TableHead>
              <TableBody>
                {paginatedData.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <TableCell key={cellIndex}>
                        {cell !== null ? cell : ''}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination - Fixed to use string values */}
        <div className={styles.paginationContainer}>
          <Pagination
            page={page}
            pageSize={pageSize}
            pageCount={pageCount}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            pageSizeSelectText="Items per page"
            pageSizes={pageSizeOptions}
            total={filteredData.length}
          />
        </div>
      </div>
    </Card>
  );
};

export default EventReportViewer;