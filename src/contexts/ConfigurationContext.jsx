import React, { createContext, useState, useContext, useEffect } from 'react';
import { useDataMutation } from '@dhis2/app-runtime';
import { useAuth } from './AuthContext';

/**
 * Configuration Context for managing app configurations
 */
const ConfigurationContext = createContext({
  globalConfiguration: {},
  dashboardConfigurations: {},
  setGlobalConfig: () => {},
  updateDashboardConfig: () => {},
  resetConfiguration: () => {},
  isConfigValid: () => false,
  canModifyConfiguration: () => false
});

// Define namespaces for data store
const NAMESPACE = 'EVENT_REPORT_WIDGET';
const GLOBAL_CONFIG_KEY = 'globalConfiguration';
const DASHBOARD_CONFIGS_KEY = 'dashboardConfigurations';

/**
 * ConfigurationProvider component to manage application configurations
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export const ConfigurationProvider = ({ children }) => {
  // Use authentication context
  const { hasConfigAccess, isSuperUser } = useAuth();
  
  // State for managing configurations
  const [globalConfiguration, setGlobalConfig] = useState({
    theme: 'default',
    language: 'en',
    pageSize: 10,
    refreshInterval: 0
  });
  
  const [dashboardConfigurations, setDashboardConfigs] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Define data mutations outside of any functions
  const [readGlobalConfig] = useDataMutation({
    resource: `dataStore/${NAMESPACE}/${GLOBAL_CONFIG_KEY}`,
    type: 'read'
  });

  const [readDashboardConfigs] = useDataMutation({
    resource: `dataStore/${NAMESPACE}/${DASHBOARD_CONFIGS_KEY}`,
    type: 'read'
  });

  const [updateGlobalConfig] = useDataMutation({
    resource: `dataStore/${NAMESPACE}/${GLOBAL_CONFIG_KEY}`,
    type: 'update',
    data: ({data}) => data
  });

  const [createGlobalConfig] = useDataMutation({
    resource: `dataStore/${NAMESPACE}/${GLOBAL_CONFIG_KEY}`,
    type: 'create',
    data: ({data}) => data
  });

  const [updateDashboardConfigs] = useDataMutation({
    resource: `dataStore/${NAMESPACE}/${DASHBOARD_CONFIGS_KEY}`,
    type: 'update',
    data: ({data}) => data
  });

  const [createDashboardConfigs] = useDataMutation({
    resource: `dataStore/${NAMESPACE}/${DASHBOARD_CONFIGS_KEY}`,
    type: 'create',
    data: ({data}) => data
  });

  // Load configurations on component mount
  useEffect(() => {
    const loadConfigurations = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Load global configuration
        try {
          const globalResult = await readGlobalConfig();
          setGlobalConfig(prev => ({ ...prev, ...globalResult }));
        } catch (globalError) {
          console.log('Global config error:', globalError);
          // If not found, we'll use defaults (already set in state)
          if (globalError.httpStatusCode !== 404) {
            console.error('Error fetching global config:', globalError);
          }
        }
        
        // Load dashboard configurations
        try {
          const dashboardResult = await readDashboardConfigs();
          setDashboardConfigs(dashboardResult || {});
        } catch (dashboardError) {
          console.log('Dashboard config error:', dashboardError);
          // If not found, we'll use an empty object (already set in state)
          if (dashboardError.httpStatusCode !== 404) {
            console.error('Error fetching dashboard configs:', dashboardError);
          }
        }
      } catch (error) {
        setError(error);
        console.error('Error loading configurations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadConfigurations();
  }, [readGlobalConfig, readDashboardConfigs]);

  /**
   * Update global configuration
   * @param {Object} newConfig - Configuration to update
   */
  const handleUpdateGlobalConfig = async (newConfig) => {
    if (!hasConfigAccess) {
      console.warn('Insufficient permissions to modify configuration');
      return;
    }

    try {
      const updatedConfig = {
        ...globalConfiguration,
        ...newConfig,
        lastModified: new Date().toISOString()
      };

      // Try update first
      try {
        await updateGlobalConfig({ data: updatedConfig });
      } catch (updateError) {
        // If update fails, try create
        if (updateError.httpStatusCode === 404) {
          await createGlobalConfig({ data: updatedConfig });
        } else {
          throw updateError;
        }
      }
      
      setGlobalConfig(updatedConfig);
    } catch (error) {
      console.error('Error updating global configuration:', error);
      setError(error);
    }
  };

  /**
   * Update dashboard-specific configuration
   * @param {string} dashboardId - Dashboard unique identifier
   * @param {Object} config - Configuration for the dashboard
   */
  const handleUpdateDashboardConfig = async (dashboardId, config) => {
    if (!hasConfigAccess) {
      console.warn('Insufficient permissions to modify configuration');
      return;
    }

    try {
      // Get current configurations to avoid overwriting other dashboards
      let currentConfigs = { ...dashboardConfigurations };
      
      const updatedConfigs = {
        ...currentConfigs,
        [dashboardId]: {
          ...(currentConfigs[dashboardId] || {}),
          ...config,
          lastModified: new Date().toISOString()
        }
      };

      // Try update first
      try {
        await updateDashboardConfigs({ data: updatedConfigs });
      } catch (updateError) {
        // If update fails, try create
        if (updateError.httpStatusCode === 404) {
          await createDashboardConfigs({ data: updatedConfigs });
        } else {
          throw updateError;
        }
      }
      
      setDashboardConfigs(updatedConfigs);
    } catch (error) {
      console.error('Error updating dashboard configuration:', error);
      setError(error);
    }
  };

  /**
   * Reset configuration to default state
   * @param {string} [type] - Type of configuration to reset
   */
  const resetConfiguration = async (type) => {
    if (!isSuperUser) {
      console.warn('Only super users can reset configurations');
      return;
    }

    try {
      switch (type) {
        case 'global':
          const defaultGlobalConfig = {
            theme: 'default',
            language: 'en',
            pageSize: 10,
            refreshInterval: 0
          };
          
          try {
            await updateGlobalConfig({ data: defaultGlobalConfig });
          } catch (updateError) {
            if (updateError.httpStatusCode === 404) {
              await createGlobalConfig({ data: defaultGlobalConfig });
            } else {
              throw updateError;
            }
          }
          
          setGlobalConfig(defaultGlobalConfig);
          break;
        
        case 'dashboards':
          try {
            await updateDashboardConfigs({ data: {} });
          } catch (updateError) {
            if (updateError.httpStatusCode === 404) {
              await createDashboardConfigs({ data: {} });
            } else {
              throw updateError;
            }
          }
          
          setDashboardConfigs({});
          break;
        
        default:
          // Reset everything
          const defaultConfig = {
            theme: 'default',
            language: 'en',
            pageSize: 10,
            refreshInterval: 0
          };
          
          try {
            await updateGlobalConfig({ data: defaultConfig });
          } catch (updateError) {
            if (updateError.httpStatusCode === 404) {
              await createGlobalConfig({ data: defaultConfig });
            } else {
              throw updateError;
            }
          }
          
          try {
            await updateDashboardConfigs({ data: {} });
          } catch (updateError) {
            if (updateError.httpStatusCode === 404) {
              await createDashboardConfigs({ data: {} });
            } else {
              throw updateError;
            }
          }
          
          setGlobalConfig(defaultConfig);
          setDashboardConfigs({});
      }
    } catch (error) {
      console.error('Error resetting configuration:', error);
      setError(error);
    }
  };

  /**
   * Validate current configuration
   * @returns {boolean} - Whether configuration is valid
   */
  const isConfigValid = () => {
    // Add specific validation logic
    return (
      globalConfiguration.pageSize > 0 && 
      globalConfiguration.pageSize <= 100 &&
      globalConfiguration.refreshInterval >= 0
    );
  };

  // Context value with configurations and methods
  const contextValue = {
    globalConfiguration,
    dashboardConfigurations,
    isLoading,
    error,
    
    setGlobalConfig: handleUpdateGlobalConfig,
    updateDashboardConfig: handleUpdateDashboardConfig,
    resetConfiguration,
    
    isConfigValid,
    canModifyConfiguration: hasConfigAccess
  };

  return (
    <ConfigurationContext.Provider value={contextValue}>
      {children}
    </ConfigurationContext.Provider>
  );
};

/**
 * Custom hook to use configuration context
 * @returns {Object} - Configuration context
 */
export const useConfiguration = () => {
  const context = useContext(ConfigurationContext);
  
  if (!context) {
    throw new Error('useConfiguration must be used within a ConfigurationProvider');
  }
  
  return context;
};