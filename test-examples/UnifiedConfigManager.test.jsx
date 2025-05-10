import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import UnifiedConfigManager from '../UnifiedConfigManager';

// Mock dependencies
jest.mock('@dhis2/app-runtime', () => ({
  useConfig: () => ({
    baseUrl: 'https://play.dhis2.org/dev'
  })
}));

jest.mock('../../hooks/useAuthorization', () => ({
  useAuthorization: () => ({
    hasConfigAccess: true,
    isSuperUser: true
  })
}));

jest.mock('../../hooks/useDashboards', () => ({
  useDashboards: () => ({
    dashboards: [
      { id: 'dashboard1', displayName: 'Dashboard 1' },
      { id: 'dashboard2', displayName: 'Dashboard 2' }
    ],
    loading: false
  })
}));

jest.mock('../../hooks/useEventReports', () => ({
  useEventReports: () => ({
    eventReports: [
      { id: 'report1', name: 'Report 1' },
      { id: 'report2', name: 'Report 2' }
    ]
  })
}));

jest.mock('../../hooks/useDataStore', () => ({
  useDataStore: () => ({
    getAllDashboardConfigurations: jest.fn(() => ({
      default: {
        eventReportId: 'report1',
        pageSize: 10
      },
      dashboard1: {
        eventReportId: 'report2',
        pageSize: 20
      }
    })),
    getDashboardConfiguration: jest.fn(id => ({
      eventReportId: id === 'dashboard1' ? 'report2' : 'report1',
      pageSize: id === 'dashboard1' ? 20 : 10
    })),
    deleteDashboardConfiguration: jest.fn(),
    saveConfiguration: jest.fn()
  })
}));

// Mock ConfigManager component
jest.mock('../ConfigManager', () => {
  return function MockConfigManager(props) {
    return (
      <div data-testid="config-manager">
        <div>Dashboard ID: {props.dashboardId}</div>
        <button onClick={props.onClose}>Close Config</button>
      </div>
    );
  };
});

describe('UnifiedConfigManager Component', () => {
  test('renders with correct initial state', () => {
    render(
      <UnifiedConfigManager
        isOpen={true}
        onClose={jest.fn()}
        dashboardId="dashboard1"
      />
    );
    
    // Title should be displayed
    expect(screen.getByText('Configure Event Report Widget')).toBeInTheDocument();
    
    // Dashboard selector should have correct selection
    expect(screen.getByText('Configuration Target')).toBeInTheDocument();
    
    // Report Settings tab should be active initially
    expect(screen.getByTestId('config-manager')).toBeInTheDocument();
    expect(screen.getByText('Dashboard ID: dashboard1')).toBeInTheDocument();
  });

  test('changes tabs correctly', async () => {
    render(
      <UnifiedConfigManager
        isOpen={true}
        onClose={jest.fn()}
        dashboardId="dashboard1"
      />
    );
    
    // Switch to the mapping tab
    fireEvent.click(screen.getByText('Dashboard Mapping'));
    
    // Mapping tab content should be visible
    await waitFor(() => {
      expect(screen.getByText('Dashboard to Event Report Mappings')).toBeInTheDocument();
    });
    
    // Switch back to report settings
    fireEvent.click(screen.getByText('Report Settings'));
    
    // Config manager should be visible again
    await waitFor(() => {
      expect(screen.getByTestId('config-manager')).toBeInTheDocument();
    });
  });

  test('changes dashboard selection correctly', async () => {
    const { getByText, getAllByRole } = render(
      <UnifiedConfigManager
        isOpen={true}
        onClose={jest.fn()}
        dashboardId="dashboard1"
      />
    );
    
    // Open the dashboard dropdown
    fireEvent.click(getByText('Configuration Target'));
    
    // Select dashboard2
    const options = getAllByRole('option');
    // Find the option with Dashboard 2 text
    const dashboard2Option = options.find(option => 
      option.textContent.includes('Dashboard 2')
    );
    
    fireEvent.click(dashboard2Option);
    
    // Config manager should show dashboard2
    await waitFor(() => {
      expect(screen.getByText('Dashboard ID: dashboard2')).toBeInTheDocument();
    });
  });

  test('closes the modal when close button is clicked', () => {
    const onCloseMock = jest.fn();
    
    render(
      <UnifiedConfigManager
        isOpen={true}
        onClose={onCloseMock}
        dashboardId="dashboard1"
      />
    );
    
    // Click the close button
    fireEvent.click(screen.getByText('Close'));
    
    // onClose should have been called
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });
});
