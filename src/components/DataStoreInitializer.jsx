// DataStoreInitializer.jsx
import React, { useEffect, useState } from 'react';
import { useDataEngine, useConfig } from '@dhis2/app-runtime';

const DataStoreInitializer = () => {
  const engine = useDataEngine();
  const { baseUrl } = useConfig();
  const [hasInitialized, setHasInitialized] = useState(false);
  
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
          } else if (checkResponse.status === 404) {
            // Only create if it doesn't exist
            console.log(`${NAMESPACE}/${DASHBOARD_CONFIGS_KEY} not found, creating...`);
            
            const createResponse = await fetch(
              `${apiUrl}/${NAMESPACE}/${DASHBOARD_CONFIGS_KEY}`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({}),
                credentials: 'include'
              }
            );
            
            if (createResponse.ok) {
              console.log(`Successfully created ${NAMESPACE}/${DASHBOARD_CONFIGS_KEY}`);
            } else {
              console.error(`Failed to create ${NAMESPACE}/${DASHBOARD_CONFIGS_KEY}: ${createResponse.status} ${createResponse.statusText}`);
            }
          }
        } catch (error) {
          console.error(`Error checking/creating ${NAMESPACE}/${DASHBOARD_CONFIGS_KEY}:`, error);
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
          } else if (checkResponse.status === 404) {
            // Only create if it doesn't exist
            console.log(`${NAMESPACE}/${GLOBAL_CONFIG_KEY} not found, creating...`);
            
            const createResponse = await fetch(
              `${apiUrl}/${NAMESPACE}/${GLOBAL_CONFIG_KEY}`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({}),
                credentials: 'include'
              }
            );
            
            if (createResponse.ok) {
              console.log(`Successfully created ${NAMESPACE}/${GLOBAL_CONFIG_KEY}`);
            } else {
              console.error(`Failed to create ${NAMESPACE}/${GLOBAL_CONFIG_KEY}: ${createResponse.status} ${createResponse.statusText}`);
            }
          }
        } catch (error) {
          console.error(`Error checking/creating ${NAMESPACE}/${GLOBAL_CONFIG_KEY}:`, error);
        }
        
        console.log("DataStoreInitializer: Initialization check completed");
      } catch (error) {
        console.error("DataStoreInitializer: Error during initialization check:", error);
      }
      
      // Mark as initialized so we don't run again
      setHasInitialized(true);
    };
    
    initialize();
  }, [baseUrl, engine, hasInitialized]);
  
  return null; // This component doesn't render anything
};

export default DataStoreInitializer;