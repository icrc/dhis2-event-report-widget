import React, { createContext, useState, useContext, useEffect } from 'react';
import { useDataQuery } from '@dhis2/app-runtime';

/**
 * Create the authentication context
 */
const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isSuperUser: false,
  hasConfigAccess: false,
  getUserAuthorities: () => [],
  hasAuthority: () => false,
});

/**
 * Query to fetch current user data
 */
const USER_QUERY = {
  me: {
    resource: 'me',
    params: {
      fields: 'id,name,displayName,username,authorities,userGroups[id,name],organisationUnits[id,name,level]'
    }
  }
};

/**
 * AuthProvider component to wrap the application and provide auth context
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export const AuthProvider = ({ children }) => {
  // State to manage authentication and authorization
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSuperUser, setIsSuperUser] = useState(false);
  const [userAuthorities, setUserAuthorities] = useState([]);

  // Fetch user data using the DHIS2 app-runtime
  const { data, loading, error } = useDataQuery(USER_QUERY, {
    onError: (error) => {
      console.error('Error fetching user data:', error);
      // Create mock user for testing if needed
      createMockUser();
    }
  });

  // Create a mock user for development/testing
  const createMockUser = () => {
    const mockUser = {
      id: 'mock-user-id',
      name: 'Mock User',
      displayName: 'Mock User (Admin)',
      username: 'admin',
      authorities: ['ALL', 'F_SYSTEM_SETTING', 'F_MOBILE_SENDEVENTREPORT'],
      organisationUnits: [
        { id: 'org1', name: 'Main Facility', level: 1 }
      ],
      userGroups: [
        { id: 'group1', name: 'System Administrators' }
      ]
    };
    
    setUser(mockUser);
    setIsAuthenticated(true);
    setUserAuthorities(mockUser.authorities);
    setIsSuperUser(true);
    
    console.warn('Using mock user for development/testing!');
  };

  // Effect to process user data when received
  useEffect(() => {
    if (data && data.me) {
      const userData = data.me;
      
      // Set user information
      setUser({
        id: userData.id,
        name: userData.name,
        displayName: userData.displayName,
        username: userData.username,
        organisationUnits: userData.organisationUnits || [],
        userGroups: userData.userGroups || []
      });

      // Set authentication status
      setIsAuthenticated(true);

      // Store user authorities
      const authorities = userData.authorities || [];
      setUserAuthorities(authorities);

      // Determine if user is a super user
      const superUserAuthorities = [
        'ALL',           // Full system access
        'M_dhis-web-maintenance-appmanager' // Maintenance app access
      ];

      const isSuper = authorities.some(auth => 
        superUserAuthorities.includes(auth)
      );
      setIsSuperUser(isSuper);
    } else if (error) {
      console.error('Error fetching user data:', error);
      // For development/testing, you can use a mock user
      // Uncomment the next line to enable mock user during development
      // createMockUser();
    }
  }, [data, error]);

  /**
   * Check if user has specific authorities
   * @param {string|string[]} requiredAuthorities - Authorities to check
   * @returns {boolean} - Whether user has the required authority
   */
  const hasAuthority = (requiredAuthorities) => {
    // Normalize input to array
    const authArray = Array.isArray(requiredAuthorities) 
      ? requiredAuthorities 
      : [requiredAuthorities];

    // Super user check - always has access
    if (userAuthorities.includes('ALL')) return true;

    // Check if any required authority exists
    return authArray.some(auth => userAuthorities.includes(auth));
  };

  /**
   * Get configuration access based on user authorities
   * @returns {boolean} - Whether user can access configurations
   */
  const hasConfigAccess = () => {
    const configAuthorities = [
      'ALL',                     // Full system access
      'F_SYSTEM_SETTING',        // System settings
      'F_MOBILE_SENDEVENTREPORT' // Event report configuration
    ];

    return hasAuthority(configAuthorities);
  };

  // Provide context value
  const contextValue = {
    user,
    isAuthenticated,
    isLoading: loading,
    error,
    isSuperUser,
    hasConfigAccess: hasConfigAccess(),
    getUserAuthorities: () => userAuthorities,
    hasAuthority
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to use authentication context
 * @returns {Object} - Authentication context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  // Throw error if used outside of AuthProvider
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};