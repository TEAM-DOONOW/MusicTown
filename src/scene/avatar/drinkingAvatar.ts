import { barDrinks, type BarDrinkId } from '../../data/bar';
import { findCoffee, type CoffeeId } from '../../data/coffeeMenu';

// Rest-pose landmarks of the front view's raised (viewer's right) arm.
const SHOULDER = { x: 291, y: 294 };
const FIST = { x: 329, y: 378 };
const FIST_RADIUS = 22;
// The cup sits beside the fist so the fingers overlap only its near side.
const CUP_OFFSET = { x: -24, y: -4 };
const CUP_TILT = 0.2;
const CUP_RIM = 25;

const REST_ELBOW = { x: 311, y: 346 };
const REST_HAND = { x: 329, y: 374 };

/**
 * The hand carries the cup rim to the mouth while the elbow stays low at the side, as a raised
 * forearm does in a front view. A fixed-length two-bone reach cannot get the short arm to the
 * mouth without folding the elbow up into the face, so both segments are drawn as stretchable tubes
 * of the arm cross-section instead.
 */
export function drinkingArmPose(lift: number) {
  const amount = Math.max(0, Math.min(1, lift));
  const eased = amount * amount * (3 - 2 * amount);
  const swing = Math.sin(eased * Math.PI);
  return {
    handX: REST_HAND.x + (285 - REST_HAND.x) * eased + swing * 56,
    handY: REST_HAND.y + (253.5 - REST_HAND.y) * eased,
    elbowX: REST_ELBOW.x + (318 - REST_ELBOW.x) * eased + swing * 14,
    elbowY: REST_ELBOW.y + (306 - REST_ELBOW.y) * eased,
  };
}

/** Where the cup rim sits for a pose, so the reach can be checked against the mouth. */
export function drinkingCupRim(lift: number) {
  const { handX, handY } = drinkingArmPose(lift);
  const tilt = -Math.max(0, Math.min(1, lift)) * CUP_TILT;
  return {
    x: handX + CUP_OFFSET.x + CUP_RIM * Math.sin(tilt),
    y: handY + CUP_OFFSET.y - CUP_RIM * Math.cos(tilt),
  };
}

// Everything of the arm outside the torso: the torso keeps its own side seam, so nothing of the
// shirt is erased with the arm.
function armRegion(ctx: CanvasRenderingContext2D) {
  ctx.beginPath();
  ctx.moveTo(283, 280);
  ctx.lineTo(306, 280);
  // Follow the sleeve's outer edge, so long hair beside the shoulder is never erased.
  ctx.lineTo(328, 316);
  ctx.lineTo(345, 350);
  ctx.lineTo(362, 358);
  ctx.lineTo(362, 408);
  ctx.lineTo(308, 408);
  ctx.lineTo(306, 368);
  ctx.lineTo(300, 336);
  ctx.closePath();
}
// The shoulder cover: the sleeve above the hem plus the torso beside it, so the upper arm reads as
// coming out from under the shirt. Only pixels that clearly differ from the arm colour are kept,
// so bare shoulders and long sleeves move with the arm instead of staying behind.
function sleeveZone(ctx: CanvasRenderingContext2D) {
  ctx.beginPath();
  ctx.moveTo(262, 280);
  ctx.lineTo(306, 280);
  ctx.lineTo(328, 316);
  ctx.lineTo(300, 337);
  ctx.lineTo(262, 337);
  ctx.closePath();
}

type ArmParts = {
  /** Arm pixels along the shoulder→fist axis, axis vertical at x = STRIP / 2. */
  strip: HTMLCanvasElement;
  /** One row across the arm, stretched into the upper-arm tube and the joints. */
  sliceRow: number;
  sliceLeft: number;
  sliceWidth: number;
  sleeve: HTMLCanvasElement;
};
const STRIP = 72;
const STRIP_PAD = 8;
const AXIS_ANGLE = Math.atan2(FIST.y - SHOULDER.y, FIST.x - SHOULDER.x);
const AXIS_LENGTH = Math.hypot(FIST.x - SHOULDER.x, FIST.y - SHOULDER.y);
const partsCache = new WeakMap<HTMLCanvasElement, ArmParts>();

function canvas(width: number, height: number) {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  return c;
}
/** Source point → strip coordinates (axis along +y). */
function toStrip(x: number, y: number) {
  const dx = x - SHOULDER.x,
    dy = y - SHOULDER.y;
  const c = Math.cos(AXIS_ANGLE),
    s = Math.sin(AXIS_ANGLE);
  return { x: STRIP / 2 + (dx * s - dy * c), y: STRIP_PAD + dx * c + dy * s };
}

function armParts(source: HTMLCanvasElement): ArmParts {
  const cached = partsCache.get(source);
  if (cached) return cached;
  const length = Math.ceil(AXIS_LENGTH + FIST_RADIUS + STRIP_PAD * 2);
  const strip = canvas(STRIP, length);
  const sctx = strip.getContext('2d')!;
  sctx.translate(STRIP / 2, STRIP_PAD);
  sctx.rotate(Math.PI / 2 - AXIS_ANGLE);
  sctx.translate(-SHOULDER.x, -SHOULDER.y);
  armRegion(sctx);
  sctx.clip();
  sctx.drawImage(source, 0, 0);
  // Sample the arm just below the elbow: skin for short sleeves, the cuff colour for long ones.
  const elbow = toStrip(REST_ELBOW.x, REST_ELBOW.y);
  const sliceRow = Math.round(elbow.y) - 4;
  const row = sctx.getImageData(0, sliceRow, STRIP, 1).data;
  // Grow the span outward from the middle of the opaque run while the colour stays the arm's, so the
  // shirt's side seam next to the arm never becomes a stripe along the tube.
  let first = -1,
    last = -1;
  for (let x = 0; x < STRIP; x++) {
    if (row[x * 4 + 3] > 200) {
      if (first < 0) first = x;
      last = x;
    }
  }
  const center = first < 0 ? STRIP / 2 : (first + last) >> 1;
  const mid = [row[center * 4], row[center * 4 + 1], row[center * 4 + 2]];
  const armLike = (x: number) =>
    row[x * 4 + 3] > 200 &&
    Math.abs(row[x * 4] - mid[0]) +
      Math.abs(row[x * 4 + 1] - mid[1]) +
      Math.abs(row[x * 4 + 2] - mid[2]) <
      70;
  let left = center,
    right = center;
  while (left > 0 && armLike(left - 1)) left--;
  while (right < STRIP - 1 && armLike(right + 1)) right++;
  if (right - left < 8) {
    left = STRIP / 2 - 12;
    right = STRIP / 2 + 12;
  }
  // A short sleeve (clearly not the arm colour) stays on the shoulder. Bare shoulders and long
  // sleeves match the arm, so that part moves with the arm instead. Decided once per avatar, as a
  // per-pixel split leaves outline shards of long sleeves behind.
  const sleeve = canvas(512, 512);
  const vctx = sleeve.getContext('2d')!;
  vctx.save();
  sleeveZone(vctx);
  vctx.clip();
  vctx.drawImage(source, 0, 0);
  vctx.restore();
  const zone = vctx.getImageData(258, 274, 74, 68);
  const d = zone.data;
  const torsoEdge = (y: number) => 283 + ((y - 280) * 17) / 56;
  let sleevePixels = 0,
    sleeveArmLike = 0;
  for (let i = 0; i < d.length; i += 4) {
    const x = 258 + ((i / 4) % 74),
      y = 274 + Math.floor(i / 4 / 74);
    if (d[i + 3] < 200 || x <= torsoEdge(y)) continue;
    sleevePixels++;
    const diff =
      Math.abs(d[i] - mid[0]) + Math.abs(d[i + 1] - mid[1]) + Math.abs(d[i + 2] - mid[2]);
    if (diff < 60) sleeveArmLike++;
  }
  if (sleeveArmLike * 2 > sleevePixels) {
    for (let i = 0; i < d.length; i += 4) {
      const x = 258 + ((i / 4) % 74),
        y = 274 + Math.floor(i / 4 / 74);
      if (x > torsoEdge(y)) d[i + 3] = 0;
    }
    vctx.putImageData(zone, 258, 274);
  }
  const parts = { strip, sliceRow, sliceLeft: left, sliceWidth: right - left + 1, sleeve };
  partsCache.set(source, parts);
  return parts;
}

/** A tube of the sampled arm cross-section from (x1,y1) to (x2,y2), with round ends. */
function drawTube(
  ctx: CanvasRenderingContext2D,
  parts: ArmParts,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) {
  const width = parts.sliceWidth;
  const length = Math.hypot(x2 - x1, y2 - y1);
  ctx.save();
  ctx.translate(x1, y1);
  ctx.rotate(Math.atan2(y2 - y1, x2 - x1) - Math.PI / 2);
  ctx.beginPath();
  ctx.roundRect(-width / 2, -width / 2, width, length + width, width / 2);
  ctx.clip();
  ctx.drawImage(
    parts.strip,
    parts.sliceLeft,
    parts.sliceRow,
    width,
    1,
    -width / 2,
    -width / 2,
    width,
    length + width,
  );
  ctx.restore();
}

/**
 * The forearm is the arm cross-section from the elbow to the hand; only the fist comes from the
 * artwork, moved rigidly so it stays round and keeps its shading. Cutting the forearm out of the
 * artwork as well left stepped edges and dragged the shirt's side seam along.
 */
function drawForearm(
  ctx: CanvasRenderingContext2D,
  parts: ArmParts,
  elbowX: number,
  elbowY: number,
  handX: number,
  handY: number,
  fistOnly = false,
) {
  if (!fistOnly) drawTube(ctx, parts, elbowX, elbowY, handX, handY);
  const restElbow = toStrip(REST_ELBOW.x, REST_ELBOW.y);
  const restHand = toStrip(REST_HAND.x, REST_HAND.y);
  const turn =
    Math.atan2(handY - elbowY, handX - elbowX) -
    Math.atan2(restHand.y - restElbow.y, restHand.x - restElbow.x);
  const fist = toStrip(FIST.x, FIST.y);
  ctx.save();
  ctx.translate(handX, handY);
  ctx.rotate(turn);
  ctx.translate(-restHand.x, -restHand.y);
  ctx.beginPath();
  ctx.arc(fist.x, fist.y, FIST_RADIUS, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(parts.strip, 0, 0);
  ctx.restore();
}

/** Cup and fingers share the same transformed palm anchor in every animation frame. */
export function drawDrinkingPose(
  ctx: CanvasRenderingContext2D,
  standing: HTMLCanvasElement,
  lift: number,
  coffee: CoffeeId,
  barDrink?: BarDrinkId,
  armSource = standing,
  hairLayer?: HTMLCanvasElement,
) {
  const drink = findCoffee(coffee);
  const parts = armParts(armSource);
  const { elbowX, elbowY, handX, handY } = drinkingArmPose(lift);
  {
    ctx.save();
    ctx.drawImage(standing, 0, 0, 512, 512, 0, 0, 512, 512);
    if (barDrink) {
      // Replace the seated resting arm with the original torso before drawing the reach.
      ctx.clearRect(275, 324, 82, 82);
      ctx.drawImage(armSource, 275, 324, 32, 82, 275, 324, 32, 82);
    }
    ctx.save();
    armRegion(ctx);
    ctx.clip();
    ctx.clearRect(275, 270, 90, 140);
    ctx.restore();
    // Restore stationary hair erased with the resting arm, before drawing the moving arm.
    if (hairLayer) {
      ctx.save();
      ctx.beginPath();
      armRegion(ctx);
      if (barDrink) ctx.rect(275, 324, 82, 82);
      ctx.clip();
      ctx.drawImage(hairLayer, 0, 0);
      ctx.restore();
    }
    // Upper arm and forearm meet in a round elbow, so no seam opens while the arm bends.
    // The upper arm comes out from under the shoulder cover; the forearm, cup and fist stay in
    // front of the chest when the cup is raised.
    drawTube(ctx, parts, SHOULDER.x, SHOULDER.y, elbowX, elbowY);
    ctx.drawImage(parts.sleeve, 0, 0);
    if (hairLayer) {
      ctx.save();
      sleeveZone(ctx);
      ctx.clip();
      ctx.drawImage(hairLayer, 0, 0);
      ctx.restore();
    }
    drawForearm(ctx, parts, elbowX, elbowY, handX, handY);
    drawTube(ctx, parts, elbowX, elbowY, elbowX, elbowY);
    ctx.save();
    ctx.translate(handX + CUP_OFFSET.x, handY + CUP_OFFSET.y);
    ctx.rotate(-Math.max(0, Math.min(1, lift)) * CUP_TILT);
    if (barDrink) {
      const color = barDrinks.find((drink) => drink.id === barDrink)!.color;
      ctx.fillStyle = '#edf3e8aa';
      ctx.strokeStyle = '#efe3c9';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-16, -25, 32, 38, 5);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.fillRect(-13, -12, 26, 21);
      ctx.fillStyle = '#ffffff88';
      ctx.fillRect(-10, -21, 3, 24);
    } else {
      ctx.fillStyle = drink.iced ? drink.color : '#fff3d7';
      ctx.beginPath();
      ctx.moveTo(-18, -24);
      ctx.lineTo(18, -24);
      ctx.lineTo(13, 13);
      ctx.lineTo(-13, 13);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#d4c5a7';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = drink.iced ? '#c8b58c' : '#648164';
      ctx.fillRect(-15, -11, 30, 13);
      ctx.fillStyle = drink.color;
      ctx.beginPath();
      ctx.ellipse(0, -24, 18, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      if (drink.iced) {
        ctx.fillStyle = '#e2eee1';
        ctx.globalAlpha = 0.85;
        ctx.fillRect(-11, -26, 9, 7);
        ctx.fillRect(3, -25, 8, 6);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#f1e3c0';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(7, -15);
        ctx.lineTo(7, -37);
        ctx.lineTo(1, -41);
        ctx.stroke();
      }
    }
    ctx.restore();
    // The fist wraps the near side of the cup, drawn once and only here.
    drawForearm(ctx, parts, elbowX, elbowY, handX, handY, true);
    ctx.restore();
  }
}
