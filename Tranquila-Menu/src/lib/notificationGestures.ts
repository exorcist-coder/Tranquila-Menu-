export type Swipe = { dx: number; dy: number; elapsed: number; width: number };

/** Ignore small taps; accept a deliberate drag or a short, fast flick. */
export function shouldDismissNotification({ dx, dy, elapsed, width }: Swipe): boolean {
  const horizontal = Math.abs(dx) >= Math.abs(dy);
  const distance = Math.abs(horizontal ? dx : dy);
  const threshold = horizontal ? Math.max(40, Math.min(90, width * 0.22)) : 40;
  return distance >= threshold || (distance >= 24 && elapsed > 0 && distance / elapsed >= 0.6);
}

export function notificationBottom(viewportHeight: number, obstructionTops: number[], keyboardInset = 0) {
  return Math.ceil(Math.max(12 + keyboardInset, ...obstructionTops.map(top => viewportHeight - top + 12)));
}
