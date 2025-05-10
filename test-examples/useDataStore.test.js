// src/hooks/__tests__/useDataStore.test.js
import { useDataStore } from '../src/hooks/useDataStore';

// Mock dependencies
jest.mock('@dhis2/app-runtime', () => ({
  useDataMutation: () => [jest.fn(), { loading: false }],
  useDataEngine: () => ({}),
  useDataQuery: () => ({})
}));

describe('useDataStore Hook', () => {
  // Most basic test - just verifies the hook is a function
  test('is a function', () => {
    expect(typeof useDataStore).toBe('function');
  });
  
  // Minimal test - checks if the hook returns an object
  test('returns an object with expected properties', () => {
    // Call the hook directly
    const result = useDataStore();
    
    // Check that the hook returns an object
    expect(typeof result).toBe('object');
    
    // Check that key methods exist (not testing their implementation)
    expect(typeof result.getDashboardConfiguration).toBe('function');
    expect(typeof result.getAllDashboardConfigurations).toBe('function');
    expect(typeof result.saveConfiguration).toBe('function');
  });
});