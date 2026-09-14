import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import {
  achievements,
  educationEntries,
  hobbies,
  languageEntries,
  personalInterests,
  personalProjects,
  profileLines,
  secretPanels,
  workProjects,
  workTimeline,
  type EducationEntry,
  type ProjectCard,
  type SecretPanel,
  type TimelineEntry,
} from './data';
import './styles.css';
import { CatRunner } from './CatRunner';
import { DogGoalGame } from './DogGoalGame';

interface PanelPageProps {
  theme: string;
  eyebrow: string;
  title: ReactNode;
  intro?: string;
  children: ReactNode;
  footer?: string;
}

function PanelPage({ theme, eyebrow, title, intro, children, footer }: PanelPageProps): ReactElement {
  return (
    <main className={`panel-page ${theme}`}>
      <div className="panel-eyebrow">{eyebrow}</div>
      <h1>{title}</h1>
      {intro ? <p className="panel-intro">{intro}</p> : null}
      {children}
      {footer ? <footer className="panel-footer">{footer}</footer> : null}
    </main>
  );
}

function ProjectCardView({ project }: { project: ProjectCard }): ReactElement {
  return (
    <article className="panel-card project-card">
      <h3>{project.title}</h3>
      {project.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
      <span className="panel-tag">{project.tag}</span>
    </article>
  );
}

function ProjectSection({ title, projects }: { title: string; projects: readonly ProjectCard[] }): ReactElement {
  return (
    <section className="panel-section">
      <h2>{title}</h2>
      <div className="panel-card-grid">
        {projects.map(project => <ProjectCardView key={project.title} project={project} />)}
      </div>
    </section>
  );
}

function ProjectsPanel(): ReactElement {
  return (
    <PanelPage
      theme="panel-projects"
      eyebrow="01 · Personal projects"
      title={<>Big ideas,<br />built to travel.</>}
      intro="A launch manifest of ventures, experiments, products, and work projects shaped by curiosity."
      footer="Build the impossible · one orbit at a time"
    >
      <div className="panel-orbit" aria-hidden="true">
        <i /><i /><i /><i />
      </div>
      <ProjectSection title="Personal projects" projects={personalProjects} />
      <ProjectSection title="Work projects" projects={workProjects} />
    </PanelPage>
  );
}

const timelineStart = Date.parse('2023-06-01T00:00:00Z');
const timelineEnd = Date.parse('2026-09-30T00:00:00Z');
const timelineRange = timelineEnd - timelineStart;
const timelineTrackHeight = 760;
const minimumCardHeight = 62;
const minimumVisualDuration = (minimumCardHeight / timelineTrackHeight) * timelineRange;

interface PositionedTimelineEntry extends TimelineEntry {
  top: number;
  height: number;
  lane: number;
  laneCount: number;
}

function datePosition(date: string): number {
  const timestamp = Date.parse(`${date}T00:00:00Z`);
  return Math.max(0, Math.min(100, ((timelineEnd - timestamp) / timelineRange) * 100));
}

function buildTimelineLayout(): PositionedTimelineEntry[] {
  const layout: PositionedTimelineEntry[] = [];

  for (const side of ['left', 'right'] as const) {
    const entries = workTimeline
      .filter(entry => entry.side === side)
      .sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
    const laneEnds: number[] = [];
    const placed = entries.map(entry => {
      const start = Date.parse(`${entry.start}T00:00:00Z`);
      const end = Date.parse(`${entry.end}T00:00:00Z`);
      const visualStart = Math.min(start, end - minimumVisualDuration);
      let lane = laneEnds.findIndex(laneEnd => visualStart >= laneEnd);
      if (lane < 0) {
        lane = laneEnds.length;
        laneEnds.push(end);
      } else {
        laneEnds[lane] = end;
      }

      const top = datePosition(entry.end);
      const duration = Math.max(end - start, minimumVisualDuration);
      const height = Math.min(100 - top, Math.max(4, (duration / timelineRange) * 100));
      return { ...entry, top, height, lane, laneCount: 0 };
    });

    const laneCount = laneEnds.length;
    for (const entry of placed) {
      layout.push({ ...entry, laneCount });
    }
  }

  return layout;
}

function TimelineDetail({ entry }: { entry?: TimelineEntry }): ReactElement {
  return (
    <section className={`timeline-detail${entry ? ' is-populated' : ''}`} aria-live="polite" aria-atomic="true">
      <p className="detail-kicker">{entry?.kicker ?? 'Role details'}</p>
      <h2 className="detail-title">
        {entry ? `${entry.role} · ${entry.company}` : 'Select a role'}
      </h2>
      <p className="detail-period">{entry?.period ?? 'Choose a block to explore the journey'}</p>
      <p className="detail-copy">
        {entry?.copy ?? 'Click or focus a role block to keep its details open while you explore the timeline.'}
      </p>
    </section>
  );
}

function WorkTimeline(): ReactElement {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const layout = useMemo(buildTimelineLayout, []);
  const selected = workTimeline.find(entry => entry.id === selectedId);

  return (
    <>
      <div className="timeline-heading">
        <h2>Work experience timeline</h2>
        <p>Latest roles at the top · earliest roles at the bottom</p>
      </div>
      <TimelineDetail entry={selected} />
      <section className="timeline" aria-label="Work experience timeline">
        <div className="timeline-track" style={{ '--timeline-track-height': `${timelineTrackHeight}px` } as CSSProperties}>
          <div className="timeline-axis" aria-hidden="true">
            <span className="axis-date axis-date--top">September 2026</span>
            <span className="axis-date axis-date--bottom">June 2023</span>
            {['2026-01-01', '2025-01-01', '2024-01-01'].map(date => (
              <span
                className="axis-tick"
                key={date}
                style={{ top: `${datePosition(date)}%` }}
              >
                <b>{date.slice(0, 4)}</b>
              </span>
            ))}
          </div>
          {(['left', 'right'] as const).map(side => (
            <div className={`timeline-side timeline-side--${side}`} key={side}>
              {layout.filter(entry => entry.side === side).map(entry => {
                const lane = side === 'left' ? entry.laneCount - 1 - entry.lane : entry.lane;
                const width = 100 / entry.laneCount;
                const style = {
                  top: `${entry.top}%`,
                  height: `${entry.height}%`,
                  left: `${lane * width}%`,
                  width: `calc(${width}% - 8px)`,
                };
                return (
                  <button
                    aria-pressed={selectedId === entry.id}
                    className={`timeline-card${entry.current ? ' timeline-card--current' : ''}${selectedId === entry.id ? ' is-selected' : ''}`}
                    key={entry.id}
                    onClick={() => setSelectedId(entry.id)}
                    onFocus={() => setSelectedId(entry.id)}
                    style={style}
                    type="button"
                  >
                    <span className="timeline-card__role">{entry.role}</span>
                    <span className="timeline-card__company">{entry.company}</span>
                    <span className="timeline-card__date">{entry.period}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <p className="timeline-note">
          <strong>Select</strong> or focus a block to pin its details. The block length follows the time it occupied.
        </p>
      </section>
    </>
  );
}

function WorkPanel(): ReactElement {
  return (
    <PanelPage
      theme="panel-work"
      eyebrow="02 · Work & leadership"
      title={<>Build teams.<br />Move ideas.</>}
      intro="A flight log of roles where technical direction, communication, and delivery had to share the cockpit. Each block spans the time it occupied."
      footer="Altitude is a perspective, not a destination"
    >
      <div className="panel-cloud" aria-hidden="true"><span />✦<span /></div>
      <WorkTimeline />
    </PanelPage>
  );
}

interface GraphNode extends EducationEntry {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const graphNodeWidth = 118;
const graphNodeHeight = 60;
const graphTargetDistance = 142;
const graphNodeGap = 8;

function initialGraphNodes(width: number, height: number): GraphNode[] {
  const entries = [...educationEntries, ...languageEntries];
  const centerX = width / 2;
  const centerY = height / 2;
  const radiusX = Math.max(72, Math.min(width * 0.34, 130));
  const radiusY = Math.max(74, Math.min(height * 0.35, 130));

  return entries.map((entry, index) => {
    const angle = -Math.PI / 2 + (index / entries.length) * Math.PI * 2;
    return {
      ...entry,
      x: centerX + Math.cos(angle) * radiusX,
      y: centerY + Math.sin(angle) * radiusY,
      vx: 0,
      vy: 0,
    };
  });
}

function EducationGraph(): ReactElement {
  const graphRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef({ width: 360, height: 360 });
  const draggingRef = useRef<{
    id: string;
    pointerId: number;
    clientX: number;
    clientY: number;
    x: number;
    y: number;
  } | null>(null);
  const [size, setSize] = useState(sizeRef.current);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [nodes, setNodes] = useState<GraphNode[]>(() => initialGraphNodes(360, 360));
  const nodesRef = useRef(nodes);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    const element = graphRef.current;
    if (!element || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(entries => {
      const rect = entries[0]?.contentRect;
      if (!rect?.width || !rect.height) return;
      sizeRef.current = { width: rect.width, height: rect.height };
      setSize(sizeRef.current);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let frame = 0;
    let previous = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(.035, Math.max(.008, (now - previous) / 1000));
      previous = now;
      const current = nodesRef.current.map(node => ({ ...node }));
      const dragged = draggingRef.current?.id;

      for (let first = 0; first < current.length; first += 1) {
        for (let second = first + 1; second < current.length; second += 1) {
          const a = current[first];
          const b = current[second];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const distance = Math.max(1, Math.hypot(dx, dy));
          const nx = dx / distance;
          const ny = dy / distance;
          const force = (distance - graphTargetDistance) * .72;
          if (a.id !== dragged) {
            a.vx += nx * force * dt;
            a.vy += ny * force * dt;
          }
          if (b.id !== dragged) {
            b.vx -= nx * force * dt;
            b.vy -= ny * force * dt;
          }
        }
      }

      const centerX = size.width / 2;
      const centerY = size.height / 2;
      const minX = graphNodeWidth / 2 + 5;
      const maxX = Math.max(minX, size.width - graphNodeWidth / 2 - 5);
      const minY = graphNodeHeight / 2 + 5;
      const maxY = Math.max(minY, size.height - graphNodeHeight / 2 - 5);

      for (const node of current) {
        if (node.id === dragged) continue;
        node.vx += (centerX - node.x) * .62 * dt;
        node.vy += (centerY - node.y) * .62 * dt;
        const damping = Math.pow(.12, dt);
        node.vx *= damping;
        node.vy *= damping;
        node.x += node.vx * dt;
        node.y += node.vy * dt;
        if (node.x < minX || node.x > maxX) {
          node.x = Math.max(minX, Math.min(maxX, node.x));
          node.vx *= -.35;
        }
        if (node.y < minY || node.y > maxY) {
          node.y = Math.max(minY, Math.min(maxY, node.y));
          node.vy *= -.35;
        }
      }

      // Resolve the actual card rectangles after integrating the soft forces.
      // Repeated passes let neighboring cards move together without overlapping.
      for (let pass = 0; pass < 20; pass += 1) {
        for (let first = 0; first < current.length; first += 1) {
          for (let second = first + 1; second < current.length; second += 1) {
            const a = current[first];
            const b = current[second];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const overlapX = graphNodeWidth + graphNodeGap - Math.abs(dx);
            const overlapY = graphNodeHeight + graphNodeGap - Math.abs(dy);
            if (overlapX <= 0 || overlapY <= 0) continue;
            const aShare = a.id === dragged ? 0 : b.id === dragged ? 1 : .5;
            const bShare = 1 - aShare;
            if (overlapX < overlapY) {
              const shift = (dx >= 0 ? 1 : -1) * overlapX;
              a.x -= shift * aShare;
              b.x += shift * bShare;
              a.vx = 0;
              b.vx = 0;
            } else {
              const shift = (dy >= 0 ? 1 : -1) * overlapY;
              a.y -= shift * aShare;
              b.y += shift * bShare;
              a.vy = 0;
              b.vy = 0;
            }
          }
        }
        for (const node of current) {
          node.x = Math.max(minX, Math.min(maxX, node.x));
          node.y = Math.max(minY, Math.min(maxY, node.y));
        }
      }

      nodesRef.current = current;
      setNodes(current);
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [size.height, size.width]);

  const moveDraggedNode = (event: ReactPointerEvent) => {
    const dragging = draggingRef.current;
    const rect = graphRef.current?.getBoundingClientRect();
    if (!dragging || dragging.pointerId !== event.pointerId || !rect?.width || !rect.height) return;
    // Preserve the grab offset and map screen movement into the scaled panel.
    const point = {
      x: dragging.x + (event.clientX - dragging.clientX) * size.width / rect.width,
      y: dragging.y + (event.clientY - dragging.clientY) * size.height / rect.height,
    };
    const minX = graphNodeWidth / 2 + 5;
    const maxX = Math.max(minX, size.width - graphNodeWidth / 2 - 5);
    const minY = graphNodeHeight / 2 + 5;
    const maxY = Math.max(minY, size.height - graphNodeHeight / 2 - 5);
    const next = nodesRef.current.map(node => node.id === dragging.id
      ? { ...node, x: Math.max(minX, Math.min(maxX, point.x)), y: Math.max(minY, Math.min(maxY, point.y)), vx: 0, vy: 0 }
      : node);
    nodesRef.current = next;
    setNodes(next);
  };

  const releaseDraggedNode = () => {
    draggingRef.current = null;
    setDraggingId(null);
  };

  const startDragging = (event: ReactPointerEvent<HTMLButtonElement>, id: string) => {
    const node = nodesRef.current.find(candidate => candidate.id === id);
    if (!node) return;
    event.preventDefault();
    event.stopPropagation();
    draggingRef.current = {
      id, pointerId: event.pointerId, clientX: event.clientX, clientY: event.clientY,
      x: node.x, y: node.y,
    };
    setDraggingId(id);
    setSelectedId(id);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const nudgeNode = (event: ReactKeyboardEvent<HTMLButtonElement>, id: string) => {
    const moves: Record<string, [number, number]> = {
      ArrowUp: [0, -18],
      ArrowDown: [0, 18],
      ArrowLeft: [-18, 0],
      ArrowRight: [18, 0],
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    const minX = graphNodeWidth / 2 + 5;
    const maxX = Math.max(minX, size.width - graphNodeWidth / 2 - 5);
    const minY = graphNodeHeight / 2 + 5;
    const maxY = Math.max(minY, size.height - graphNodeHeight / 2 - 5);
    const next = nodesRef.current.map(node => node.id === id
      ? { ...node, x: Math.max(minX, Math.min(maxX, node.x + move[0])), y: Math.max(minY, Math.min(maxY, node.y + move[1])), vx: 0, vy: 0 }
      : node);
    nodesRef.current = next;
    setNodes(next);
  };

  const selected = nodes.find(node => node.id === selectedId);

  return (
    <>
      <div
        aria-label="Education and language graph. Drag nodes to explore."
        className="education-graph"
        onPointerCancel={releaseDraggedNode}
        onPointerMove={moveDraggedNode}
        onPointerUp={releaseDraggedNode}
        ref={graphRef}
        role="application"
      >
        <div className="education-graph__orbit" aria-hidden="true" />
        {nodes.map(node => (
          <button
            aria-label={`${node.title}, ${node.label}`}
            aria-pressed={selectedId === node.id}
            className={`education-node education-node--${node.type}${draggingId === node.id ? ' is-dragging' : ''}`}
            key={node.id}
            onClick={() => setSelectedId(node.id)}
            onFocus={() => setSelectedId(node.id)}
            onKeyDown={event => nudgeNode(event, node.id)}
            onPointerDown={event => startDragging(event, node.id)}
            style={{ left: node.x, top: node.y }}
            type="button"
          >
            <span className="education-node__kind">{node.type}</span>
            <strong>{node.title}</strong>
            <small>{node.label}</small>
          </button>
        ))}
      </div>
      <section className="education-graph__detail" aria-live="polite" aria-atomic="true">
        <h3>{selected?.title ?? 'Explore a learning node'}</h3>
        {selected ? <small>{selected.label}</small> : null}
        <p>{selected?.copy ?? 'Select or focus a node to read its full details.'}</p>
      </section>
    </>
  );
}

function EducationPanel(): ReactElement {
  return (
    <PanelPage
      theme="panel-education"
      eyebrow="03 · Education & learning"
      title={<>Keep asking<br />better questions.</>}
      intro="A living constellation of education and languages gathered while building things that need to work."
      footer="Curiosity is a system property"
    >
      <div className="panel-nodes" aria-hidden="true"><i /><b /><i /><b /><i /><b /><i /><b /><i /></div>
      <section className="panel-section education-section">
        <div className="education-section__heading">
          <h2>Learning graph</h2>
          <span>drag to rearrange</span>
        </div>
        <EducationGraph />
        <p className="education-graph__hint">Nodes have a soft gravity. Pull one away and the constellation follows; bring them together and they make room.</p>
      </section>
    </PanelPage>
  );
}

function ProfileLines({ lines }: { lines: readonly { label: string; value: string }[] }): ReactElement {
  return (
    <div className="profile-lines">
      {lines.map(line => (
        <div className="profile-line" key={line.label}>
          <span>{line.label}</span>
          <strong>{line.value}</strong>
        </div>
      ))}
    </div>
  );
}

function AboutPanel(): ReactElement {
  return (
    <PanelPage
      theme="panel-about"
      eyebrow="04 · Profile & curiosity"
      title={<>A little company.<br />A happy cat.</>}
      footer="Make room for wonder"
    >
      <CatRunner />
      <h2>About me · A curious builder.</h2>
      <div className="panel-flower" aria-hidden="true">✿</div>
      <div className="panel-quote">
        “I know of no better life purpose than to perish attempting the great and impossible.”
        <small>— Friedrich Nietzsche</small>
      </div>
      <p className="panel-intro">
        Highly curious, fast-learning, and always looking for meaningful answers across technology, academia, geopolitics, economics, and current events. Charisma, public speaking, initiative, and team management help turn that curiosity into movement.
      </p>
      <ProfileLines lines={profileLines} />
      <nav className="panel-links" aria-label="Profile links">
        <a href="mailto:santiagoyepesmesa0224@gmail.com">Email ↗</a>
        <a href="https://www.linkedin.com/in/santiago-yepes-mesa-67ab80270" rel="noreferrer" target="_blank">LinkedIn ↗</a>
      </nav>
      <ProfileLines lines={personalInterests} />
    </PanelPage>
  );
}

function AchievementGroup({ title, entries }: { title: string; entries: ReadonlyArray<(typeof achievements)[number]> }): ReactElement {
  return (
    <section className="panel-section">
      <h2>{title}</h2>
      <div className="achievement-list">
        {entries.map(entry => (
          <article className="panel-card achievement-card" key={entry.title}>
            <h3>{entry.title}</h3>
            <p>{entry.copy}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function AchievementsPanel(): ReactElement {
  return (
    <PanelPage
      theme="panel-achievements"
      eyebrow="05 · Achievements"
      title={<>Milestones worth<br />remembering.</>}
      intro="Proof points are useful—not as a finish line, but as evidence that a hard problem can move."
      footer="Earned in public · carried forward quietly"
    >
      <DogGoalGame />
      <div className="panel-medal" aria-hidden="true">✦</div>
      <AchievementGroup title="Awards" entries={achievements.filter(entry => entry.group === 'Awards')} />
      <AchievementGroup title="Honors" entries={achievements.filter(entry => entry.group === 'Honors')} />
    </PanelPage>
  );
}

type BenchResult = 'ready' | 'won' | 'failed';

function BenchPressFigure({ lift }: { lift: number }): ReactElement {
  const barY = 112 - lift * 48;
  // Two fixed-length arm segments meet at the elbow throughout the press.
  const shoulder = { x: 117, y: 127 };
  const hand = { x: 122, y: barY };
  const dx = hand.x - shoulder.x;
  const dy = hand.y - shoulder.y;
  const distance = Math.hypot(dx, dy);
  const bend = Math.sqrt(Math.max(0, 32 ** 2 - (distance / 2) ** 2));
  const elbow = {
    x: (shoulder.x + hand.x) / 2 + dy / distance * bend,
    y: (shoulder.y + hand.y) / 2 - dx / distance * bend,
  };
  const arm = `M${shoulder.x} ${shoulder.y}L${elbow.x} ${elbow.y}L${hand.x} ${hand.y}`;
  return (
    <svg
      aria-label="Side view of a lifter lying on a flat bench, feet planted, pressing a barbell above his chest"
      className="bench-game__figure"
      role="img"
      viewBox="0 0 300 220"
    >
      <defs>
        <linearGradient id="bench-metal" x1="0" x2="1">
          <stop offset="0" stopColor="#81958d" />
          <stop offset=".5" stopColor="#eef2df" />
          <stop offset="1" stopColor="#93a88e" />
        </linearGradient>
      </defs>
      <ellipse className="bench-game__shadow" cx="152" cy="202" rx="119" ry="8" />
      {/* Rack and safety arms sit behind the athlete. */}
      <path d="M60 198V59h11v139m-23 0h43M68 89h15v-9M68 146h72" fill="none" stroke="#82958b" strokeWidth="6" strokeLinejoin="round" />
      <path className="bench-game__leg bench-game__leg--far" d="M179 137L222 154L234 192" fill="none" />
      <path className="bench-game__shoe" d="M225 187h12l14 8q3 6-3 6h-25z" />
      <path className="bench-game__bench-leg" d="M83 151h9v44h16v6H69v-6h14zm91 0h9v44h16v6h-40v-6h15z" />
      <rect className="bench-game__bench" x="65" y="141" width="137" height="13" rx="5" />
      <path className="bench-game__arm bench-game__arm--far" d={arm} transform="translate(15 -7)" />
      {/* Head, shoulders and hips rest along the horizontal bench pad. */}
      <path className="bench-game__torso" d="M103 125Q116 116 134 121L171 131L183 128L189 143H109z" />
      <path d="M160 130l24-2 13 13-15 15-17-12z" fill="#405d50" />
      <path className="bench-game__leg" d="M187 143L215 158L215 194" fill="none" />
      <path className="bench-game__shoe" d="M207 190h15l14 7q4 6-3 6h-27z" />
      <path d="M98 130h12" stroke="#e9bd94" strokeWidth="13" />
      <path className="bench-game__head" d="M77 126q0-14 13-15l9 3 4 7 6 3-6 4q-1 11-13 11-13 0-13-13z" />
      <path className="bench-game__hair" d="M78 132q-9-15 3-22 10-5 16 4l-12 4 1 15z" />
      <path d="M96 119l3 1" stroke="#5e493b" strokeWidth="2" strokeLinecap="round" />
      <path className="bench-game__arm" d={arm} />
      <g className="bench-game__bar" transform={`translate(0 ${barY})`}>
        <path d="M88 14L168-23" stroke="url(#bench-metal)" strokeWidth="5" strokeLinecap="round" />
        <ellipse className="bench-game__plate" cx="153" cy="-16" rx="10" ry="21" transform="rotate(-12 153 -16)" />
        <ellipse className="bench-game__plate" cx="104" cy="7" rx="12" ry="24" transform="rotate(-12 104 7)" />
        <ellipse cx="104" cy="7" rx="4" ry="7" fill="#93a88e" />
        <path d="M88 14l16-7" stroke="url(#bench-metal)" strokeWidth="5" strokeLinecap="round" />
        <path d="M119 1l6-3m12-5 5-2" stroke="#e9bd94" strokeWidth="7" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function BenchPressGame(): ReactElement {
  const [lift, setLift] = useState(.42);
  const [arrow, setArrow] = useState(.16);
  const [result, setResult] = useState<BenchResult>('ready');
  const liftRef = useRef(lift);
  const arrowRef = useRef(arrow);
  const directionRef = useRef(1);
  const resultRef = useRef<BenchResult>(result);

  useEffect(() => {
    liftRef.current = lift;
  }, [lift]);

  useEffect(() => {
    arrowRef.current = arrow;
  }, [arrow]);

  useEffect(() => {
    resultRef.current = result;
  }, [result]);

  useEffect(() => {
    if (result !== 'ready') return;
    let frame = 0;
    let previous = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(.04, Math.max(.008, (now - previous) / 1000));
      previous = now;
      const speed = .38 + liftRef.current * 1.18;
      let next = arrowRef.current + directionRef.current * speed * dt;
      if (next >= 1) {
        next = 1;
        directionRef.current = -1;
      } else if (next <= 0) {
        next = 0;
        directionRef.current = 1;
      }
      arrowRef.current = next;
      setArrow(next);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [result]);

  const targetWidth = .34 - lift * .24;
  const targetLeft = .5 - targetWidth / 2;
  const meterStyle = {
    '--target-left': `${targetLeft * 100}%`,
    '--target-width': `${targetWidth * 100}%`,
    '--arrow-position': `${arrow * 100}%`,
  } as CSSProperties;

  const attempt = () => {
    if (resultRef.current !== 'ready') return;
    const width = .34 - liftRef.current * .24;
    const hit = Math.abs(arrowRef.current - .5) <= width / 2;
    const nextLift = Math.max(0, Math.min(1, liftRef.current + (hit ? .12 : -.14)));
    liftRef.current = nextLift;
    setLift(nextLift);
    if (nextLift >= 1) {
      resultRef.current = 'won';
      setResult('won');
    } else if (nextLift <= 0) {
      resultRef.current = 'failed';
      setResult('failed');
    }
  };

  const reset = () => {
    directionRef.current = 1;
    liftRef.current = .42;
    arrowRef.current = .16;
    resultRef.current = 'ready';
    setLift(.42);
    setArrow(.16);
    setResult('ready');
  };

  const status = result === 'won'
    ? 'Rep complete! Strong work.'
    : result === 'failed'
      ? 'The bar stalled. Try again.'
      : 'Press when the arrow enters the green.';

  return (
    <section className={`bench-game bench-game--${result}`} aria-label="Helping the bar go up">
      <aside className="bench-game__side bench-game__side--left">
        {hobbies.slice(0, 2).map(hobby => (
          <article className="bench-game__fact" key={hobby.id}>
            <span>{hobby.number}</span>
            <strong>{hobby.title}</strong>
            <p>{hobby.copy}</p>
          </article>
        ))}
      </aside>
      <div className="bench-game__center">
        <div className="bench-game__status" aria-live="polite">
          <strong>{status}</strong>
          <span>{Math.round(lift * 100)}% bar height</span>
        </div>
        <BenchPressFigure lift={lift} />
        <div
          aria-label="Timing line. Press while the arrow is in the green area."
          className="bench-game__meter"
          onKeyDown={event => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              attempt();
            }
          }}
          onPointerDown={event => {
            event.preventDefault();
            attempt();
          }}
          role="button"
          style={meterStyle}
          tabIndex={0}
        >
          <span className="bench-game__target" />
          <span className="bench-game__arrow" />
        </div>
        <button className="bench-game__press" onClick={result === 'ready' ? attempt : reset} type="button">
          {result === 'ready' ? 'Press!' : 'Try again'}
        </button>
        {result !== 'ready' ? <button className="bench-game__reset" onClick={reset} type="button">Reset rep</button> : null}
      </div>
      <aside className="bench-game__side bench-game__side--right">
        {hobbies.slice(2).map(hobby => (
          <article className="bench-game__fact" key={hobby.id}>
            <span>{hobby.number}</span>
            <strong>{hobby.title}</strong>
            <p>{hobby.copy}</p>
          </article>
        ))}
      </aside>
    </section>
  );
}

function HobbiesPanel(): ReactElement {
  return (
    <PanelPage
      theme="panel-hobbies"
      eyebrow="06 · Life beyond code"
      title={<>Help the bar<br />go up.</>}
      intro="The other projects keep the builder human. Help him complete one more repetition, then read the stories on either side."
      footer="Rest is part of the system"
    >
      <BenchPressGame />
    </PanelPage>
  );
}

function LibraryPanel(): ReactElement {
  return (
    <PanelPage
      theme="panel-library"
      eyebrow="07 · Empire construction in progress"
      title="Library of Pergamon"
      intro="A future home for long-form notes, references, and the kind of ideas that deserve a quiet room."
    >
      <div className="panel-columns" aria-hidden="true"><i /><i /><i /></div>
      <p className="panel-note">The shelves are not ready yet. The blueprint is ambitious, the scaffolding is dignified, and the next chapter is being prepared.</p>
      <div className="panel-status">You will know it in the news</div>
    </PanelPage>
  );
}

function SecretPanel({ panel }: { panel: SecretPanel }): ReactElement {
  return (
    <main className={`panel-page secret-panel ${panel.theme}`}>
      <div className="panel-eyebrow">{panel.eyebrow}</div>
      <div className="secret-panel__icon" aria-hidden="true">{panel.theme === 'secret-launch' ? (
        <svg width="64" height="72" viewBox="0 0 64 72" className="secret-panel__rocket">
          <path d="M25 48 32 70 39 48" fill="#ff9a54" />
          <path d="M23 31 9 53l15-4m17-18 14 22-15-4" fill="#bd6551" stroke="#ffca74" strokeWidth="2" />
          <path d="M32 3C19 16 18 35 24 51h16C46 35 45 16 32 3Z" fill="#fff2cf" />
          <circle cx="32" cy="27" r="7" fill="#385e78" stroke="#a15f43" strokeWidth="3" />
        </svg>
      ) : panel.icon}</div>
      <h1>{panel.title}</h1>
      <p className="secret-panel__copy">{panel.copy}</p>
      <div className="secret-panel__signature">{panel.signature}</div>
    </main>
  );
}

type PanelComponent = () => ReactElement;

const panelRegistry: Readonly<Record<string, PanelComponent>> = {
  'starship:front': ProjectsPanel,
  'starship:back': () => <SecretPanel panel={secretPanels.starship} />,
  'f22:front': WorkPanel,
  'f22:back': () => <SecretPanel panel={secretPanels.f22} />,
  'neural-network:front': EducationPanel,
  'neural-network:back': () => <SecretPanel panel={secretPanels['neural-network']} />,
  'roses:front': AboutPanel,
  'roses:back': () => <SecretPanel panel={secretPanels.roses} />,
  'victory-statue:front': AchievementsPanel,
  'victory-statue:back': () => <SecretPanel panel={secretPanels['victory-statue']} />,
  'squat-rack:front': HobbiesPanel,
  'squat-rack:back': () => <SecretPanel panel={secretPanels['squat-rack']} />,
  'pergamon-library:front': LibraryPanel,
  'pergamon-library:back': () => <SecretPanel panel={secretPanels['pergamon-library']} />,
};

function MissingPanel(): ReactElement {
  return (
    <PanelPage theme="panel-missing" eyebrow="Notebook" title="A page is missing.">
      <p className="panel-intro">This story has not been added to the island yet.</p>
    </PanelPage>
  );
}

export function PanelContent({ panelId }: { panelId: string }): ReactElement {
  const Panel = panelRegistry[panelId] ?? MissingPanel;
  return <Panel />;
}
