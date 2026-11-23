// Duel Kartu Pasar — keyboard and mouse input. The game reads one plain
// object per frame: the mouse position for card hover, a one-shot click in
// canvas coordinates, and a one-shot key press.

export function createInput(canvas) {
  const input = { hover: null, click: null, key: null };

  canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    input.hover = {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    };
  });
  canvas.addEventListener('mouseleave', () => {
    input.hover = null;
  });
  canvas.addEventListener('mousedown', (event) => {
    const rect = canvas.getBoundingClientRect();
    input.click = {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    };
  });
  window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
      event.preventDefault();
    }
    if (!event.repeat) input.key = key;
  });
  return input;
}

/** Hand the frame's input to the world, then clear the one-shot edges. */
export function consumeInput(input) {
  const frame = { click: input.click, hover: input.hover, key: input.key };
  input.click = null;
  input.key = null;
  return frame;
}
