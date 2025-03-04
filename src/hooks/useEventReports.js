import { useState, useEffect, useCallback } from 'react';
import { useDataQuery } from '@dhis2/app-runtime';

/**
 * Custom hook for fetching and managing Event Reports
 * Provides methods to retrieve, filter, and interact with event reports
 */
const useEventReports = () => {
  // State management
  const [eventReports, setEventReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    programType: null,
    dataElementType: null,
    searchTerm: ''
  });

  // Define static query to get all event reports with complete details
  const eventReportsQuery = {
    eventReports: {
      resource: 'eventReports',
      params: {
        fields: ['*', 
                'program[id,displayName,programType]',
                'programStage[id,displayName]',
                'dataElementDimensions[dataElement[id,displayName],programStage[id]]',
                'attributeDimensions[attribute[id,displayName]]',
                'columnDimensions',
                'rowDimensions',
                'filterDimensions',
                'organisationUnits[id,displayName]',
                'relativePeriods'],
        order: 'name:asc',
        paging: false
      }
    }
  };

  // Use the query hook at the top level
  const { data, loading: queryLoading, error: queryError, refetch } = useDataQuery(eventReportsQuery, {
    onComplete: (data) => {
      if (data?.eventReports?.eventReports) {
        setEventReports(data.eventReports.eventReports);
      } else {
        // For demo purposes, create mock data if no real data available
        setEventReports(createMockEventReports());
      }
      setLoading(false);
    },
    onError: (error) => {
      console.error('Error fetching event reports:', error);
      setError(error);
      // For demo purposes, create mock data even on error
      setEventReports(createMockEventReports());
      setLoading(false);
    }
  });

  /**
   * Create mock event reports for testing
   * @returns {Array} - Mock event reports
   */
  const createMockEventReports = () => {
    return [
      {
        id: 'er1',
        name: 'Malaria Cases Report',
        displayName: 'Malaria Cases Report',
        description: 'Monthly report of malaria cases',
        program: {
          id: 'p1',
          displayName: 'Malaria Program',
          programType: 'WITHOUT_REGISTRATION'
        },
        programStage: {
          id: 'ps1',
          displayName: 'Diagnosis Stage'
        },
        attributeDimensions: [
          { attribute: { id: 'attr1', displayName: 'Patient Name' } },
          { attribute: { id: 'attr2', displayName: 'Age' } }
        ],
        dataElementDimensions: [
          { 
            dataElement: { id: 'de1', displayName: 'Diagnosis' },
            programStage: { id: 'ps1' }
          },
          { 
            dataElement: { id: 'de2', displayName: 'Treatment' },
            programStage: { id: 'ps1' }
          }
        ],
        columnDimensions: ['pe', 'ou', 'attr1', 'attr2', 'de1', 'de2'],
        organisationUnits: [{ id: 'orgUnit1', displayName: 'District Hospital' }],
        created: '2023-01-15T10:30:45.123',
        lastUpdated: '2023-02-20T14:15:30.456',
        relativePeriods: {
          last12Months: true
        }
      },
      {
        id: 'er2',
        name: 'Immunization Coverage',
        displayName: 'Immunization Coverage',
        description: 'Quarterly immunization coverage report',
        program: {
          id: 'p2',
          displayName: 'Immunization Program',
          programType: 'WITH_REGISTRATION'
        },
        programStage: {
          id: 'ps2',
          displayName: 'Vaccination Stage'
        },
        attributeDimensions: [
          { attribute: { id: 'attr3', displayName: 'Patient ID' } },
          { attribute: { id: 'attr4', displayName: 'Gender' } }
        ],
        dataElementDimensions: [
          { 
            dataElement: { id: 'de3', displayName: 'Vaccine Type' },
            programStage: { id: 'ps2' }
          },
          { 
            dataElement: { id: 'de4', displayName: 'Dose Number' },
            programStage: { id: 'ps2' }
          }
        ],
        columnDimensions: ['pe', 'ou', 'attr3', 'attr4', 'de3', 'de4'],
        organisationUnits: [{ id: 'orgUnit2', displayName: 'City Clinic' }],
        created: '2023-03-10T09:20:15.789',
        lastUpdated: '2023-03-10T09:20:15.789',
        relativePeriods: {
          thisQuarter: true
        }
      }
    ];
  };

  /**
   * Get event report details by ID
   * @param {string} reportId - ID of the event report
   * @returns {Object|null} Event report details
   */
  const getEventReportDetails = useCallback((reportId) => {
    return eventReports.find(report => report.id === reportId) || null;
  }, [eventReports]);

  /**
   * Extract analytics query parameters from an event report
   * @param {string} reportId - ID of the event report 
   * @returns {Object|null} Query parameters for analytics
   */
  const getAnalyticsParams = useCallback((reportId) => {
    const report = getEventReportDetails(reportId);
    if (!report) return null;
    
    // Get program and program stage
    const programId = report.program?.id;
    const programStageId = report.programStage?.id;
    
    if (!programId) return null;
    
    // Extract organization units
    const orgUnits = report.organisationUnits?.map(ou => ou.id) || [];
    const orgUnit = orgUnits.length > 0 ? orgUnits[0] : 'USER_ORGUNIT';
    
    // Determine period based on relative periods
    let period = 'LAST_12_MONTHS';
    if (report.relativePeriods) {
      if (report.relativePeriods.last12Months) period = 'LAST_12_MONTHS';
      else if (report.relativePeriods.last6Months) period = 'LAST_6_MONTHS';
      else if (report.relativePeriods.last3Months) period = 'LAST_3_MONTHS';
      else if (report.relativePeriods.thisYear) period = 'THIS_YEAR';
      else if (report.relativePeriods.lastYear) period = 'LAST_YEAR';
    }
    
    // Extract dimensions
    const dimensions = [];
    
    // Process attribute dimensions - for API v29, don't add the ATTRIBUTE: prefix
    if (report.attributeDimensions && report.attributeDimensions.length > 0) {
      report.attributeDimensions.forEach(dimension => {
        if (dimension.attribute && dimension.attribute.id) {
          dimensions.push(dimension.attribute.id);
        }
      });
    }
    
    // Process data element dimensions - format as programStageId.dataElementId
    if (report.dataElementDimensions && report.dataElementDimensions.length > 0) {
      report.dataElementDimensions.forEach(dimension => {
        if (dimension.dataElement && dimension.dataElement.id) {
          // Include the program stage ID if available
          const stageId = dimension.programStage?.id || programStageId;
          if (stageId) {
            dimensions.push(`${stageId}.${dimension.dataElement.id}`);
          }
        }
      });
    }
    
    // Process column dimensions if no explicit dimensions were found
    if ((!dimensions.length) && report.columnDimensions && report.columnDimensions.length > 0) {
      report.columnDimensions.forEach(dimension => {
        // Skip standard dimensions like period (pe) and org unit (ou)
        if (dimension !== 'pe' && dimension !== 'ou') {
          // Format according to API v29 requirements
          if (dimension.includes('.')) {
            // Already formatted as stage.dataElement
            dimensions.push(dimension);
          } else {
            // Check if it's an attribute ID
            const isAttribute = report.attributeDimensions?.some(
              attrDim => attrDim.attribute?.id === dimension
            );
            
            if (isAttribute) {
              // For API v29, just use the ID without prefix
              dimensions.push(dimension);
            } else if (programStageId) {
              // Assume it's a data element
              dimensions.push(`${programStageId}.${dimension}`);
            }
          }
        }
      });
    }
    
    return {
      programId,
      programStageId,
      orgUnit,
      period,
      dimensions,
      pageSize: 100,
      page: 1
    };
  }, [getEventReportDetails]);

  /**
   * Filter event reports based on various criteria
   * @param {Object} filterOptions - Filtering options
   */
  const filterEventReports = useCallback((filterOptions) => {
    setFilters(prev => ({ ...prev, ...filterOptions }));
  }, []);

  /**
   * Get filtered event reports
   * @returns {Array} Filtered event reports
   */
  const getFilteredEventReports = useCallback(() => {
    return eventReports.filter(report => {
      // Program type filter
      if (filters.programType && 
          report.program?.programType !== filters.programType) {
        return false;
      }

      // Search term filter
      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        const matchesName = report.name.toLowerCase().includes(searchTerm);
        const matchesProgram = report.program?.displayName.toLowerCase().includes(searchTerm);
        
        if (!matchesName && !matchesProgram) {
          return false;
        }
      }

      return true;
    });
  }, [eventReports, filters]);

  /**
   * Refresh event reports data
   */
  const refreshEventReports = useCallback(() => {
    setLoading(true);
    refetch();
  }, [refetch]);

  // Update loading state based on query loading
  useEffect(() => {
    setLoading(queryLoading);
  }, [queryLoading]);

  return {
    // Event reports data
    eventReports,
    filteredEventReports: getFilteredEventReports(),
    
    // Metadata and state
    loading,
    error,
    
    // Methods
    getEventReportDetails,
    getAnalyticsParams,
    filterEventReports,
    refreshEventReports,
    
    // Current filters
    currentFilters: filters
  };
};

export { useEventReports };