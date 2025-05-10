// src/setupTests.js
import '@testing-library/jest-dom';

// Simple localStorage and sessionStorage mock
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  }
});

Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  }
});

// Suppress console warnings about test implementation details
const originalWarn = console.warn;
console.warn = function (msg, ...args) {
  if (typeof msg === 'string' && (
    msg.includes('The mutation should be static') ||
    msg.includes('react-dom') ||
    msg.includes('inside a test') ||
    msg.includes('createRoot') ||
    msg.includes('unmountComponentAtNode')
  )) {
    return;
  }
  originalWarn(msg, ...args);
};

// Suppress console errors about missing APIs in test environment
const originalError = console.error;
console.error = function (msg, ...args) {
  if (typeof msg === 'string' && (
    msg.includes('not wrapped in act') ||
    msg.includes('Cannot read properties of undefined')
  )) {
    return;
  }
  originalError(msg, ...args);
};

// Mock window.URL.createObjectURL
if (typeof window.URL.createObjectURL === 'undefined') {
  Object.defineProperty(window.URL, 'createObjectURL', {
    value: jest.fn().mockImplementation(() => 'blob:url')
  });
}

// Mock ResizeObserver (used by some UI components)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock fetch
global.fetch = jest.fn().mockImplementation(() => {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve('')
  });
});