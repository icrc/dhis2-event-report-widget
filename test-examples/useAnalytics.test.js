import { renderHook, act } from '@testing-library/react-hooks';
import { useAnalytics } from '../../hooks/useAnalytics';

// Mock data engine
jest.mock('@dhis2/app-runtime', () => ({
  useDataEngine: () => ({
    query: jest.fn().mockImplementation(() => Promise.resolve({
      analytics: {
        headers: [
          { column: 'Event Date' },
          { column: 'Organisation Unit' },
          { column: 'First Name' },
          { column: 'Last Name' }
        ],
        rows: [
          ['2023-01-01', 'Facility 1', 'John', 'Doe'],
          ['2023-01-02', 'Facility 2', 'Jane', 'Smith']
        ],
        metaData: {
          dimensions: { pe: ['LAST_12_MONTHS'], ou: ['USER_ORGUNIT'] }
        },
        width: 4,
        height: 2
      }
    }))
  })
}));

describe('useAnalytics Hook', () => {
  test('fetchAnalytics fetches and processes data correctly', async () => {
    const { result } = renderHook(() => useAnalytics());
    
    await act(async () => {
      await result.current.fetchAnalytics({
        programId: 'test-program',
        period: 'LAST_12_MONTHS',
        orgUnit: 'USER_ORGUNIT'
      }, 'test-report', 'EVENT');
    });
    
    // Check that data is processed correctly
    expect(result.current.analyticsData).toEqual([
      ['Event Date', 'Organisation Unit', 'First Name', 'Last Name'],
      ['2023-01-01', 'Facility 1', 'John', 'Doe'],
      ['2023-01-02', 'Facility 2', 'Jane', 'Smith']
    ]);
    
    // Check metadata
    expect(result.current.metadata).toHaveProperty('dimensions');
    expect(result.current.metadata).toHaveProperty('metaData');
    expect(result.current.metadata).toHaveProperty('headers');
    expect(result.current.metadata.width).toBe(4);
    expect(result.current.metadata.height).toBe(2);
  });

  test('exportToCSV formats data correctly for export', async () => {
    // Mock createElement and click methods
    document.createElement = jest.fn().mockImplementation(() => ({
      setAttribute: jest.fn(),
      style: {},
      click: jest.fn(),
    }));
    document.body.appendChild = jest.fn();
    document.body.removeChild = jest.fn();
    URL.createObjectURL = jest.fn().mockReturnValue('blob:url');
    
    const { result } = renderHook(() => useAnalytics());
    
    // Set up test data
    await act(async () => {
      result.current.analyticsData = [
        ['First Name', 'Last Name', 'Age'],
        ['John', 'Doe', 30],
        ['Jane', 'Smith', 25]
      ];
    });
    
    // Call exportToCSV
    act(() => {
      result.current.exportToCSV(result.current.analyticsData, 'test_export.csv');
    });
    
    // Check that document methods were called
    expect(document.createElement).toHaveBeenCalledWith('a');
    expect(document.body.appendChild).toHaveBeenCalled();
    expect(document.body.removeChild).toHaveBeenCalled();
    
    // Reset mocks
    document.createElement.mockRestore();
    document.body.appendChild.mockRestore();
    document.body.removeChild.mockRestore();
    URL.createObjectURL.mockRestore();
  });
});