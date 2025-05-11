# DHIS2 Event Report Widget

## Executive Summary

The DHIS2 Event Report Widget is a flexible, user-friendly application designed to improve access to critical event-based analytics in DHIS2. This widget allows users to easily embed event reports directly in dashboards, enhancing the visibility and use of vital health data. By providing a configurable interface for displaying event data with features like column visibility customization, search capabilities, and direct links to DHIS2 capture applications, this widget streamlines data workflows and supports informed decision-making.

## Table of Contents

1. [Introduction](#introduction)
2. [Key Features](#key-features)
3. [Technical Architecture](#technical-architecture)
4. [User Guide](#user-guide)
5. [Configuration Options](#configuration-options)
6. [Use Cases](#use-cases)
7. [Implementation Benefits](#implementation-benefits)
8. [Future Development Roadmap](#future-development-roadmap)

## Introduction

Health data collection systems often contain valuable information that isn't easily accessible to frontline users. The Event Report Widget solves this problem by bringing DHIS2 event data directly to dashboards where it can inform daily operations. The widget enhances the standard DHIS2 dashboard functionality by providing a more interactive and customizable way to work with event data.

This application addresses several key challenges:
- Limited dashboard integration for event-level data
- Difficulty configuring reports for non-technical users
- Time spent navigating between different DHIS2 modules
- Need for contextual filtering and search within event reports

## Key Features

### Core Capabilities

- **Dashboard Integration**: Seamlessly embeds event reports within DHIS2 dashboards
- **Configurable Display**: Customize visible columns, page size, and default periods
- **Contextual Search**: Full text search across all visible data
- **Column Filtering**: Apply filters to specific columns for targeted data analysis
- **Column Visibility Control**: Hide/show columns based on relevance to the user
- **Direct Action Links**: Quick access to event details in Tracker Capture or Event Capture
- **CSV Export**: Export displayed data for offline use or further analysis
- **Smart Program Detection**: Automatically detects and links to the appropriate capture app
- **Server-side Pagination**: Efficiently handle large datasets with minimal loading time
- **User-based Access Control**: Configuration permissions based on user roles

### User Experience Improvements

- **Responsive Design**: Adapts to different screen sizes and dashboard layouts
- **Intuitive Interface**: Clean, modern UI consistent with DHIS2 design guidelines
- **Performance Optimized**: Minimizes data loading and processing time
- **Error Handling**: Comprehensive error boundaries and user feedback
- **Dynamic Refreshing**: Data can be manually refreshed without reloading the dashboard

## Technical Architecture

### Application Structure

The widget follows a modular architecture based on React components and custom hooks:

```
/
├── components/
│   ├── ConfigManager.jsx         # Configuration management interface
│   ├── ConfigurationList.jsx     # List of saved configurations
│   ├── DataStoreInitializer.jsx  # Sets up datastore on first run
│   ├── DashboardSelector.jsx     # Dashboard mapping interface
│   ├── ErrorBoundary.jsx         # Error handling wrapper
│   ├── EventReportViewer.jsx     # Main data display component
│   └── UnifiedConfigManager.jsx  # Combined configuration interface
├── contexts/
│   ├── AuthContext.jsx           # Authentication management
│   └── ConfigurationContext.jsx  # Configuration state management
├── hooks/
│   ├── useAnalytics.js           # Analytics data fetching
│   ├── useAuthorization.js       # Authorization management
│   ├── useDashboards.js          # Dashboard data access
│   ├── useDataStore.js           # DHIS2 datastore operations
│   └── useEventReports.js        # Event report management
├── utils/
│   ├── analyticsUtils.js         # Data manipulation utilities
│   ├── authUtils.js              # Authentication helpers
│   ├── configurationValidator.js # Configuration validation
│   └── constants.js              # Global constants
└── App.jsx                       # Main application entrypoint
```

### Technical Stack

- **Framework**: React with function components and hooks
- **UI Library**: DHIS2 UI Component Library
- **State Management**: React Context API with custom hooks
- **Data Access**: DHIS2 App Runtime for data queries and mutations
- **Storage**: DHIS2 DataStore API for configuration persistence
- **Analytics**: DHIS2 Analytics API for event data
- **Styling**: CSS Modules for component-scoped styling
- **Icons**: React-Icons (FI set) for visual elements

### Data Flow

1. **Authentication**: App loads and verifies user credentials and permissions
2. **Configuration Detection**: Identifies dashboard context and loads relevant configuration
3. **Event Report Loading**: Fetches event report definition based on configuration
4. **Analytics Query**: Constructs and executes analytics API query based on event report parameters
5. **Data Processing**: Filters and formats data according to user preferences
6. **Rendering**: Displays data with interactive controls
7. **User Interaction**: Handles search, filtering, pagination, and other user interactions

### Integration Points

- **DHIS2 Dashboard Module**: The widget integrates as a dashboard app
- **DHIS2 DataStore API**: Stores and retrieves configuration settings
- **DHIS2 Analytics API**: Fetches event report data
- **DHIS2 Capture Apps**: Links directly to Tracker Capture or Event Capture for detailed views

## User Guide

### Setting Up the Widget (Correct Workflow)

1. **Create and Save an Event List Report**
   - Navigate to the Event Reports app in DHIS2
   - Create a new event report by selecting program, stages, and dimensions
   - Configure the desired layout, filters, and output options
   - Save the event report with a descriptive name

2. **Configure Dashboard-Widget Mapping**
   - Open the Event Report Widget application
   - Navigate to the Configuration section
   - Select the dashboard you want to configure from the dropdown
   - Map the previously created event report to the selected dashboard
   - Customize settings like page size, default period, and column visibility
   - Save the configuration

3. **Add the Widget to a Dashboard**
   - Navigate to the DHIS2 dashboard you configured
   - Click "+" to add a new item
   - Select "Event Report Widget" from the app list
   - Set the size and position of the widget
   - The widget will automatically load the event report mapped to this dashboard

### Viewing Event Data

- Data is displayed in a tabular format with configurable columns
- Use the search box to find specific information across all visible columns
- Click column headers to sort data in ascending/descending order
- Use the pagination controls to navigate through larger datasets
- Click "View Details" to open the corresponding event in Tracker Capture or Event Capture

### Configuration

- Users with configuration access can click "Configure Widget" to open the configuration interface
- Configuration includes:
  - Selecting an event report to display
  - Setting default number of records per page
  - Choosing a default period (e.g., Last 12 Months)
  - Customizing which columns are visible/hidden
- Dashboard-specific configurations can be created for different contexts

## Configuration Options

### Basic Settings

| Setting | Description | Default |
|---------|-------------|---------|
| Event Report | The DHIS2 event report to display | *Required* |
| Records per Page | Number of records to display per page | 10 |
| Default Period | Default time period for data | LAST_12_MONTHS |
| Global Fallback | Use default configuration if dashboard-specific one doesn't exist | Enabled |

### Column Visibility

- All columns from the selected event report can be toggled on/off
- Default hidden columns include system fields like:
  - Event ID
  - Program stage
  - Tracked entity instance
  - Geometry data
  - Organization unit hierarchy

### Dashboard Mapping

- The Unified Configuration Manager allows administrators to:
  - View all dashboard-specific configurations
  - Create/edit configurations for any dashboard
  - Delete existing configurations
  - Modify the default configuration

## Use Cases

### Primary Care Facility

**Scenario**: A health center needs to monitor recent malaria cases.
**Solution**: The widget displays a Malaria Event Report on the facility dashboard, allowing staff to:
- View recent cases at a glance
- Quickly search for patient details
- Link directly to case details for follow-up
- Filter by diagnosis date or treatment type


## Implementation Benefits

### For End Users

- **Immediate Access**: Critical data available directly on dashboards
- **Reduced Navigation**: Fewer clicks to access and analyze event data
- **Customizable View**: Personalized data display for different user needs
- **Streamlined Workflow**: Direct links to capture apps for follow-up actions

### For Administrators

- **Flexible Configuration**: Tailor reports for different dashboard contexts
- **Centralized Management**: Manage all widget configurations from one interface
- **Role-Based Access**: Restrict configuration capabilities to appropriate users
- **Easy Deployment**: Simple to add to existing dashboards with no infrastructure changes

### For Organizations

- **Improved Data Use**: Increases visibility and utilization of collected data
- **Better Decision Support**: Provides more contextual information on dashboards
- **Reduced Training Needs**: Intuitive interface requires minimal user training
- **Enhanced Productivity**: Saves time by reducing navigation between modules

## Future Development Roadmap

### Planned Enhancements

1. **Multiple Widgets per Dashboard**
   - Support for adding multiple event report widgets to a single dashboard
   - Independent configuration for each widget instance
   - Support for different widget sizes and layouts
   - Ability to link multiple reports to the same dashboard

2. **Advanced Filtering**
   - Date range pickers for temporal filtering
   - Multi-select filters for categorical data
   - Saved filter configurations

3. **Offline Capabilities**
   - Cache recent data for offline viewing
   - Background data synchronization
   - Offline action queue
