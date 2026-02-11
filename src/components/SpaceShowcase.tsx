import { useEffect, useRef, useState } from 'react';

import { startAmbientHum, type AmbientHumController } from '../features/space/ambientHum';
import { SpaceSceneRuntime } from '../features/space/SpaceSceneRuntime';
import { SPACE_MODELS } from '../features/space/spaceModels';

const SpaceShowcase = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const runtimeRef = useRef<SpaceSceneRuntime | null>(null);
  const humRef = useRef<AmbientHumController | null>(null);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isAudioOn, setIsAudioOn] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const runtime = new SpaceSceneRuntime({
      container,
      models: SPACE_MODELS,
      onSelectionChange: setSelectedIndex,
    });

    runtimeRef.current = runtime;
    void runtime.start();

    return () => {
      runtime.dispose();
      runtimeRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!isAudioOn) {
      humRef.current?.stop();
      humRef.current = null;
      return;
    }

    humRef.current = startAmbientHum();

    return () => {
      humRef.current?.stop();
      humRef.current = null;
    };
  }, [isAudioOn]);

  const selectedName = selectedIndex === null ? '' : SPACE_MODELS[selectedIndex]?.name ?? '';

  return (
    <section className="space-page">
      <div ref={containerRef} className="space-canvas" aria-label="Interactive 3D portfolio scene" />

      <div className="space-hud">
        <h1>3D Portfolio Ring</h1>
        <p>Drag left or right to rotate view. Click a model to focus. Enter focuses nearest. Esc resets.</p>

        <div className="space-controls">
          <button type="button" onClick={() => setIsAudioOn((prev) => !prev)}>
            {isAudioOn ? 'Disable ambient hum' : 'Enable ambient hum'}
          </button>
          <button type="button" onClick={() => runtimeRef.current?.setSelection(null)}>
            Clear focus
          </button>
        </div>
      </div>

      <div className={`focus-label ${selectedName ? 'show' : ''}`}>{selectedName}</div>
    </section>
  );
};

export default SpaceShowcase;
