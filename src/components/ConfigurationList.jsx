import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  TableHead,
  TableRowHead,
  TableCellHead,
  TableBody,
  TableRow,
  TableCell,
  Card,
  Button,
  CircularLoader,
  NoticeBox,
  Tooltip,
  InputField
} from '@dhis2/ui';
import { useDataStore } from '../hooks/useDataStore';
import { useDashboards } from '../hooks/useDashboards';
import { useEventReports } from '../hooks/useEventReports';
import { FiArrowUp, FiArrowDown } from 'react-icons/fi';

const ConfigurationList = ({ 
  openConfigModal, 
  currentDashboardId, 
  hasConfigAccess,
  refreshTimestamp = 0
}) => {
  const [loading, setLoading] = useState(true);
  const { getAllDashboardConfigurations } = useDataStore();
  const { dashboards } = useDashboards();
  const { eventReports } = useEventReports();
  const [configurations, setConfigurations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'dashboardName', direction: 'asc' });

  // Create a function to load configurations that we can call directly
  const loadConfigurations = useCallback(async () => {
    console.log("Loading configurations. Timestamp:", refreshTimestamp);
    setLoading(true);
    
    try {
      // Force fresh data fetch
      const configs = getAllDashboardConfigurations();
      console.log("Fetched configurations:", configs);
      
      // Transform configurations into a more usable format
      const configList = Object.entries(configs).map(([dashboardId, config]) => {
        // Find dashboard name
        let dashboardName = dashboardId;
        if (dashboardId === 'default') {
          dashboardName = 'Default Configuration';
        } else {
          const dashboard = dashboards.find(d => d.id === dashboardId);
          if (dashboard) {
            dashboardName = dashboard.displayName;
          }
        }
        
        // Find event report name
        let reportName = config.eventReportId;
        const report = eventReports.find(r => r.id === config.eventReportId);
        if (report) {
          reportName = report.displayName || report.name;
        }
        
        return {
          dashboardId,
          dashboardName,
          eventReportId: config.eventReportId,
          reportName,
          pageSize: config.pageSize,
          period: config.period,
          lastModified: config.lastModified || config.metadata?.createdAt,
        };
      });
      
      console.log("Processed configuration list:", configList);
      setConfigurations(configList);
    } catch (error) {
      console.error('Error loading configurations:', error);
    } finally {
      setLoading(false);
    }
  }, [getAllDashboardConfigurations, dashboards, eventReports, refreshTimestamp]);

  // Load configurations when component mounts or refreshTimestamp changes
  useEffect(() => {
    console.log("ConfigurationList effect triggered. Timestamp:", refreshTimestamp);
    loadConfigurations();
  }, [loadConfigurations, refreshTimestamp]);

  // Format a date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (e) {
      return dateString;
    }
  };
  
  // Format period for display
  const formatPeriod = (period) => {
    const periodMap = {
      'LAST_12_MONTHS': 'Last 12 Months',
      'LAST_6_MONTHS': 'Last 6 Months',
      'THIS_YEAR': 'This Year',
      'LAST_YEAR': 'Last Year'
    };
    
    return periodMap[period] || period;
  };

  // Component for handle refresh button functionality
  const handleRefresh = () => {
    console.log("Manual refresh requested");
    loadConfigurations();
  };

  // Handle search term change
  const handleSearchChange = (value) => {
    setSearchTerm(value);
  };

  // Handle sorting
  const handleSort = (key) => {
    setSortConfig(prev => {
      const direction = prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc';
      return { key, direction };
    });
  };

  // Apply search and sorting to configurations
  const filteredAndSortedConfigurations = configurations
    .filter(config => 
      config.dashboardName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      config.reportName.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

  if (loading) {
    return (
      <Card>
        <div style={{ padding: '32px', textAlign: 'center' }}>
          <CircularLoader />
          <p style={{ marginTop: '16px' }}>Loading configurations...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div style={{ padding: '16px' }}>
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>Event Report Widget Configurations</h2>
          <Button small onClick={handleRefresh}>Refresh</Button>
        </div>
        
        <InputField
          placeholder="Search configurations..."
          value={searchTerm}
          onChange={({ value }) => handleSearchChange(value)}
          dense
          style={{ marginBottom: '16px' }}
        />
        
        <p>Below is a list of all configured event report widgets. The default configuration is used when no dashboard-specific configuration is available.</p>
        
        {filteredAndSortedConfigurations.length === 0 ? (
          <NoticeBox title="No Matching Configurations">
            <p>No configurations match your search criteria. Please adjust your search term.</p>
          </NoticeBox>
        ) : (
          <Table>
            <TableHead>
              <TableRowHead>
                <TableCellHead onClick={() => handleSort('dashboardName')}>
                  Dashboard
                  {sortConfig.key === 'dashboardName' && (
                    <span>{sortConfig.direction === 'asc' ? <FiArrowUp /> : <FiArrowDown />}</span>
                  )}
                </TableCellHead>
                <TableCellHead onClick={() => handleSort('reportName')}>
                  Event Report
                  {sortConfig.key === 'reportName' && (
                    <span>{sortConfig.direction === 'asc' ? <FiArrowUp /> : <FiArrowDown />}</span>
                  )}
                </TableCellHead>
                <TableCellHead onClick={() => handleSort('pageSize')}>
                  Page Size
                  {sortConfig.key === 'pageSize' && (
                    <span>{sortConfig.direction === 'asc' ? <FiArrowUp /> : <FiArrowDown />}</span>
                  )}
                </TableCellHead>
                <TableCellHead onClick={() => handleSort('period')}>
                  Period
                  {sortConfig.key === 'period' && (
                    <span>{sortConfig.direction === 'asc' ? <FiArrowUp /> : <FiArrowDown />}</span>
                  )}
                </TableCellHead>
                <TableCellHead onClick={() => handleSort('lastModified')}>
                  Last Modified
                  {sortConfig.key === 'lastModified' && (
                    <span>{sortConfig.direction === 'asc' ? <FiArrowUp /> : <FiArrowDown />}</span>
                  )}
                </TableCellHead>
              </TableRowHead>
            </TableHead>
            <TableBody>
              {filteredAndSortedConfigurations.map(config => (
                <TableRow key={config.dashboardId}>
                  <TableCell>
                    <Tooltip content={config.dashboardId === 'default' ? 'Default Configuration' : `Dashboard ID: ${config.dashboardId}`}>
                      <span style={{ fontWeight: config.dashboardId === 'default' ? 'bold' : 'normal' }}>
                        {config.dashboardName}
                      </span>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Tooltip content={`Report ID: ${config.eventReportId}`}>
                      <span>{config.reportName}</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell>{config.pageSize}</TableCell>
                  <TableCell>{formatPeriod(config.period)}</TableCell>
                  <TableCell>{formatDate(config.lastModified)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        
        <div style={{ marginTop: '16px', color: '#666', fontSize: '0.9em' }}>
          <p>Note: To view a specific configuration in action, add this app to the corresponding dashboard.</p>
        </div>
      </div>
    </Card>
  );
};

export default ConfigurationList;