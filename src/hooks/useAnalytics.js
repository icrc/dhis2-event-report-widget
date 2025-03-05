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
   * @param {string} outputType - Type of analytics (EVENT or ENROLLMENT)
   */
  const fetchAnalytics = useCallback(async (params, reportId = null, outputType = 'EVENT') => {
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

      // Build the query parameters
      const queryParams = {
        dimension: dimensionParams,
        displayProperty: 'NAME',
        totalPages: false,
        outputType: outputType,
        desc: outputType === 'ENROLLMENT' ? 'enrollmentdate' : 'eventdate',
        pageSize: params.pageSize || 100,
        page: params.page || 1,
        outputIdScheme: 'NAME'  // Use NAME to get text values not codes
      };
      
      // If stage is specified, add it to the params
      if (params.programStageId) {
        queryParams.stage = params.programStageId;
      }

      console.log('Analytics query parameters:', queryParams);
      console.log('Output type:', outputType);

      // Determine the resource path based on output type
      const resourcePath = outputType === 'ENROLLMENT' 
        ? `analytics/enrollments/query/${params.programId}.json`
        : `analytics/events/query/${params.programId}.json`;

      // Create the query with the exact format needed
      const query = {
        analytics: {
          resource: resourcePath,
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
        const mockData = createMockData(outputType);
        setAnalyticsData(mockData.data);
        setMetadata(mockData.metadata);
      }
    } catch (error) {
      console.error('Analytics fetch error:', error);
      setError(error);
      
      // Create mock data on error
      const mockData = createMockData(outputType);
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
   * @param {string} outputType - Type of output data (EVENT or ENROLLMENT)
   * @returns {Object} - Mock analytics data
   */
  const createMockData = (outputType = 'EVENT') => {
    let headers;
    
    if (outputType === 'ENROLLMENT') {
      headers = ['Enrollment Date', 'Organization Unit', "Patient's First Name", "Patient's Surname", 'Sex', 'Age', 'Weight'];
    } else {
      headers = ['Event Date', 'Organization Unit', 'Status', "Patient's First Name", "Patient's Surname", 'Sex', 'Age'];
    }
    
    // Generate some dummy rows
    const rows = [];
    const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emma', 'James', 'Emily'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Wilson'];
    
    for (let i = 1; i <= 20; i++) {
      const date = new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
      const orgUnit = `Facility ${i % 5 + 1}`;
      const firstName = firstNames[i % firstNames.length];
      const lastName = lastNames[i % lastNames.length];
      const gender = i % 2 === 0 ? 'Male' : 'Female';
      const age = Math.floor(Math.random() * 60) + 18;
      
      if (outputType === 'ENROLLMENT') {
        const weight = Math.floor(Math.random() * 50) + 50; // 50-100 kg
        rows.push([
          date.toISOString().split('T')[0],
          orgUnit,
          firstName,
          lastName,
          gender,
          age,
          weight
        ]);
      } else {
        const status = ['Active', 'Completed', 'Scheduled'][i % 3];
        rows.push([
          date.toISOString().split('T')[0],
          orgUnit,
          status,
          firstName,
          lastName,
          gender,
          age
        ]);
      }
    }

    return {
      data: [headers, ...rows],
      metadata: {
        itemCount: rows.length,
        headers: headers,
        reportId: currentReportId,
        outputType: outputType
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