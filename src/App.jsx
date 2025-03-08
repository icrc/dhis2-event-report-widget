import React, { useState, useCallback, useEffect } from 'react';
import {
  DataProvider,
  useConfig,
  useDataEngine
} from '@dhis2/app-runtime';
import {
  CssReset,
  CssVariables,
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
import ConfigurationList from './components/ConfigurationList';
import DataStoreInitializer from './components/DataStoreInitializer';

// Import hooks
import { useAuthorization } from './hooks/useAuthorization';
import { useDataStore } from './hooks/useDataStore';

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
  const [isDashboardEmbedded, setIsDashboardEmbedded] = useState(false);
  const [configListKey, setConfigListKey] = useState(0);
  const [refreshTimestamp, setRefreshTimestamp] = useState(Date.now());

  // Use authorization hook
  const { hasConfigAccess, isSuperUser, isLoading: authLoading } = useAuthorization();
  
  // Get DHIS2 data engine for API calls
  const engine = useDataEngine();
  
  // Get the refresh function from useDataStore
  const { refreshConfigurations } = useDataStore();
  
  // Detect dashboard context using dashboardItemId
  useEffect(() => {
    const detectDashboardContext = async () => {
      console.log("Detecting dashboard context...");
      console.log("Current URL:", window.location.href);
      
      const urlParams = new URLSearchParams(window.location.search);
      
      // Check if we're in a dashboard item
      const dashboardItemId = urlParams.get('dashboardItemId');
      const isEmbedded = !!dashboardItemId;
      
      // Set the embedded state
      setIsDashboardEmbedded(isEmbedded);
      
      if (isEmbedded) {
        console.log("App is embedded in a dashboard");
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
        
        // Hide the DHIS2 header when embedded
        const styleElement = document.createElement('style');
        styleElement.textContent = `
          header.jsx-1294371968 {
            display: none;
          }
          
          .dhis2-header-bar {
            display: none;
          }
        `;
        styleElement.id = 'dashboard-embedded-styles';
        document.head.appendChild(styleElement);
        
      } else {
        // If we're not in a dashboard item, use default
        console.log("Not in a dashboard context, using default configuration");
        setCurrentDashboardId('default');
      }
    };
    
    detectDashboardContext();
    
    // Cleanup function
    return () => {
      const existingStyle = document.getElementById('dashboard-embedded-styles');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, [engine]);

  // Open configuration modal
  const openConfigModal = useCallback(() => {
    setIsConfigModalOpen(true);
  }, []);
  
  // Close configuration modal and refresh config list using multiple approaches
  const handleConfigModalClose = useCallback(() => {
    setIsConfigModalOpen(false);
    
    console.log("Closing config modal, triggering refresh...");
    
    // Approach 1: Force component remount with key change
    setConfigListKey(prev => prev + 1);
    
    // Approach 2: Update timestamp to trigger effect dependencies
    setRefreshTimestamp(Date.now());
    
    // Approach 3: Directly call refresh function from useDataStore
    if (refreshConfigurations) {
      refreshConfigurations();
    }
  }, [refreshConfigurations]);
  
  // Render configuration button (for users with config access)
  const renderConfigButtons = useCallback(() => {
    // Don't show the configure button if:
    // 1. User doesn't have config access, or
    // 2. App is embedded in a dashboard
    if (!hasConfigAccess || isDashboardEmbedded) return null;

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
  }, [hasConfigAccess, openConfigModal, isDashboardEmbedded]);

  // Render content
  const renderContent = useCallback(() => {
    // When not embedded, show configuration list
    if (!isDashboardEmbedded) {
      return (
        <ConfigurationList
          key={configListKey} // Force remount when key changes
          openConfigModal={openConfigModal}
          currentDashboardId={currentDashboardId}
          hasConfigAccess={hasConfigAccess}
          refreshTimestamp={refreshTimestamp} // Pass timestamp for refresh trigger
        />
      );
    }
    
    // When embedded, show the report viewer
    return <EventReportViewer dashboardId={currentDashboardId} />;
  }, [
    currentDashboardId, 
    isDashboardEmbedded, 
    openConfigModal, 
    hasConfigAccess,
    configListKey, 
    refreshTimestamp
  ]);

  // Show loading while authorization is being checked
  if (authLoading || appLoading) {
    return <LoadingSpinner message={appLoading ? "Finding dashboard context..." : "Initializing application..."} />;
  }

  return (
    <ErrorBoundary>
      {/* Add the DataStoreInitializer */}
      <DataStoreInitializer />
      
      <div className="app-container" style={{ padding: '16px' }}>
        {/* Configuration Button */}
        {renderConfigButtons()}

        {/* Content with Error Boundary */}
        <ErrorBoundary>
          {renderContent()}
        </ErrorBoundary>

        {/* Unified Configuration Modal */}
        <UnifiedConfigManager 
          isOpen={isConfigModalOpen}
          onClose={handleConfigModalClose}
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