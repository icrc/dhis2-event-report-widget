// src/components/__tests__/ErrorBoundary.test.jsx
import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import ErrorBoundary from '../ErrorBoundary'

// Mock console.error to prevent noise in test output
const originalConsoleError = console.error
beforeAll(() => {
  console.error = jest.fn()
})
afterAll(() => {
  console.error = originalConsoleError
})

// Create a component that throws an error
const ThrowError = () => {
  throw new Error('Test error')
  return null
}

describe('ErrorBoundary Component', () => {
  test('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div data-testid="child">Child Component</div>
      </ErrorBoundary>
    )
    
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })
  
  test('renders fallback UI when error occurs', () => {
    // We need to spy on console.error and temporarily disable it
    // to prevent the expected error from cluttering the test output
    console.error.mockImplementation(() => {})
    
    // Render a component that will throw an error
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )
    
    // Check that fallback UI is rendered
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('Try Again')).toBeInTheDocument()
  })
})