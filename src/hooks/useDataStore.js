import { useState, useCallback, useEffect } from "react";
import { useDataQuery, useDataMutation, useDataEngine } from "@dhis2/app-runtime";

/**
 * Default columns to hide in the event report view
 */
const DEFAULT_HIDDEN_COLUMNS = [
  "Event",
  "Program stage",
  "Stored by",
  "Created by",
  "Last updated by",
  "Last updated on",
  "Scheduled date",
  "Date of enrollment in the system",
  "Date of Report",
  "Tracked entity instance",
  "Program instance",
  "Geometry",
  "Longitude",
  "Latitude",
  "Organisation unit name hierarchy",
  "Organisation unit code",
];

/**
 * Custom hook for managing DHIS2 Data Store interactions
 */
const useDataStore = () => {
  // Namespace for storing configurations
  const NAMESPACE = "EVENT_REPORT_WIDGET";
  // For storing all dashboard configurations in one key
  const DASHBOARD_CONFIGS_KEY = "dashboardConfigurations";
  const GLOBAL_CONFIG_KEY = "globalConfiguration";

  // State for managing configurations
  const [configurations, setConfigurations] = useState({});
  const [globalConfig, setGlobalConfig] = useState({
    theme: "default",
    language: "en",
    pageSize: 10,
    refreshInterval: 0,
    globalFallback: true,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Define static mutations
  const [readDashboardConfigs] = useDataMutation({
    resource: `dataStore/${NAMESPACE}/${DASHBOARD_CONFIGS_KEY}`,
    type: "read",
  });

  const [updateDashboardConfigs] = useDataMutation({
    resource: `dataStore/${NAMESPACE}/${DASHBOARD_CONFIGS_KEY}`,
    type: "update",
    data: ({ data }) => data,
  });

  const [createDashboardConfigs] = useDataMutation({
    resource: `dataStore/${NAMESPACE}/${DASHBOARD_CONFIGS_KEY}`,
    type: "create",
    data: ({ data }) => data,
  });

  const [readGlobalConfig] = useDataMutation({
    resource: `dataStore/${NAMESPACE}/${GLOBAL_CONFIG_KEY}`,
    type: "read",
  });

  const [updateGlobalConfig] = useDataMutation({
    resource: `dataStore/${NAMESPACE}/${GLOBAL_CONFIG_KEY}`,
    type: "update",
    data: ({ data }) => data,
  });

  const [createGlobalConfig] = useDataMutation({
    resource: `dataStore/${NAMESPACE}/${GLOBAL_CONFIG_KEY}`,
    type: "create",
    data: ({ data }) => data,
  });

  // Function to refresh configurations
  const refreshConfigurations = useCallback(async () => {
    setLoading(true);
    try {
      // Re-fetch configurations from data store
      try {
        const configs = await readDashboardConfigs();
        setConfigurations(configs || {});
      } catch (configError) {
        if (configError.httpStatusCode === 404) {
          setConfigurations({});
        } else {
          throw configError;
        }
      }
      
      // Re-fetch global config
      try {
        const globalConfigData = await readGlobalConfig();
        setGlobalConfig(globalConfigData || {
          theme: "default",
          language: "en",
          pageSize: 10,
          refreshInterval: 0,
          globalFallback: true,
        });
      } catch (globalError) {
        if (globalError.httpStatusCode !== 404) {
          throw globalError;
        }
      }
    } catch (error) {
      console.error("Error refreshing configurations:", error);
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [readDashboardConfigs, readGlobalConfig]);

  // Load all configurations on init
  useEffect(() => {
    const loadConfigurations = async () => {
      setLoading(true);

      try {
        // Load dashboard configurations
        try {
          const dashboardConfigsData = await readDashboardConfigs();
          setConfigurations(dashboardConfigsData || {});
        } catch (configError) {
          // If not found, use empty object
          if (configError.httpStatusCode === 404) {
            setConfigurations({});
          } else {
            console.error(
              "Error loading dashboard configurations:",
              configError
            );
            throw configError;
          }
        }

        // Load global configuration
        try {
          const globalConfigData = await readGlobalConfig();
          setGlobalConfig(
            globalConfigData || {
              theme: "default",
              language: "en",
              pageSize: 10,
              refreshInterval: 0,
              globalFallback: true,
            }
          );
        } catch (globalError) {
          // If not found, use defaults
          if (globalError.httpStatusCode === 404) {
            // Keep default values
          } else {
            console.error("Error loading global configuration:", globalError);
            throw globalError;
          }
        }
      } catch (error) {
        console.error("Error loading configurations:", error);
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    loadConfigurations();
  }, [readDashboardConfigs, readGlobalConfig]);

  // Save configuration for a specific dashboard
  const saveConfiguration = useCallback(
    async (dashboardId, config) => {
      if (!dashboardId) {
        throw new Error("Dashboard ID is required");
      }

      try {
        setLoading(true);

        // Get current configurations
        let currentConfigs;
        try {
          currentConfigs = await readDashboardConfigs();
        } catch (readError) {
          // If not found, use empty object
          if (readError.httpStatusCode === 404) {
            currentConfigs = {};
          } else {
            throw readError;
          }
        }

        console.log("Current configs before update:", currentConfigs);

        // Update the specific dashboard configuration
        const updatedConfigs = {
          ...currentConfigs, // Keep ALL existing configurations
          [dashboardId]: {
            // Only update the specific one
            ...(currentConfigs[dashboardId] || {}),
            ...config,
            lastModified: new Date().toISOString(),
          },
        };

        console.log("Updated configs to save:", updatedConfigs);

        // Save updated configurations
        try {
          await updateDashboardConfigs({ data: updatedConfigs });
        } catch (updateError) {
          // If key doesn't exist, create it
          if (updateError.httpStatusCode === 404) {
            await createDashboardConfigs({ data: updatedConfigs });
          } else {
            throw updateError;
          }
        }

        // Update local state
        setConfigurations(updatedConfigs);
        console.log("Configurations updated in state:", updatedConfigs);

        return updatedConfigs;
      } catch (error) {
        console.error(
          `Error saving configuration for dashboard ${dashboardId}:`,
          error
        );
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [readDashboardConfigs, updateDashboardConfigs, createDashboardConfigs]
  );
  
  // Save global configuration
  const saveGlobalConfiguration = useCallback(
    async (newGlobalConfig) => {
      try {
        setLoading(true);

        // Get current global config
        let currentGlobalConfig;
        try {
          currentGlobalConfig = await readGlobalConfig();
        } catch (readError) {
          // If not found, use defaults
          if (readError.httpStatusCode === 404) {
            currentGlobalConfig = {
              theme: "default",
              language: "en",
              pageSize: 10,
              refreshInterval: 0,
              globalFallback: true,
            };
          } else {
            throw readError;
          }
        }

        // Update global config
        const updatedConfig = {
          ...currentGlobalConfig,
          ...newGlobalConfig,
          lastModified: new Date().toISOString(),
        };

        // Save updated global config
        try {
          await updateGlobalConfig({ data: updatedConfig });
        } catch (updateError) {
          // If key doesn't exist, create it
          if (updateError.httpStatusCode === 404) {
            await createGlobalConfig({ data: updatedConfig });
          } else {
            throw updateError;
          }
        }

        // Update local state
        setGlobalConfig(updatedConfig);

        return updatedConfig;
      } catch (error) {
        console.error("Error saving global configuration:", error);
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [readGlobalConfig, updateGlobalConfig, createGlobalConfig]
  );

  // Delete a dashboard configuration
  const deleteDashboardConfiguration = useCallback(
    async (dashboardId) => {
      if (!dashboardId) {
        throw new Error("Dashboard ID is required");
      }

      if (dashboardId === "default") {
        throw new Error("Cannot delete default configuration");
      }

      try {
        setLoading(true);

        // Get current configurations
        let currentConfigs;
        try {
          currentConfigs = await readDashboardConfigs();
        } catch (readError) {
          // If not found, nothing to delete
          if (readError.httpStatusCode === 404) {
            setLoading(false);
            return {};
          } else {
            throw readError;
          }
        }

        // Check if configuration exists
        if (!currentConfigs[dashboardId]) {
          setLoading(false);
          return currentConfigs;
        }

        // Remove the dashboard configuration
        const { [dashboardId]: removed, ...remainingConfigs } = currentConfigs;

        // Save updated configurations
        await updateDashboardConfigs({ data: remainingConfigs });

        // Update local state
        setConfigurations(remainingConfigs);

        return remainingConfigs;
      } catch (error) {
        console.error(
          `Error deleting configuration for dashboard ${dashboardId}:`,
          error
        );
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [readDashboardConfigs, updateDashboardConfigs]
  );

  // Get dashboard configuration with fallback to default if needed
  const getDashboardConfiguration = useCallback(
    (dashboardId) => {
      console.log("Getting config for dashboardId:", dashboardId);
      console.log("Available configurations:", configurations);
      
      // Handle specific dashboard configuration
      if (dashboardId && dashboardId !== 'default' && configurations[dashboardId]) {
        console.log("Found specific configuration for dashboard:", dashboardId);
        return configurations[dashboardId];
      }
      
      // Always use default if available
      if (configurations["default"]) {
        console.log("Using default configuration");
        return configurations["default"];
      }
      
      // No configuration found
      console.log("No configuration found for dashboard");
      return null;
    },
    [configurations]
  );

  // Get all dashboard configurations
  const getAllDashboardConfigurations = useCallback(() => {
    console.log("Current configurations:", configurations);
    return configurations;
  }, [configurations]);

  // Get global configuration
  const getGlobalConfiguration = useCallback(() => {
    return globalConfig;
  }, [globalConfig]);

  // Reset all configurations
  const resetAllConfigurations = useCallback(async () => {
    try {
      setLoading(true);

      // Default dashboard configurations
      const defaultConfigs = {
        default: {
          pageSize: 10,
          period: "LAST_12_MONTHS",
          hiddenColumns: DEFAULT_HIDDEN_COLUMNS,
          metadata: {
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString(),
          },
        },
      };

      // Default global config
      const defaultGlobalConfig = {
        theme: "default",
        language: "en",
        pageSize: 10,
        refreshInterval: 0,
        globalFallback: true,
        lastModified: new Date().toISOString(),
      };

      // Save default configurations
      try {
        await updateDashboardConfigs({ data: defaultConfigs });
      } catch (configError) {
        if (configError.httpStatusCode === 404) {
          await createDashboardConfigs({ data: defaultConfigs });
        } else {
          throw configError;
        }
      }

      try {
        await updateGlobalConfig({ data: defaultGlobalConfig });
      } catch (globalError) {
        if (globalError.httpStatusCode === 404) {
          await createGlobalConfig({ data: defaultGlobalConfig });
        } else {
          throw globalError;
        }
      }

      // Update local state
      setConfigurations(defaultConfigs);
      setGlobalConfig(defaultGlobalConfig);
    } catch (error) {
      console.error("Error resetting configurations:", error);
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [
    updateDashboardConfigs,
    createDashboardConfigs,
    updateGlobalConfig,
    createGlobalConfig,
  ]);

  return {
    loading,
    error,
    saveConfiguration,
    saveGlobalConfiguration,
    deleteDashboardConfiguration,
    getDashboardConfiguration,
    getAllDashboardConfigurations,
    getGlobalConfiguration,
    resetAllConfigurations,
    refreshConfigurations
  };
};

export { useDataStore };