import { DOMMatrix } from "canvas";

// Polyfill DOMMatrix
if (!(global as any).DOMMatrix) {
  (global as any).DOMMatrix = DOMMatrix;
}

// Proper fake Path2D class
if (!(global as any).Path2D) {
  class FakePath2D {
    constructor(_path?: string | Path2D) {}
    moveTo() {}
    lineTo() {}
    bezierCurveTo() {}
    quadraticCurveTo() {}
    arc() {}
    arcTo() {}
    ellipse() {}
    rect() {}
    closePath() {}
    addPath() {}
  }
  (global as any).Path2D = FakePath2D;
}
