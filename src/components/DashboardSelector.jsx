// DashboardSelector.jsx
import React, { useState, useEffect } from 'react';
import {
  SingleSelectField,
  SingleSelectOption,
  Button,
  Box,
  NoticeBox,
  CircularLoader
} from '@dhis2/ui';

import { useDashboards } from '../hooks/useDashboards';
import { useEventReports } from '../hooks/useEventReports';
import { useDataStore } from '../hooks/useDataStore';

const DashboardSelector = ({ embedded = false }) => {
  // Get dashboards and event reports
  const { dashboards, loading: dashboardsLoading } = useDashboards();
  const { eventReports, loading: reportsLoading } = useEventReports();
  const { mapDashboardToReport, getAllDashboardConfigurations } = useDataStore();
  
  // State management
  const [selectedDashboard, setSelectedDashboard] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  
  // Get existing configurations
  const dashboardConfigurations = getAllDashboardConfigurations();
  
  // Handle configuration mapping
  const handleSaveMapping = async () => {
    if (!selectedDashboard || !selectedReport) {
      setSaveMessage({ type: 'error', text: 'Please select both a dashboard and a report' });
      return;
    }
    
    setIsSaving(true);
    try {
      await mapDashboardToReport(selectedDashboard, selectedReport);
      setSaveMessage({ type: 'success', text: 'Mapping saved successfully' });
      
      // Reset after successful save
      if (!embedded) {
        setSelectedDashboard(null);
        setSelectedReport(null);
      }
    } catch (error) {
      setSaveMessage({ type: 'error', text: `Error saving mapping: ${error.message}` });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Loading state
  if (dashboardsLoading || reportsLoading) {
    return (
      <Box padding="16px" display="flex" justifyContent="center">
        <CircularLoader />
      </Box>
    );
  }
  
  // Empty state for dashboards
  if (dashboards.length === 0) {
    return (
      <NoticeBox title="No Dashboards Available">
        <p>No dashboards were found in the system. Please create dashboards first.</p>
      </NoticeBox>
    );
  }
  
  // Empty state for reports
  if (eventReports.length === 0) {
    return (
      <NoticeBox title="No Event Reports Available">
        <p>No event reports were found in the system. Please create event reports first.</p>
      </NoticeBox>
    );
  }
  
  return (
    <div>
      <Box marginBottom="16px">
        <h3>Map Event Reports to Dashboards</h3>
        <p>Select a dashboard and assign an event report to it. This determines which report appears on which dashboard.</p>
      </Box>
      
      <Box marginBottom="16px">
        <SingleSelectField
          label="Select Dashboard"
          selected={selectedDashboard || ''}
          onChange={({ selected }) => setSelectedDashboard(selected)}
          filterable
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
      
      {selectedDashboard && (
        <Box marginBottom="16px">
          <SingleSelectField
            label="Select Event Report"
            selected={selectedReport || (dashboardConfigurations[selectedDashboard]?.eventReportId) || ''}
            onChange={({ selected }) => setSelectedReport(selected)}
            filterable
          >
            {eventReports.map(report => (
              <SingleSelectOption
                key={report.id}
                value={report.id}
                label={report.displayName || report.name}
              />
            ))}
          </SingleSelectField>
          
          <Box display="flex" justifyContent="flex-end" marginTop="16px">
            <Button
              primary
              onClick={handleSaveMapping}
              loading={isSaving}
              disabled={isSaving || (!selectedReport && !dashboardConfigurations[selectedDashboard]?.eventReportId)}
            >
              Save Mapping
            </Button>
          </Box>
        </Box>
      )}
      
      {saveMessage && (
        <NoticeBox title={saveMessage.type === 'success' ? 'Success' : 'Error'} 
                  error={saveMessage.type === 'error'} 
                  success={saveMessage.type === 'success'}>
          {saveMessage.text}
        </NoticeBox>
      )}
      
      {/* Display current mappings */}
      <Box marginTop="32px">
        <h3>Current Dashboard Mappings</h3>
        {Object.keys(dashboardConfigurations).length === 0 ? (
          <p>No dashboard mappings configured yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Dashboard</th>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Event Report</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(dashboardConfigurations).map(([dashId, config]) => {
                const dashboard = dashboards.find(d => d.id === dashId);
                const report = eventReports.find(r => r.id === config.eventReportId);
                
                if (!dashboard || !report) return null;
                
                return (
                  <tr key={dashId}>
                    <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{dashboard.displayName}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{report.displayName || report.name}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Box>
    </div>
  );
};

export default DashboardSelector;