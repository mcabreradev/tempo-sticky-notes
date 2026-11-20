// Test environment setup: jsdom misses PointerEvent capture APIs and, in
// some versions, PointerEvent itself. The app relies on both, so tests run
// against minimal stubs; real-pointer behavior is verified in the browser.

class PointerEventStub extends MouseEvent {
  public readonly pointerId: number
  public readonly pointerType: string
  public readonly isPrimary: boolean

  constructor(type: string, init: PointerEventInit = {}) {
    super(type, init)
    this.pointerId = init.pointerId ?? 1
    this.pointerType = init.pointerType ?? 'mouse'
    this.isPrimary = init.isPrimary ?? true
  }
}

if (typeof window !== 'undefined' && typeof window.PointerEvent === 'undefined') {
  // @ts-expect-error - stubbing the missing constructor for jsdom
  window.PointerEvent = PointerEventStub
}

if (typeof Element !== 'undefined') {
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = () => {}
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = () => {}
  }
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => true
  }
}
