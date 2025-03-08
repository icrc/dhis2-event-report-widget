/**
 * Configuration Validation Utility
 * Provides validation methods for various configuration types
 */
export const configurationValidator = {
  /**
   * Validate dashboard event report configuration
   * @param {Object} config - Configuration object to validate
   * @returns {Object} - Validation result
   */
  validateDashboardConfig: (config) => {
    const errors = [];
    const warnings = [];

    // Check if configuration exists
    if (!config) {
      return {
        isValid: false,
        errors: ["Configuration cannot be empty"],
      };
    }

    // Validate event report ID
    if (!config.eventReportId) {
      errors.push("Event Report ID is required");
    }

    // Validate page size
    if (config.pageSize !== undefined) {
      if (typeof config.pageSize !== "number") {
        errors.push("Page size must be a number");
      } else if (config.pageSize < 5 || config.pageSize > 100) {
        warnings.push("Page size is recommended to be between 5 and 100");
      }
    }

    // Validate period
    const validPeriods = [
      "LAST_12_MONTHS",
      "LAST_6_MONTHS",
      "THIS_YEAR",
      "LAST_YEAR",
    ];
    if (config.period && !validPeriods.includes(config.period)) {
      errors.push(`Invalid period. Must be one of: ${validPeriods.join(", ")}`);
    }

    // Validate output type if specified
    const validOutputTypes = ["EVENT", "ENROLLMENT"];
    if (config.outputType && !validOutputTypes.includes(config.outputType)) {
      errors.push(
        `Invalid output type. Must be one of: ${validOutputTypes.join(", ")}`
      );
    }
    // Validate metadata
    if (config.metadata) {
      if (
        config.metadata.createdAt &&
        isNaN(Date.parse(config.metadata.createdAt))
      ) {
        errors.push("Invalid creation date format");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  },

  /**
   * Validate global application configuration
   * @param {Object} config - Global configuration object
   * @returns {Object} - Validation result
   */
  validateGlobalConfig: (config) => {
    const errors = [];
    const warnings = [];

    // Check if configuration exists
    if (!config) {
      return {
        isValid: false,
        errors: ["Global configuration cannot be empty"],
      };
    }

    // Validate theme
    const validThemes = ["default", "dark", "light"];
    if (config.theme && !validThemes.includes(config.theme)) {
      errors.push(`Invalid theme. Must be one of: ${validThemes.join(", ")}`);
    }

    // Validate language
    const validLanguages = ["en", "fr", "es", "pt"];
    if (config.language && !validLanguages.includes(config.language)) {
      warnings.push(
        `Unsupported language. Recommended languages: ${validLanguages.join(
          ", "
        )}`
      );
    }

    // Validate refresh interval
    if (config.refreshInterval !== undefined) {
      if (typeof config.refreshInterval !== "number") {
        errors.push("Refresh interval must be a number");
      } else if (config.refreshInterval < 0) {
        errors.push("Refresh interval cannot be negative");
      } else if (config.refreshInterval > 3600) {
        warnings.push(
          "Refresh interval is unusually high (max recommended: 1 hour)"
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  },

  /**
   * Validate event report configuration
   * @param {Object} config - Event report configuration
   * @returns {Object} - Validation result
   */
  validateEventReportConfig: (config) => {
    const errors = [];
    const warnings = [];

    // Check if configuration exists
    if (!config) {
      return {
        isValid: false,
        errors: ["Event report configuration cannot be empty"],
      };
    }

    // Validate report ID
    if (!config.reportId) {
      errors.push("Report ID is required");
    }

    // Validate program type
    const validProgramTypes = ["EVENT", "TRACKED_ENTITY"];
    if (config.programType && !validProgramTypes.includes(config.programType)) {
      errors.push(
        `Invalid program type. Must be one of: ${validProgramTypes.join(", ")}`
      );
    }

    // Validate data dimensions
    if (config.dataDimensions) {
      if (!Array.isArray(config.dataDimensions)) {
        errors.push("Data dimensions must be an array");
      } else if (config.dataDimensions.length === 0) {
        warnings.push("No data dimensions specified");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  },

  /**
   * Combine multiple configuration validations
   * @param {Object} config - Configuration object
   * @param {string} type - Configuration type
   * @returns {Object} - Combined validation result
   */
  validateConfiguration: (config, type) => {
    switch (type) {
      case "dashboard":
        return configurationValidator.validateDashboardConfig(config);
      case "global":
        return configurationValidator.validateGlobalConfig(config);
      case "eventReport":
        return configurationValidator.validateEventReportConfig(config);
      default:
        return {
          isValid: false,
          errors: ["Unknown configuration type"],
        };
    }
  },
};

// Export individual validation methods and combined validator
export const {
  validateDashboardConfig,
  validateGlobalConfig,
  validateEventReportConfig,
} = configurationValidator;

export default configurationValidator;
