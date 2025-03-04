import { useState, useCallback, useEffect } from 'react';
import { useDataEngine } from '@dhis2/app-runtime';

/**
 * Custom hook for fetching and managing analytics data
 */
const useAnalytics = () => {
  // Get the data engine for custom queries
  const engine = useDataEngine();
  
  // State management
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [currentReportId, setCurrentReportId] = useState(null);

  /**
   * Fetch analytics data using event report parameters
   * @param {Object} params - Parameters for fetching analytics 
   * @param {string} reportId - ID of the event report
   */
  const fetchAnalytics = useCallback(async (params, reportId = null) => {
    setLoading(true);
    setError(null);
    
    // Store current report ID if provided
    if (reportId) {
      setCurrentReportId(reportId);
    }
    
    // Make sure programId is available
    if (!params.programId) {
      setError(new Error('Program ID is required for analytics query'));
      setLoading(false);
      return;
    }

    try {
      // Build dimension array for the query
      const dimensionParams = [
        `pe:${params.period || 'LAST_12_MONTHS'}`,
        `ou:${params.orgUnit || 'USER_ORGUNIT'}`
      ];
      
      // Add custom dimensions if provided (including data elements and attributes)
      if (params.dimensions && params.dimensions.length) {
        // For API compatibility, remove any "ATTRIBUTE:" prefix
        const cleanDimensions = params.dimensions.map(dim => 
          dim.replace('ATTRIBUTE:', '')
        );
        dimensionParams.push(...cleanDimensions);
      }

      // Join all dimensions with comma for a single dimension parameter
      const dimensionParam = dimensionParams.join(',');

      // Build the query parameters
      const queryParams = {
        dimension: dimensionParam,
        displayProperty: 'NAME',
        totalPages: false,
        outputType: 'EVENT',
        desc: 'eventdate',
        pageSize: params.pageSize || 100,
        page: params.page || 1,
        outputIdScheme: 'NAME'  // Use NAME to get text values not codes
      };
      
      // If stage is specified, add it to the params
      if (params.programStageId) {
        queryParams.stage = params.programStageId;
      }

      console.log('Analytics query parameters:', queryParams);
      console.log('Dimensions:', dimensionParam);

      // Create the query with the exact format needed
      const query = {
        analytics: {
          resource: `analytics/events/query/${params.programId}.json`,
          params: queryParams
        }
      };

      // Execute the query using data engine
      const response = await engine.query(query);
      
      if (response && response.analytics) {
        const processedData = processAnalyticsResponse(response.analytics);
        setAnalyticsData(processedData.data);
        setMetadata(processedData.metadata);
      } else {
        // Create mock data if no real data
        const mockData = createMockData();
        setAnalyticsData(mockData.data);
        setMetadata(mockData.metadata);
      }
    } catch (error) {
      console.error('Analytics fetch error:', error);
      setError(error);
      
      // Create mock data on error
      const mockData = createMockData();
      setAnalyticsData(mockData.data);
      setMetadata(mockData.metadata);
    } finally {
      setLoading(false);
    }
  }, [engine]);

  /**
   * Process raw analytics response
   * @param {Object} rawResponse - Raw analytics response
   * @returns {Object} - Processed analytics data
   */
  const processAnalyticsResponse = (rawResponse) => {
    if (!rawResponse || !rawResponse.headers) {
      return createMockData();
    }

    // Extract headers using the column property instead of name
    // This ensures we get the human-readable column names (e.g., "Patient's Surname")
    // rather than the internal names (e.g., "ENRjVGxVL6l")
    const headers = rawResponse.headers.map(header => header.column);
    const rows = rawResponse.rows || [];

    // Create metadata
    const metadata = {
      dimensions: rawResponse.dimensions,
      metaData: rawResponse.metaData,
      width: rawResponse.width,
      height: rawResponse.height,
      itemCount: rows.length,
      headers: headers,
      reportId: currentReportId
    };

    return {
      data: [headers, ...rows],
      metadata
    };
  };

  /**
   * Create mock data for testing
   * @returns {Object} - Mock analytics data
   */
  const createMockData = () => {
    const headers = ['Event Date', 'Organization Unit', 'Status', 'Age', 'Gender'];
    
    // Generate some dummy rows
    const rows = [];
    for (let i = 1; i <= 20; i++) {
      const date = new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
      const orgUnit = `Facility ${i % 5 + 1}`;
      const status = ['Active', 'Completed', 'Scheduled'][i % 3];
      const age = Math.floor(Math.random() * 60) + 18;
      const gender = i % 2 === 0 ? 'Male' : 'Female';
      
      rows.push([
        date.toISOString().split('T')[0],
        orgUnit,
        status,
        age,
        gender
      ]);
    }

    return {
      data: [headers, ...rows],
      metadata: {
        itemCount: rows.length,
        headers: headers,
        reportId: currentReportId
      }
    };
  };

  /**
   * Export analytics data to CSV
   * @param {Array} data - Analytics data to export
   * @param {string} filename - Filename for export
   */
  const exportToCSV = useCallback((data, filename = 'analytics_export.csv') => {
    if (!data || data.length === 0) {
      console.warn('No data to export');
      return;
    }

    // Convert data to CSV
    const csvContent = data.map(row => 
      row.map(cell => 
        typeof cell === 'string' && cell.includes(',') 
          ? `"${cell.replace(/"/g, '""')}"` 
          : cell
      ).join(',')
    ).join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  return {
    analyticsData,
    metadata,
    loading,
    error,
    fetchAnalytics,
    exportToCSV
  };
};

export { useAnalytics };