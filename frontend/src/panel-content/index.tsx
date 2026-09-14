import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
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

const projectPlanetLayouts = [
  { x: '12%', y: '24%', size: 64, rotation: -12 },
  { x: '33%', y: '36%', size: 48, rotation: 18 },
  { x: '56%', y: '19%', size: 78, rotation: 4 },
  { x: '84%', y: '29%', size: 54, rotation: -22 },
  { x: '20%', y: '73%', size: 84, rotation: 9 },
  { x: '49%', y: '77%', size: 56, rotation: 25 },
  { x: '77%', y: '72%', size: 70, rotation: -7 },
  { x: '10%', y: '53%', size: 42, rotation: 15 },
  { x: '67%', y: '50%', size: 46, rotation: -18 },
] as const;

interface ProjectPointer {
  x: number;
  y: number;
  angle: number;
  visible: boolean;
}

interface HoveredProject {
  project: ProjectCard;
  x: number;
  y: number;
  placement: 'above' | 'below';
}

function ProjectHoverCard({ hover }: { hover: HoveredProject }): ReactElement {
  return (
    <aside
      className={`project-hover-card project-hover-card--${hover.placement}`}
      id={`project-popover-${hover.project.title.replace(/\W+/g, '-').toLowerCase()}`}
      role="tooltip"
      style={{ left: hover.x, top: hover.y }}
    >
      <span className="project-hover-card__tag">{hover.project.tag}</span>
      <h3>{hover.project.title}</h3>
      {hover.project.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
    </aside>
  );
}

function SpaceShip({ angle, x, y }: { angle: number; x: number; y: number }): ReactElement {
  return (
    <svg
      aria-hidden="true"
      className="space-cursor__ship"
      style={{ left: x, top: y, transform: `translate(-50%, -50%) rotate(${angle}deg)` }}
      viewBox="0 0 48 64"
    >
      <path className="space-cursor__flame" d="M19 47c1 8 4 13 5 15 2-3 5-8 5-15Z" />
      <path className="space-cursor__body" d="M24 3C14 12 10 23 14 43h20c4-20 0-31-10-40Z" />
      <path className="space-cursor__fin" d="m14 34-10 12 11-3m19-9 10 12-11-3" />
      <circle className="space-cursor__window" cx="24" cy="24" r="6" />
      <path className="space-cursor__shine" d="M20 11c-3 7-4 13-3 19" />
    </svg>
  );
}

function ProjectUniverse({ title, projects }: { title: string; projects: readonly ProjectCard[] }): ReactElement {
  const universeRef = useRef<HTMLDivElement>(null);
  const previousPointer = useRef<{ x: number; y: number } | null>(null);
  const [pointer, setPointer] = useState<ProjectPointer>({ x: 0, y: 0, angle: 0, visible: false });
  const [hovered, setHovered] = useState<HoveredProject | null>(null);

  const updatePointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse') return;
    const bounds = universeRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    const previous = previousPointer.current;
    const angle = previous && (x !== previous.x || y !== previous.y)
      ? Math.atan2(y - previous.y, x - previous.x) * 180 / Math.PI + 90
      : pointer.angle;
    previousPointer.current = { x, y };
    setPointer({ x, y, angle, visible: true });
  };

  const showProject = (project: ProjectCard, element: HTMLElement, clientX?: number, clientY?: number) => {
    const universe = universeRef.current;
    if (!universe) return;
    const bounds = universe.getBoundingClientRect();
    const target = element.getBoundingClientRect();
    const x = clientX === undefined ? target.left + target.width / 2 - bounds.left : clientX - bounds.left;
    const y = clientY === undefined ? target.top - bounds.top : clientY - bounds.top;
    const popupWidth = Math.min(300, Math.max(180, bounds.width - 24));
    const minX = popupWidth / 2 + 12;
    const maxX = Math.max(minX, bounds.width - popupWidth / 2 - 12);
    setHovered({
      project,
      x: Math.min(maxX, Math.max(minX, x)),
      y: Math.max(0, y),
      placement: y > 175 ? 'above' : 'below',
    });
  };

  const clearProject = (project: ProjectCard) => {
    setHovered(current => current?.project.title === project.title ? null : current);
  };

  return (
    <section className="project-universe-section" aria-label={`${title} project field`}>
      <div className="project-universe-heading">
        <h2>{title}</h2>
        <span>hover to land</span>
      </div>
      <div
        className="project-universe"
        onPointerEnter={updatePointer}
        onPointerLeave={() => {
          previousPointer.current = null;
          setPointer(current => ({ ...current, visible: false }));
          setHovered(null);
        }}
        onPointerMove={updatePointer}
        ref={universeRef}
      >
        <div className="project-universe__stars" aria-hidden="true" />
        <div className="project-universe__nebula" aria-hidden="true" />
        {projects.map((project, index) => {
          const layout = projectPlanetLayouts[index % projectPlanetLayouts.length];
          const popoverId = `project-popover-${project.title.replace(/\W+/g, '-').toLowerCase()}`;
          return (
            <button
              aria-describedby={hovered?.project.title === project.title ? popoverId : undefined}
              aria-label={`Explore project ${project.title}`}
              className={`project-planet project-planet--${index % 9}`}
              key={project.title}
              onBlur={() => clearProject(project)}
              onFocus={event => showProject(project, event.currentTarget)}
              onPointerEnter={event => showProject(project, event.currentTarget, event.clientX, event.clientY)}
              onPointerLeave={() => clearProject(project)}
              style={{
                '--planet-rotation': `${layout.rotation}deg`,
                '--planet-size': `${layout.size}px`,
                '--planet-x': layout.x,
                '--planet-y': layout.y,
              } as CSSProperties}
              type="button"
            >
              <span aria-hidden="true" />
            </button>
          );
        })}
        {hovered ? <ProjectHoverCard hover={hovered} /> : null}
        {pointer.visible ? <div className="space-cursor"><SpaceShip angle={pointer.angle} x={pointer.x} y={pointer.y} /></div> : null}
        <p className="project-universe__hint">Steer through the field · every world keeps its own story</p>
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
      <ProjectUniverse title="Personal projects" projects={personalProjects} />
      <ProjectUniverse title="Work projects" projects={workProjects} />
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

interface HoveredExperience {
  entry: TimelineEntry;
  x: number;
  y: number;
  placement: 'above' | 'below';
}

function ExperiencePopover({ hover }: { hover: HoveredExperience }): ReactElement {
  return (
    <aside
      className={`timeline-hover-card timeline-hover-card--${hover.placement}`}
      id={`experience-popover-${hover.entry.id}`}
      role="tooltip"
      style={{ left: hover.x, top: hover.y }}
    >
      <span className="timeline-hover-card__kicker">{hover.entry.kicker}</span>
      <h3>{hover.entry.role}</h3>
      <strong className="timeline-hover-card__company">{hover.entry.company}</strong>
      <span className="timeline-hover-card__period">{hover.entry.period}</span>
      <p>{hover.entry.copy}</p>
    </aside>
  );
}

function WorkTimeline(): ReactElement {
  const [hovered, setHovered] = useState<HoveredExperience | null>(null);
  const layout = useMemo(buildTimelineLayout, []);

  const updateHover = (entry: TimelineEntry, element: HTMLElement, clientX: number, clientY: number) => {
    const timeline = element.closest<HTMLElement>('.timeline');
    if (!timeline) return;
    const bounds = timeline.getBoundingClientRect();
    const popupWidth = Math.min(300, Math.max(180, bounds.width - 24));
    const minX = popupWidth / 2 + 12;
    const maxX = Math.max(minX, bounds.width - popupWidth / 2 - 12);
    const x = Math.min(maxX, Math.max(minX, clientX - bounds.left));
    const y = Math.max(0, clientY - bounds.top);
    setHovered({ entry, x, y, placement: y > 185 ? 'above' : 'below' });
  };

  const clearHover = (entry: TimelineEntry) => {
    setHovered(current => current?.entry.id === entry.id ? null : current);
  };

  return (
    <>
      <div className="timeline-heading">
        <h2>Work experience timeline</h2>
        <p>Latest roles at the top · earliest roles at the bottom</p>
      </div>
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
                const describedBy = hovered?.entry.id === entry.id ? `experience-popover-${entry.id}` : undefined;
                return (
                  <article
                    aria-describedby={describedBy}
                    className={`timeline-card${entry.current ? ' timeline-card--current' : ''}`}
                    key={entry.id}
                    onBlur={() => clearHover(entry)}
                    onFocus={event => updateHover(entry, event.currentTarget, event.currentTarget.getBoundingClientRect().left + event.currentTarget.getBoundingClientRect().width / 2, event.currentTarget.getBoundingClientRect().top + event.currentTarget.getBoundingClientRect().height / 2)}
                    onPointerEnter={event => updateHover(entry, event.currentTarget, event.clientX, event.clientY)}
                    onPointerLeave={() => clearHover(entry)}
                    onPointerMove={event => updateHover(entry, event.currentTarget, event.clientX, event.clientY)}
                    style={style}
                    tabIndex={0}
                  >
                    <span className="timeline-card__role">{entry.role}</span>
                    <span className="timeline-card__company">{entry.company}</span>
                    <span className="timeline-card__date">{entry.period}</span>
                  </article>
                );
              })}
            </div>
          ))}
        </div>
        {hovered ? <ExperiencePopover hover={hovered} /> : null}
        <p className="timeline-note">
          <strong>Hover</strong> over a role to see the full story. The block length follows the time it occupied.
        </p>
      </section>
    </>
  );
}

function WorkPanel(): ReactElement {
  return (
    <PanelPage
      theme="panel-work"
      eyebrow="02 · Work"
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
      title={<>A little company.<br />A lot of curiosity.</>}
      footer="Make room for wonder"
    >
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

type AwardRelicType = 'armor' | 'laurel' | 'helmet' | 'swords' | 'shield';

const awardRelicTypes: readonly AwardRelicType[] = ['armor', 'laurel', 'helmet', 'swords', 'shield'];

const awardColumnLayouts = [
  { left: '10%', bottom: '4%', height: '88%', depth: 2 },
  { left: '30%', bottom: '13%', height: '76%', depth: 3 },
  { left: '50%', bottom: '3%', height: '91%', depth: 4 },
  { left: '70%', bottom: '11%', height: '78%', depth: 3 },
  { left: '90%', bottom: '4%', height: '86%', depth: 2 },
] as const;

function AwardRelic({ type }: { type: AwardRelicType }): ReactElement {
  const commonProps = {
    'aria-hidden': true,
    className: `award-relic__illustration award-relic__illustration--${type}`,
    viewBox: '0 0 96 96',
  } as const;

  if (type === 'armor') {
    return (
      <svg {...commonProps}>
        <path d="M31 17c6-6 28-6 34 0l8 12-6 42c-10 6-28 6-38 0l-6-42Z" />
        <path d="m31 18-15 10 8 19 10-6m31-23 15 10-8 19-10-6" />
        <path d="M29 43h38M27 55h42M30 67h36" />
        <path d="M42 17h12v17H42z" />
        <circle cx="48" cy="43" r="4" />
      </svg>
    );
  }

  if (type === 'laurel') {
    return (
      <svg {...commonProps}>
        <path d="M17 76C5 57 9 28 34 13M79 76c12-19 8-48-17-63" />
        <path d="M19 64 9 58m14-9L12 42m17-9-11-12m26 53L36 65m41-1 10-6M70 49l11-7M67 33l11-12M53 71l12-6" />
        <path d="M19 64c-7-2-11-5-13-10 7-1 12 2 16 7m1-18c-7-1-11-4-14-9 7-1 12 1 17 6m0-18c-5-4-7-8-7-13 6 2 10 6 11 11m41 51c7-2 11-5 13-10-7-1-12 2-16 7m-1-18c7-1 11-4 14-9-7-1-12 1-17 6m0-18c5-4 7-8 7-13-6 2-10 6-11 11" />
      </svg>
    );
  }

  if (type === 'helmet') {
    return (
      <svg {...commonProps}>
        <path d="M22 72c-4-10-5-23-2-35C23 20 34 10 49 10c17 0 27 14 27 31v31Z" />
        <path d="M20 47h56l-5 13H21Zm8-16h39M51 11l8 19M27 25l-3 23M24 66h49" />
        <path d="M65 10c10 5 16 14 17 25-7-4-13-5-19-4" />
        <path d="M37 10c-2-7 2-10 6-3m8 1c0-7 4-9 7-2" />
      </svg>
    );
  }

  if (type === 'swords') {
    return (
      <svg {...commonProps}>
        <path d="m25 72 42-48" />
        <path d="m71 72-42-48" />
        <path d="m67 24 8-9 5 5-8 9M29 24l-8-9-5 5 8 9" />
        <path d="m18 45 20 18m40-18L58 63" />
        <path d="m17 44-6 7m68-7 6 7" />
        <path d="M41 88h14" />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <path d="M48 7 78 18v26c0 20-13 34-30 43C31 78 18 64 18 44V18Z" />
      <path d="M48 15v63M25 27h46M31 62h34" />
      <path d="m48 24 4 8 9 1-7 6 2 9-8-4-8 4 2-9-7-6 9-1Z" />
      <path d="M39 78c6 3 12 3 18 0" />
    </svg>
  );
}

function AwardDetails({ entry, onClose }: { entry: (typeof achievements)[number]; onClose: () => void }): ReactElement {
  return (
    <article
      aria-label={`${entry.title} details`}
      className="award-details"
      data-testid="achievement-details"
      onClick={(event: ReactMouseEvent<HTMLElement>) => event.stopPropagation()}
      role="dialog"
    >
      <div className="award-details__topline">
        <span>{entry.group} · recognition</span>
        <button aria-label="Close award details" onClick={onClose} type="button">Close ×</button>
      </div>
      <h3 data-testid="achievement-details-title">{entry.title}</h3>
      <p data-testid="achievement-details-copy">{entry.copy}</p>
      <span className="award-details__hint">Click outside to return it to its column.</span>
    </article>
  );
}

function AwardsGrove({ entries }: { entries: readonly (typeof achievements)[number][] }): ReactElement {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const activeEntry = activeIndex === null ? null : entries[activeIndex];
  const activeRelic = activeIndex === null ? null : awardRelicTypes[activeIndex % awardRelicTypes.length];

  useEffect(() => {
    if (activeIndex === null) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActiveIndex(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex]);

  return (
    <section className={`awards-grove${activeEntry ? ' awards-grove--focused' : ''}`} aria-label="Awards and honors grove" data-testid="achievement-field">
      <div className="awards-grove__sky" aria-hidden="true" />
      <div className="awards-grove__sun" aria-hidden="true" />
      <div className="awards-grove__hills" aria-hidden="true" />
      <div className="awards-grove__trees" aria-hidden="true">
        {[0, 1, 2, 3, 4, 5, 6].map(index => <span className={`olive-tree olive-tree--${index}`} key={index} />)}
      </div>
      <div className="awards-grove__field" aria-hidden="true" />
      <div className="awards-grove__heading">
        <span>Olive grove of distinction</span>
        <strong>Click a relic to inspect it</strong>
      </div>
      {entries.map((entry, index) => {
        const layout = awardColumnLayouts[index % awardColumnLayouts.length];
        const relicType = awardRelicTypes[index % awardRelicTypes.length];
        const active = activeIndex === index;
        return (
          <div
            className={`award-site${active ? ' award-site--active' : ''}`}
            data-achievement-id={entry.title}
            data-state={active ? 'featured' : 'resting'}
            data-testid="achievement-relic"
            key={entry.title}
            style={{
              '--award-depth': layout.depth,
              '--award-height': layout.height,
              '--award-left': layout.left,
              '--award-bottom': layout.bottom,
            } as CSSProperties}
          >
            <div className="award-column" data-testid="achievement-column">
              <span className="award-column__capital" />
              <span className="award-column__shaft" />
              <span className="award-column__base" />
            </div>
            <button
              aria-expanded={active}
              aria-label={`Inspect ${entry.title}`}
              aria-pressed={active}
              className={`award-relic award-relic--${relicType}`}
              data-state={active ? 'featured' : 'resting'}
              data-testid="achievement-object"
              onClick={() => setActiveIndex(index)}
              type="button"
            >
              <AwardRelic type={relicType} />
            </button>
          </div>
        );
      })}
      {activeEntry && activeRelic ? (
        <div className="award-focus-layer" data-testid="achievement-dismiss-surface" onClick={() => setActiveIndex(null)}>
          <div className={`award-featured-relic award-featured-relic--${activeRelic}`} aria-hidden="true" data-achievement-id={activeEntry.title} data-state="featured" data-testid="achievement-featured">
            <AwardRelic type={activeRelic} />
          </div>
          <AwardDetails entry={activeEntry} onClose={() => setActiveIndex(null)} />
        </div>
      ) : null}
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
      <div className="panel-medal" aria-hidden="true">✦</div>
      <AwardsGrove entries={achievements} />
    </PanelPage>
  );
}

function HobbiesPanel(): ReactElement {
  return (
    <PanelPage
      theme="panel-hobbies"
      eyebrow="06 · Life beyond code"
      title={<>Life beyond<br />the build.</>}
      intro="The other projects keep the builder human. Here are a few things that make time away from code feel well spent."
      footer="Rest is part of the system"
    >
      <div className="panel-bars" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></div>
      <div className="hobby-list">
        {hobbies.map(hobby => (
          <article className="panel-card hobby-card" key={hobby.id}>
            <span className="hobby-number">{hobby.number}</span>
            <h2>{hobby.title}</h2>
            <p>{hobby.copy}</p>
          </article>
        ))}
      </div>
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
