import React, { useState, useCallback } from 'react';
import {
  DataProvider,
  useConfig
} from '@dhis2/app-runtime';
import {
  CssReset,
  CssVariables,
  TabBar,
  Tab,
  NoticeBox,
  Button,
  CircularLoader,
  Layer,
  Center
} from '@dhis2/ui';

// Import contexts
import { AuthProvider } from './contexts/AuthContext';
import { ConfigurationProvider } from './contexts/ConfigurationContext';

// Import components
import ErrorBoundary from './components/ErrorBoundary';
import EventReportViewer from './components/EventReportViewer';
import ConfigManager from './components/ConfigManager';
import DashboardConfigSelector from './components/DashboardConfigSelector';

// Import hooks
import { useAuthorization } from './hooks/useAuthorization';

/**
 * ConfigManagerModal Component
 * Wrapper for the ConfigManager to handle modal state
 */
const ConfigManagerModal = ({ isOpen, onClose, dashboardId }) => {
  if (!isOpen) return null;
  
  return (
    <ConfigManager 
      dashboardId={dashboardId}
      onClose={onClose} 
    />
  );
};

/**
 * DashboardConfigModal Component
 * Wrapper for the DashboardConfigSelector to handle modal state
 */
const DashboardConfigModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  
  return (
    <DashboardConfigSelector 
      onClose={onClose} 
    />
  );
};

/**
 * LoadingSpinner Component
 * Reusable loading indicator
 */
const LoadingSpinner = ({ message = 'Loading...' }) => (
  <Layer>
    <Center>
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <CircularLoader />
        <p style={{ marginTop: '1rem' }}>{message}</p>
      </div>
    </Center>
  </Layer>
);

/**
 * Main Application Component
 * Provides the core structure for the Event Reports Widget
 */
const App = () => {
  // State for managing active tab and modals
  const [activeTab, setActiveTab] = useState('viewer');
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isDashboardConfigModalOpen, setIsDashboardConfigModalOpen] = useState(false);
  const [currentDashboardId, setCurrentDashboardId] = useState(null);
  const [appLoading, setAppLoading] = useState(false);

  // Use authorization hook
  const { hasConfigAccess, isSuperUser, isLoading: authLoading } = useAuthorization();

  // Handle tab change
  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
  }, []);

  // Open configuration modal for a specific dashboard
  const openConfigModal = useCallback((dashboardId) => {
    setCurrentDashboardId(dashboardId);
    setIsConfigModalOpen(true);
  }, []);

  // Render configuration management buttons (for users with config access)
  const renderConfigButtons = useCallback(() => {
    if (!hasConfigAccess) return null;

    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        margin: '16px'
      }}>
        <Button 
          onClick={() => openConfigModal(currentDashboardId)}
          primary
        >
          Configure Widget
        </Button>
        {isSuperUser && (
          <Button 
            onClick={() => setIsDashboardConfigModalOpen(true)}
            secondary
            style={{ marginLeft: '16px' }}
          >
            Manage Dashboard Configs
          </Button>
        )}
      </div>
    );
  }, [hasConfigAccess, isSuperUser, currentDashboardId, openConfigModal]);

  // Render tab navigation
  const renderTabNavigation = useCallback(() => {
    return (
      <TabBar>
        <Tab
          key="viewer"
          selected={activeTab === 'viewer'}
          onClick={() => handleTabChange('viewer')}
        >
          Event Reports
        </Tab>
        {hasConfigAccess && (
          <Tab
            key="config"
            selected={activeTab === 'config'}
            onClick={() => handleTabChange('config')}
          >
            Configuration
          </Tab>
        )}
      </TabBar>
    );
  }, [activeTab, hasConfigAccess, handleTabChange]);

  // Render active tab content
  const renderActiveTabContent = useCallback(() => {
    switch (activeTab) {
      case 'viewer':
        return <EventReportViewer dashboardId={currentDashboardId} />;
      case 'config':
        return hasConfigAccess ? <ConfigManager dashboardId={currentDashboardId} /> : null;
      default:
        return null;
    }
  }, [activeTab, hasConfigAccess, currentDashboardId]);

  // Show loading while authorization is being checked
  if (authLoading) {
    return <LoadingSpinner message="Initializing application..." />;
  }

  return (
    <ErrorBoundary>
      <div className="app-container" style={{ padding: '16px' }}>
        {/* Configuration Buttons */}
        {renderConfigButtons()}

        {/* Tab Navigation */}
        {renderTabNavigation()}

        {/* Active Tab Content with Error Boundary */}
        <ErrorBoundary>
          {appLoading ? (
            <LoadingSpinner />
          ) : (
            renderActiveTabContent()
          )}
        </ErrorBoundary>

        {/* Configuration Modal */}
        <ConfigManagerModal 
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          dashboardId={currentDashboardId}
        />

        {/* Dashboard Configuration Modal */}
        <DashboardConfigModal 
          isOpen={isDashboardConfigModalOpen}
          onClose={() => setIsDashboardConfigModalOpen(false)}
        />
      </div>
    </ErrorBoundary>
  );
};

/**
 * AppProvider Component
 * Wraps the main App with necessary providers
 */
const AppProvider = () => {
  return (
    <DataProvider>
      <ErrorBoundary>
        <AuthProvider>
          <ConfigurationProvider>
            <CssReset />
            <CssVariables colors spacers />
            <App />
          </ConfigurationProvider>
        </AuthProvider>
      </ErrorBoundary>
    </DataProvider>
  );
};

export default AppProvider;