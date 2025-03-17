// DataStoreInitializer.jsx
import React, { useEffect, useState } from 'react';
import { useDataEngine, useConfig } from '@dhis2/app-runtime';

const DataStoreInitializer = () => {
  const engine = useDataEngine();
  const { baseUrl } = useConfig();
  const [hasInitialized, setHasInitialized] = useState(false);
  const [initStatus, setInitStatus] = useState({
    dashboardConfigs: 'pending',
    globalConfig: 'pending'
  });
  
  useEffect(() => {
    // Only run once
    if (hasInitialized) return;
    
    const initialize = async () => {
      console.log("DataStoreInitializer: Starting initialization check...");
      
      // Define namespace and keys
      const NAMESPACE = "EVENT_REPORT_WIDGET";
      const DASHBOARD_CONFIGS_KEY = "dashboardConfigurations";
      const GLOBAL_CONFIG_KEY = "globalConfiguration";
      
      try {
        // Get the correct base URL for the API
        const apiUrl = `${baseUrl}/api/dataStore`;
        console.log("Using API URL:", apiUrl);
        
        // Create default configuration objects
        const defaultDashboardConfigs = {
          default: {
            pageSize: 10,
            period: "LAST_12_MONTHS",
            hiddenColumns: [
              'Event',
              'Program stage',
              'Stored by',
              'Created by',
              'Last updated by',
              'Last updated on',
              'Scheduled date',
              'Date of enrollment in the system',
              'Date of Report',
              'Tracked entity instance',
              'Program instance',
              'Geometry',
              'Longitude',
              'Latitude',
              'Organisation unit name hierarchy',
              'Organisation unit code'
            ],
            metadata: {
              createdAt: new Date().toISOString(),
              lastModified: new Date().toISOString(),
            }
          }
        };
        
        const defaultGlobalConfig = {
          theme: "default",
          language: "en",
          pageSize: 10,
          refreshInterval: 0,
          globalFallback: true,
          lastModified: new Date().toISOString(),
        };
        
        // First check if dashboard configurations key exists
        try {
          const checkResponse = await fetch(
            `${apiUrl}/${NAMESPACE}/${DASHBOARD_CONFIGS_KEY}`,
            {
              method: 'GET',
              credentials: 'include'
            }
          );
          
          if (checkResponse.ok) {
            console.log(`${NAMESPACE}/${DASHBOARD_CONFIGS_KEY} already exists, no need to create.`);
            
            // Fetch and log the current content for debugging
            const content = await checkResponse.json();
            console.log(`Current dashboard configurations:`, content);
            
            setInitStatus(prev => ({...prev, dashboardConfigs: 'exists'}));
          } else if (checkResponse.status === 404) {
            // Only create if it doesn't exist
            console.log(`${NAMESPACE}/${DASHBOARD_CONFIGS_KEY} not found, creating with default values...`);
            
            const createResponse = await fetch(
              `${apiUrl}/${NAMESPACE}/${DASHBOARD_CONFIGS_KEY}`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(defaultDashboardConfigs), // Use default configs
                credentials: 'include'
              }
            );
            
            if (createResponse.ok) {
              console.log(`Successfully created ${NAMESPACE}/${DASHBOARD_CONFIGS_KEY} with default values`);
              setInitStatus(prev => ({...prev, dashboardConfigs: 'created'}));
            } else {
              console.error(`Failed to create ${NAMESPACE}/${DASHBOARD_CONFIGS_KEY}: ${createResponse.status} ${createResponse.statusText}`);
              setInitStatus(prev => ({...prev, dashboardConfigs: 'error'}));
            }
          }
        } catch (error) {
          console.error(`Error checking/creating ${NAMESPACE}/${DASHBOARD_CONFIGS_KEY}:`, error);
          setInitStatus(prev => ({...prev, dashboardConfigs: 'error'}));
        }
        
        // Then check if global configuration key exists
        try {
          const checkResponse = await fetch(
            `${apiUrl}/${NAMESPACE}/${GLOBAL_CONFIG_KEY}`,
            {
              method: 'GET',
              credentials: 'include'
            }
          );
          
          if (checkResponse.ok) {
            console.log(`${NAMESPACE}/${GLOBAL_CONFIG_KEY} already exists, no need to create.`);
            
            // Fetch and log the current content for debugging
            const content = await checkResponse.json();
            console.log(`Current global configuration:`, content);
            
            setInitStatus(prev => ({...prev, globalConfig: 'exists'}));
          } else if (checkResponse.status === 404) {
            // Only create if it doesn't exist
            console.log(`${NAMESPACE}/${GLOBAL_CONFIG_KEY} not found, creating with default values...`);
            
            const createResponse = await fetch(
              `${apiUrl}/${NAMESPACE}/${GLOBAL_CONFIG_KEY}`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(defaultGlobalConfig), // Use default global config
                credentials: 'include'
              }
            );
            
            if (createResponse.ok) {
              console.log(`Successfully created ${NAMESPACE}/${GLOBAL_CONFIG_KEY} with default values`);
              setInitStatus(prev => ({...prev, globalConfig: 'created'}));
            } else {
              console.error(`Failed to create ${NAMESPACE}/${GLOBAL_CONFIG_KEY}: ${createResponse.status} ${createResponse.statusText}`);
              setInitStatus(prev => ({...prev, globalConfig: 'error'}));
            }
          }
        } catch (error) {
          console.error(`Error checking/creating ${NAMESPACE}/${GLOBAL_CONFIG_KEY}:`, error);
          setInitStatus(prev => ({...prev, globalConfig: 'error'}));
        }
        
        console.log("DataStoreInitializer: Initialization check completed with status:", initStatus);
      } catch (error) {
        console.error("DataStoreInitializer: Error during initialization check:", error);
      }
      
      // Mark as initialized so we don't run again
      setHasInitialized(true);
    };
    
    initialize();
  }, [baseUrl, engine, hasInitialized, initStatus]);
  
  return null; // This component doesn't render anything
};

export default DataStoreInitializer;