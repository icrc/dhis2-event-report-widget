/**
 * Authentication and Authorization Utility Functions
 * Provides helper methods for managing user permissions and roles
 */

/**
 * Check if a user has a specific authority
 * @param {string|string[]} requiredAuthorities - Authorities to check
 * @param {string[]} userAuthorities - User's current authorities
 * @returns {boolean} - Whether user has the required authority
 */
export const hasAuthority = (requiredAuthorities, userAuthorities = []) => {
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
   * Determine if a user is a super user
   * @param {string[]} userAuthorities - User's current authorities
   * @returns {boolean} - Whether user is a super user
   */
  export const isSuperUser = (userAuthorities = []) => {
    const SUPER_USER_AUTHORITIES = [
      'ALL',
      'M_dhis-web-maintenance-appmanager'
    ];
  
    return SUPER_USER_AUTHORITIES.some(auth => 
      userAuthorities.includes(auth)
    );
  };
  
  /**
   * Check configuration access permissions
   * @param {string[]} userAuthorities - User's current authorities
   * @returns {boolean} - Whether user can modify configurations
   */
  export const hasConfigAccess = (userAuthorities = []) => {
    const CONFIG_AUTHORITIES = [
      'ALL',
      'F_SYSTEM_SETTING',
      'F_MOBILE_SENDEVENTREPORT'
    ];
  
    return hasAuthority(CONFIG_AUTHORITIES, userAuthorities);
  };
  
  /**
   * Filter organization units based on user access
   * @param {Object[]} orgUnits - List of organization units
   * @param {string[]} userOrgUnits - User's accessible organization units
   * @returns {Object[]} - Filtered organization units
   */
  export const filterAccessibleOrgUnits = (orgUnits = [], userOrgUnits = []) => {
    return orgUnits.filter(orgUnit => 
      userOrgUnits.some(userOu => userOu.id === orgUnit.id)
    );
  };
  
  /**
   * Generate a token for temporary access
   * @param {Object} user - User object
   * @param {number} expiresIn - Token expiration time in seconds
   * @returns {string} - Generated access token
   */
  export const generateAccessToken = (user, expiresIn = 3600) => {
    if (!user) {
      throw new Error('Cannot generate token for undefined user');
    }
  
    // Basic token generation (for demonstration - use proper JWT in production)
    const tokenPayload = {
      userId: user.id,
      username: user.username,
      authorities: user.authorities,
      exp: Date.now() + (expiresIn * 1000)
    };
  
    return btoa(JSON.stringify(tokenPayload));
  };
  
  /**
   * Validate an access token
   * @param {string} token - Access token to validate
   * @returns {Object|null} - Decoded token or null if invalid
   */
  export const validateAccessToken = (token) => {
    try {
      const decodedToken = JSON.parse(atob(token));
      
      // Check token expiration
      if (decodedToken.exp < Date.now()) {
        console.warn('Token has expired');
        return null;
      }
  
      return decodedToken;
    } catch (error) {
      console.error('Invalid token', error);
      return null;
    }
  };
  
  /**
   * Get user roles from authorities
   * @param {string[]} userAuthorities - User's authorities
   * @returns {string[]} - User roles
   */
  export const getUserRoles = (userAuthorities = []) => {
    const roleMap = {
      'ALL': 'Super Administrator',
      'F_SYSTEM_SETTING': 'System Administrator',
      'F_MOBILE_SENDEVENTREPORT': 'Report Manager',
      // Add more role mappings as needed
    };
  
    return userAuthorities
      .filter(auth => roleMap[auth])
      .map(auth => roleMap[auth]);
  };