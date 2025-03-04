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

  // Query to fetch dashboards
  const dashboardsQuery = {
    dashboards: {
      resource: 'dashboards',
      params: {
        fields: [
          'id',
          'displayName',
          'created',
          'lastUpdated',
          'user[id,displayName]'
        ],
        order: 'displayName:asc',
        paging: false
      }
    }
  };

  /**
   * Fetch dashboards from the server
   */
  const fetchDashboards = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await useDataQuery(dashboardsQuery);
      const fetchedDashboards = result.dashboards?.dashboards || [];
      
      setDashboards(fetchedDashboards);
      setLoading(false);
    } catch (queryError) {
      console.error('Dashboards fetch error:', queryError);
      setError(queryError);
      setLoading(false);
    }
  };

  // Fetch dashboards on component mount
  useEffect(() => {
    fetchDashboards();
  }, []);

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
    getDashboardById,
    refetch: fetchDashboards
  };
};