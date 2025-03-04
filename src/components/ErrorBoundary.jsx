import React, { Component } from 'react';
import { NoticeBox, Button } from '@dhis2/ui';
import { FiRefreshCw } from 'react-icons/fi';

/**
 * ErrorBoundary Component
 * 
 * Catches JavaScript errors anywhere in child component tree,
 * logs errors, and displays a fallback UI
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to an error reporting service
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ 
      hasError: false,
      error: null,
      errorInfo: null
    });
  }

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // You can render any custom fallback UI
      if (fallback) {
        return fallback(error, this.handleReset);
      }

      return (
        <div style={{ padding: '16px' }}>
          <NoticeBox error title="Something went wrong">
            <p>The application encountered an unexpected error.</p>
            {error && (
              <details style={{ whiteSpace: 'pre-wrap', marginTop: '10px' }}>
                <summary>Error Details</summary>
                <p>{error.toString()}</p>
                {errorInfo && errorInfo.componentStack && (
                  <div style={{ marginTop: '10px' }}>
                    <p>Component Stack:</p>
                    <pre>{errorInfo.componentStack}</pre>
                  </div>
                )}
              </details>
            )}
            <div style={{ marginTop: '16px' }}>
              <Button primary onClick={this.handleReset} icon={<FiRefreshCw />}>
                Try Again
              </Button>
            </div>
          </NoticeBox>
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;