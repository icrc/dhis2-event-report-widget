import React, { createContext, useState, useContext, useEffect } from 'react';
import { useDataMutation } from '@dhis2/app-runtime';
import { useAuth } from './AuthContext';

/**
 * Configuration Context for managing app configurations
 */
const ConfigurationContext = createContext({
  globalConfig: {},
  dashboardConfigs: {},
  setGlobalConfig: () => {},
  updateDashboardConfig: () => {},
  resetConfiguration: () => {},
  isConfigValid: () => false,
  canModifyConfiguration: () => false
});

// Define namespaces for data store
const NAMESPACE = 'EVENT_REPORT_WIDGET';
const GLOBAL_CONFIG_KEY = 'globalConfig';
const DASHBOARD_CONFIGS_KEY = 'dashboardConfigs';

/**
 * ConfigurationProvider component to manage application configurations
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export const ConfigurationProvider = ({ children }) => {
  // Use authentication context
  const { hasConfigAccess, isSuperUser } = useAuth();
  
  // State for managing configurations
  const [globalConfig, setGlobalConfig] = useState({
    theme: 'default',
    language: 'en',
    pageSize: 10,
    refreshInterval: 0
  });
  
  const [dashboardConfigs, setDashboardConfigs] = useState({});
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

  const [createNamespace] = useDataMutation({
    resource: `dataStore/${NAMESPACE}`,
    type: 'create',
    data: ({data}) => data
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
        // Try to create namespace first (might fail if already exists)
        try {
          await createNamespace({ data: {} });
        } catch (namespaceError) {
          // Ignore if namespace already exists
          console.log('Namespace creation error (might already exist):', namespaceError);
        }

        // Load global configuration
        try {
          const globalResult = await readGlobalConfig();
          setGlobalConfig(prev => ({ ...prev, ...globalResult }));
        } catch (globalError) {
          console.log('Global config error:', globalError);
          // If not found, create with defaults
          if (globalError.httpStatusCode === 404) {
            const defaultConfig = {
              theme: 'default',
              language: 'en',
              pageSize: 10,
              refreshInterval: 0
            };
            await createGlobalConfig({ data: defaultConfig });
            setGlobalConfig(defaultConfig);
          } else {
            console.error('Error fetching global config:', globalError);
          }
        }
        
        // Load dashboard configurations
        try {
          const dashboardResult = await readDashboardConfigs();
          setDashboardConfigs(dashboardResult || {});
        } catch (dashboardError) {
          console.log('Dashboard config error:', dashboardError);
          // If not found, create with defaults
          if (dashboardError.httpStatusCode === 404) {
            await createDashboardConfigs({ data: {} });
            setDashboardConfigs({});
          } else {
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
  }, [createNamespace, readGlobalConfig, readDashboardConfigs, createGlobalConfig, createDashboardConfigs]);

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
        ...globalConfig,
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
      const updatedConfigs = {
        ...dashboardConfigs,
        [dashboardId]: {
          ...(dashboardConfigs[dashboardId] || {}),
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
          await updateGlobalConfig({ data: defaultGlobalConfig });
          setGlobalConfig(defaultGlobalConfig);
          break;
        
        case 'dashboards':
          await updateDashboardConfigs({ data: {} });
          setDashboardConfigs({});
          break;
        
        default:
          // Reset everything
          await updateGlobalConfig({ 
            data: {
              theme: 'default',
              language: 'en',
              pageSize: 10,
              refreshInterval: 0
            } 
          });
          await updateDashboardConfigs({ data: {} });
          
          setGlobalConfig({
            theme: 'default',
            language: 'en',
            pageSize: 10,
            refreshInterval: 0
          });
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
      globalConfig.pageSize > 0 && 
      globalConfig.pageSize <= 100 &&
      globalConfig.refreshInterval >= 0
    );
  };

  // Context value with configurations and methods
  const contextValue = {
    globalConfig,
    dashboardConfigs,
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