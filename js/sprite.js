// sprite.js — draws pixel art on a <canvas> and keeps it moving.
//
// A frame can be either:
//   - a list of rectangles [color letter, x, y, w, h]  (the placeholders)
//   - a list of strings, one letter per pixel, '.' = empty (the hub's style)
// Colors come from PAL in data/sprites.js. Every frame gets the same dark
// outline as the hub's sprites. Animations play forward then backward,
// so 4 drawn frames make a smooth 6-frame loop.

const OUTLINE = '#0d0b12';
const stillMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Turn one frame into a size x size grid of colors (null = empty). */
function framePixels(frame, size) {
  const grid = Array.from({ length: size }, () => Array(size).fill(null));
  if (typeof frame[0] === 'string') {
    frame.forEach((row, y) => [...row].forEach((ch, x) => {
      if (ch !== '.' && y < size && x < size) grid[y][x] = PAL[ch];
    }));
    return grid;
  }
  for (const [ch, x0, y0, w, h] of frame) {
    for (let y = Math.max(0, y0); y < Math.min(size, y0 + h); y++) {
      for (let x = Math.max(0, x0); x < Math.min(size, x0 + w); x++) grid[y][x] = PAL[ch];
    }
  }
  return grid;
}

/** Draw one frame onto a canvas: ground shadow, outline, then the pixels. */
function drawFrame(canvas, frame) {
  const size = canvas.width;
  const g = canvas.getContext('2d');
  const px = framePixels(frame, size);
  const solid = (x, y) => y >= 0 && y < size && x >= 0 && x < size && px[y][x];
  g.clearRect(0, 0, size, size);

  if (size === 32) { // a soft shadow under Mara's feet
    g.fillStyle = 'rgba(0, 0, 0, .35)';
    g.fillRect(6, 30, 20, 1);
  }

  g.fillStyle = OUTLINE;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (solid(x, y)) continue;
      if (solid(x + 1, y) || solid(x - 1, y) || solid(x, y + 1) || solid(x, y - 1)) g.fillRect(x, y, 1, 1);
    }
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!px[y][x]) continue;
      g.fillStyle = px[y][x];
      g.fillRect(x, y, 1, 1);
    }
  }
}

// Every canvas that's animating right now, and what it's playing.
const playing = new Map();

/**
 * Play an animation ({ fps, frames }) on a canvas. Call it again on the
 * same canvas to switch animations. A canvas that leaves the page stops
 * by itself.
 */
function playSprite(canvas, anim) {
  if (!canvas || !anim) return;
  playing.set(canvas, { anim, start: performance.now(), shown: -1 });
  drawFrame(canvas, anim.frames[0]);
}

// Forward then back: 0 1 2 3 2 1 0 1 2 ...
function pingPong(step, count) {
  if (count < 2) return 0;
  const cycle = 2 * count - 2;
  const i = step % cycle;
  return i < count ? i : cycle - i;
}

function tick(now) {
  for (const [canvas, state] of playing) {
    if (!canvas.isConnected) { playing.delete(canvas); continue; }
    const fps = stillMotion ? 0.5 : state.anim.fps; // slow, not frozen: the demo still teaches
    const step = Math.floor(((now - state.start) / 1000) * fps);
    const index = pingPong(step, state.anim.frames.length);
    if (index !== state.shown) {
      drawFrame(canvas, state.anim.frames[index]);
      state.shown = index;
    }
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

/** The animation for an exercise id (falls back to Mara standing). */
function exerciseSprite(exerciseId) {
  const ex = EXERCISES[exerciseId];
  return SPRITES[ex && ex.sprite] || SPRITES.idle;
}
