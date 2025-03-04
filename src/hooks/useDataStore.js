import { useState, useCallback, useEffect } from 'react';
import { useDataMutation } from '@dhis2/app-runtime';

/**
 * Custom hook for managing DHIS2 Data Store interactions
 * Assumes the namespace already exists (created manually)
 * 
 * @returns {Object} Data store methods and state
 */
const useDataStore = () => {
  // Namespace for storing configurations
  const NAMESPACE = 'EVENT_REPORT_WIDGET_CONFIGS';
  const CONFIG_KEY = 'dashboardConfigurations';

  // State to manage loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [configurations, setConfigurations] = useState({});

  // Define static dataStore mutations
  const [readConfig] = useDataMutation({
    resource: `dataStore/${NAMESPACE}/${CONFIG_KEY}`,
    type: 'read'
  });

  const [createConfig] = useDataMutation({
    resource: `dataStore/${NAMESPACE}/${CONFIG_KEY}`,
    type: 'create',
    data: ({ config }) => config
  });

  const [updateConfig] = useDataMutation({
    resource: `dataStore/${NAMESPACE}/${CONFIG_KEY}`,
    type: 'update',
    data: ({ config }) => config
  });

  const [deleteKey] = useDataMutation({
    resource: `dataStore/${NAMESPACE}/${CONFIG_KEY}`,
    type: 'delete'
  });

  // Load configurations on initial render
  useEffect(() => {
    const loadConfigurations = async () => {
      setLoading(true);
      setError(null);

      try {
        // Try to read configuration
        const configData = await readConfig();
        setConfigurations(configData || {});
        setLoading(false);
      } catch (error) {
        console.log('Error reading configuration:', error);
        
        // If key doesn't exist, create empty configuration
        if (error.httpStatusCode === 404) {
          try {
            console.log('Creating initial configuration');
            const defaultConfig = {};
            await createConfig({ config: defaultConfig });
            setConfigurations(defaultConfig);
            setLoading(false);
          } catch (createError) {
            console.error('Error creating configuration:', createError);
            setError(createError);
            setLoading(false);
          }
        } else {
          console.error('Unexpected error:', error);
          setError(error);
          setLoading(false);
        }
      }
    };

    loadConfigurations();
  }, [readConfig, createConfig]);

  /**
   * Save configuration to Data Store
   * @param {string} key - Configuration key (e.g., dashboard ID)
   * @param {Object} configuration - Configuration to save
   * @param {boolean} [encrypt=false] - Whether to encrypt the data
   * @returns {Promise<Object>} Updated configuration
   */
  const saveConfiguration = useCallback(async (key, configuration, encrypt = false) => {
    setLoading(true);
    setError(null);

    try {
      // Update local copy
      const updatedConfigs = {
        ...configurations,
        [key]: {
          ...configuration,
          lastModified: new Date().toISOString()
        }
      };

      // Update in data store
      const params = encrypt ? { encrypt: true } : {};
      await updateConfig({ config: updatedConfigs, params });
      
      // Update state
      setConfigurations(updatedConfigs);
      setLoading(false);
      return updatedConfigs;
    } catch (error) {
      console.error('Error saving configuration:', error);
      
      // If key doesn't exist, try to create it
      if (error.httpStatusCode === 404) {
        try {
          const newConfigs = { 
            [key]: {
              ...configuration,
              lastModified: new Date().toISOString()
            }
          };
          
          const params = encrypt ? { encrypt: true } : {};
          await createConfig({ config: newConfigs, params });
          
          // Update state
          setConfigurations(newConfigs);
          setLoading(false);
          return newConfigs;
        } catch (createError) {
          console.error('Error creating configuration:', createError);
          setError(createError);
          setLoading(false);
          throw createError;
        }
      } else {
        setError(error);
        setLoading(false);
        throw error;
      }
    }
  }, [configurations, updateConfig, createConfig]);

  /**
   * Get configuration for a specific key
   * @param {string} key - Configuration key (e.g., dashboard ID)
   * @returns {Object|null} Configuration for the key
   */
  const getConfiguration = useCallback((key) => {
    return configurations[key] || null;
  }, [configurations]);

  /**
   * Get dashboard configuration (alias for getConfiguration)
   * @param {string} dashboardId - Dashboard ID
   * @returns {Object|null} Dashboard configuration
   */
  const getDashboardConfiguration = useCallback((dashboardId) => {
    return getConfiguration(dashboardId);
  }, [getConfiguration]);

  /**
   * Delete a specific configuration
   * @param {string} key - Configuration key to delete
   * @returns {Promise<Object>} Updated configurations
   */
  const deleteConfiguration = useCallback(async (key) => {
    setLoading(true);
    setError(null);

    try {
      // Create a copy without the specified key
      const { [key]: removed, ...remainingConfigs } = configurations;

      // Update in data store
      await updateConfig({ config: remainingConfigs });
      
      // Update state
      setConfigurations(remainingConfigs);
      setLoading(false);
      return remainingConfigs;
    } catch (error) {
      console.error('Error deleting configuration:', error);
      setError(error);
      setLoading(false);
      throw error;
    }
  }, [configurations, updateConfig]);

  /**
   * Clear all configurations
   * @returns {Promise<void>}
   */
  const clearAllConfigurations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Set empty object instead of deleting key
      await updateConfig({ config: {} });
      setConfigurations({});
      setLoading(false);
    } catch (error) {
      console.error('Error clearing all configurations:', error);
      setError(error);
      setLoading(false);
      throw error;
    }
  }, [updateConfig]);

  return {
    configurations,
    loading,
    error,
    saveConfiguration,
    getConfiguration,
    getDashboardConfiguration,
    deleteConfiguration,
    clearAllConfigurations
  };
};

export { useDataStore };