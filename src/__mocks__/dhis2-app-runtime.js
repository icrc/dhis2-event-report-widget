// src/__mocks__/dhis2-app-runtime.js
// This file mocks the @dhis2/app-runtime module

const mockData = {
  me: {
    id: 'admin',
    name: 'Administrator',
    authorities: ['ALL'],
    organisationUnits: [{ id: 'ou1', name: 'Main Facility' }]
  },
  dashboards: {
    dashboards: [
      { id: 'dash1', displayName: 'Dashboard 1' },
      { id: 'dash2', displayName: 'Dashboard 2' }
    ]
  },
  eventReports: {
    eventReports: [
      { 
        id: 'report1', 
        name: 'Malaria Cases', 
        program: { id: 'p1', programType: 'WITHOUT_REGISTRATION' },
        programStage: { id: 'ps1' }
      },
      { 
        id: 'report2', 
        name: 'Immunization Coverage', 
        program: { id: 'p2', programType: 'WITH_REGISTRATION' },
        programStage: { id: 'ps2' }
      }
    ]
  },
  analytics: {
    headers: [
      { column: 'First Name' },
      { column: 'Last Name' },
      { column: 'Age' }
    ],
    rows: [
      ['John', 'Doe', 30],
      ['Jane', 'Smith', 25]
    ],
    metaData: {},
    width: 3,
    height: 2
  }
};

// Mock useDataQuery hook
const useDataQuery = jest.fn().mockImplementation(query => {
  // Determine which data to return based on the query
  let data = null;
  
  if (query.me) {
    data = { me: mockData.me };
  } else if (query.dashboards) {
    data = { dashboards: mockData.dashboards };
  } else if (query.eventReports) {
    data = { eventReports: mockData.eventReports };
  }
  
  return {
    data,
    loading: false,
    error: null,
    refetch: jest.fn()
  };
});

// Mock useDataMutation hook
const useDataMutation = jest.fn().mockImplementation(() => {
  const mutate = jest.fn().mockResolvedValue({});
  
  return [
    mutate,
    {
      loading: false,
      error: null,
      called: false
    }
  ];
});

// Mock useDataEngine hook
const useDataEngine = jest.fn().mockImplementation(() => ({
  query: jest.fn().mockResolvedValue({
    analytics: mockData.analytics
  })
}));

// Mock useConfig hook
const useConfig = jest.fn().mockImplementation(() => ({
  baseUrl: 'https://test.dhis2.org/dev',
  apiVersion: 33
}));

// Mock CustomDataProvider component
const CustomDataProvider = ({ children }) => children;

module.exports = {
  useDataQuery,
  useDataMutation,
  useDataEngine,
  useConfig,
  CustomDataProvider
};