import { renderHook } from '@testing-library/react-hooks';
import { useAuthorization } from '../../hooks/useAuthorization';
import { useAuth } from '../../contexts/AuthContext';

// Mock the AuthContext
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn()
}));

describe('useAuthorization Hook', () => {
  beforeEach(() => {
    // Reset mock
    useAuth.mockReset();
  });

  test('hasConfigAccess returns true for users with config access', () => {
    // Mock super user
    useAuth.mockReturnValue({
      isAuthenticated: true,
      isSuperUser: true,
      user: { id: 'admin', name: 'Admin User' },
      getUserAuthorities: () => ['ALL'],
      hasAuthority: () => true
    });
    
    const { result } = renderHook(() => useAuthorization());
    
    expect(result.current.hasConfigAccess).toBe(true);
    expect(result.current.isSuperUser).toBe(true);
  });

  test('hasConfigAccess returns false for users without config access', () => {
    // Mock regular user
    useAuth.mockReturnValue({
      isAuthenticated: true,
      isSuperUser: false,
      user: { id: 'user', name: 'Regular User' },
      getUserAuthorities: () => ['F_VIEW_EVENT_ANALYTICS'],
      hasAuthority: (authorities) => 
        authorities.includes('F_VIEW_EVENT_ANALYTICS')
    });
    
    const { result } = renderHook(() => useAuthorization());
    
    expect(result.current.hasConfigAccess).toBe(false);
    expect(result.current.isSuperUser).toBe(false);
  });
});