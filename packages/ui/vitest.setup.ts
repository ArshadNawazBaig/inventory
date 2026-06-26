import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});

/**
 * jsdom polyfills for Radix UI primitives that use portalled, pointer-driven popovers
 * (Select, Dropdown, Popover, …). jsdom ships none of these, so without the shims Radix throws
 * when opening content in tests. Test-only, minimal no-ops.
 */
Element.prototype.scrollIntoView = function scrollIntoView() {};
Element.prototype.hasPointerCapture = function hasPointerCapture() {
  return false;
};
Element.prototype.setPointerCapture = function setPointerCapture() {};
Element.prototype.releasePointerCapture = function releasePointerCapture() {};

if (typeof globalThis.ResizeObserver === 'undefined') {
  class ResizeObserverShim {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  globalThis.ResizeObserver = ResizeObserverShim as unknown as typeof ResizeObserver;
}

if (typeof globalThis.PointerEvent === 'undefined') {
  class PointerEventShim extends MouseEvent {
    public readonly pointerId: number;
    public readonly pointerType: string;
    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params);
      this.pointerId = params.pointerId ?? 0;
      this.pointerType = params.pointerType ?? 'mouse';
    }
  }
  globalThis.PointerEvent = PointerEventShim as unknown as typeof PointerEvent;
}
