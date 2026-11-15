// Keyboard + mouse state, translated into canvas coordinates.

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.mouseX = 0;
    this.mouseY = 0;
    this.mouseDown = false;
    this.clicked = null; // {x, y} consumed by the game each frame
    this.keys = {};
    this.pressed = {}; // keys pressed this frame
    this.wheel = 0;
    canvas.addEventListener('mousemove', (e) => {
      const r = canvas.getBoundingClientRect();
      this.mouseX = ((e.clientX - r.left) / r.width) * canvas.width;
      this.mouseY = ((e.clientY - r.top) / r.height) * canvas.height;
    });
    canvas.addEventListener('mousedown', (e) => {
      this.mouseDown = true;
      const r = canvas.getBoundingClientRect();
      this.clicked = {
        x: ((e.clientX - r.left) / r.width) * canvas.width,
        y: ((e.clientY - r.top) / r.height) * canvas.height,
        button: e.button,
      };
    });
    window.addEventListener('mouseup', () => { this.mouseDown = false; });
    window.addEventListener('keydown', (e) => {
      if (!e.repeat) this.pressed[e.key.toLowerCase()] = true;
      this.keys[e.key.toLowerCase()] = true;
      if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(e.key.toLowerCase())) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => { this.keys[e.key.toLowerCase()] = false; });
    canvas.addEventListener('wheel', (e) => { this.wheel += e.deltaY; e.preventDefault(); }, { passive: false });
  }

  endFrame() { this.clicked = null; this.pressed = {}; this.wheel = 0; }
  wasPressed(key) { return !!this.pressed[key.toLowerCase()]; }
  isDown(key) { return !!this.keys[key.toLowerCase()]; }
}
