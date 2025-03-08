import React, { useState, useEffect, useMemo } from 'react';
import {
  ModalActions,
  Button,
  SingleSelectField,
  SingleSelectOption,
  InputField,
  NoticeBox,
  Tab,
  TabBar,
  Box,
  Checkbox,
  FieldSet,
  Legend
} from '@dhis2/ui';

// Import custom hooks and utilities
import { useDataStore } from '../hooks/useDataStore';
import { useAuthorization } from '../hooks/useAuthorization';
import { useEventReports } from '../hooks/useEventReports';
import { configurationValidator } from '../utils/configurationValidator';
//import { PAGE_SIZE_OPTION_VALUES, DEFAULT_PAGE_SIZE } from '../utils/constants';

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
 * - Only accessible by users with config access
 * - Allows selecting an event report and configuring display options
 * - Saves configuration to DHIS2 Data Store
 * 
 * @param {Object} props
 * @param {string} props.dashboardId - Unique identifier for the dashboard or 'default'
 * @param {function} props.onClose - Callback to close the configuration modal
 * @param {boolean} props.embedded - Whether the component is embedded in another component
 */
const ConfigManager = ({ dashboardId, onClose, embedded = false }) => {
  // Use custom hooks for authorization, data store, and event reports
  const { hasConfigAccess } = useAuthorization();
  const { saveConfiguration, getDashboardConfiguration, saveGlobalConfiguration } = useDataStore();
  const { eventReports, loading: reportsLoading, error: reportsError, getEventReportDetails } = useEventReports();

  const PAGE_SIZE_OPTIONS = [
    { value: '5', label: '5' },
    { value: '10', label: '10' },
    { value: '15', label: '15' },
    { value: '20', label: '20' },
    { value: '25', label: '25' },
    { value: '50', label: '50' },
    { value: '100', label: '100' }
  ];

  const DEFAULT_PAGE_SIZE = '10';

  // Get current dashboard configuration
  const existingConfig = useMemo(() =>
    getDashboardConfiguration(dashboardId) || {},
    [dashboardId, getDashboardConfiguration]
  );

  // State for active tab
  const [activeTab, setActiveTab] = useState('basic');

  // State for configuration options
  const [selectedReport, setSelectedReport] = useState(existingConfig.eventReportId || null);
  const [pageSize, setPageSize] = useState(
    existingConfig.pageSize ? String(existingConfig.pageSize) : DEFAULT_PAGE_SIZE
  );
  const [period, setPeriod] = useState(existingConfig.period || 'LAST_12_MONTHS');
  const [hiddenColumns, setHiddenColumns] = useState(existingConfig.hiddenColumns || DEFAULT_HIDDEN_COLUMNS);

  // State for global config options
  const [globalFallback, setGlobalFallback] = useState(true);

  // State for validation
  const [validationResult, setValidationResult] = useState(null);
  const [isSaving, setIsSaving] = useState(false);


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
      pageSize: parseInt(pageSize, 10), // Make sure this is converted to a number
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

    setIsSaving(true);
    console.log(`Saving configuration for dashboard: ${dashboardId}`, {
      eventReportId: selectedReport,
      pageSize: parseInt(pageSize, 10),
      period,
      hiddenColumns: hiddenColumns.length
    });

    // Prepare configuration object
    const configuration = {
      eventReportId: selectedReport,
      pageSize: parseInt(pageSize, 10),
      period,
      hiddenColumns,
      metadata: {
        createdAt: new Date().toISOString()
      }
    };

    try {
      // Save specific dashboard configuration
      saveConfiguration(dashboardId, configuration);

      // If this is the default config, also update global settings
      if (dashboardId === 'default') {
        saveGlobalConfiguration({
          globalFallback,
          lastModified: new Date().toISOString()
        });
      }

      // Show success message
      setValidationResult({
        isValid: true,
        errors: [],
        warnings: [],
        success: `Configuration for ${dashboardId === 'default' ? 'default' : `dashboard ${dashboardId}`} saved successfully!`
      });

      // Close the modal after saving (if not embedded)
      if (!embedded && typeof onClose === 'function') {
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
      setValidationResult({
        isValid: false,
        errors: [`Error saving configuration: ${error.message}`],
        warnings: []
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Check user authorization
  if (!hasConfigAccess) {
    return (
      <Box>
        <NoticeBox error>
          You do not have permission to manage configurations.
          Only users with configuration access can modify widget settings.
        </NoticeBox>
        {!embedded && (
          <Box marginTop="16px" display="flex" justifyContent="flex-end">
            <Button onClick={onClose}>Close</Button>
          </Box>
        )}
      </Box>
    );
  }

  // Render configuration interface
  return (
    <Box>
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
              selected={selectedReport || ''}  // Add default empty string
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
              <SingleSelectField
                label="Records per Page"
                onChange={({ selected }) => setPageSize(selected)}
                selected={pageSize || DEFAULT_PAGE_SIZE}
                helpText="Number of records to display per page"
              >
                {PAGE_SIZE_OPTIONS.map(option => (
                  <SingleSelectOption
                    key={option.value}
                    value={option.value}
                    label={option.label}
                  />
                ))}
              </SingleSelectField>
            </Box>

            {/* Period Selection */}
            <Box marginTop="16px">
              <SingleSelectField
                label="Default Period"
                onChange={({ selected }) => setPeriod(selected)}
                selected={period || ''}
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

            {/* Global Settings (for default config only) */}
            {dashboardId === 'default' && (
              <Box marginTop="16px">
                <FieldSet>
                  <Legend>Global Settings</Legend>

                  <Box marginTop="8px">
                    <Checkbox
                      label="Use Default Configuration for All Dashboards If Not Specified"
                      checked={globalFallback}
                      onChange={({ checked }) => setGlobalFallback(checked)}
                    />
                  </Box>
                </FieldSet>
              </Box>
            )}
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

        {/* Success Message */}
        {validationResult?.success && (
          <Box marginTop="16px">
            <NoticeBox title="Success" success>
              {validationResult.success}
            </NoticeBox>
          </Box>
        )}

        {/* Actions */}
        <Box marginTop="16px" display="flex" justifyContent="flex-end">
          {!embedded && (
            <Button secondary onClick={onClose} style={{ marginRight: '8px' }}>
              Cancel
            </Button>
          )}
          <Button
            primary
            onClick={handleSaveConfiguration}
            disabled={!selectedReport || isSaving}
            loading={isSaving}
          >
            Save Configuration
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default ConfigManager;