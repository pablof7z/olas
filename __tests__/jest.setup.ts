// Basic Jest setup file
// Add any global mocks or setup needed for tests 
// Polyfill setImmediate for Jest
if (typeof setImmediate === 'undefined') {
  // @ts-ignore
  global.setImmediate = (cb: () => void) => setTimeout(cb, 0);
}