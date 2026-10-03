// Sample a bowed flight path, with every point inside the visible viewport.
export function bugFlightPath(start, end, bounds) {
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
  const dx = end.x - start.x, dy = end.y - start.y;
  const distance = Math.hypot(dx, dy) || 1;
  const bow = Math.min(110, distance * .3);
  const control = {
    x: clamp((start.x + end.x) / 2 - dy / distance * bow, bounds.left, bounds.right),
    y: clamp((start.y + end.y) / 2 + dx / distance * bow, bounds.top, bounds.bottom),
  };
  return Array.from({ length: 25 }, (_, index) => {
    const t = index / 24, u = 1 - t;
    return {
      x: u * u * start.x + 2 * u * t * control.x + t * t * end.x,
      y: u * u * start.y + 2 * u * t * control.y + t * t * end.y,
      bank: Math.sin(Math.PI * t) * Math.sign(dx) * 9,
    };
  });
}
