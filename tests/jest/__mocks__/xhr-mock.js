/* global jest */
const xhrMockClass = jest.fn({
  open: jest.fn(),
  send: jest.fn(),
  setRequestHeader: jest.fn(),
  addEventListener: jest.fn(),
});

window.XMLHttpRequest = jest.fn().mockImplementation(xhrMockClass);
global.XMLHttpRequest = window.XMLHttpRequest;
