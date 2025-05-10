// src/components/__tests__/EventReportViewer.test.jsx
import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import EventReportViewer from '../EventReportViewer';

// Mock all dependencies as empty functions to avoid errors
jest.mock('../../hooks/useDataStore', () => ({
  useDataStore: () => ({
    getDashboardConfiguration: () => null
  })
}));

jest.mock('../../hooks/useAnalytics', () => ({
  useAnalytics: () => ({
    fetchAnalytics: () => Promise.resolve(),
    analyticsData: null,
    loading: false,
    error: null
  })
}));

jest.mock('../../hooks/useEventReports', () => ({
  useEventReports: () => ({
    getEventReportDetails: () => null,
    getAnalyticsParams: () => null,
    loading: false
  })
}));

jest.mock('../../hooks/useAuthorization', () => ({
  useAuthorization: () => ({
    hasConfigAccess: false
  })
}));

jest.mock('@dhis2/app-runtime', () => ({
  useConfig: () => ({
    baseUrl: 'https://test.dhis2.org'
  })
}));

// Simplest possible CSS module mock
jest.mock('../EventReportViewer.module.css', () => ({}));

describe('EventReportViewer Component', () => {
  // Most basic test possible - just checks if the component renders without crashing
  test('renders without crashing', () => {
    // Using try/catch to handle any rendering errors
    try {
      render(<EventReportViewer dashboardId="test-dashboard" />);
      // If we get here, the component rendered without throwing an exception
      expect(true).toBe(true);
    } catch (error) {
      // This will fail the test if there's an error
      expect(error).toBeFalsy();
    }
  });
});