import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EventReportViewer from './EventReportViewer';

// Mock the necessary custom hooks
jest.mock('../hooks/useDataStore', () => ({
  useDataStore: () => ({
    getDashboardConfiguration: jest.fn(() => ({
      eventReportId: 'test-report-id',
      pageSize: 10,
      period: 'LAST_12_MONTHS',
      hiddenColumns: [
        'Event',
        'Program stage',
        'Stored by',
      ]
    })),
    saveConfiguration: jest.fn()
  })
}));

jest.mock('../hooks/useAnalytics', () => ({
  useAnalytics: () => ({
    fetchAnalytics: jest.fn(),
    analyticsData: [
      ['Event', 'First Name', 'Last Name', 'Age', 'Gender', 'Program stage', 'Stored by'],
      ['event-1', 'John', 'Doe', 35, 'Male', 'Registration', 'admin'],
      ['event-2', 'Jane', 'Smith', 28, 'Female', 'Registration', 'admin'],
      ['event-3', 'Mike', 'Johnson', 42, 'Male', 'Registration', 'admin']
    ],
    loading: false,
    error: null,
    exportToCSV: jest.fn()
  })
}));

jest.mock('../hooks/useEventReports', () => ({
  useEventReports: () => ({
    getEventReportDetails: jest.fn(() => ({
      id: 'test-report-id',
      name: 'Test Report',
      displayName: 'Test Event Report'
    })),
    getAnalyticsParams: jest.fn(() => ({
      programId: 'test-program',
      programStageId: 'test-stage',
      period: 'LAST_12_MONTHS',
      pageSize: 10
    })),
    loading: false
  })
}));

jest.mock('../contexts/ConfigurationContext', () => ({
  useConfiguration: () => ({
    globalConfig: {
      theme: 'default',
      language: 'en',
      pageSize: 10
    }
  })
}));

describe('EventReportViewer', () => {
  test('correctly filters out hidden columns', async () => {
    render(<EventReportViewer dashboardId="test-dashboard" />);
    
    // Wait for component to render with data
    await waitFor(() => {
      // Check that the title of the report is rendered
      expect(screen.getByText('Test Event Report')).toBeInTheDocument();
    });
    
    // Check that visible columns are displayed
    expect(screen.getByText('First Name')).toBeInTheDocument();
    expect(screen.getByText('Last Name')).toBeInTheDocument();
    expect(screen.getByText('Age')).toBeInTheDocument();
    expect(screen.getByText('Gender')).toBeInTheDocument();
    
    // Check that hidden columns are not displayed
    expect(screen.queryByText('Event')).not.toBeInTheDocument();
    expect(screen.queryByText('Program stage')).not.toBeInTheDocument();
    expect(screen.queryByText('Stored by')).not.toBeInTheDocument();
    
    // Check that data for visible columns is displayed
    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.getByText('Jane')).toBeInTheDocument();
    expect(screen.getByText('28')).toBeInTheDocument();
    expect(screen.getByText('Male')).toBeInTheDocument();
    expect(screen.getByText('Female')).toBeInTheDocument();
  });

  test('search functionality filters data correctly', async () => {
    render(<EventReportViewer dashboardId="test-dashboard" />);
    
    // Wait for component to render with data
    await waitFor(() => {
      expect(screen.getByText('Test Event Report')).toBeInTheDocument();
    });
    
    // Search for "Jane"
    const searchInput = screen.getByPlaceholderText('Search...');
    fireEvent.change(searchInput, { target: { value: 'Jane' } });
    
    // Should see Jane but not John or Mike
    expect(screen.getByText('Jane')).toBeInTheDocument();
    expect(screen.getByText('Smith')).toBeInTheDocument();
    expect(screen.queryByText('John')).not.toBeInTheDocument();
    expect(screen.queryByText('Mike')).not.toBeInTheDocument();
  });

  test('column visibility toggle works correctly', async () => {
    render(<EventReportViewer dashboardId="test-dashboard" />);
    
    // Wait for component to render with data
    await waitFor(() => {
      expect(screen.getByText('Test Event Report')).toBeInTheDocument();
    });
    
    // Open column selector
    const columnsButton = screen.getByText('Columns');
    fireEvent.click(columnsButton);
    
    // Check initially visible columns are checked
    const firstNameCheckbox = screen.getByLabelText('First Name');
    const lastNameCheckbox = screen.getByLabelText('Last Name');
    
    expect(firstNameCheckbox).toBeChecked();
    expect(lastNameCheckbox).toBeChecked();
    
    // Toggle First Name visibility
    fireEvent.click(firstNameCheckbox);
    
    // First Name should now be hidden
    expect(screen.queryByText('First Name')).not.toBeInTheDocument();
    expect(screen.getByText('Last Name')).toBeInTheDocument();
  });
});