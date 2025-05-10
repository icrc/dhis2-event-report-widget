import { configurationValidator } from '../../utils/configurationValidator';

describe('configurationValidator', () => {
  test('validateDashboardConfig validates correctly', () => {
    // Valid configuration
    const validConfig = {
      eventReportId: 'test-report',
      pageSize: 10,
      period: 'LAST_12_MONTHS',
      hiddenColumns: ['Event', 'Program stage']
    };
    
    const validResult = configurationValidator.validateDashboardConfig(validConfig);
    expect(validResult.isValid).toBe(true);
    expect(validResult.errors.length).toBe(0);
  });

  test('validateGlobalConfig validates correctly', () => {
    // Valid configuration
    const validConfig = {
      theme: 'default',
      language: 'en',
      refreshInterval: 60
    };
    
    const validResult = configurationValidator.validateGlobalConfig(validConfig);
    expect(validResult.isValid).toBe(true);
  });
});