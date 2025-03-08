import { useState, useEffect } from 'react';
import { useDataQuery } from '@dhis2/app-runtime';

/**
 * Custom hook for fetching and managing dashboards
 */
export const useDashboards = () => {
  // State management
  const [dashboards, setDashboards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Define the query outside of the component
  const DASHBOARDS_QUERY = {
    dashboards: {
      resource: 'dashboards',
      params: {
        fields: ['id', 'displayName', 'created', 'lastUpdated'],
        order: 'displayName:asc',
        page: 1,
        pageSize: 100
      }
    }
  };

  // Use the query hook 
  const { data, loading: queryLoading, error: queryError } = useDataQuery(DASHBOARDS_QUERY);

  // Update state when data is fetched
  useEffect(() => {
    if (data) {
      setDashboards(data.dashboards.dashboards || []);
      setLoading(false);
    } else if (queryError) {
      console.error('Error fetching dashboards:', queryError);
      setError(queryError);
      setLoading(false);
      
      // Provide mock data for development if needed
      if (process.env.NODE_ENV === 'development') {
        setDashboards([
          { id: 'dashboard1', displayName: 'COVID-19 Dashboard' },
          { id: 'dashboard2', displayName: 'Maternal Health Dashboard' },
          { id: 'dashboard3', displayName: 'Immunization Dashboard' }
        ]);
      }
    } else {
      setLoading(queryLoading);
    }
  }, [data, queryError, queryLoading]);

  /**
   * Get a specific dashboard by ID
   * @param {string} dashboardId - ID of the dashboard
   * @returns {Object|null} Dashboard details
   */
  const getDashboardById = (dashboardId) => {
    return dashboards.find(dashboard => dashboard.id === dashboardId) || null;
  };

  return {
    dashboards,
    loading,
    error,
    getDashboardById
  };
};