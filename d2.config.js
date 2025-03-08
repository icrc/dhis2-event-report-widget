/**
 * @file d2.config.js
 * @description Configuration file for DHIS2 app development and builds
 */
const config = {
    type: 'app',
    name: 'event-report-widget',
    title: 'Event list Widget',
    description: 'Dashboard widget to display events list',
    entryPoints: {
        app: './src/App.jsx',
        dashboardWidget: './src/App.jsx',
        plugin: './src/App.jsx'
    },
    dataStoreNamespace: 'event-report-widget',
    customAuthorities: [
        'TRACKER_CAPTURE_ACCESS',
        'MY_ORG_UNIT_DATA'
    ],
    dashboardWidget: {
        displayName: 'Event report List',
        description: 'Displays recent event with links to the tracker/ capture module',
        icon: {
            name: 'list'
        },
        minWidth: 400,
        minHeight: 500,
        defaultWidth: 550,
        defaultHeight: 600
    },
    // Add this dashboard configuration to hide the header and sidebar
    dashboard: {
        hideTitle: true,
        hideGlobalHeaderAndSideBar: true
    }
}

module.exports = config