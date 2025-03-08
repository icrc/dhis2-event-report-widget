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
  Box,
  Card,
  Checkbox,
  Tooltip
} from '@dhis2/ui';

import { FiFilter, FiDownload, FiRefreshCw, FiSettings, FiArrowUp, FiArrowDown, FiExternalLink } from 'react-icons/fi';
import { useDataStore } from '../hooks/useDataStore';
import { useAnalytics } from '../hooks/useAnalytics';
import { useEventReports } from '../hooks/useEventReports';
import { useConfiguration } from '../contexts/ConfigurationContext';
import { useConfig } from '@dhis2/app-runtime';
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

const TrackerCaptureIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    {/* SVG path for Tracker Capture icon */}
    <path d="M12 5c-3.9 0-7 3.1-7 7s3.1 7 7 7 7-3.1 7-7-3.1-7-7-7zm0 2c2.8 0 5 2.2 5 5s-2.2 5-5 5-5-2.2-5-5 2.2-5 5-5zm0 2c-1.7 0-3 1.3-3 3s1.3 3 3 3 3-1.3 3-3-1.3-3-3-3z" />
  </svg>
);

const CaptureIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    {/* SVG path for Capture icon */}
    <path d="M9 3L5 7h3v7h2V7h3L9 3zm6 14h-3v-7H10v7H7l4 4 4-4z" />
  </svg>
);

/**
 * EventReportViewer Component
 * Displays analytics data for a specific dashboard's event report
 */
const EventReportViewer = ({ dashboardId }) => {
  // Get baseUrl from DHIS2 app-runtime config
  const { baseUrl } = useConfig();

  // Utilize custom hooks for data management
  const { getDashboardConfiguration, saveConfiguration } = useDataStore();
  const { fetchAnalytics, analyticsData, metadata, loading: analyticsLoading, error: analyticsError, exportToCSV } = useAnalytics();
  const { getEventReportDetails, getAnalyticsParams, loading: reportsLoading } = useEventReports();
  const { globalConfiguration } = useConfiguration();

  // Component state management
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [columnFilters, setColumnFilters] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pageSize, setPageSize] = useState('50'); // Default to 50 to match API default
  const [hiddenColumns, setHiddenColumns] = useState(DEFAULT_HIDDEN_COLUMNS);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [sortConfig, setSortConfig] = useState({ columnIndex: null, direction: 'asc' });

  // Available page sizes as strings
  const pageSizeOptions = ['10', '25', '50', '100'];

  // Get configuration
  const config = useMemo(() =>
    getDashboardConfiguration(dashboardId),
    [dashboardId, getDashboardConfiguration]
  );

  // Debug logging
  console.log("Dashboard ID:", dashboardId);
  console.log("Retrieved configuration:", config);

  // Function for initial data fetching
  const fetchInitialData = useCallback(() => {
    if (!config?.eventReportId) return;

    setIsRefreshing(true);
    const reportId = config.eventReportId;
    const reportDetails = getEventReportDetails(reportId);
    const reportParams = getAnalyticsParams(reportId);

    if (reportParams) {
      // Get the initial page size from config and convert to number
      const configPageSize = config.pageSize ? parseInt(config.pageSize, 10) : 50;
      console.log('Initial fetch with page size:', configPageSize);

      // Explicitly set the page size
      reportParams.pageSize = configPageSize;

      if (config.period) {
        reportParams.period = config.period;
      }

      const outputType = reportDetails?.outputType || 'EVENT';

      // Direct call with explicit parameters
      fetchAnalytics({
        ...reportParams,
        pageSize: configPageSize // Ensure this parameter is set correctly
      }, reportId, outputType, 1)
        .finally(() => {
          setIsRefreshing(false);
        });
    } else {
      setIsRefreshing(false);
    }
  }, [config, getEventReportDetails, getAnalyticsParams, fetchAnalytics]);

  // Initial data load and configuration
  useEffect(() => {
    // Only fetch on initial load and when event report ID changes
    if (config?.eventReportId) {
      // Get initial page size as a string
      const initialPageSize = config.pageSize ? String(config.pageSize) : '50';

      // Set the initial page size from config
      if (pageSizeOptions.includes(initialPageSize)) {
        setPageSize(initialPageSize);
      } else {
        setPageSize('50'); // Default to 50 if invalid
      }

      // Set initial hidden columns
      if (config.hiddenColumns) {
        setHiddenColumns(config.hiddenColumns);
      } else {
        setHiddenColumns(DEFAULT_HIDDEN_COLUMNS);
      }

      // Initial fetch with page 1
      fetchInitialData();
    }
    // Only depend on config.eventReportId, not the entire config object
  }, [config?.eventReportId, fetchInitialData]);

  // Get event report details for the current configuration
  const eventReportDetails = useMemo(() => {
    if (!config?.eventReportId) return null;
    return getEventReportDetails(config.eventReportId);
  }, [config, getEventReportDetails]);

  // Determine if the program is WITH_REGISTRATION or WITHOUT_REGISTRATION
  const programType = useMemo(() => {
    if (!eventReportDetails?.program) return null;
    return eventReportDetails.program.programType || 'WITHOUT_REGISTRATION';
  }, [eventReportDetails]);

  // Determine the output type (EVENT or ENROLLMENT)
  const outputType = useMemo(() => {
    return eventReportDetails?.outputType || 'EVENT';
  }, [eventReportDetails]);

  // Function to fetch data with pagination
  const fetchData = useCallback(async (pageNumber = 1, customPageSize = null) => {
    if (!config?.eventReportId) return;

    setIsRefreshing(true);
    try {
      const reportId = config.eventReportId;
      const reportDetails = getEventReportDetails(reportId);
      const reportParams = getAnalyticsParams(reportId);

      if (reportParams) {
        // Use the custom page size if provided, otherwise use current pageSize
        // Make sure to convert string pageSize to number
        const pageSizeToUse = customPageSize ? parseInt(customPageSize, 10) : parseInt(pageSize, 10);
        console.log('Fetching data with page size:', pageSizeToUse);

        // Explicitly set the page size
        reportParams.pageSize = pageSizeToUse;

        if (config.period) {
          reportParams.period = config.period;
        }

        const outputType = reportDetails?.outputType || 'EVENT';

        // Direct call with explicit parameters
        await fetchAnalytics({
          ...reportParams,
          pageSize: pageSizeToUse // Ensure this parameter is set correctly
        }, reportId, outputType, pageNumber);
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [config, getEventReportDetails, getAnalyticsParams, fetchAnalytics, pageSize]);

  // Filter out hidden columns and their corresponding data, but add Action column
  const filteredAnalyticsData = useMemo(() => {
    if (!analyticsData || analyticsData.length === 0) return [];

    // Get the headers (first row)
    const headers = analyticsData[0];

    // Create an array of indices for visible columns (columns not in hiddenColumns)
    const visibleIndices = headers.map((header, index) =>
      hiddenColumns.includes(header) ? -1 : index
    ).filter(index => index !== -1);

    // Find indices for important fields we need for generating links
    // Field names may differ between EVENT and ENROLLMENT analytics
    const eventIndex = headers.indexOf('Event');
    const teiIndex = headers.indexOf('Tracked entity instance');
    const enrollmentIndex = headers.indexOf('Enrollment');
    const ouIndex = headers.indexOf('Organisation unit');

    // Filter the headers and data rows to include only visible columns
    const filteredData = analyticsData.map((row, rowIndex) => {
      // For the header row, add the "Action" column
      if (rowIndex === 0) {
        return [...visibleIndices.map(index => row[index]), 'Action'];
      }
      // For data rows, add the action button/link
      else {
        // Store the relevant IDs for linking based on output type
        const eventId = eventIndex >= 0 ? row[eventIndex] : null;
        const tei = teiIndex >= 0 ? row[teiIndex] : null;
        const enrollmentId = enrollmentIndex >= 0 ? row[enrollmentIndex] : null;
        const orgUnitId = ouIndex >= 0 ? row[ouIndex] : null;

        // Add a special value for the action column that can be interpreted as a button later
        return [
          ...visibleIndices.map(index => row[index]),
          {
            type: 'action',
            eventId,
            tei,
            enrollmentId,
            orgUnitId,
            outputType: outputType
          }
        ];
      }
    });

    // Apply search term filter
    const searchTermLower = searchTerm.toLowerCase();
    const filteredBySearch = filteredData.filter((row, rowIndex) => {
      if (rowIndex === 0) return true; // Keep header row
      return row.some(cell => typeof cell === 'string' && cell.toLowerCase().includes(searchTermLower));
    });

    // Apply column filters
    const filteredByColumns = filteredBySearch.filter((row, rowIndex) => {
      if (rowIndex === 0) return true; // Keep header row
      return Object.entries(columnFilters).every(([colIndex, filterValue]) => {
        const cellValue = row[colIndex];
        return typeof cellValue === 'string' && cellValue.toLowerCase().includes(filterValue.toLowerCase());
      });
    });

    return filteredByColumns;
  }, [analyticsData, hiddenColumns, outputType, searchTerm, columnFilters]);

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
  const handleRefresh = useCallback(() => {
    fetchData(page);
  }, [fetchData, page]);

  // Handle page change
  const handlePageChange = useCallback(({ page: newPage }) => {
    if (newPage && newPage > 0) {
      setPage(newPage);
      fetchData(newPage);
    } else {
      setPage(1);
      fetchData(1);
    }
  }, [fetchData]);

  // Handle page size change
  // Fix for the handlePageSizeChange function in EventReportViewer.jsx


  // Fix for the handlePageSizeChange function
  const handlePageSizeChange = useCallback((value) => {
    // The DHIS2 Pagination component might be calling this differently than expected
    console.log('Page size change value:', value);

    // Try to extract the actual value - it might be passed directly
    // or it might be inside an object
    let selectedSize = value;

    // If it's an object, try to get the selected property
    if (typeof value === 'object' && value !== null) {
      selectedSize = value.selected;
    }

    // If we still don't have a valid value, check if we have an event with a target
    if (!selectedSize && value && value.target && value.target.value) {
      selectedSize = value.target.value;
    }

    console.log('Extracted selected size:', selectedSize);

    // If we still don't have a valid selection, just use the current page size
    if (!selectedSize || !pageSizeOptions.includes(String(selectedSize))) {
      console.warn('Could not determine valid page size, using current:', pageSize);
      return;
    }

    // Convert to string to ensure consistency
    const selectedSizeStr = String(selectedSize);
    console.log('Selected new page size:', selectedSizeStr);

    // Update the state
    setPageSize(selectedSizeStr);
    setPage(1);

    // Set loading state
    setIsRefreshing(true);

    // Get the parameters for the request
    const reportId = config?.eventReportId;
    if (!reportId) {
      setIsRefreshing(false);
      return;
    }

    const reportDetails = getEventReportDetails(reportId);
    const reportParams = getAnalyticsParams(reportId);

    if (reportParams) {
      // Convert string to number for the API call
      const numericPageSize = parseInt(selectedSizeStr, 10);
      console.log('Using numeric page size for request:', numericPageSize);

      // Explicitly set the page size in the params
      reportParams.pageSize = numericPageSize;

      if (config.period) {
        reportParams.period = config.period;
      }

      const outputType = reportDetails?.outputType || 'EVENT';

      // Direct call to fetchAnalytics with explicit parameters
      fetchAnalytics({
        ...reportParams,
        pageSize: numericPageSize // Ensure this parameter is set correctly
      }, reportId, outputType, 1)
        .then(() => {
          // Update configuration AFTER successful fetch
          if (config && dashboardId) {
            saveConfiguration(dashboardId, {
              ...config,
              pageSize: numericPageSize
            });
          }
        })
        .finally(() => {
          setIsRefreshing(false);
        });
    } else {
      setIsRefreshing(false);
    }
  }, [pageSize, pageSizeOptions, config, dashboardId, getEventReportDetails, getAnalyticsParams, fetchAnalytics, saveConfiguration]);


  // Export data to CSV
  const handleExport = useCallback(() => {
    if (!analyticsData) return;

    const filename = `event_report_${dashboardId || 'export'}_${new Date().toISOString().slice(0, 10)}.csv`;
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
      if (config && dashboardId) {
        saveConfiguration(dashboardId, {
          ...config,
          hiddenColumns: newHiddenColumns
        });
      }

      return newHiddenColumns;
    });
  }, [config, dashboardId, saveConfiguration]);

  // Reset column visibility to defaults
  const resetColumnVisibility = useCallback(() => {
    setHiddenColumns(DEFAULT_HIDDEN_COLUMNS);

    // Save default hidden columns to configuration
    if (config && dashboardId) {
      saveConfiguration(dashboardId, {
        ...config,
        hiddenColumns: DEFAULT_HIDDEN_COLUMNS
      });
    }
  }, [config, dashboardId, saveConfiguration]);

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

  // Generate link to tracker or capture app based on program type and output type
  const generateAppLink = useCallback((row) => {
    if (!row || !row.type || row.type !== 'action') return '#';

    const { eventId, tei, orgUnitId } = row;
    const programId = eventReportDetails?.program?.id;
    const outputType = eventReportDetails?.outputType || 'EVENT';

    if (!programId) return '#';

    // For ENROLLMENT output type, always use tracker capture
    if (outputType === 'ENROLLMENT' && tei && programId && orgUnitId) {
      return `${baseUrl}/dhis-web-tracker-capture/index.html#/dashboard?tei=${tei}&program=${programId}&ou=${orgUnitId}`;
    }

    // For EVENT output type, use program type to determine the right app
    if (outputType === 'EVENT') {
      // Tracker Capture for WITH_REGISTRATION programs
      if (programType === 'WITH_REGISTRATION' && tei && programId && orgUnitId) {
        return `${baseUrl}/dhis-web-tracker-capture/index.html#/dashboard?tei=${tei}&program=${programId}&ou=${orgUnitId}`;
      }
      // Event Capture for WITHOUT_REGISTRATION programs
      else if (eventId) {
        return `${baseUrl}/dhis-web-capture/index.html#/viewEvent?viewEventId=${eventId}`;
      }
    }

    return '#';
  }, [baseUrl, eventReportDetails, programType]);

  // Get full set of columns from analytics data for column selector
  const allColumns = useMemo(() => {
    if (!analyticsData || analyticsData.length === 0) return [];
    // Don't include the Action column in the column selector
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
  if (!config?.eventReportId) {
    return (
      <NoticeBox title="No Event Report Configured">
        <p>Please configure an event report for this dashboard.</p>
      </NoticeBox>
    );
  }

  // Render no data state
  if (!filteredAnalyticsData || filteredAnalyticsData.length <= 1) {
    return (
      <Card>
        <div className={styles.container}>
          {/* Event Report Title */}
          {eventReportDetails && (
            <h2 className={styles.header}>
              {eventReportDetails.displayName || eventReportDetails.name}
              {eventReportDetails.outputType && (
                <span style={{ fontSize: '0.8em', fontWeight: 'normal', marginLeft: '8px', color: '#666' }}>
                  ({eventReportDetails.outputType === 'ENROLLMENT' ? 'Enrollment Data' : 'Event Data'})
                </span>
              )}
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
              {/* Don't show filter for the action column */}
              {filteredAnalyticsData[0].slice(0, -1).map((header, index) => (
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

          {/* No Matching Data Message */}
          <NoticeBox title="No Matching Data">
            <p>No data matches your search criteria. Please adjust your search term or filters.</p>
          </NoticeBox>
        </div>
      </Card>
    );
  }

  // Extract pagination info from metadata
  const pager = metadata?.pager || {
    page: 1,
    pageCount: 1,
    pageSize: parseInt(pageSize, 10),
    total: (filteredAnalyticsData?.length || 0) - 1
  };

  return (
    <Card>
      <div className={styles.container}>
        {/* Event Report Title */}
        {eventReportDetails && (
          <h2 className={styles.header}>
            {eventReportDetails.displayName || eventReportDetails.name}
            {eventReportDetails.outputType && (
              <span style={{ fontSize: '0.8em', fontWeight: 'normal', marginLeft: '8px', color: '#666' }}>
                ({eventReportDetails.outputType === 'ENROLLMENT' ? 'Enrollment Data' : 'Event Data'})
              </span>
            )}
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
            {/* Don't show filter for the action column */}
            {filteredAnalyticsData[0].slice(0, -1).map((header, index) => (
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
          {pager.total ?
            `Showing ${filteredAnalyticsData.length - 1} of ${pager.total} total results` :
            `Showing ${filteredAnalyticsData.length - 1} results`
          }
          {pager.page > 1 && pager.pageCount > 1 && ` (page ${pager.page} of ${pager.pageCount})`}
          {searchTerm && ' (filtered)'}
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
                  {filteredAnalyticsData.slice(1).map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <TableCell key={cellIndex}>
                          {typeof cell === 'object' && cell.type === 'action' ? (
                            <a
                              href={generateAppLink(cell)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.actionLink}
                            >
                              <Button
                                small
                                className={styles.actionButton}
                                icon={
                                  cell.outputType === 'ENROLLMENT' || programType === 'WITH_REGISTRATION'
                                    ? <TrackerCaptureIcon />
                                    : <CaptureIcon />
                                }
                              >
                                View Details
                              </Button>
                            </a>
                          ) : (
                            cell !== null ? cell : ''
                          )}
                        </TableCell>
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
                      onClick={() => index < filteredAnalyticsData[0].length - 1 ? handleSort(index) : null}
                      className={index < filteredAnalyticsData[0].length - 1 ? styles.sortableHeader : ''}
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
                {filteredAnalyticsData.slice(1).map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <TableCell key={cellIndex}>
                        {typeof cell === 'object' && cell.type === 'action' ? (
                          <a
                            href={generateAppLink(cell)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.actionLink}
                          >
                            <Button
                              small
                              className={styles.actionButton}
                              icon={
                                cell.outputType === 'ENROLLMENT' || programType === 'WITH_REGISTRATION'
                                  ? <TrackerCaptureIcon />
                                  : <CaptureIcon />
                              }
                            >
                              View Details
                            </Button>
                          </a>
                        ) : (
                          cell !== null ? cell : ''
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Server-side Pagination - Using API pager metadata */}
        {filteredAnalyticsData && filteredAnalyticsData.length > 1 && (
          <div className={styles.paginationContainer}>
            <Pagination
              page={pager.page}
              pageSize={parseInt(pageSize, 10)}
              pageCount={pager.pageCount || 1}
              onPageChange={handlePageChange}
              onPageSizeChange={(value) => {
                console.log("Page size changed:", value);
                // If value is the direct value, not an object
                if (typeof value === 'string' || typeof value === 'number') {
                  handlePageSizeChange(value);
                } else {
                  // If value is an object as seen in some implementations
                  handlePageSizeChange(value);
                }
              }}
              pageSizeSelectText="Items per page"
              pageSizes={pageSizeOptions}
              total={pager.total || (filteredAnalyticsData.length - 1)}
            />
          </div>
        )}
      </div>
    </Card>
  );
};

export default EventReportViewer;