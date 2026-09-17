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
  type ProjectCard,
  type SecretPanel,
  type TimelineEntry,
} from './data';
import './styles.css';
import { ProjectPlanet } from './ProjectPlanet';
import { projectPlane, nearestPlanetLimb, type Point } from './projectPointer';
import { HobbyScene } from './HobbyScene';
import { AwardsScene } from './AwardsScene';
import { AwardRelic, type AwardRelicType } from './AwardRelic';
import { buildTimelineLayout, formatTimelineMonth } from './timelineLayout';

const publicAssetBaseUrl = ((import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.BASE_URL ?? '/');

interface PanelPageProps {
  theme: string;
  eyebrow: string;
  title: ReactNode;
  intro?: string;
  children: ReactNode;
}

function PanelPage({ theme, eyebrow, title, intro, children }: PanelPageProps): ReactElement {
  return (
    <main className={`panel-page ${theme}`}>
      <div className="panel-eyebrow">{eyebrow}</div>
      <h1>{title}</h1>
      {intro ? <p className="panel-intro">{intro}</p> : null}
      {children}
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
  landed: boolean;
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

function SpaceShip({ angle, x, y, landed }: { angle: number; x: number; y: number; landed: boolean }): ReactElement {
  return (
    <svg
      aria-hidden="true"
      className={`space-cursor__ship${landed ? ' space-cursor__ship--landed' : ''}`}
      style={{ left: x, top: y, transform: `translate(-50%, -50%) rotate(${angle}deg)` }}
      viewBox="0 0 48 64"
    >
      <path className="space-cursor__flame" d="M19 47c1 8 4 13 5 15 2-3 5-8 5-15Z" />
      <path className="space-cursor__body" d="M24 3C14 12 10 23 14 43h20c4-20 0-31-10-40Z" />
      <path className="space-cursor__fin" d="m14 34-10 12 11-3m19-9 10 12-11-3" />
      <circle className="space-cursor__window" cx="24" cy="24" r="6" />
      {landed ? <path className="space-cursor__landing-gear" d="M16 39 10 50H5m27-11 6 11h5" /> : null}
      <path className="space-cursor__shine" d="M20 11c-3 7-4 13-3 19" />
    </svg>
  );
}

function ProjectUniverse({ title, projects, designOffset = 0 }: { title: string; projects: readonly ProjectCard[]; designOffset?: number }): ReactElement {
  const universeRef = useRef<HTMLDivElement>(null);
  const previousPointer = useRef<{ x: number; y: number } | null>(null);
  const [pointer, setPointer] = useState<ProjectPointer>({ x: 0, y: 0, angle: 0, visible: false, landed: false });
  const [hovered, setHovered] = useState<HoveredProject | null>(null);

  const getProjection = () => {
    const universe = universeRef.current;
    if (!universe) return null;
    const corners = Array.from(universe.querySelectorAll<HTMLElement>('.project-universe__corner')).map(element => {
      const rect = element.getBoundingClientRect();
      return { x: rect.x, y: rect.y };
    });
    if (corners.length !== 4) return null;
    return projectPlane(corners as [Point, Point, Point, Point], universe.clientWidth, universe.clientHeight);
  };

  const updatePointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse') return;
    const universe = universeRef.current, projection = getProjection();
    if (!universe || !projection) return;
    const mouse = { x: event.clientX, y: event.clientY };
    const local = projection.toLocal(mouse);
    const previous = previousPointer.current;
    const angle = previous && (local.x !== previous.x || local.y !== previous.y)
      ? Math.atan2(local.y - previous.y, local.x - previous.x) * 180 / Math.PI + 90
      : pointer.angle;
    previousPointer.current = local;
    for (let index = 0; index < projects.length; index++) {
      const layout = projectPlanetLayouts[index % projectPlanetLayouts.length];
      const center = { x: parseFloat(layout.x) / 100 * universe.clientWidth, y: parseFloat(layout.y) / 100 * universe.clientHeight };
      const radius = layout.size / 2;
      if (Math.hypot(local.x - center.x, local.y - center.y) <= radius) {
        setPointer({ ...nearestPlanetLimb(mouse, center, radius, projection), visible: true, landed: true });
        return;
      }
    }
    setPointer({ ...local, angle, visible: true, landed: false });
  };

  const showProject = (project: ProjectCard, element: HTMLElement, clientX?: number, clientY?: number) => {
    const universe = universeRef.current;
    if (!universe) return;
    const projection = getProjection();
    if (!projection) return;
    const target = element.getBoundingClientRect();
    const { x, y } = projection.toLocal({ x: clientX ?? target.left + target.width / 2, y: clientY ?? target.top });
    const popupWidth = Math.min(300, Math.max(180, universe.clientWidth - 24));
    const minX = popupWidth / 2 + 12;
    const maxX = Math.max(minX, universe.clientWidth - popupWidth / 2 - 12);
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
        {[0, 1, 2, 3].map(corner => <span aria-hidden="true" className={`project-universe__corner project-universe__corner--${corner}`} key={corner} />)}
        <div className="project-universe__stars" aria-hidden="true" />
        <div className="project-universe__nebula" aria-hidden="true" />
        {projects.map((project, index) => {
          const layout = projectPlanetLayouts[index % projectPlanetLayouts.length];
          const popoverId = `project-popover-${project.title.replace(/\W+/g, '-').toLowerCase()}`;
          return (
            <button
              aria-describedby={hovered?.project.title === project.title ? popoverId : undefined}
              aria-label={`Explore project ${project.title}`}
              className="project-planet"
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
              <ProjectPlanet designIndex={designOffset + index} />
            </button>
          );
        })}
        {hovered ? <ProjectHoverCard hover={hovered} /> : null}
        {pointer.visible ? <div className="space-cursor"><SpaceShip angle={pointer.angle} x={pointer.x} y={pointer.y} landed={pointer.landed} /></div> : null}
      </div>
    </section>
  );
}

function ProjectsPanel(): ReactElement {
  return (
    <PanelPage
      theme="panel-projects"
      eyebrow="01"
      title="Projects"
    >
      <ProjectUniverse title="Personal projects" projects={personalProjects} />
      <ProjectUniverse title="Work projects" projects={workProjects} designOffset={personalProjects.length} />
    </PanelPage>
  );
}

interface HoveredExperience {
  entry: TimelineEntry;
  x: number;
  y: number;
  placement: 'above' | 'below';
}

function ExperiencePopover({ hover, onEnter, onLeave, onDismiss }: {
  hover: HoveredExperience;
  onEnter: () => void;
  onLeave: () => void;
  onDismiss: () => void;
}): ReactElement {
  return (
    <aside
      className={`timeline-hover-card timeline-hover-card--${hover.placement}`}
      id={`experience-popover-${hover.entry.id}`}
      role="tooltip"
      style={{ left: hover.x, top: hover.y }}
      tabIndex={0}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      onFocus={onEnter}
      onBlur={onLeave}
      onKeyDown={event => { if (event.key === 'Escape') onDismiss(); }}
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
  const [now, setNow] = useState(() => new Date());
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const layout = useMemo(() => buildTimelineLayout(workTimeline, now), [now]);
  const trackHeight = Math.max(900, (layout.end - layout.start) / (365.25 * 86400000) * 330);
  const years = Array.from({ length: new Date(layout.end).getUTCFullYear() - new Date(layout.start).getUTCFullYear() + 1 }, (_, index) => Date.UTC(new Date(layout.start).getUTCFullYear() + index, 0, 1)).filter(date => date > layout.start && date < layout.end);

  const keepHover = () => {
    if (closeTimer.current !== null) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  };
  const dismissHover = () => { keepHover(); setHovered(null); };
  const scheduleClose = () => {
    keepHover();
    closeTimer.current = setTimeout(() => setHovered(null), 250);
  };

  useEffect(() => {
    const refreshMonth = () => setNow(previous => {
      const next = new Date();
      return previous.getUTCFullYear() === next.getUTCFullYear() && previous.getUTCMonth() === next.getUTCMonth() ? previous : next;
    });
    const interval = setInterval(refreshMonth, 30_000);
    document.addEventListener('visibilitychange', refreshMonth);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', refreshMonth);
      if (closeTimer.current !== null) clearTimeout(closeTimer.current);
    };
  }, []);

  const updateHover = (entry: TimelineEntry, element: HTMLElement, pointerY?: number) => {
    keepHover();
    const timeline = element.closest<HTMLElement>('.timeline');
    if (!timeline) return;
    const target = element.getBoundingClientRect();
    const popupWidth = Math.min(360, timeline.clientWidth - 24);
    const minX = popupWidth / 2 + 12;
    const maxX = Math.max(minX, timeline.clientWidth - popupWidth / 2 - 12);
    const side = element.parentElement!;
    const track = side.parentElement!;
    const x = Math.min(maxX, Math.max(minX, side.offsetLeft + element.offsetLeft + element.offsetWidth / 2));
    const fraction = pointerY === undefined ? 0.5 : Math.max(0, Math.min(1, (pointerY - target.top) / target.height));
    const y = track.offsetTop + element.offsetTop + element.offsetHeight * fraction;
    const placement = (pointerY ?? target.top + target.height / 2) > window.innerHeight / 2 ? 'above' : 'below';
    setHovered({ entry, x, y, placement });
  };

  return (
    <>
      <section className="timeline" aria-label="Experience timeline">
        <div className="timeline-endpoint"><time dateTime={new Date(layout.currentMonth).toISOString().slice(0, 7)}>{formatTimelineMonth(layout.currentMonth)}</time><span>Now</span></div>
        <div className="timeline-track" style={{ height: trackHeight }}>
          <div className="timeline-axis" aria-hidden="true" />
          {years.map(date => <span className="timeline-year" key={date} style={{ top: `${(layout.end - date) / (layout.end - layout.start) * 100}%` }}>{new Date(date).getUTCFullYear()}</span>)}
          {(['left', 'right'] as const).map(side => (
            <div className={`timeline-side timeline-side--${side}`} key={side}>
              {layout.cards.filter(entry => entry.side === side).map(entry => {
                const describedBy = hovered?.entry.id === entry.id ? `experience-popover-${entry.id}` : undefined;
                return (
                  <article
                    key={entry.id}
                    style={{ top: `${entry.top}%`, height: `${entry.height}%`, width: `calc((100% - ${(layout.laneCount - 1) * 8}px) / ${layout.laneCount})`, left: `calc(${entry.lane} * ((100% + 8px) / ${layout.laneCount}))` }}
                    data-start={entry.startTimestamp}
                    data-end={entry.endTimestamp}
                    aria-describedby={describedBy}
                    className={`timeline-card${entry.current ? ' timeline-card--current' : ''}`}
                    onBlur={scheduleClose}
                    onFocus={event => updateHover(entry, event.currentTarget)}
                    onPointerEnter={event => updateHover(entry, event.currentTarget, event.clientY)}
                    onPointerLeave={scheduleClose}
                    onClick={event => updateHover(entry, event.currentTarget)}
                    onKeyDown={event => { if (event.key === 'Escape') dismissHover(); }}
                    tabIndex={0}
                  >
                    <span className="timeline-card__role">{entry.role}</span>
                    <span className="timeline-card__company">{entry.company}</span>
                    <span className="timeline-card__date">{entry.period}</span>
                    <span className="timeline-card__status">{entry.current ? 'Active' : entry.kicker}</span>
                  </article>
                );
              })}
            </div>
          ))}
        </div>
        <div className="timeline-endpoint timeline-endpoint--start"><time dateTime={new Date(layout.start).toISOString().slice(0, 7)}>{formatTimelineMonth(layout.start)}</time><span>Beginning</span></div>
        {hovered ? <ExperiencePopover hover={hovered} onEnter={keepHover} onLeave={scheduleClose} onDismiss={dismissHover} /> : null}
      </section>
    </>
  );
}

function WorkPanel(): ReactElement {
  return (
    <PanelPage
      theme="panel-work"
      eyebrow="02"
      title="Work experience"
    >
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
  const [lockedId, setLockedId] = useState<string | null>(null);
  const activeId = lockedId ?? selectedId;
  const selected = allEducationEntries.find(entry => entry.id === activeId);

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
            const active = activeId === connection.fromId || activeId === connection.toId;
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
              aria-label={`${layer.role} education entries`}
              className={`education-layer education-layer--${layer.role}`}
              data-layer-id={layer.id}
              data-role={layer.role}
              key={layer.id}
              style={{ left: `${networkLayerX(layerIndex)}%` }}
            >
              <div className="education-layer__nodes">
                {layer.entries.map((entry, entryIndex) => (
                  <button
                    aria-describedby={activeId === entry.id ? 'education-graph-detail' : undefined}
                    aria-label={`${entry.title}; ${entry.provider}; ${entry.date}`}
                    aria-pressed={activeId === entry.id}
                    className={`education-node education-node--${entry.type}${activeId === entry.id ? ' is-selected' : ''}`}
                    data-entry-id={entry.id}
                    data-locked={lockedId === entry.id}
                    data-testid="education-node"
                    key={entry.id}
                    onClick={() => {
                      setSelectedId(entry.id);
                      setLockedId(entry.id);
                    }}
                    onFocus={() => {
                      if (lockedId === null) setSelectedId(entry.id);
                    }}
                    onPointerEnter={event => {
                      if (event.pointerType === 'mouse' && lockedId === null) setSelectedId(entry.id);
                    }}
                    style={{ top: `${networkNodeY(entryIndex, layer.entries.length)}%` }}
                    type="button"
                  >
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
      {selected ? (
        <section className="education-graph__detail" id="education-graph-detail" aria-live="polite" aria-atomic="true">
          <div className="education-graph__detail-meta">
            <span>{selected.type}</span>
            <span>{selected.date}</span>
          </div>
          <h3>{selected.title}</h3>
          <small>{selected.provider}</small>
          <p>{selected.copy}</p>
        </section>
      ) : null}
    </>
  );
}

function EducationPanel(): ReactElement {
  return (
    <PanelPage
      theme="panel-education"
      eyebrow="03"
      title="Skills & education"
    >
      <section className="panel-section education-section">
        <EducationGraph />
      </section>
    </PanelPage>
  );
}

function AboutPanel(): ReactElement {
  return (
    <PanelPage
      theme="panel-about"
      eyebrow="04"
      title="About me"
    >
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

const awardRelicTypes: readonly AwardRelicType[] = ['armor', 'laurel', 'helmet', 'swords', 'shield'];

// Coordinates follow the five relics in the 1448 × 1086 reference artwork.
const awardColumnLayouts = [
  { left: '12%', top: '9%', height: '21%' },
  { left: '30.5%', top: '18%', height: '12%' },
  { left: '49%', top: '12%', height: '18%' },
  { left: '68.5%', top: '17%', height: '13%' },
  { left: '88.5%', top: '9%', height: '21%' },
] as const;

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

  return (
    <section className={`awards-grove${activeEntry ? ' awards-grove--focused' : ''}`} aria-label="Awards and honors grove" data-testid="achievement-field" onKeyDown={event => {
      if (event.key === 'Escape') { event.stopPropagation(); setActiveIndex(null); }
    }}>
      <AwardsScene activeIndex={activeIndex} />
      {entries.map((entry, index) => {
        const layout = awardColumnLayouts[index % awardColumnLayouts.length];
        const active = activeIndex === index;
        return (
          <div
            className={`award-site${active ? ' award-site--active' : ''}`}
            data-achievement-id={entry.title}
            data-state={active ? 'featured' : 'resting'}
            data-testid="achievement-relic"
            key={entry.title}
            style={{
              '--award-height': layout.height,
              '--award-left': layout.left,
              '--award-top': layout.top,
            } as CSSProperties}
          >
            <div aria-hidden="true" className="award-column" data-testid="achievement-column" />
            <button
              aria-expanded={active}
              aria-label={`Inspect ${entry.title}`}
              aria-pressed={active}
              className="award-relic"
              data-state={active ? 'featured' : 'resting'}
              data-testid="achievement-object"
              onClick={() => setActiveIndex(index)}
              type="button"
            >
            </button>
          </div>
        );
      })}
      {activeEntry && activeRelic ? (
        <div className="award-focus-layer" data-testid="achievement-dismiss-surface" onClick={() => setActiveIndex(null)}>
          <div className={`award-featured-relic award-featured-relic--${activeRelic}`} style={{
            '--award-origin-x': awardColumnLayouts[activeIndex!].left,
            '--award-origin-y': `${parseFloat(awardColumnLayouts[activeIndex!].top) + parseFloat(awardColumnLayouts[activeIndex!].height) / 2}%`,
          } as CSSProperties} aria-hidden="true" data-achievement-id={activeEntry.title} data-state="featured" data-testid="achievement-featured">
            <AwardRelic kind={activeRelic} />
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
      eyebrow="05"
      title="Honors & awards"
    >
      <AwardsGrove entries={achievements} />
    </PanelPage>
  );
}

function HobbyConstellation(): ReactElement {
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <section
      aria-label="Hobby star field"
      className="hobby-sky"
      data-testid="hobby-sky"
    >
      <HobbyScene />
      <div className="hobby-sky__star-field" role="list">
        {hobbies.map(hobby => (
          <div
            className={`hobby-star-item${activeId === hobby.id ? ' is-active' : ''}`}
            key={hobby.id}
            role="listitem"
            onBlur={event => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setActiveId(null);
            }}
            onFocus={() => setActiveId(hobby.id)}
            onKeyDown={event => {
              if (event.key === 'Escape') { event.stopPropagation(); setActiveId(null); }
            }}
            onPointerEnter={event => {
              if (event.pointerType === 'mouse') setActiveId(hobby.id);
            }}
            onPointerLeave={event => {
              if (event.pointerType === 'mouse') setActiveId(current => current === hobby.id ? null : current);
            }}
            style={{
              '--hobby-star-delay': `${hobby.star.delay}s`,
              '--hobby-star-size': `${hobby.star.size}px`,
              '--hobby-star-x': hobby.star.x,
              '--hobby-star-y': hobby.star.y,
              '--hobby-star-offset': `${parseFloat(hobby.star.x)}cqw`,
            } as CSSProperties}
          >
            <button
              aria-describedby={activeId === hobby.id ? `hobby-detail-${hobby.id}` : undefined}
              aria-label={`Hobby star ${hobby.number}: ${hobby.title}`}
              aria-pressed={activeId === hobby.id}
              className={`hobby-star${activeId === hobby.id ? ' is-active' : ''}`}
              data-hobby-id={hobby.id}
              data-testid="hobby-star"
              onClick={() => setActiveId(hobby.id)}
              type="button"
            >
              <span aria-hidden="true" className="hobby-star__halo" />
              <span aria-hidden="true" className="hobby-star__glyph">✦</span>
              <span aria-hidden="true" className="hobby-star__number">{hobby.number}</span>
            </button>
            {activeId === hobby.id ? (
              <aside aria-live="polite" className="hobby-star-detail" id={`hobby-detail-${hobby.id}`} role="tooltip" data-testid="hobby-details" tabIndex={0}>
                <div className="hobby-star-detail__topline"><span>{hobby.number} · hobby star</span></div>
                <h3>{hobby.title}</h3>
                <p>{hobby.copy}</p>
              </aside>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function HobbiesPanel(): ReactElement {
  return (
    <PanelPage
      theme="panel-hobbies"
      eyebrow="06"
      title="Hobbies"
    >
      <HobbyConstellation />
    </PanelPage>
  );
}

function LibraryPanel(): ReactElement {
  return (
    <PanelPage
      theme="panel-library"
      eyebrow="07"
      title="Go Big or Go Home"
    >
      <div className="library-message">
        <p className="library-message__title">Building something VERY BIG</p>
        <p className="library-message__status">Currently in stealth mode</p>
      </div>
    </PanelPage>
  );
}

function FitnessStatsPanel(): ReactElement {
  const panel = secretPanels['squat-rack'];

  return (
    <main className={`panel-page secret-panel fitness-stats-panel ${panel.theme}`} data-testid="fitness-stats-panel">
      <h1>{panel.title}</h1>
      <p className="fitness-stats__copy">{panel.copy}</p>
      <ul className="fitness-stats__grid" aria-label="Fitness and endurance statistics">
        {fitnessStats.map(stat => (
          <li className={`fitness-stat fitness-stat--${stat.accent}`} data-testid="fitness-stat" key={stat.id}>
            <strong className="fitness-stat__value">{stat.value}</strong>
            <span className="fitness-stat__label">{stat.label}</span>
            {stat.detail ? <p>{stat.detail}</p> : null}
          </li>
        ))}
      </ul>
    </main>
  );
}

function ProfileMemoryPanel(): ReactElement {
  return (
    <main className={`panel-page secret-panel profile-memory-panel ${profileMemory.theme}`} data-testid="profile-memory-panel">
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
      </figure>
      <p className="profile-memory__story">{profileMemory.story}</p>
    </main>
  );
}

function F22RaptorMark(): ReactElement {
  return (
    <svg aria-hidden="true" className="secret-panel__f22" viewBox="0 0 220 140">
      <g className="secret-panel__f22-shock" fill="none" strokeLinecap="round">
        <path d="M12 72c24-35 57-52 99-53" />
        <path d="M5 77c33-18 67-25 103-21" />
        <path d="M13 83c27 14 59 23 95 22" />
        <path d="M25 91c22 29 51 43 87 44" />
      </g>
      <g className="secret-panel__f22-body">
        <path d="m111 9 10 47 76 21-69 5-17 49-17-49-69-5 76-21Z" />
        <path d="m101 57-31-29 23 42m26-13 31-29-23 42" />
        <path d="m95 82-18 18 30-12m18-6 18 18-30-12" />
        <path className="secret-panel__f22-cockpit" d="m106 29 5-13 5 13-5 20Z" />
        <path className="secret-panel__f22-tail" d="m96 101 15 29 15-29-15 8Z" />
      </g>
    </svg>
  );
}

function SecretPanel({ panel }: { panel: SecretPanel }): ReactElement {
  return (
    <main className={`panel-page secret-panel ${panel.theme}`}>
      {panel.eyebrow ? <div className="panel-eyebrow">{panel.eyebrow}</div> : null}
      {panel.theme === 'secret-flight' || panel.icon ? (
        <div className="secret-panel__icon" aria-hidden="true">
          {panel.theme === 'secret-launch' ? (
            <svg width="64" height="72" viewBox="0 0 64 72" className="secret-panel__rocket">
              <path d="M25 48 32 70 39 48" fill="#ff9a54" />
              <path d="M23 31 9 53l15-4m17-18 14 22-15-4" fill="#bd6551" stroke="#ffca74" strokeWidth="2" />
              <path d="M32 3C19 16 18 35 24 51h16C46 35 45 16 32 3Z" fill="#fff2cf" />
              <circle cx="32" cy="27" r="7" fill="#385e78" stroke="#a15f43" strokeWidth="3" />
            </svg>
          ) : panel.theme === 'secret-flight' ? <F22RaptorMark /> : panel.icon}
        </div>
      ) : null}
      <h1>{panel.title}</h1>
      {panel.copy ? <p className="secret-panel__copy">{panel.copy}</p> : null}
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
