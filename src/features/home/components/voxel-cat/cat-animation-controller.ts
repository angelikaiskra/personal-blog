/** Seconds and radians; all idle tuning lives here. */
export const CAT_IDLE = {
  breath: { duration: 3.8, inhale: 0.42, depth: 0.018 },
  blink: { interval: [2, 4.5], close: 0.1, hold: 0.065, open: 0.2, doubleChance: 0.2, doubleGap: 0.16 },
  ear: { interval: [3, 6], attack: 0.16, hold: 0.12, release: 0.7, amplitude: [0.07, 0.11] },
  tail: { interval: [0.9, 2.4], attack: 0.6, hold: 0.2, release: 1.15, delay: 0.18, amplitude: [0.17, 0.28] },
  tailDrift: {
    speed: 0.95,
    modulationSpeed: 0.17,
    strength: 0.7,
    variation: 0.3,
    tail2: 0.03,
    tail3: 0.075,
    tail4: 0.11,
    phaseLag: 0.3,
  },
  head: { pitchRatio: 0.35, interval: [4, 8], attack: 0.85, hold: 0.65, release: 1.3, amplitude: [0.065, 0.1] },
  maxDelta: 0.05,
} as const;

export type CatPose = {
  breath: number;
  eyeOpen: number;
  headYaw: number;
  headPitch: number;
  earL: number;
  earR: number;
  tail2: number;
  tail3: number;
  tail4: number;
};

export const neutralCatPose = (): CatPose => ({
  breath: 0,
  eyeOpen: 1,
  headYaw: 0,
  headPitch: 0,
  earL: 0,
  earR: 0,
  tail2: 0,
  tail3: 0,
  tail4: 0,
});

const smooth = (t: number) => {
  const x = Math.max(0, Math.min(1, t));
  // Floating-point cancellation near 1 can otherwise exceed the pose range by an epsilon.
  return Math.max(0, Math.min(1, x * x * x * (x * (x * 6 - 15) + 10)));
};
const envelope = (t: number, attack: number, hold: number, release: number) =>
  t < 0 ? 0 : t < attack ? smooth(t / attack) : 1 - smooth((t - attack - hold) / release);

type GestureKind = 'ear' | 'tail' | 'head';
type Gesture = { kind: GestureKind; start: number; end: number; amplitude: number; side: number; direction: number };

/** Pure clock/pose calculator. Random choices happen at event boundaries, never per frame. */
export function createCatAnimationController(random: () => number = Math.random) {
  const pose = neutralCatPose();
  const between = ([min, max]: readonly [number, number]) => min + random() * (max - min);
  let time = 0;
  const gestures: Partial<Record<GestureKind, Gesture>> = {};
  let blinkStart = -Infinity;
  let doubleBlink = false;
  let blinkAt = 0;
  const due = { ear: 0, tail: 0, head: 0 };
  const kinds: GestureKind[] = ['ear', 'tail', 'head'];
  const blinkDuration = CAT_IDLE.blink.close + CAT_IDLE.blink.hold + CAT_IDLE.blink.open;

  function reset() {
    time = 0;
    for (const kind of kinds) delete gestures[kind];
    blinkStart = -Infinity;
    doubleBlink = false;
    blinkAt = between(CAT_IDLE.blink.interval);
    for (const kind of kinds) due[kind] = between(CAT_IDLE[kind].interval);
    Object.assign(pose, neutralCatPose());
    return pose;
  }

  function update(deltaSeconds: number): CatPose {
    if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) return pose;
    time += deltaSeconds;

    // Absolute event times preserve the same RNG order and rhythm at 30, 60 and 120 Hz.
    for (;;) {
      let kind = kinds[0];
      for (const candidate of kinds) if (due[candidate] < due[kind]) kind = candidate;
      const gestureAt = due[kind];
      if (Math.min(blinkAt, gestureAt) > time) break;
      if (blinkAt <= gestureAt) {
        blinkStart = blinkAt;
        doubleBlink = random() < CAT_IDLE.blink.doubleChance;
        blinkAt +=
          blinkDuration +
          (doubleBlink ? CAT_IDLE.blink.doubleGap + blinkDuration : 0) +
          between(CAT_IDLE.blink.interval);
      } else {
        const config = CAT_IDLE[kind];
        const end =
          gestureAt + config.attack + config.hold + config.release + (kind === 'tail' ? CAT_IDLE.tail.delay : 0);
        gestures[kind] = {
          kind,
          start: gestureAt,
          end,
          amplitude: between(config.amplitude),
          side: random() < 0.5 ? -1 : 1,
          direction: random() < 0.5 ? -1 : 1,
        };
        due[kind] = end + between(config.interval);
      }
    }

    const phase = (time % CAT_IDLE.breath.duration) / CAT_IDLE.breath.duration;
    pose.breath =
      phase < CAT_IDLE.breath.inhale
        ? smooth(phase / CAT_IDLE.breath.inhale)
        : 1 - smooth((phase - CAT_IDLE.breath.inhale) / (1 - CAT_IDLE.breath.inhale));
    const blink = CAT_IDLE.blink;
    const elapsed = time - blinkStart;
    const closing = envelope(elapsed, blink.close, blink.hold, blink.open);
    const second = doubleBlink
      ? envelope(elapsed - blinkDuration - blink.doubleGap, blink.close, blink.hold, blink.open)
      : 0;
    pose.eyeOpen = 1 - Math.max(closing, second);
    pose.headYaw = pose.headPitch = pose.earL = pose.earR = 0;
    // A slow amplitude modulation keeps the baseline from repeating like a pendulum.
    const drift = CAT_IDLE.tailDrift;
    const strength = drift.strength + Math.sin(time * drift.modulationSpeed) * drift.variation;
    const tailPhase = time * drift.speed;
    pose.tail2 = Math.sin(tailPhase) * drift.tail2 * strength;
    pose.tail3 = Math.sin(tailPhase - drift.phaseLag) * drift.tail3 * strength;
    pose.tail4 = Math.sin(tailPhase - 2 * drift.phaseLag) * drift.tail4 * strength;
    for (const kind of kinds) {
      const gesture = gestures[kind];
      if (!gesture || time >= gesture.end) continue;
      const config = CAT_IDLE[gesture.kind];
      const elapsed = time - gesture.start;
      const value = gesture.amplitude * envelope(elapsed, config.attack, config.hold, config.release);
      if (gesture.kind === 'ear') {
        if (gesture.side < 0) pose.earL = -value * gesture.direction;
        else pose.earR = value * gesture.direction;
      } else if (gesture.kind === 'head') {
        pose.headYaw = value * gesture.side;
        pose.headPitch = value * CAT_IDLE.head.pitchRatio * gesture.direction;
      } else {
        pose.tail3 += value * gesture.side * 0.65;
        pose.tail4 +=
          gesture.amplitude *
          gesture.side *
          envelope(elapsed - CAT_IDLE.tail.delay, config.attack, config.hold, config.release);
      }
    }
    return pose;
  }

  reset();
  return { update, reset };
}
