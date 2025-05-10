import { renderHook, act } from '@testing-library/react-hooks';
import { useEventReports } from '../../hooks/useEventReports';

// Mock DHIS2 data query
jest.mock('@dhis2/app-runtime', () => ({
  useDataQuery: () => ({
    data: {
      eventReports: {
        eventReports: [
          {
            id: 'report1',
            name: 'Malaria Cases Report',
            displayName: 'Malaria Cases Report',
            program: {
              id: 'p1',
              displayName: 'Malaria Program',
              programType: 'WITHOUT_REGISTRATION'
            },
            programStage: {
              id: 'ps1',
              displayName: 'Diagnosis Stage'
            },
            attributeDimensions: [],
            dataElementDimensions: [
              {
                dataElement: { id: 'de1', displayName: 'Diagnosis' },
                programStage: { id: 'ps1' }
              }
            ],
            columnDimensions: ['pe', 'ou', 'de1'],
            outputType: 'EVENT'
          },
          {
            id: 'report2',
            name: 'Immunization Report',
            displayName: 'Immunization Report',
            program: {
              id: 'p2',
              displayName: 'Immunization Program',
              programType: 'WITH_REGISTRATION'
            },
            programStage: {
              id: 'ps2',
              displayName: 'Vaccination Stage'
            },
            attributeDimensions: [],
            dataElementDimensions: [],
            columnDimensions: ['pe', 'ou'],
            outputType: 'ENROLLMENT'
          }
        ]
      }
    },
    loading: false,
    error: null,
    refetch: jest.fn()
  })
}));

describe('useEventReports Hook', () => {
  test('returns event reports data', () => {
    const { result } = renderHook(() => useEventReports());
    
    expect(result.current.eventReports).toHaveLength(2);
    expect(result.current.eventReports[0].id).toBe('report1');
    expect(result.current.eventReports[1].id).toBe('report2');
  });

  test('getEventReportDetails returns correct report', () => {
    const { result } = renderHook(() => useEventReports());
    
    const report = result.current.getEventReportDetails('report1');
    
    expect(report).not.toBeNull();
    expect(report.name).toBe('Malaria Cases Report');
    expect(report.program.programType).toBe('WITHOUT_REGISTRATION');
  });

  test('getAnalyticsParams generates correct parameters', () => {
    const { result } = renderHook(() => useEventReports());
    
    const params = result.current.getAnalyticsParams('report1');
    
    expect(params).not.toBeNull();
    expect(params.programId).toBe('p1');
    expect(params.programStageId).toBe('ps1');
    expect(params.period).toBe('LAST_12_MONTHS');
    expect(params.dimensions).toContain('ps1.de1');
  });
});