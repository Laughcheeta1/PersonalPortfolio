import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import {
  achievements,
  educationLayers,
  fitnessStats,
  hobbies,
  personalProjects,
  profileMemory,
  secretPanels,
  workProjects,
  workTimeline,
  type EducationEntry,
  type Hobby,
  type ProjectCard,
  type SecretPanel,
  type TimelineEntry,
} from './data';
import './styles.css';

const publicAssetBaseUrl = ((import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.BASE_URL ?? '/');

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

interface EducationConnection {
  id: string;
  fromId: string;
  toId: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
}

const networkLayerX = (layerIndex: number): number => 10 + layerIndex * 20;

function networkNodeY(nodeIndex: number, nodeCount: number): number {
  if (nodeCount <= 1) return 50;
  const span = nodeCount === 2 ? 44 : nodeCount === 3 ? 60 : 68;
  return 50 - span / 2 + nodeIndex * span / (nodeCount - 1);
}

const educationConnections: readonly EducationConnection[] = educationLayers
  .slice(0, -1)
  .flatMap((layer, layerIndex) => {
    const nextLayer = educationLayers[layerIndex + 1];
    if (!nextLayer) return [];
    return layer.entries.flatMap((entry, entryIndex) => nextLayer.entries.map((nextEntry, nextIndex) => ({
      id: `${entry.id}-${nextEntry.id}`,
      fromId: entry.id,
      toId: nextEntry.id,
      from: { x: networkLayerX(layerIndex), y: networkNodeY(entryIndex, layer.entries.length) },
      to: { x: networkLayerX(layerIndex + 1), y: networkNodeY(nextIndex, nextLayer.entries.length) },
    })));
  });

const allEducationEntries: readonly EducationEntry[] = educationLayers.flatMap(layer => layer.entries);

function connectionPath(connection: EducationConnection): string {
  const bend = (connection.to.x - connection.from.x) * .45;
  return `M ${connection.from.x} ${connection.from.y} C ${connection.from.x + bend} ${connection.from.y}, ${connection.to.x - bend} ${connection.to.y}, ${connection.to.x} ${connection.to.y}`;
}

function EducationGraph(): ReactElement {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = allEducationEntries.find(entry => entry.id === selectedId);

  return (
    <>
      <div
        aria-label="Education neural network. Languages feed courses, university learning, and formal education."
        className="education-graph"
        data-testid="education-network"
        role="group"
      >
        <svg aria-hidden="true" className="education-graph__connections" preserveAspectRatio="none" viewBox="0 0 100 100">
          {educationConnections.map(connection => {
            const active = selectedId === connection.fromId || selectedId === connection.toId;
            return (
              <path
                className={`education-connection${active ? ' is-active' : ''}`}
                data-from={connection.fromId}
                data-to={connection.toId}
                d={connectionPath(connection)}
                key={connection.id}
              />
            );
          })}
        </svg>
        <div className="education-graph__layers">
          {educationLayers.map((layer, layerIndex) => (
            <section
              aria-labelledby={`education-layer-${layer.id}`}
              className={`education-layer education-layer--${layer.role}`}
              data-layer-id={layer.id}
              data-role={layer.role}
              key={layer.id}
              style={{ left: `${networkLayerX(layerIndex)}%` }}
            >
              <div className="education-layer__heading">
                <h3 id={`education-layer-${layer.id}`}>{layer.label}</h3>
                <span>{layer.descriptor}</span>
              </div>
              <div className="education-layer__nodes">
                {layer.entries.map((entry, entryIndex) => (
                  <button
                    aria-describedby={selectedId === entry.id ? 'education-graph-detail' : undefined}
                    aria-label={`${entry.title}; ${entry.provider}; ${entry.date}`}
                    aria-pressed={selectedId === entry.id}
                    className={`education-node education-node--${entry.type}${selectedId === entry.id ? ' is-selected' : ''}`}
                    data-entry-id={entry.id}
                    data-testid="education-node"
                    key={entry.id}
                    onClick={() => setSelectedId(entry.id)}
                    onFocus={() => setSelectedId(entry.id)}
                    onPointerEnter={event => {
                      if (event.pointerType === 'mouse') setSelectedId(entry.id);
                    }}
                    style={{ top: `${networkNodeY(entryIndex, layer.entries.length)}%` }}
                    type="button"
                  >
                    <span aria-hidden="true" className="education-node__core" />
                    <span className="education-node__kind">{entry.type}</span>
                    <strong title={entry.title}>{entry.title}</strong>
                    <span className="education-node__provider" title={entry.provider}>{entry.provider}</span>
                    <span className="education-node__date">{entry.date}</span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
      <section className="education-graph__detail" id="education-graph-detail" aria-live="polite" aria-atomic="true">
        <div className="education-graph__detail-meta">
          <span>{selected?.type ?? 'network signal'}</span>
          {selected ? <span>{selected.date}</span> : null}
        </div>
        <h3>{selected?.title ?? 'Follow the signal'}</h3>
        {selected ? <small>{selected.provider}</small> : null}
        <p>{selected?.copy ?? 'Hover, select, or focus a neuron to trace the learning behind it.'}</p>
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
      intro="A neural network of languages, courses, university learning, and formal education gathered while building things that need to work."
      footer="Curiosity is a system property"
    >
      <div className="panel-nodes" aria-hidden="true"><i /><b /><i /><b /><i /><b /><i /><b /><i /></div>
      <section className="panel-section education-section">
        <div className="education-section__heading">
          <h2>Learning network</h2>
          <span>5 layers · 4 max</span>
        </div>
        <EducationGraph />
        <p className="education-graph__hint">Follow the signal from language input through independent learning and university study to the formal record.</p>
      </section>
    </PanelPage>
  );
}

function AboutPanel(): ReactElement {
  return (
    <PanelPage
      theme="panel-about"
      eyebrow="04 · Profile & curiosity"
      title={<>A little company.<br />A lot of curiosity.</>}
    >
      <h2>About me · A curious builder.</h2>
      <div className="panel-flower" aria-hidden="true">✿</div>
      <div className="panel-quote">
        “I know of no better life purpose than to perish attempting the great and impossible.”
        <small>— Friedrich Nietzsche</small>
      </div>
      {/* Reserved for a future personal note. */}
      <section className="profile-personal-space" aria-label="Reserved space for a future personal note" />
      <nav className="panel-links" aria-label="Profile links">
        <a href="https://www.linkedin.com/in/santiago-yepes-mesa-67ab80270" rel="noreferrer" target="_blank">LinkedIn ↗</a>
        <a href="https://github.com/Laughcheeta1" rel="noreferrer" target="_blank">GitHub ↗</a>
      </nav>
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

function HobbyConstellation(): ReactElement {
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeHobby: Hobby | undefined = hobbies.find(hobby => hobby.id === activeId);

  return (
    <section
      aria-label="Hobby star field"
      className="hobby-sky"
      data-testid="hobby-sky"
    >
      <svg aria-hidden="true" className="hobby-sky__scene" preserveAspectRatio="none" viewBox="0 0 160 100">
        <defs>
          <linearGradient id="hobby-sky-gradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#030b1b" />
            <stop offset="0.48" stopColor="#0a1730" />
            <stop offset="1" stopColor="#18233a" />
          </linearGradient>
          <linearGradient id="hobby-horizon-gradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#e8b45c" stopOpacity=".9" />
            <stop offset=".22" stopColor="#9a5d48" stopOpacity=".48" />
            <stop offset="1" stopColor="#172238" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect fill="url(#hobby-sky-gradient)" height="100" width="160" />
        <path className="hobby-sky__milky-way" d="M-8 23C25 4 47 12 72 27s43 22 96-13" />
        <path className="hobby-sky__milky-way-core" d="M-8 23C25 4 47 12 72 27s43 22 96-13" />
        <g className="hobby-sky__ambient-stars">
          <circle cx="8" cy="13" r=".45" /><circle cx="16" cy="35" r=".28" /><circle cx="25" cy="9" r=".7" />
          <circle cx="34" cy="29" r=".35" /><circle cx="43" cy="17" r=".5" /><circle cx="53" cy="7" r=".3" />
          <circle cx="61" cy="36" r=".55" /><circle cx="70" cy="13" r=".35" /><circle cx="83" cy="24" r=".42" />
          <circle cx="93" cy="8" r=".3" /><circle cx="103" cy="32" r=".65" /><circle cx="112" cy="16" r=".3" />
          <circle cx="124" cy="7" r=".5" /><circle cx="137" cy="29" r=".35" /><circle cx="148" cy="12" r=".62" />
          <circle cx="155" cy="39" r=".3" /><circle cx="5" cy="48" r=".25" /><circle cx="28" cy="43" r=".28" />
          <circle cx="47" cy="39" r=".24" /><circle cx="90" cy="42" r=".32" /><circle cx="119" cy="40" r=".25" />
        </g>
        <path className="hobby-sky__horizon-light" d="M0 70C30 64 57 68 79 65s55-2 81 4v31H0Z" />
        <path className="hobby-sky__far-mountains" d="M0 69 15 59 27 66 43 50 58 64 77 43 95 64 114 48 132 63 149 53 160 59v41H0Z" />
        <path className="hobby-sky__near-mountains" d="M0 81 19 68 36 74 53 61 72 75 91 57 109 74 126 64 143 77 160 68v32H0Z" />
        <path className="hobby-sky__valley" d="M0 84c27-9 43-7 63-2 15 4 28 2 43-4 18-7 35-6 54 1v21H0Z" />
        <path className="hobby-sky__city-road" d="M116 100c-11-9-19-13-25-16-7-4-13-7-19-12" />
        <g className="hobby-sky__city-lights">
          <circle cx="95" cy="84" r=".55" /><circle cx="101" cy="87" r=".4" /><circle cx="108" cy="83" r=".65" />
          <circle cx="114" cy="89" r=".35" /><circle cx="121" cy="86" r=".55" /><circle cx="127" cy="91" r=".42" />
          <circle cx="134" cy="87" r=".62" /><circle cx="140" cy="92" r=".32" /><circle cx="147" cy="89" r=".48" />
          <circle cx="104" cy="94" r=".38" /><circle cx="113" cy="96" r=".62" /><circle cx="123" cy="95" r=".35" />
          <circle cx="131" cy="97" r=".5" /><circle cx="143" cy="96" r=".34" /><circle cx="151" cy="94" r=".54" />
        </g>
        <path className="hobby-sky__foreground" d="M0 91c16-5 26-3 39 1 11 4 22 4 33 1 12-4 24-3 35 2 14 6 31 4 53-3v8H0Z" />
        <g className="hobby-sky__figure">
          <ellipse className="hobby-sky__figure-shadow" cx="70" cy="99" rx="32" ry="5" />
          <path className="hobby-sky__figure-body" d="M57 100c2-13 1-23 7-29 5-6 13-7 20-3 7 4 10 17 12 32Z" />
          <circle className="hobby-sky__figure-skin" cx="70" cy="64" r="5" />
          <path className="hobby-sky__figure-hair" d="M65 65c-1-6 3-10 9-10 5 0 8 4 8 9-3-3-7-2-10 1-2 2-5 2-7 0Z" />
          <path className="hobby-sky__figure-knee" d="M77 82c7-5 17-2 24 5l11 9-6 6-13-8-12 5Z" />
          <path className="hobby-sky__figure-leg" d="M61 87c-9 2-18 6-27 13l5 5h25l8-9Z" />
          <path className="hobby-sky__figure-arm" d="M76 75c7 4 13 8 19 15l-3 3c-7-5-12-8-19-11Z" />
          <path className="hobby-sky__figure-shoe" d="M39 96h-9c-4 1-5 4-1 5h15Z" />
          <path className="hobby-sky__figure-highlight" d="M67 59c-2 2-2 5-1 7m-4 17c-1 6-1 10 0 15" />
        </g>
      </svg>
      <p className="hobby-sky__caption">A lookout above the noise · five stars, five ways to stay hopeful</p>
      <div className="hobby-sky__star-field" role="list">
        {hobbies.map(hobby => (
          <span
            className="hobby-star-item"
            key={hobby.id}
            role="listitem"
            style={{
              '--hobby-star-delay': `${hobby.star.delay}s`,
              '--hobby-star-size': `${hobby.star.size}px`,
              '--hobby-star-x': hobby.star.x,
              '--hobby-star-y': hobby.star.y,
            } as CSSProperties}
          >
            <button
              aria-describedby={activeId === hobby.id ? 'hobby-star-detail' : undefined}
              aria-label={`Hobby star ${hobby.number}: ${hobby.title}`}
              aria-pressed={activeId === hobby.id}
              className={`hobby-star${activeId === hobby.id ? ' is-active' : ''}`}
              data-hobby-id={hobby.id}
              data-testid="hobby-star"
              onBlur={event => {
                if (!event.relatedTarget || !event.currentTarget.contains(event.relatedTarget as Node)) setActiveId(null);
              }}
              onClick={() => setActiveId(hobby.id)}
              onFocus={() => setActiveId(hobby.id)}
              onPointerEnter={event => {
                if (event.pointerType === 'mouse') setActiveId(hobby.id);
              }}
              onPointerLeave={event => {
                if (event.pointerType === 'mouse') setActiveId(current => current === hobby.id ? null : current);
              }}
              type="button"
            >
              <span aria-hidden="true" className="hobby-star__halo" />
              <span aria-hidden="true" className="hobby-star__glyph">✦</span>
              <span aria-hidden="true" className="hobby-star__number">{hobby.number}</span>
            </button>
          </span>
        ))}
      </div>
      {activeHobby ? (
        <aside aria-live="polite" className="hobby-star-detail" id="hobby-star-detail" role="tooltip" data-testid="hobby-details">
          <div className="hobby-star-detail__topline">
            <span>{activeHobby.number} · hobby star</span>
            <span>signal received</span>
          </div>
          <h3>{activeHobby.title}</h3>
          <p>{activeHobby.copy}</p>
        </aside>
      ) : null}
      <p className="hobby-sky__hint">Hover, focus, or tap a bright star to read its story.</p>
    </section>
  );
}

function HobbiesPanel(): ReactElement {
  return (
    <PanelPage
      theme="panel-hobbies"
      eyebrow="06 · Hobbies"
      title={<>Keep looking<br />up.</>}
      intro="A quiet lookout for the things that keep me hopeful, curious, and moving."
      footer="There is always another star"
    >
      <HobbyConstellation />
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
      <p className="panel-note">Go big or go home</p>
      <div className="panel-status">You will know it in the news</div>
    </PanelPage>
  );
}

function FitnessStatsPanel(): ReactElement {
  const panel = secretPanels['squat-rack'];

  return (
    <main className={`panel-page secret-panel fitness-stats-panel ${panel.theme}`} data-testid="fitness-stats-panel">
      <div className="panel-eyebrow">{panel.eyebrow}</div>
      <div className="fitness-stats__emblem" aria-hidden="true">{panel.icon}</div>
      <h1>{panel.title}</h1>
      <p className="fitness-stats__copy">{panel.copy}</p>
      <ul className="fitness-stats__grid" aria-label="Fitness and endurance statistics">
        {fitnessStats.map((stat, index) => (
          <li className={`fitness-stat fitness-stat--${stat.accent}`} data-testid="fitness-stat" key={stat.id}>
            <div className="fitness-stat__head">
              <span className="fitness-stat__index">{String(index + 1).padStart(2, '0')}</span>
              <span className="fitness-stat__category">{stat.accent}</span>
            </div>
            <strong className="fitness-stat__value">{stat.value}</strong>
            <span className="fitness-stat__label">{stat.label}</span>
            <p>{stat.detail}</p>
          </li>
        ))}
      </ul>
      <div className="fitness-stats__signature">{panel.signature}</div>
    </main>
  );
}

function ProfileMemoryPanel(): ReactElement {
  return (
    <main className={`panel-page secret-panel profile-memory-panel ${profileMemory.theme}`} data-testid="profile-memory-panel">
      <div className="panel-eyebrow">{profileMemory.eyebrow}</div>
      <div className="profile-memory__seal" aria-hidden="true">{profileMemory.icon}</div>
      <h1>{profileMemory.title}</h1>
      <p className="profile-memory__song-lead">My favourite song is</p>
      <div className="profile-memory__song">{profileMemory.song}</div>
      <figure className="profile-memory__player">
        <div className="profile-memory__screen">
          <iframe
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
            src={profileMemory.embedUrl}
            title={`YouTube player for ${profileMemory.song}`}
          />
        </div>
        <figcaption>
          <span>Play it here · relive the moment</span>
          <a href={profileMemory.videoUrl} rel="noreferrer" target="_blank">Open on YouTube ↗</a>
        </figcaption>
      </figure>
      <p className="profile-memory__story">{profileMemory.story}</p>
      <div className="profile-memory__ellipsis" aria-hidden="true">···</div>
      <p className="profile-memory__closing">{profileMemory.closing}</p>
    </main>
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
      {panel.additionalCopy ? <p className="secret-panel__copy secret-panel__copy--secondary">{panel.additionalCopy}</p> : null}
      {panel.signature ? <div className="secret-panel__signature">{panel.signature}</div> : null}
      {panel.image ? (
        <figure className="secret-panel__image-frame">
          <img alt={panel.image.alt} data-testid="secret-panel-image" src={`${publicAssetBaseUrl}${panel.image.src}`} />
        </figure>
      ) : null}
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
  'roses:back': ProfileMemoryPanel,
  'victory-statue:front': AchievementsPanel,
  'victory-statue:back': () => <SecretPanel panel={secretPanels['victory-statue']} />,
  'squat-rack:front': HobbiesPanel,
  'squat-rack:back': FitnessStatsPanel,
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
