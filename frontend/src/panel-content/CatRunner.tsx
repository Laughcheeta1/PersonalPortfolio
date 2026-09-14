import { useEffect, useRef, useState } from 'react';
import { advanceCatRun, catRunnerConfig as tuning, runnerObstacles, jumpCatRun, releaseCatRun, jumpHeight, newCatRun, runDistance } from './cat-runner';
import './cat-runner.css';

export function CatRunner() {
  const [run, setRun] = useState(newCatRun);
  const runRef = useRef(run);
  const host = useRef<HTMLElement>(null);
  const audio = useRef<AudioContext | null>(null);
  const [sound, setSound] = useState(false);
  const lastMeow = useRef(-1);
  const [best, setBest] = useState(0);
  const score = Math.floor(runDistance(run.elapsed) / 10);
  useEffect(() => { setBest(previous => Math.max(previous, score)); }, [score]);
  const progress = Math.floor(run.elapsed / tuning.duration * 100);
  const meowing = run.status === 'won' || (run.status === 'running' && run.elapsed % tuning.meowInterval < 1);

  useEffect(() => () => { void audio.current?.close(); }, []);
  useEffect(() => {
    if (run.status !== 'running') return;
    let frame = 0;
    let previous = performance.now();
    const tick = (now: number) => {
      const dt = (now - previous) / 1000;
      previous = now;
      // Leaving the roses panel or switching tabs pauses the journey.
      if (!document.hidden && !host.current?.closest('[inert]')) {
        const next = advanceCatRun(runRef.current, dt);
        runRef.current = next;
        setRun(next);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [run.status]);

  const meowNumber = Math.floor(run.elapsed / tuning.meowInterval);
  useEffect(() => {
    if (run.status !== 'running' || lastMeow.current === meowNumber) return;
    lastMeow.current = meowNumber;
    const context = audio.current;
    if (!sound || !context || context.state !== 'running') return;
    const voice = context.createOscillator();
    const gain = context.createGain();
    voice.type = 'triangle';
    voice.frequency.setValueAtTime(650, context.currentTime);
    voice.frequency.exponentialRampToValueAtTime(950, context.currentTime + .12);
    voice.frequency.exponentialRampToValueAtTime(420, context.currentTime + .48);
    gain.gain.setValueAtTime(0, context.currentTime);
    gain.gain.linearRampToValueAtTime(.06, context.currentTime + .06);
    gain.gain.linearRampToValueAtTime(0, context.currentTime + .5);
    voice.connect(gain).connect(context.destination);
    voice.start();
    voice.stop(context.currentTime + .5);
    voice.onended = () => { voice.disconnect(); gain.disconnect(); };
  }, [meowNumber, run.status, sound]);

  const act = () => {
    const next = runRef.current.status === 'running'
      ? jumpCatRun(runRef.current)
      : { ...newCatRun(), status: 'running' as const };
    if (runRef.current.status !== 'running') lastMeow.current = -1;
    runRef.current = next;
    setRun(next);
  };
  const release = () => {
    runRef.current = releaseCatRun(runRef.current);
    setRun(runRef.current);
  };
  const won = run.status === 'won';
  const height = jumpHeight(run);
  const stride = run.status === 'running' ? height > 0 ? -8 : Math.sin(runDistance(run.elapsed) / 13) * 12 : 0;

  return (
    <section className={`cat-runner cat-runner--${run.status}`} aria-label="Accompany the cat to eat" ref={host} tabIndex={0}
      onKeyDown={event => {
        if ((event.target as HTMLElement).closest('[aria-pressed]')) return;
        if ([' ', 'ArrowUp', 'Enter'].includes(event.key)) {
          event.preventDefault();
          if (!event.repeat) act();
        }
      }} onKeyUp={event => {
        if ((event.target as HTMLElement).closest('[aria-pressed]')) return;
        if ([' ', 'ArrowUp', 'Enter'].includes(event.key)) { event.preventDefault(); release(); }
      }} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) release(); }}>
      <h2>Accompany the cat to eat</h2>
      <p>A hungry cat, a dash to dinner. Tap for a short hop; hold for a higher jump. The pace picks up as you go!</p>
      <div className="cat-runner__score"><span>Score {String(score).padStart(4, '0')}</span><span>Best {String(best).padStart(4, '0')}</span></div>
      <div className="cat-runner__progress-label"><span>Journey to the food</span><span>{progress}%</span></div>
      <progress aria-label="Progress toward the cat’s food" max="100" value={progress} />
      <svg onPointerDown={event => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); host.current?.focus({ preventScroll: true }); act(); }} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release} className="cat-runner__scene" viewBox="0 0 640 235" role="img" aria-label={won ? 'The light-grey cat eats from its food bowl beside the runner.' : 'A man and a light-grey cat run toward dinner, jumping over chairs.'}>
        <path d="M0 180Q90 145 180 177T360 169T640 170V235H0Z" fill="#e8d7bf" />
        <path d="M0 211H640" stroke="#a77773" strokeWidth="2" />
        {[0, 1, 2, 3, 4, 5].map(i => <path key={i} d={`M${(i * 130 - runDistance(run.elapsed) % 130)} 224h25`} stroke="#bf9f8b" strokeWidth="2" />)}
        <g transform={`translate(${won ? 390 : tuning.runnerX} ${211 - height})`} fill="none" stroke="#65414b" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="0" cy="-77" r="11" fill="#e8bb9d" strokeWidth="2" />
          <path d="M-10-81q2-16 19-7" strokeWidth="6" />
          <path d="M0-62l-3 29" stroke="#aa5c6c" strokeWidth="15" />
          <path d={`M-3-33l${-14 - stride} 16 5 17M-3-33l${15 + stride} 16-6 17M0-56l-17 12-10-8M0-56l16 10 12-12`} />
        </g>
        {runnerObstacles(run.elapsed).map(obstacle => <g className="cat-runner__chair" key={obstacle.id} transform={`translate(${obstacle.x} 211)`} fill="#b77b58" stroke="#774b40" strokeWidth="3">
          {obstacle.kind === 'chair' ? <><path d="M2-49h8v26h22v7H2Z" /><path d="M5-17V0m24-17V0" /></> : <><path d="M2-29h30v8H2ZM5-21V0m24-21V0" />{obstacle.kind === 'pair' && <path d="M29-29h30v8H29ZM32-21V0m24-21V0" />}</>}
        </g>)}
        <g className="cat-runner__cat" transform={`translate(${won ? 495 : 105} ${211 - height})`} fill="#d9d9d9" stroke="#777" strokeWidth="1.8" strokeLinejoin="round">
          <path d="M-22-16q-24-4-22-26" fill="none" stroke="#d9d9d9" strokeWidth="7" strokeLinecap="round" />
          <ellipse cx="-5" cy="-17" rx="23" ry="12" />
          <path d={`M-20-14v${12 + stride / 5}h7v-13M7-14v14h7v-16`} />
          <g className={won ? 'cat-runner__eating' : undefined}>
            <path d="M10-22l-2-22 12 8 12-8 3 22q-12 16-25 0Z" />
            <path d="M15-25h2m10 0h2m-9 6 3 2 3-2m-12-1-12-2m27 2 12-2" fill="none" strokeLinecap="round" />
          </g>
        </g>
        {meowing && <g className="cat-runner__meow"><rect x={won ? 464 : 44} y="86" width="80" height="30" rx="15" fill="#fff9ed" /><text x={won ? 504 : 84} y="107" textAnchor="middle" fill="#65414b">{won ? 'Purr…' : 'Meow!'}</text></g>}
        <g className="cat-runner__food" transform={`translate(${won ? 532 : 608} 211)`}>
          <ellipse cx="0" cy="-11" rx="21" ry="6" fill="#8f654b" />
          <path d="M-24-12h48l-6 16h-36Z" fill="#b66173" stroke="#774b40" strokeWidth="2" />
          <path d="M-8-4h16" stroke="#fff0dc" strokeWidth="3" />
        </g>
      </svg>
      <p className="cat-runner__status" role="status">{won ? 'Dinner time! Your cat made it safely and is eating.' : run.status === 'failed' ? 'A chair got in the way. Your friend is waiting — try again!' : run.status === 'running' ? 'Tap / hold the scene, Jump, or Space / ↑. Short hop for stools; hold to clear chairs.' : 'Ready when you are. Let’s take the cat to dinner.'}</p>
      <div className="cat-runner__controls">
        <button type="button" onPointerDown={event => {
          event.preventDefault();
          event.currentTarget.focus({ preventScroll: true });
          event.currentTarget.setPointerCapture(event.pointerId);
          act();
        }} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}
          onClick={event => { if (event.detail === 0) { act(); release(); } }}>
          {run.status === 'running' ? 'Hold to jump' : run.status === 'ready' ? 'Start journey' : 'Play again'}
        </button>
        <button type="button" aria-pressed={sound} onClick={() => {
          if (!sound) {
            audio.current ??= new AudioContext();
            void audio.current.resume();
          }
          setSound(!sound);
        }}>Meow sound: {sound ? 'on' : 'off'}</button>
      </div>
    </section>
  );
}
