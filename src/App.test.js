// src/App.test.js
import { CustomDataProvider } from '@dhis2/app-runtime'
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

it('renders without crashing', () => {
    const div = document.createElement('div')
    const root = createRoot(div)
    
    // Act
    root.render(
        <CustomDataProvider>
            <App />
        </CustomDataProvider>
    )
    
    // Cleanup
    root.unmount()
})

// Add a simpler test that doesn't involve rendering
test('App component can be imported', () => {
    expect(App).toBeDefined()
})