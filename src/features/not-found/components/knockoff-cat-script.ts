import * as THREE from 'three';
import { DIGIT_W, DIGIT_Z, dropIn, isStanding, shove, wobble, type Digit } from './knockoff-digits';
import type { KnockoffStatus } from './knockoff-scene';

/**
 * The cat's choreography. Each step is a generator: every `yield` waits one frame and receives
 * that frame's delta, already scaled by the rush speed. The frame loop drives the running script,
 * so it pauses with the page, and cancelling it is just dropping it.
 */
type Script = Generator<void, void, number>;

const CAT_HOME = { x: 9, z: -1.2, yaw: -0.47 };
/** Facing mostly left: the camera-side (left) paw does the swatting. */
const SWAT_YAW = -1.15;
/** How far ahead of the cat's origin the raised paw lands, and how far off-centre it sits. */
const PAW_REACH = 8.6;
const PAW_SIDE = 2.07;

const CAT_REST = {
  ...CAT_HOME,
  hop: 0,
  squash: 0,
  lean: 0,
  paw: 0,
  pawOut: 0,
  /** Head override on top of the idle and cursor pose, blended in by `focus`. */
  focus: 0,
  lookYaw: 0,
  lookPitch: 0,
};

/**
 * Choreography speed. Each click on the cat raises the target a step; the speed eases
 * towards it, and once the clicks stop the target drifts back to normal.
 */
const RUSH = { step: 0.2, max: 2, rise: 0.2, hold: 0.4, fall: 0.6 };

const smooth = (t: number) => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
};
const lerp = THREE.MathUtils.lerp;

/** Where the cat sits to swat a digit's right-hand face with its left front paw. */
function swatSpot(digitX: number) {
  const forwardX = Math.sin(SWAT_YAW);
  const forwardZ = Math.cos(SWAT_YAW);
  // The model's own +X (its left side) in world space.
  const leftX = Math.cos(SWAT_YAW);
  const leftZ = -Math.sin(SWAT_YAW);
  const contactX = digitX + DIGIT_W / 2 + 0.15;
  const contactZ = DIGIT_Z;
  return {
    x: contactX - forwardX * PAW_REACH - leftX * PAW_SIDE,
    z: contactZ - forwardZ * PAW_REACH - leftZ * PAW_SIDE,
    yaw: SWAT_YAW,
  };
}

/** Calls `step` with progress 0..1 once per frame for `duration` seconds. */
function* tween(duration: number, step: (k: number) => void): Script {
  let elapsed = 0;
  for (;;) {
    elapsed += yield;
    const k = Math.min(1, elapsed / duration);
    step(k);
    if (k >= 1) return;
  }
}
const wait = (seconds: number) => tween(seconds, () => {});

type CatScriptOptions = {
  digits: Digit[];
  /** Where the cat looks once the shelf is empty: the "Put it back" button. */
  buttonSpot: THREE.Vector3;
  setStatus: (status: KnockoffStatus) => void;
};

export function createCatScript({ digits, buttonSpot, setStatus }: CatScriptOptions) {
  const pose = { ...CAT_REST };
  /** What the eyes follow while the script runs: a digit (even mid-fall), a fixed spot, or rest. */
  let gaze: Digit | THREE.Vector3 | null = null;
  let script: Script | null = null;
  /** True while a `patience` pause runs; a click on the cat ends it. */
  let waiting = false;
  let rush = 1;
  let rushTarget = 1;
  /** Seconds since the last click on the cat. */
  let rushIdle = 0;

  /** Ease the head override to a target. */
  const look = (yaw: number, pitch: number, focus: number, duration: number) => {
    const from = { yaw: pose.lookYaw, pitch: pose.lookPitch, focus: pose.focus };
    return tween(duration, (k) => {
      const e = smooth(k);
      pose.lookYaw = lerp(from.yaw, yaw, e);
      pose.lookPitch = lerp(from.pitch, pitch, e);
      pose.focus = lerp(from.focus, focus, e);
    });
  };

  const turn = (yaw: number, duration: number) => {
    const from = pose.yaw;
    return tween(duration, (k) => (pose.yaw = lerp(from, yaw, smooth(k))));
  };

  function* hop(to: { x: number; z: number; yaw: number }): Script {
    const distance = Math.hypot(to.x - pose.x, to.z - pose.z);
    const air = 0.3 + Math.min(distance, 12) * 0.018;
    const height = 1.6 + Math.min(distance, 12) * 0.12;
    yield* tween(0.14, (k) => (pose.squash = 0.12 * smooth(k)));
    const from = { x: pose.x, z: pose.z, yaw: pose.yaw };
    yield* tween(air, (k) => {
      pose.x = lerp(from.x, to.x, k);
      pose.z = lerp(from.z, to.z, k);
      pose.yaw = lerp(from.yaw, to.yaw, smooth(k));
      pose.hop = 4 * height * k * (1 - k);
      pose.squash = k < 0.25 ? lerp(0.12, -0.08, k / 0.25) : lerp(-0.08, 0, (k - 0.25) / 0.75);
    });
    pose.hop = 0;
    yield* tween(0.1, (k) => (pose.squash = 0.1 * Math.sin(k * Math.PI)));
    pose.squash = 0;
  }

  /** Raise the paw over `windUp` seconds, then a quick tap. */
  function* tap(onContact: () => void, windUp = 0.3): Script {
    yield* tween(windUp, (k) => {
      const e = smooth(k);
      pose.paw = -1.45 * e;
      pose.pawOut = 0.12 * e;
      pose.lean = -0.04 * e;
    });
    yield* tween(0.07, (k) => (pose.paw = lerp(-1.45, -1.12, k)));
    onContact();
    yield* tween(0.32, (k) => {
      const e = smooth(k);
      pose.paw = lerp(-1.12, 0, e);
      pose.pawOut = lerp(0.12, 0, e);
      pose.lean = lerp(-0.04, 0, e);
    });
  }

  /** A wait the visitor can cut short by clicking the cat. */
  function* patience(seconds: number): Script {
    let elapsed = 0;
    waiting = true;
    while (waiting && elapsed < seconds) elapsed += yield;
    waiting = false;
  }

  function* knockEverything(): Script {
    yield* patience(1.6);
    for (;;) {
      const digit = digits.findLast(isStanding);
      if (!digit) break;
      gaze = digit;
      // Notice it, go over.
      yield* look(0.35, 0.15, 1, 0.35);
      yield* wait(0.25);
      yield* look(0, 0.3, 1, 0.2);
      yield* hop(swatSpot(digit.home.x));
      yield* look(0, 0.3, 1, 0.25);
      yield* wait(0.3);

      if (isStanding(digit)) {
        // Tap. Watch it rock. Look at you. Shove.
        yield* tap(() => wobble(digit));
        yield* wait(0.45);
        gaze = null;
        yield* look(0.75, -0.05, 1, 0.3);
        yield* wait(0.55);
        gaze = digit;
        yield* look(0, 0.3, 1, 0.25);
        yield* tap(() => shove(digit), 0.22);
      }
      // Follow it down.
      yield* look(0.6, 0.62, 1, 0.3);
      yield* wait(0.55);
      yield* look(0.7, 0, 0.6, 0.45);
      gaze = null;
      yield* patience(1.1);
    }

    // Nothing left to knock over: face the audience, very pleased, and eye the button.
    gaze = buttonSpot;
    yield* turn(-0.25, 0.45);
    yield* look(0, 0, 0, 0.4);
    setStatus('empty');
  }

  function* rebuildScript(): Script {
    setStatus('rebuilding');
    yield* hop(CAT_HOME);
    yield* look(0.3, -0.35, 1, 0.3);
    digits.forEach((digit, i) => dropIn(digit, i * 0.14));
    // Watch them rain back in, the middle one for all three.
    gaze = digits[1];
    yield* look(0.25, 0.1, 1, 0.6);
    yield* wait(0.5);
    gaze = null;
    yield* look(0, 0, 0, 0.4);
    setStatus('playing');
    yield* knockEverything();
  }

  const step = (dt: number) => {
    if (script?.next(dt).done) script = null;
  };
  const stop = () => {
    script = null;
    waiting = false;
    rush = rushTarget = 1;
    rushIdle = 0;
  };
  /** Replace whatever is running; the first step runs up to the script's first `yield`. */
  const run = (next: () => Script) => {
    stop();
    script = next();
    step(0);
  };

  return {
    pose,
    get gaze() {
      return gaze;
    },
    play: () => run(knockEverything),
    rebuild: () => run(rebuildScript),
    /** A click on the cat: skip the current pause and nudge the speed up a step. */
    hurry() {
      rushTarget = Math.min(RUSH.max, rushTarget + RUSH.step);
      rushIdle = 0;
      if (!waiting) return;
      waiting = false;
      step(0);
    },
    update(dt: number) {
      rushIdle += dt;
      if (rushIdle > RUSH.hold) rushTarget = Math.max(1, rushTarget - ((RUSH.max - 1) / RUSH.fall) * dt);
      // Exponential approach: about 95% of the way there after `rise` seconds.
      rush += (rushTarget - rush) * (1 - Math.exp((-3 * dt) / RUSH.rise));
      step(dt * rush);
    },
    /** Stop the script and put the cat back on its mark. */
    reset() {
      stop();
      gaze = null;
      Object.assign(pose, CAT_REST);
    },
  };
}
