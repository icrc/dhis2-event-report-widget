// src/hooks/__tests__/useDataStore.simple.test.js
import { useDataStore } from '../../hooks/useDataStore';

// Mock the DHIS2 data mutations
jest.mock('@dhis2/app-runtime', () => ({
  useDataMutation: () => [
    jest.fn().mockImplementation(async (params) => {
      if (params?.data) {
        return params.data;
      }
      return mockConfigurations;
    }),
    { called: false, loading: false }
  ],
  useDataEngine: () => ({
    query: jest.fn()
  }),
  useDataQuery: () => ({
    data: null,
    loading: false,
    error: null,
    refetch: jest.fn()
  })
}));

// Mock configurations for testing
const mockConfigurations = {
  'default': {
    eventReportId: 'default-report',
    pageSize: 10,
    hiddenColumns: ['Event', 'Program stage'],
    lastModified: '2023-01-01T00:00:00.000Z'
  }
};

// Simple test of the hook's existence
describe('useDataStore Hook', () => {
  it('can be imported', () => {
    expect(typeof useDataStore).toBe('function');
  });
});