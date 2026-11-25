import type { MutableRefObject } from 'react';
import type { Position } from '../../types/park';
import type { Stage } from '../../data/model';
import type { SoundEffect } from '../../data/sounds';
import { Button } from '../ui/Button';
import { Flaticon } from '../ui/Flaticon';
import { MovementJoystick } from './MovementJoystick';
import { reactions } from './PerformanceControls';
import { playerScreen } from '../../scene/park/playerScreen';
import './portrait-controls.css';

/** Bottom control deck used when a phone is held upright: joystick left, actions right. */
export function PortraitControls({
  motion,
  near,
  performing,
  onStage,
  onStages,
  onReaction,
  onNothing,
}: {
  motion: MutableRefObject<Position>;
  near: Stage | null;
  performing: number | null;
  onStage: (stage: Stage) => void;
  onStages: () => void;
  onReaction: (symbol: string, sound: SoundEffect) => void;
  onNothing: () => void;
}) {
  // Presses the on-screen bubble (resident, bench, cafe, bar, notice board) closest to the player.
  const interact = () => {
    const canvas = document.getElementById('park');
    const origin = canvas?.getBoundingClientRect();
    const player =
      origin && Number.isFinite(playerScreen.x)
        ? { x: origin.left + playerScreen.x, y: origin.top + playerScreen.y }
        : origin
          ? { x: origin.left + origin.width / 2, y: origin.top + origin.height / 2 }
          : null;
    const bubble = [...document.querySelectorAll<HTMLButtonElement>('#app .bench-action')]
      .filter(
        (b) =>
          !b.hidden &&
          !b.disabled &&
          b.style.visibility !== 'hidden' &&
          getComputedStyle(b).display !== 'none' &&
          b.getClientRects().length > 0,
      )
      .map((b) => {
        const r = b.getBoundingClientRect();
        const d = player ? Math.hypot(r.left + r.width / 2 - player.x, r.bottom - player.y) : 0;
        return { b, d };
      })
      // Bubbles such as the bar sign show whenever on screen; only accept ones beside the player.
      .filter(({ d }) => !origin || d < origin.height * 0.4)
      .sort((a, c) => a.d - c.d)[0]?.b;
    if (bubble) bubble.click();
    else if (near) onStage(near);
    else onNothing();
  };
  return (
    <section className="portrait-controls" aria-label="조작">
      <MovementJoystick
        motion={motion}
        id="portrait-joystick"
        stickId="portrait-stick"
        className="portrait-movement"
        radius={52}
        travel={34}
      />
      <div className="portrait-actions">
        <div className="portrait-main-actions">
          <Button
            className="portrait-action portrait-busking"
            disabled={performing !== null}
            onClick={() => (near ? onStage(near) : onStages())}
          >
            <span className="portrait-action-icon">
              <Flaticon name="microphone" size={30} />
            </span>
            <small>버스킹</small>
          </Button>
          <Button className="portrait-action portrait-interact" onClick={interact}>
            <span className="portrait-action-icon">
              <Flaticon name="chat" size={30} />
            </span>
            <small>상호작용</small>
          </Button>
        </div>
        {performing === null && (
          <div className="portrait-reactions">
            {reactions.map((r) => (
              <Button
                key={r.s}
                aria-label={r.label + ' 보내기'}
                onClick={() => onReaction(r.s, r.sound)}
              >
                <Flaticon name={r.icon} size={r.size + 2} />
                <small>{r.label}</small>
              </Button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
