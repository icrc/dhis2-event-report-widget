import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalTitle,
  ModalContent,
  ModalActions,
  Button,
  SingleSelectField,
  SingleSelectOption,
  NoticeBox,
  Divider,
  InputField,
  Tab,
  TabBar,
  Box,
  Checkbox
} from '@dhis2/ui';

// Import custom hooks
import { useDataStore } from '../hooks/useDataStore';
import { useDashboards } from '../hooks/useDashboards';
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
 * DashboardConfigSelector Component
 * 
 * Provides an interface for mapping event reports to specific dashboards
 * - Allows selection of dashboards and corresponding event reports
 * - Configurable display options
 * - Accessible only to super users
 * 
 * @param {Object} props
 * @param {function} props.onClose - Callback to close the modal
 */
const DashboardConfigSelector = ({ onClose }) => {
  // Utilize custom hooks for data management and authorization
  const { canManageConfigurations } = useAuthorization();
  const { saveConfiguration, getDashboardConfiguration } = useDataStore();
  const { dashboards, loading: dashboardsLoading } = useDashboards();
  const { eventReports, loading: reportsLoading, getEventReportDetails } = useEventReports();

  // Component state management
  const [activeTab, setActiveTab] = useState('basic');
  const [selectedDashboard, setSelectedDashboard] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [pageSize, setPageSize] = useState(10);
  const [period, setPeriod] = useState('LAST_12_MONTHS');
  const [hiddenColumns, setHiddenColumns] = useState(DEFAULT_HIDDEN_COLUMNS);
  const [availableColumns, setAvailableColumns] = useState([]);
  const [validationResult, setValidationResult] = useState(null);

  // Load existing configuration when dashboard is selected
  useEffect(() => {
    if (selectedDashboard) {
      const existingConfig = getDashboardConfiguration(selectedDashboard);
      if (existingConfig) {
        setSelectedReport(existingConfig.eventReportId || null);
        setPageSize(existingConfig.pageSize || 10);
        setPeriod(existingConfig.period || 'LAST_12_MONTHS');
        setHiddenColumns(existingConfig.hiddenColumns || DEFAULT_HIDDEN_COLUMNS);
      } else {
        // Reset to defaults if no configuration exists
        setSelectedReport(null);
        setPageSize(10);
        setPeriod('LAST_12_MONTHS');
        setHiddenColumns(DEFAULT_HIDDEN_COLUMNS);
      }
    }
  }, [selectedDashboard, getDashboardConfiguration]);

  // Update available columns when report changes
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

  // Predefined period options for consistency
  const periodOptions = [
    { value: 'LAST_12_MONTHS', label: 'Last 12 Months' },
    { value: 'LAST_6_MONTHS', label: 'Last 6 Months' },
    { value: 'THIS_YEAR', label: 'This Year' },
    { value: 'LAST_YEAR', label: 'Last Year' }
  ];

  // Validate and update page size
  const handlePageSizeChange = (value) => {
    const parsedValue = parseInt(value, 10);
    // Ensure page size is within reasonable bounds
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

  // Save dashboard-specific event report configuration
  const handleSaveConfiguration = () => {
    // Validate required fields
    if (!selectedDashboard || !selectedReport) {
      setValidationResult({
        isValid: false,
        errors: ['Please select both a dashboard and an event report'],
        warnings: []
      });
      return;
    }

    if (!validateConfig()) {
      return;
    }

    // Prepare configuration object
    const configuration = {
      dashboardId: selectedDashboard,
      eventReportId: selectedReport,
      pageSize,
      period,
      hiddenColumns,
      metadata: {
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      }
    };

    // Save configuration using data store utility
    saveConfiguration(selectedDashboard, configuration);
    
    // Close modal after saving
    onClose();
  };

  // Check user authorization
  if (!canManageConfigurations()) {
    return (
      <Modal>
        <ModalContent>
          <NoticeBox error>
            Access Denied: Only super users can configure dashboard widgets.
          </NoticeBox>
        </ModalContent>
        <ModalActions>
          <Button onClick={onClose}>Close</Button>
        </ModalActions>
      </Modal>
    );
  }

  // Render configuration interface
  return (
    <Modal large>
      <ModalTitle>Configure Dashboard Event Report Widget</ModalTitle>
      <ModalContent>
        {/* Dashboard Selection */}
        <Box padding="16px">
          <SingleSelectField
            label="Select Dashboard"
            loading={dashboardsLoading}
            onChange={({ selected }) => setSelectedDashboard(selected)}
            selected={selectedDashboard}
            required
          >
            {dashboards.map(dashboard => (
              <SingleSelectOption
                key={dashboard.id}
                value={dashboard.id}
                label={dashboard.displayName}
              />
            ))}
          </SingleSelectField>
        </Box>

        <Divider />

        {selectedDashboard && (
          <>
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
                disabled={!selectedReport}
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
              {activeTab === 'columns' && selectedReport && (
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

              {/* Validation Errors */}
              {validationResult?.errors?.length > 0 && (
                <Box marginTop="16px">
                  <NoticeBox error title="Configuration Error">
                    <ul>
                      {validationResult.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </NoticeBox>
                </Box>
              )}

              {/* Validation Warnings */}
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
          </>
        )}
      </ModalContent>
      
      {/* Action Buttons */}
      <ModalActions>
        <Button secondary onClick={onClose}>
          Cancel
        </Button>
        <Button 
          primary 
          onClick={handleSaveConfiguration}
          disabled={!selectedDashboard || !selectedReport}
        >
          Save Configuration
        </Button>
      </ModalActions>
    </Modal>
  );
};

export default DashboardConfigSelector;