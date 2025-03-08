import React, { useState, useCallback, useEffect } from 'react';
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
import UnifiedConfigManager from './components/UnifiedConfigManager';

// Import hooks
import { useAuthorization } from './hooks/useAuthorization';

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
  // State for managing configuration modal and current dashboard
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [currentDashboardId, setCurrentDashboardId] = useState(null);
  const [appLoading, setAppLoading] = useState(false);

  // Use authorization hook
  const { hasConfigAccess, isSuperUser, isLoading: authLoading } = useAuthorization();

 // Try to get the dashboard ID from URL or context
 useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const dashboardId = urlParams.get('dashboardId');
    
    if (dashboardId) {
      setCurrentDashboardId(dashboardId);
    } else {
      // Set to null to indicate we're not in a dashboard context
      setCurrentDashboardId(null);
    }
  }, []);

  // Open configuration modal
  const openConfigModal = useCallback(() => {
    setIsConfigModalOpen(true);
  }, []);

  // Render configuration button (for users with config access)
  const renderConfigButtons = useCallback(() => {
    if (!hasConfigAccess) return null;

    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        margin: '16px'
      }}>
        <Button 
          onClick={openConfigModal}
          primary
        >
          Configure Widget
        </Button>
      </div>
    );
  }, [hasConfigAccess, openConfigModal]);

  // Render tab navigation - only the Event Reports tab
  const renderTabNavigation = useCallback(() => {
    return (
      <TabBar>
        <Tab
          key="viewer"
          selected={true}
        >
          Event Reports
        </Tab>
      </TabBar>
    );
  }, []);

  // Render content - Event Report Viewer
  const renderContent = useCallback(() => {
    return <EventReportViewer dashboardId={currentDashboardId} />;
  }, [currentDashboardId]);

  // Show loading while authorization is being checked
  if (authLoading) {
    return <LoadingSpinner message="Initializing application..." />;
  }

  return (
    <ErrorBoundary>
      <div className="app-container" style={{ padding: '16px' }}>
        {/* Configuration Button */}
        {renderConfigButtons()}

        {/* Tab Navigation */}
        {renderTabNavigation()}

        {/* Content with Error Boundary */}
        <ErrorBoundary>
          {appLoading ? (
            <LoadingSpinner />
          ) : (
            renderContent()
          )}
        </ErrorBoundary>

        {/* Unified Configuration Modal */}
        <UnifiedConfigManager 
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          dashboardId={currentDashboardId}
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