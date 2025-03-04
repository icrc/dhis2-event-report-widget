import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  ModalTitle,
  ModalContent,
  ModalActions,
  Button,
  SingleSelectField,
  SingleSelectOption,
  InputField,
  NoticeBox,
  Tab,
  TabBar,
  Checkbox,
  Box,
  Divider,
  FieldSet,
  Legend
} from '@dhis2/ui';

// Import custom hooks and utilities
import { useDataStore } from '../hooks/useDataStore';
import { useAuthorization } from '../hooks/useAuthorization';
import { useEventReports } from '../hooks/useEventReports';
import { configurationValidator } from '../utils/configurationValidator';

// Default hidden columns definition
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
 * ConfigManager Component
 * 
 * Provides a configuration interface for dashboard event report widgets
 * - Only accessible by super users
 * - Allows selecting an event report and configuring display options
 * - Saves configuration to DHIS2 Data Store
 * 
 * @param {Object} props
 * @param {string} props.dashboardId - Unique identifier for the dashboard
 * @param {function} props.onClose - Callback to close the configuration modal
 */
const ConfigManager = ({ dashboardId, onClose }) => {
  // Use custom hooks for authorization, data store, and event reports
  const { hasConfigAccess, isSuperUser } = useAuthorization();
  const { saveConfiguration, getDashboardConfiguration } = useDataStore();
  const { eventReports, loading: reportsLoading, error: reportsError, getEventReportDetails } = useEventReports();

  // Get current dashboard configuration
  const existingConfig = useMemo(() => 
    getDashboardConfiguration(dashboardId) || {},
    [dashboardId, getDashboardConfiguration]
  );

  // State for active tab
  const [activeTab, setActiveTab] = useState('basic');

  // State for configuration options
  const [selectedReport, setSelectedReport] = useState(existingConfig.eventReportId || null);
  const [pageSize, setPageSize] = useState(existingConfig.pageSize || 10);
  const [period, setPeriod] = useState(existingConfig.period || 'LAST_12_MONTHS');
  const [hiddenColumns, setHiddenColumns] = useState(existingConfig.hiddenColumns || DEFAULT_HIDDEN_COLUMNS);
  
  // State for validation
  const [validationResult, setValidationResult] = useState(null);

  // Fetch sample columns when selected report changes
  const [availableColumns, setAvailableColumns] = useState([]);
  useEffect(() => {
    if (selectedReport) {
      const reportDetails = getEventReportDetails(selectedReport);
      if (reportDetails) {
        // In a real app, we would fetch sample data to get columns
        // For now, let's use a mix of default hidden columns and some additional columns
        const sampleColumns = [
          ...DEFAULT_HIDDEN_COLUMNS,
          'First Name',
          'Last Name',
          'Age',
          'Gender',
          'Phone',
          'Email',
          'Registration Date',
          'Status',
          'Organization Unit'
        ];
        setAvailableColumns([...new Set(sampleColumns)]);
      }
    }
  }, [selectedReport, getEventReportDetails]);

  // Predefined period options
  const periodOptions = [
    { value: 'LAST_12_MONTHS', label: 'Last 12 Months' },
    { value: 'LAST_6_MONTHS', label: 'Last 6 Months' },
    { value: 'THIS_YEAR', label: 'This Year' },
    { value: 'LAST_YEAR', label: 'Last Year' }
  ];

  // Validate page size input
  const handlePageSizeChange = (value) => {
    const parsedValue = parseInt(value, 10);
    // Ensure page size is between 5 and 100
    if (!isNaN(parsedValue) && parsedValue >= 5 && parsedValue <= 100) {
      setPageSize(parsedValue);
    }
  };

  // Toggle a column's visibility in the hidden columns array
  const toggleColumnVisibility = (columnName) => {
    setHiddenColumns(prev => {
      if (prev.includes(columnName)) {
        return prev.filter(col => col !== columnName);
      } else {
        return [...prev, columnName];
      }
    });
  };

  // Reset hidden columns to default
  const resetHiddenColumns = () => {
    setHiddenColumns(DEFAULT_HIDDEN_COLUMNS);
  };

  // Validate configuration
  const validateConfig = () => {
    // Create configuration object for validation
    const configToValidate = {
      eventReportId: selectedReport,
      pageSize,
      period,
      hiddenColumns,
      metadata: {
        createdAt: new Date().toISOString()
      }
    };

    // Validate using utility
    const result = configurationValidator.validateDashboardConfig(configToValidate);
    setValidationResult(result);
    
    return result.isValid;
  };

  // Save configuration to Data Store
  const handleSaveConfiguration = () => {
    // Validate required fields and configuration
    if (!selectedReport) {
      setValidationResult({
        isValid: false,
        errors: ['Please select an event report'],
        warnings: []
      });
      return;
    }

    if (!validateConfig()) {
      return;
    }

    // Prepare configuration object
    const configuration = {
      eventReportId: selectedReport,
      pageSize,
      period,
      hiddenColumns,
      metadata: {
        createdAt: new Date().toISOString()
      }
    };

    // Save configuration for specific dashboard
    saveConfiguration(dashboardId, configuration);
    
    // Close the modal after saving
    onClose();
  };

  // Check user authorization
  if (!hasConfigAccess) {
    return (
      <Modal>
        <ModalContent>
          <NoticeBox error>
            You do not have permission to manage configurations. 
            Only users with configuration access can modify widget settings.
          </NoticeBox>
        </ModalContent>
        <ModalActions>
          <Button onClick={onClose}>Close</Button>
        </ModalActions>
      </Modal>
    );
  }

  // Render configuration modal
  return (
    <Modal large>
      <ModalTitle>Configure Dashboard Event Report Widget</ModalTitle>
      <ModalContent>
        {/* Tab Navigation */}
        <TabBar>
          <Tab
            key="basic"
            selected={activeTab === 'basic'}
            onClick={() => setActiveTab('basic')}
          >
            Basic Settings
          </Tab>
          <Tab
            key="columns"
            selected={activeTab === 'columns'}
            onClick={() => setActiveTab('columns')}
          >
            Column Visibility
          </Tab>
        </TabBar>

        <Box padding="16px">
          {/* Basic Settings Tab */}
          {activeTab === 'basic' && (
            <>
              {/* Event Report Selection */}
              <SingleSelectField
                label="Select Event Report"
                loading={reportsLoading}
                error={!!reportsError}
                onChange={({ selected }) => setSelectedReport(selected)}
                selected={selectedReport}
                required
              >
                {eventReports.map(report => (
                  <SingleSelectOption
                    key={report.id}
                    value={report.id}
                    label={report.name}
                  />
                ))}
              </SingleSelectField>

              {/* Page Size Configuration */}
              <Box marginTop="16px">
                <InputField
                  label="Records per Page"
                  type="number"
                  value={pageSize.toString()}
                  onChange={({ value }) => handlePageSizeChange(value)}
                  min={5}
                  max={100}
                  helpText="Number of records to display (5-100)"
                />
              </Box>

              {/* Period Selection */}
              <Box marginTop="16px">
                <SingleSelectField
                  label="Default Period"
                  onChange={({ selected }) => setPeriod(selected)}
                  selected={period}
                >
                  {periodOptions.map(option => (
                    <SingleSelectOption
                      key={option.value}
                      value={option.value}
                      label={option.label}
                    />
                  ))}
                </SingleSelectField>
              </Box>
            </>
          )}

          {/* Columns Visibility Tab */}
          {activeTab === 'columns' && (
            <>
              <Box display="flex" justifyContent="space-between" alignItems="center" marginBottom="16px">
                <h3 style={{ margin: 0 }}>Configure Visible Columns</h3>
                <Button small onClick={resetHiddenColumns}>Reset to Default</Button>
              </Box>
              
              <Box marginBottom="16px">
                <p>Select which columns should be hidden in the report view:</p>
              </Box>
              
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '12px', 
                maxHeight: '300px', 
                overflowY: 'auto' 
              }}>
                {availableColumns.map((column, index) => (
                  <div key={index} style={{ flex: '0 0 250px' }}>
                    <Checkbox
                      checked={hiddenColumns.includes(column)}
                      label={column}
                      onChange={() => toggleColumnVisibility(column)}
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Error Handling */}
          {(reportsError || validationResult?.errors?.length > 0) && (
            <Box marginTop="16px">
              <NoticeBox error title="Configuration Error">
                {reportsError && <p>Error loading event reports: {reportsError.message}</p>}
                {validationResult?.errors?.length > 0 && (
                  <ul>
                    {validationResult.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                )}
              </NoticeBox>
            </Box>
          )}

          {/* Warnings */}
          {validationResult?.warnings?.length > 0 && (
            <Box marginTop="16px">
              <NoticeBox warning title="Configuration Warnings">
                <ul>
                  {validationResult.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </NoticeBox>
            </Box>
          )}
        </Box>
      </ModalContent>
      
      {/* Actions */}
      <ModalActions>
        <Button secondary onClick={onClose}>
          Cancel
        </Button>
        <Button 
          primary 
          onClick={handleSaveConfiguration}
          disabled={!selectedReport}
        >
          Save Configuration
        </Button>
      </ModalActions>
    </Modal>
  );
};

export default ConfigManager;