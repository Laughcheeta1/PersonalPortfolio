import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { advanceDogGoal, aimDogGoal, shotDuration, dogGoalConfig as tuning, dogGoalFinished, goalCenter, newDogGoal, pressDogGoal } from './dog-goal';
import './dog-goal.css';

const instructions = {
  aim: 'Aim at a corner. Hold Shoot to build power, then release!',
  charging: 'Release to shoot! More power gives the keeper less time.',
  flight: 'The keeper commits…',
  goal: 'GOAL! Straight past the paws.',
  saved: 'Saved! Try a corner with more power.',
  miss: 'Just wide! Keep the target inside the posts.',
};

export function DogGoalGame() {
  const [game, setGame] = useState(newDogGoal);
  const state = useRef(game);
  const host = useRef<HTMLElement>(null);

  useEffect(() => {
    let previous = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const dt = (now - previous) / 1000;
      previous = now;
      if (!document.hidden && !host.current?.closest('[inert]') && !dogGoalFinished(state.current.phase)) {
        state.current = advanceDogGoal(state.current, dt);
        setGame(state.current);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const press = () => {
    state.current = pressDogGoal(state.current);
    setGame(state.current);
  };
  const aim = (x: number, y: number) => {
    state.current = aimDogGoal(state.current, x, y);
    setGame(state.current);
  };
  const center = goalCenter();
  const left = center - tuning.goalWidth / 2;
  const shot = game.phase === 'flight' || dogGoalFinished(game.phase);
  const travel = game.flight / shotDuration(game);
  const ballX = 320 + (game.aimX - 320) * travel;
  const ballY = 276 + (game.aimY - 276) * travel - Math.sin(travel * Math.PI) * 32;
  const ballRadius = 14 - 7 * travel;
  const dive = shot ? Math.max(-38, Math.min(38, (game.dogX - center) * .35)) : 0;
  const aimStyle = { '--dog-power': `${game.power * 100}%` } as CSSProperties;
  const matchOver = game.attempts >= tuning.shotsPerMatch;
  const result = matchOver ? (game.goals >= tuning.goalsToWin ? 'You win the shootout!' : 'The keeper wins this round.') : instructions[game.phase];
  const start = () => { if (state.current.phase !== 'flight' && state.current.phase !== 'charging') press(); };
  const release = () => { if (state.current.phase === 'charging') press(); };

  return (
    <section className={`dog-goal dog-goal--${game.phase}`} aria-label="Dog penalty shootout" ref={host} style={aimStyle}>
      <h2>Penalty shootout</h2>
      <p className="dog-goal__intro">Five penalties. Score three to win. Pick your spot and beat a very good dog.</p>
      <div className="dog-goal__score" aria-label={`${game.goals} goals from ${game.attempts} shots`}>
        <strong>{game.goals} goals · {game.attempts}/{tuning.shotsPerMatch} shots</strong>
        <span aria-hidden="true">{Array.from({ length: tuning.shotsPerMatch }, (_, i) => <i key={i} className={game.results[i] ?? 'pending'}>{game.results[i] === 'goal' ? '✓' : game.results[i] ? '×' : '·'}</i>)}</span>
      </div>
      <div className="dog-goal__pitch">
        <svg className="dog-goal__scene" viewBox="0 0 640 310" role="group" tabIndex={0} aria-label="Aim your penalty: tap the goal or use the arrow keys, then hold the Shoot button."
          onPointerDown={event => {
            const bounds = event.currentTarget.getBoundingClientRect();
            aim((event.clientX - bounds.left) / bounds.width * 640, (event.clientY - bounds.top) / bounds.height * 310);
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={event => {
            if (event.buttons !== 1) return;
            const bounds = event.currentTarget.getBoundingClientRect();
            aim((event.clientX - bounds.left) / bounds.width * 640, (event.clientY - bounds.top) / bounds.height * 310);
          }}
          onKeyDown={event => {
            const delta = { ArrowLeft: [-8, 0], ArrowRight: [8, 0], ArrowUp: [0, -8], ArrowDown: [0, 8] }[event.key];
            if (delta) { event.preventDefault(); aim(state.current.aimX + delta[0], state.current.aimY + delta[1]); }
          }}>
          <defs>
            <pattern id="dog-goal-net" width="18" height="18" patternUnits="userSpaceOnUse"><path d="M18 0H0V18" fill="none" stroke="#fff7dd" strokeOpacity=".5" strokeWidth="1.5" /></pattern>
          </defs>
          <path d="M0 0H640V310H0Z" fill="#c3d0a0" />
          <path d="M0 200H640V310H0Z" fill="#95ae7e" />
          <path d="M0 253H640M106 310 179 183H461L534 310M241 310Q320 256 399 310" fill="none" stroke="#f6efd1" strokeWidth="2" opacity=".65" />
          <g className="dog-goal__goal" transform={`translate(${left} 0)`}>
            <path d="M0 48 18 30H232L250 48V182H0Z" fill="#496b5533" />
            <path d="M0 48 18 30H232L250 48M18 30V168L0 182m232-152v138l18 14M18 168H232" fill="none" stroke="#f9efd0" strokeWidth="3" />
            <path d="M0 48H250V182H0Z" fill="url(#dog-goal-net)" />
            <path d="M0 182V48H250V182" fill="none" stroke="#fff9e7" strokeWidth="7" strokeLinejoin="round" />
          </g>
          <ellipse cx={game.dogX} cy="185" rx="36" ry="7" fill="#3e5c4333" />
          <g className="dog-goal__dog" transform={`translate(${game.dogX} ${game.dogY}) rotate(${dive})`} stroke="#68432c" strokeWidth="2.5" strokeLinejoin="round">
            <path d="M20 14q36-3 29-25" fill="none" stroke="#a56b3f" strokeWidth="10" strokeLinecap="round" />
            <path d="M-16 8-22 28q5 8 13 2l10-20m11-2 13 20q9 7 14-1L27 5" fill="#c89154" />
            <ellipse cy="0" rx="24" ry="29" fill="#b46e60" />
            <path d="M-20-6-43-18q-13 0-12 12l29 24m46-24 23-12q13 0 12 12L26 18" fill="#c89154" />
            <ellipse cx="-48" cy="-12" rx="10" ry="12" fill="#eee6c9" /><ellipse cx="48" cy="-12" rx="10" ry="12" fill="#eee6c9" />
            <path d="M-18-40q-27-10-23 19 2 19 17 8m42-27q27-10 23 19-2 19-17 8" fill="#855533" />
            <ellipse cy="-31" rx="25" ry="23" fill="#cf995f" />
            <ellipse cy="-22" rx="16" ry="11" fill="#f1d6a5" />
            <path d="m-5-25 5 5 5-5Z" fill="#493829" /><path d="M0-20v6m-8-22h1m14 0h1" strokeLinecap="round" strokeWidth="4" />
            <text x="0" y="12" textAnchor="middle" stroke="none" fill="#fff4d2" fontSize="19" fontWeight="800">1</text>
          </g>
          {!shot && <g className="dog-goal__crosshair" transform={`translate(${game.aimX} ${game.aimY})`} fill="none" stroke="#783f41" strokeWidth="2"><circle r="12" /><path d="M-18 0H18M0-18V18" /></g>}
          <g className="dog-goal__ball" transform={`translate(${ballX} ${ballY}) rotate(${travel * 420})`}>
            <circle r={ballRadius} fill="#fff8e5" stroke="#584d3f" strokeWidth="2" />
            <path d={`M0 ${-ballRadius * .6} ${ballRadius * .58} ${-ballRadius * .2} ${ballRadius * .36} ${ballRadius * .48} ${-ballRadius * .36} ${ballRadius * .48} ${-ballRadius * .58} ${-ballRadius * .2}Z`} fill="#584d3f" />
          </g>
          {dogGoalFinished(game.phase) && <g className="dog-goal__result"><rect x="205" y="227" width="230" height="43" rx="21" fill="#fff4dceF" /><text x="320" y="255" textAnchor="middle" fill="#68432c" fontWeight="800" fontSize="24">{game.phase === 'goal' ? 'GOAL!' : game.phase === 'saved' ? 'WHAT A SAVE!' : 'JUST WIDE!'}</text></g>}
        </svg>
      </div>
      <div className="dog-goal__power" role="meter" aria-label="Shot power" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(game.power * 100)}><span>Power</span><div><i /></div><b>{Math.round(game.power * 100)}%</b></div>
      <p className="dog-goal__status" role="status">{result}</p>
      <div className="dog-goal__controls">
        <button type="button" aria-disabled={game.phase === 'flight'}
          onPointerDown={event => { if (event.button !== 0) return; event.currentTarget.setPointerCapture(event.pointerId); start(); }}
          onPointerUp={release} onPointerCancel={release} onBlur={release}
          onKeyDown={event => { if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); if (!event.repeat) start(); } }}
          onKeyUp={event => { if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); release(); } }}
          onClick={event => { if (event.detail === 0) { if (state.current.phase === 'charging') release(); else start(); } }}
        >{dogGoalFinished(game.phase) ? matchOver ? 'Play again' : 'Next penalty' : game.phase === 'flight' ? 'Ball in flight…' : game.phase === 'charging' ? 'Release to shoot!' : 'Hold to shoot'}</button>
        <span>Tap / drag to aim · Arrow keys to aim · Hold Space to shoot</span>
      </div>
    </section>
  );
}
