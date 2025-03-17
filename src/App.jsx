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

  // Detect dashboard context and set the current dashboard ID
  useEffect(() => {
    let dashboardChangeInterval = null;
    let previousLocation = '';

    const detectDashboardContext = async () => {
      console.log("Detecting dashboard context...");
      console.log("Current URL:", window.location.href);

      // First, try to detect if we're in a frame/embedded context
      const isFramed = window !== window.parent;
      const urlParams = new URLSearchParams(window.location.search);
      const hasPluginParam = window.location.href.includes('plugin.html');
      const isEmbedded = isFramed || hasPluginParam;

      console.log("Is embedded/framed:", isEmbedded);

      // Set the embedded state
      setIsDashboardEmbedded(isEmbedded);

      if (isEmbedded) {
        console.log("App is embedded in a dashboard");
        setAppLoading(true);

        // Function to identify the current dashboard
        const identifyCurrentDashboard = async () => {
          // Try different methods to detect dashboard ID
          let dashboardId = null;

          // Check if we have a stored dashboard ID in sessionStorage
          // (useful for cross-frame communication)
          const storedDashboardId = sessionStorage.getItem('current_dashboard_id');
          if (storedDashboardId) {
            console.log("Found dashboard ID in sessionStorage:", storedDashboardId);
            dashboardId = storedDashboardId;
          }

          // Method 1: Check URL parameters
          if (!dashboardId) {
            const dashboardParamId = urlParams.get('dashboardId');
            if (dashboardParamId) {
              console.log("Found dashboard ID in URL parameters:", dashboardParamId);
              dashboardId = dashboardParamId;
              // Store for future reference
              sessionStorage.setItem('current_dashboard_id', dashboardId);
            }
          }

          // Method 2: Try to extract from referrer URL
          if (!dashboardId && document.referrer) {
            console.log("Checking referrer URL:", document.referrer);
            try {
              const referrerUrl = new URL(document.referrer);
              const referrerParams = new URLSearchParams(referrerUrl.search);
              let referrerDashboardId = referrerParams.get('id');

              // Try different parameter names that DHIS2 might use
              if (!referrerDashboardId) {
                referrerDashboardId = referrerParams.get('dashboard');
              }

              // Check if we're in the dashboard app
              if (referrerDashboardId &&
                (referrerUrl.pathname.includes('dhis-web-dashboard') ||
                  referrerUrl.pathname.includes('/dashboard'))) {
                console.log("Found dashboard ID in referrer:", referrerDashboardId);
                dashboardId = referrerDashboardId;
                // Store for future reference
                sessionStorage.setItem('current_dashboard_id', dashboardId);
              }
            } catch (error) {
              console.log("Error processing referrer URL:", error);
            }
          }

          // Method 3: Try to communicate with parent frame (if we're in an iframe)
          if (!dashboardId && isFramed) {
            console.log("Attempting to communicate with parent frame");
            try {
              // Set up a listener for dashboard context messages
              const messagePromise = new Promise((resolve) => {
                const handleMessage = (event) => {
                  // Process messages from parent frame
                  if (event.data && event.data.type === 'DASHBOARD_CONTEXT') {
                    console.log("Received dashboard context from parent:", event.data);
                    resolve(event.data.dashboardId);

                    // Store for future reference
                    if (event.data.dashboardId) {
                      sessionStorage.setItem('current_dashboard_id', event.data.dashboardId);
                    }
                  }
                };

                // Add the event listener
                window.addEventListener('message', handleMessage, false);

                // Post a message to parent asking for dashboard ID
                window.parent.postMessage({
                  type: 'GET_DASHBOARD_CONTEXT',
                  appName: 'event-report-widget'
                }, '*');

                // Timeout after 500ms
                setTimeout(() => {
                  window.removeEventListener('message', handleMessage);
                  resolve(null);
                }, 500);
              });

              const messageDashboardId = await messagePromise;
              if (messageDashboardId) {
                console.log("Received dashboard ID from parent frame:", messageDashboardId);
                dashboardId = messageDashboardId;
              }
            } catch (error) {
              console.log("Error communicating with parent frame:", error);
            }
          }

          // Method 4: Extract dashboard ID from parent URL hash fragment
          if (!dashboardId && isFramed) {
            try {
              // Try to access the parent location
              const parentUrl = window.parent.location.href;
              console.log("Parent URL:", parentUrl);

              // Check for hash-based dashboard URL (/#/dashboardId pattern)
              if (parentUrl.includes('/#/')) {
                // Extract dashboard ID from hash fragment
                const hashParts = parentUrl.split('/#/');
                if (hashParts.length > 1) {
                  // Get the part after #/ which should be the dashboard ID
                  // It might have additional segments or query parameters, so take just the ID part
                  let potentialId = hashParts[1].split('/')[0].split('?')[0];

                  console.log("Extracted potential dashboard ID from hash:", potentialId);

                  // Validate this is a dashboard ID by checking if it's one of our known dashboards
                  const possibleDashboards = JSON.parse(sessionStorage.getItem('possible_dashboards') || '[]');
                  const matchingDashboard = possibleDashboards.find(d => d.id === potentialId);

                  if (matchingDashboard) {
                    console.log("Confirmed dashboard ID from hash:", potentialId);
                    dashboardId = potentialId;
                    sessionStorage.setItem('current_dashboard_id', dashboardId);
                  }
                }
              }
              // Also try the traditional URL parameter approach as a fallback
              else {
                const parentUrlObj = new URL(parentUrl);
                const parentParams = new URLSearchParams(parentUrlObj.search);
                const parentDashboardId = parentParams.get('id') || parentParams.get('dashboard');

                if (parentDashboardId) {
                  console.log("Found dashboard ID in parent URL parameters:", parentDashboardId);
                  dashboardId = parentDashboardId;
                  sessionStorage.setItem('current_dashboard_id', dashboardId);
                }
              }
            } catch (error) {
              // This is expected if the parent is from a different origin
              console.log("Could not access parent URL due to same-origin policy");
            }
          }

          // Method 5: If we still can't find the dashboard ID, fetch all dashboards 
          // and find the one that has this app
          if (!dashboardId) {
            console.log("Attempting to find dashboard ID by fetching all dashboards");

            try {
              // Fetch all dashboards with their items
              const result = await engine.query({
                dashboards: {
                  resource: 'dashboards',
                  params: {
                    fields: 'id,name,dashboardItems[id,type,appKey,appUrl]',
                    paging: false
                  }
                }
              });

              console.log("Fetched dashboards:", result.dashboards);

              if (result.dashboards && result.dashboards.dashboards) {
                // Try to guess which dashboard is currently being viewed

                // First look for dashboards that have this app embedded
                const dashboardsWithApp = [];

                for (const dashboard of result.dashboards.dashboards) {
                  if (dashboard.dashboardItems) {
                    // Look for any item that might be our app
                    const appItem = dashboard.dashboardItems.find(item => {
                      return (
                        (item.type === 'APP' && item.appKey === 'event-report-widget') ||
                        (item.appUrl && item.appUrl.includes('event-report-widget'))
                      );
                    });

                    if (appItem) {
                      console.log(`Found dashboard with our app: ${dashboard.name} (${dashboard.id})`);
                      dashboardsWithApp.push(dashboard);
                    }
                  }
                }

                // If we found multiple dashboards with our app, try to determine which one is active
                if (dashboardsWithApp.length > 0) {
                  // For now, just use the first one, but we'll set up a dashboard change detector
                  console.log(`Found ${dashboardsWithApp.length} dashboards with our app, using first one for now`);
                  dashboardId = dashboardsWithApp[0].id;

                  // Store all possible dashboards for our app in sessionStorage for later reference
                  sessionStorage.setItem('possible_dashboards', JSON.stringify(
                    dashboardsWithApp.map(d => ({ id: d.id, name: d.name }))
                  ));
                }
              }
            } catch (error) {
              console.error("Error fetching dashboards:", error);
            }
          }

          return dashboardId;
        };

        // Identify the current dashboard
        const dashboardId = await identifyCurrentDashboard();

        // Set the dashboard ID or fallback to default
        if (dashboardId) {
          console.log("Setting dashboard ID to:", dashboardId);
          setCurrentDashboardId(dashboardId);
        } else {
          console.log("Could not determine dashboard ID, using default configuration");
          setCurrentDashboardId('default');
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

        // Set up poller to detect dashboard changes if we're embedded
        if (isFramed) {
          // Store the current location/URL
          previousLocation = document.referrer;

          // Set up interval to check for dashboard changes

          dashboardChangeInterval = setInterval(async () => {
            try {
              // Get the list of possible dashboards
              const possibleDashboardsJSON = sessionStorage.getItem('possible_dashboards');
              if (!possibleDashboardsJSON) return;

              const possibleDashboards = JSON.parse(possibleDashboardsJSON);
              if (!possibleDashboards || possibleDashboards.length <= 1) return;

              // Get current parent location
              let currentLocation = '';
              try {
                currentLocation = window.parent.location.href;
              } catch (err) {
                // Can't access parent location due to same-origin policy
                currentLocation = document.referrer;
                // If we can't access the parent URL, we can't detect changes
                if (!currentLocation || currentLocation === previousLocation) return;
              }

              // Skip if location hasn't changed since last check
              if (currentLocation === previousLocation) return;

              console.log("Detected parent location change:", currentLocation);
              previousLocation = currentLocation;

              // Check for hash-based dashboard navigation (#/dashboardId pattern)
              if (currentLocation.includes('/#/')) {
                const hashParts = currentLocation.split('/#/');
                if (hashParts.length > 1) {
                  // Extract the dashboard ID from the URL
                  const newDashboardId = hashParts[1].split('/')[0].split('?')[0];

                  // Verify this is a valid dashboard from our possible list
                  const matchingDashboard = possibleDashboards.find(d => d.id === newDashboardId);

                  if (matchingDashboard) {
                    console.log("Detected dashboard change to:", matchingDashboard.name, "(", newDashboardId, ")");

                    // Update dashboard ID if it changed
                    if (newDashboardId !== currentDashboardId) {
                      console.log("Updating current dashboard ID to:", newDashboardId);
                      setCurrentDashboardId(newDashboardId);
                      sessionStorage.setItem('current_dashboard_id', newDashboardId);
                    }
                  }
                }
              }
            } catch (error) {
              console.log("Error in dashboard change detector:", error);
            }
          }, 5000); // Check every 5 seconds instead of every second
        }

        setAppLoading(false);
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

      // Clear the interval for dashboard change detection
      if (dashboardChangeInterval) {
        clearInterval(dashboardChangeInterval);
      }

      // Remove any event listeners
      window.removeEventListener('message', () => { });
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