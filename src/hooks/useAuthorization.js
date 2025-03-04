import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Custom hook for managing user authorization
 * Provides methods to check user authorities and access levels
 * 
 * @returns {Object} Authorization utilities and methods
 */
const useAuthorization = () => {
  // Use the auth context
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    hasAuthority: contextHasAuthority,
    getUserAuthorities,
    isSuperUser
  } = useAuth();

  // State for tracking specific permissions
  const [hasConfigAccess, setHasConfigAccess] = useState(false);
  const [hasDataAccess, setHasDataAccess] = useState(false);
  const [authLevel, setAuthLevel] = useState('viewer'); // 'viewer', 'editor', 'admin'

  // Predefined authority sets
  const CONFIG_AUTHORITIES = [
    'ALL',
    'F_SYSTEM_SETTING',
    'F_MOBILE_SENDEVENTREPORT'
  ];

  const DATA_AUTHORITIES = [
    'ALL',
    'F_VIEW_EVENT_ANALYTICS',
    'F_VIEW_EVENT_REPORT'
  ];

  // Check specific permissions when user data or authorities change
  useEffect(() => {
    if (isAuthenticated && user) {
      // Check config access
      const configAccess = contextHasAuthority(CONFIG_AUTHORITIES);
      setHasConfigAccess(configAccess);

      // Check data access
      const dataAccess = contextHasAuthority(DATA_AUTHORITIES);
      setHasDataAccess(dataAccess);

      // Determine authorization level
      if (isSuperUser) {
        setAuthLevel('admin');
      } else if (configAccess) {
        setAuthLevel('editor');
      } else {
        setAuthLevel('viewer');
      }
    } else {
      // Reset permissions when not authenticated
      setHasConfigAccess(false);
      setHasDataAccess(false);
      setAuthLevel('viewer');
    }
  }, [user, isAuthenticated, isSuperUser, contextHasAuthority]);

  /**
   * Check if user can manage configurations
   * @returns {boolean} Whether user can manage configurations
   */
  const canManageConfigurations = () => {
    return hasConfigAccess || isSuperUser;
  };

  /**
   * Get user's organization units
   * @returns {Array} List of user's organization units
   */
  const getUserOrgUnits = () => {
    return user?.organisationUnits || [];
  };

  /**
   * Check if user has access to a specific organization unit
   * @param {string} orgUnitId - Organization unit ID to check
   * @returns {boolean} Whether user has access to the org unit
   */
  const hasOrgUnitAccess = (orgUnitId) => {
    const userOrgUnits = getUserOrgUnits();
    return userOrgUnits.some(ou => ou.id === orgUnitId);
  };

  return {
    // Authentication status from context
    isAuthenticated,
    isLoading,
    
    // User roles and access
    isSuperUser,
    hasConfigAccess, // This is now a boolean, not a function
    hasDataAccess,
    authLevel,
    getUserAuthorities,
    
    // Authorization methods
    hasAuthority: contextHasAuthority,
    canManageConfigurations,
    
    // Organization unit methods
    getUserOrgUnits,
    hasOrgUnitAccess,
    
    // User information
    user
  };
};

export { useAuthorization };