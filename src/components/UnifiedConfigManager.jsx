import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalTitle,
  ModalContent,
  ModalActions,
  Button,
  TabBar,
  Tab,
  Box,
  NoticeBox,
  SingleSelectField,
  SingleSelectOption,
  Table,
  TableHead,
  TableRowHead,
  TableCellHead,
  TableBody,
  TableRow,
  TableCell
} from '@dhis2/ui';
import { useConfig } from '@dhis2/app-runtime';
// Import components and hooks
import ConfigManager from './ConfigManager';
import { useAuthorization } from '../hooks/useAuthorization';
import { useDashboards } from '../hooks/useDashboards';
import { useEventReports } from '../hooks/useEventReports';
import { useDataStore } from '../hooks/useDataStore';

/**
 * UnifiedConfigManager Component
 * Provides a unified interface for all configuration needs
 */
const UnifiedConfigManager = ({ isOpen, onClose, dashboardId: initialDashboardId, isEmbedded = false }) => {
  // Use hooks
  const { hasConfigAccess, isSuperUser } = useAuthorization();
  const { dashboards, loading: dashboardsLoading } = useDashboards();
  const { eventReports } = useEventReports();
  const {
    getAllDashboardConfigurations,
    getDashboardConfiguration,
    deleteDashboardConfiguration,
    saveConfiguration
  } = useDataStore();

  // State for active tab and selected dashboard
  const [activeTab, setActiveTab] = useState('report');
  const [selectedDashboardId, setSelectedDashboardId] = useState(initialDashboardId || 'default');
  const [mappings, setMappings] = useState([]);
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const { baseUrl } = useConfig();
  // Handle tab change
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  // Handle dashboard change
  const handleDashboardChange = ({ selected }) => {
    if (selected !== '_divider') {
      setSelectedDashboardId(selected);
    }
  };

  // Return to dashboard or close modal
  const handleReturnToDashboard = () => {
    // Get the current dashboard ID from the URL if available    
   
      window.location.href = `${baseUrl}/dhis-web-dashboard/#/`;
  
  };


  // Load mappings when tab changes to mapping
  useEffect(() => {
    if (activeTab === 'mapping') {
      const configs = getAllDashboardConfigurations();
      console.log('Dashboard configurations:', configs);

      const mappingInfo = [];

      // Create an array of mapping objects for display
      Object.entries(configs).forEach(([dashId, config]) => {
        if (dashId && config.eventReportId) {
          // Find dashboard info (or use fallback if not found)
          const dashboard = dashboards.find(d => d.id === dashId) ||
            { displayName: dashId === 'default' ? 'Default' : `Dashboard ${dashId}` };

          // Find report info (or use fallback if not found)
          const report = eventReports.find(r => r.id === config.eventReportId) ||
            { name: config.eventReportId };

          mappingInfo.push({
            dashboardId: dashId,
            dashboardName: dashboard.displayName,
            reportId: config.eventReportId,
            reportName: report.name || report.displayName || 'Unknown Report'
          });
        }
      });

      console.log('Mapping info:', mappingInfo);
      setMappings(mappingInfo);
    }
  }, [activeTab, getAllDashboardConfigurations, dashboards, eventReports]);

  // Handle deleting a dashboard configuration
  const handleDeleteConfiguration = async (dashboardId) => {
    if (window.confirm(`Are you sure you want to remove the configuration for dashboard "${dashboardId}"?`)) {
      try {
        setDeleteInProgress(true);
        await deleteDashboardConfiguration(dashboardId);

        // Update mappings
        setMappings(prev => prev.filter(m => m.dashboardId !== dashboardId));
      } catch (error) {
        console.error('Error deleting configuration:', error);
      } finally {
        setDeleteInProgress(false);
      }
    }
  };

  // Check user authorization
  if (!hasConfigAccess && !isEmbedded) {
    return (
      <Modal>
        <ModalContent>
          <NoticeBox error>
            You do not have permission to manage configurations.
          </NoticeBox>
        </ModalContent>
        <ModalActions>
         
            <Button primary onClick={handleReturnToDashboard}>
              Close and Return to Dashboard
            </Button>
         
        </ModalActions>
      </Modal>
    );
  }

  if (!isOpen) return null;

  return (
    <Modal large>
      <ModalTitle>Configure Event Report Widget</ModalTitle>
      <ModalContent>
        {/* Dashboard Selector - Always visible */}
        <Box padding="16px 16px 0 16px">
          <SingleSelectField
            label="Configuration Target"
            loading={dashboardsLoading}
            onChange={handleDashboardChange}
            selected={selectedDashboardId || ''}
          >
            {/* Default option */}
            <SingleSelectOption
              value="default"
              label="Default Configuration (used when no dashboard is specified)"
            />

            {/* Divider between default and actual dashboards */}
            {dashboards.length > 0 && (
              <SingleSelectOption
                value="_divider"
                label="──────── Dashboards ────────"
                disabled
              />
            )}

            {/* Dashboard options */}
            {dashboards.map(dashboard => (
              <SingleSelectOption
                key={dashboard.id}
                value={dashboard.id}
                label={dashboard.displayName}
              />
            ))}
          </SingleSelectField>

          {selectedDashboardId === 'default' && (
            <Box margin="8px 0">
              <NoticeBox title="Default Configuration" warning={false}>
                You are configuring the default settings. These will be used when the widget is accessed outside of a dashboard context.
              </NoticeBox>
            </Box>
          )}
        </Box>

        {/* Configuration Tabs */}
        <TabBar>
          <Tab
            key="report"
            selected={activeTab === 'report'}
            onClick={() => handleTabChange('report')}
          >
            Report Settings
          </Tab>
          <Tab
            key="mapping"
            selected={activeTab === 'mapping'}
            onClick={() => handleTabChange('mapping')}
          >
            Dashboard Mapping
          </Tab>
        </TabBar>

        <Box padding="16px">
          {/* Report Configuration */}
          {activeTab === 'report' && (
            <ConfigManager
              dashboardId={selectedDashboardId}
              embedded={isEmbedded}
              onClose={onClose}
            />
          )}

          {/* Dashboard Mapping */}
          {activeTab === 'mapping' && (
            <Box>
              <h3>Dashboard to Event Report Mappings</h3>
              <p>This table shows all dashboards that have been configured with an event report.</p>

              {mappings.length === 0 ? (
                <NoticeBox title="No Mappings Found">
                  No dashboards have been mapped to event reports yet.
                  Use the Report Settings tab to configure dashboards.
                </NoticeBox>
              ) : (
                <Table>
                  <TableHead>
                    <TableRowHead>
                      <TableCellHead>Dashboard</TableCellHead>
                      <TableCellHead>Event Report</TableCellHead>
                      <TableCellHead>Actions</TableCellHead>
                    </TableRowHead>
                  </TableHead>
                  <TableBody>
                    {mappings.map((mapping, index) => (
                      <TableRow key={index}>
                        <TableCell>{mapping.dashboardName}</TableCell>
                        <TableCell>{mapping.reportName}</TableCell>
                        <TableCell>
                          <Button
                            small
                            onClick={() => {
                              setSelectedDashboardId(mapping.dashboardId);
                              setActiveTab('report');
                            }}
                          >
                            Edit
                          </Button>

                          {mapping.dashboardId !== 'default' && (
                            <Button
                              small
                              destructive
                              onClick={() => handleDeleteConfiguration(mapping.dashboardId)}
                              loading={deleteInProgress}
                              disabled={deleteInProgress}
                              style={{ marginLeft: '8px' }}
                            >
                              Remove
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {/* Global Configuration Section */}
              <Box marginTop="32px">
                <h3>Global Configuration</h3>
                <p>The default configuration is used when no dashboard-specific configuration is available.</p>

                <Box marginTop="16px">
                  <Button
                    onClick={() => {
                      setSelectedDashboardId('default');
                      setActiveTab('report');
                    }}
                  >
                    Edit Default Configuration
                  </Button>
                </Box>
              </Box>
            </Box>
          )}
        </Box>
      </ModalContent>

      <ModalActions>
        <Button secondary onClick={onClose}>
          Close
        </Button>
      </ModalActions>
    </Modal>
  );
};

export default UnifiedConfigManager;