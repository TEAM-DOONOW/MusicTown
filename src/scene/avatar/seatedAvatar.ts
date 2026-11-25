/** Preserve all four view directions while bending the legs into a seated pose. */
export function composeSeatedAvatar(standing: HTMLCanvasElement) {
  const seated = document.createElement('canvas');
  seated.width = standing.width;
  seated.height = standing.height;
  const ctx = seated.getContext('2d')!;
  // Each cell keeps its own hair, face and clothing view.
  for (let cell = 0; cell < 4; cell++) {
    const view = document.createElement('canvas');
    view.width = view.height = 512;
    view.getContext('2d')!.drawImage(standing, cell * 512, 0, 512, 512, 0, 0, 512, 512);
    ctx.save();
    ctx.translate(cell * 512, 0);
    if (cell === 1 || cell === 3) {
      // The left view is composed as a mirrored right view, so both share one set of coordinates.
      const facing = cell === 1 ? view : mirror(view);
      ctx.save();
      if (cell === 3) {
        ctx.translate(512, 0);
        ctx.scale(-1, 1);
      }
      drawSideSeated(ctx, facing);
      ctx.restore();
      ctx.restore();
      continue;
    }
    // Lower legs hang from separated knees, with shoes pointing slightly outward.
    for (const [sourceX, x] of [
      [215, 192],
      [263, 283],
    ]) {
      // Rounded knees, so the shin tops never show square corners beside the shorts.
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x, 412, 37, 47, [14, 14, 0, 0]);
      ctx.clip();
      ctx.drawImage(view, sourceX, 410, 37, 40, x, 412, 37, 47);
      ctx.restore();
    }
    ctx.save();
    ctx.translate(208, 455);
    ctx.rotate(0.12);
    ctx.drawImage(view, 207, 448, 49, 29, -29, -2, 53, 30);
    ctx.restore();
    ctx.save();
    ctx.translate(303, 455);
    ctx.rotate(-0.12);
    ctx.drawImage(view, 258, 448, 49, 29, -24, -2, 53, 30);
    ctx.restore();
    // Rotate each thigh outward from the hip, rather than squashing standing legs.
    for (const [hip, angle, sourceX] of [
      [235, 0.7, 205],
      [277, -0.7, 256],
    ]) {
      ctx.save();
      ctx.translate(hip, 375);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.roundRect(-25, -5, 51, 50, 16);
      ctx.clip();
      // Shorts only: including the shin below the hem left sharp skin shards at the knee.
      ctx.drawImage(view, sourceX, 369, 51, 40, -25, -5, 51, 50);
      ctx.restore();
    }
    // Keep the upper body at its native proportions and rest the hands on the lap.
    ctx.drawImage(view, 217, 371, 78, 24, 217, 370, 78, 30);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, 512, 330);
    ctx.rect(205, 330, 102, 41);
    ctx.clip();
    ctx.drawImage(view, 0, 0, 512, 371, 0, 0, 512, 371);
    ctx.restore();
    ctx.save();
    ctx.translate(203, 324);
    ctx.rotate(-0.42);
    ctx.drawImage(view, 160, 324, 47, 73, -43, 0, 47, 73);
    ctx.restore();
    ctx.save();
    ctx.translate(309, 324);
    ctx.rotate(0.42);
    ctx.drawImage(view, 305, 324, 47, 73, -4, 0, 47, 73);
    ctx.restore();
    ctx.restore();
  }
  return seated;
}

function mirror(view: HTMLCanvasElement) {
  const flipped = document.createElement('canvas');
  flipped.width = view.width;
  flipped.height = view.height;
  const ctx = flipped.getContext('2d')!;
  ctx.translate(view.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(view, 0, 0);
  return flipped;
}

/**
 * Right-facing side view: the thigh reaches forward from the hip, the shin hangs straight down
 * from the knee and the shoe points forward, so the leg reads as one bent limb on a seat.
 */
function drawSideSeated(ctx: CanvasRenderingContext2D, view: HTMLCanvasElement) {
  // Shin and shoe first, so the thigh covers the top of the shin at the knee.
  ctx.drawImage(view, 236, 410, 34, 38, 297, 398, 34, 48);
  ctx.drawImage(view, 226, 446, 68, 31, 290, 442, 68, 31);
  // Bare knee showing past the shorts hem.
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(292, 381, 40, 27, 13);
  ctx.clip();
  ctx.drawImage(view, 240, 412, 26, 28, 292, 381, 40, 27);
  ctx.restore();
  // Shorts over the thigh, stretched from a clean slice beside the hand.
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(214, 372, 98, 36, [0, 16, 16, 0]);
  ctx.clip();
  ctx.drawImage(view, 217, 372, 16, 36, 214, 372, 98, 36);
  ctx.restore();
  // Upper body, arm and the hand resting on the lap stay at their native proportions.
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, 512, 404);
  ctx.clip();
  ctx.drawImage(view, 0, 0, 512, 410, 0, 0, 512, 410);
  ctx.restore();
}
