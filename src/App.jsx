import React, { useState, useCallback, useEffect } from 'react';
import {
  DataProvider,
  useConfig,
  useDataEngine
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

  // Get DHIS2 data engine for API calls
  const engine = useDataEngine();

  // Detect dashboard context using dashboardItemId
  useEffect(() => {
    const detectDashboardContext = async () => {
      console.log("Detecting dashboard context...");
      console.log("Current URL:", window.location.href);

      const urlParams = new URLSearchParams(window.location.search);

      // Check if we're in a dashboard item
      const dashboardItemId = urlParams.get('dashboardItemId');

      if (dashboardItemId) {
        console.log("Found dashboard item ID:", dashboardItemId);
        setAppLoading(true);

        try {
          // Fetch all dashboards with their items
          const result = await engine.query({
            dashboards: {
              resource: 'dashboards',
              params: {
                fields: 'id,name,dashboardItems[id,appKey]',
                paging: false
              }
            }
          });

          console.log("Fetched dashboards:", result.dashboards);

          // Find which dashboard contains our item
          let foundDashboardId = null;

          if (result.dashboards && result.dashboards.dashboards) {
            for (const dashboard of result.dashboards.dashboards) {
              if (dashboard.dashboardItems) {
                const matchingItem = dashboard.dashboardItems.find(
                  item => item.id === dashboardItemId && item.appKey === 'event-report-widget'
                );

                if (matchingItem) {
                  foundDashboardId = dashboard.id;
                  console.log(`Found matching dashboard: ${dashboard.name} (${dashboard.id})`);
                  break;
                }
              }
            }
          }

          if (foundDashboardId) {
            console.log("Setting dashboard ID to:", foundDashboardId);
            setCurrentDashboardId(foundDashboardId);
          } else {
            console.log("Dashboard not found, using default configuration");
            setCurrentDashboardId('default');
          }
        } catch (error) {
          console.error("Error fetching dashboards:", error);
          console.log("Using default configuration due to error");
          setCurrentDashboardId('default');
        } finally {
          setAppLoading(false);
        }
      } else {
        // If we're not in a dashboard item, use default
        console.log("Not in a dashboard context, using default configuration");
        setCurrentDashboardId('default');
      }
    };

    detectDashboardContext();
  }, [engine]);

  // Open configuration modal
  const openConfigModal = useCallback(() => {
    setIsConfigModalOpen(true);
  }, []);

  useEffect(() => {
    // Check if we're embedded in a dashboard
    const urlParams = new URLSearchParams(window.location.search);
    const isDashboardEmbedded = urlParams.has('dashboardItemId');
    
    if (isDashboardEmbedded) {
      // Create a style element to hide the header
      const styleElement = document.createElement('style');
      styleElement.textContent = `
        header.jsx-1294371968 {
          display: none !important;
        }
        
        /* Add more selectors if needed to hide other elements */
        .dhis2-header-bar {
          display: none;
        }
      `;
      
      // Add an ID to the style element so we can remove it later if needed
      styleElement.id = 'dashboard-embedded-styles';
      
      // Add the style element to the document head
      document.head.appendChild(styleElement);
      
      // Clean up function to remove the style when component unmounts
      return () => {
        const existingStyle = document.getElementById('dashboard-embedded-styles');
        if (existingStyle) {
          existingStyle.remove();
        }
      };
    }
  }, []);

  // Render configuration button (for users with config access)
  const renderConfigButtons = useCallback(() => {
    // Don't show the configure button in these cases:
    // 1. If user doesn't have config access
    // 2. If the app is embedded in a dashboard (dashboardItemId is present)

    if (!hasConfigAccess) return null;

    // Check if we're embedded in a dashboard by looking at URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const isDashboardEmbedded = urlParams.has('dashboardItemId');

    // Hide button when embedded in a dashboard
    if (isDashboardEmbedded) return null;

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
  if (authLoading || appLoading) {
    return <LoadingSpinner message={appLoading ? "Finding dashboard context..." : "Initializing application..."} />;
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
          {renderContent()}
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