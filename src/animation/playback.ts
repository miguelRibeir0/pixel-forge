import { useEffect, useRef } from 'react';
import useEditorStore from '../store/editorStore';

export function useAnimationPlayer() {
  const isPlaying = useEditorStore(s => s.isPlaying);
  const rafRef = useRef<number>(0);
  const frameStartRef = useRef<number>(0);
  const frameIndexRef = useRef<number>(0);

  useEffect(() => {
    if (!isPlaying) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    const state = useEditorStore.getState();
    const doc = state.project?.documents.find(d => d.id === state.activeDocumentId);
    if (!doc || doc.frames.length === 0) return;

    const frames = doc.frames;
    const startFrameId = state.playbackFrameId;
    let frameIndex = startFrameId
      ? frames.findIndex(f => f.id === startFrameId)
      : 0;
    if (frameIndex < 0) frameIndex = 0;
    frameIndexRef.current = frameIndex;
    frameStartRef.current = performance.now();

    const tick = (now: number) => {
      const s = useEditorStore.getState();
      if (!s.isPlaying) return;

      const d = s.project?.documents.find(doc => doc.id === s.activeDocumentId);
      if (!d || d.frames.length === 0) return;

      const elapsed = now - frameStartRef.current;
      const currentFrame = d.frames[frameIndexRef.current];
      if (!currentFrame) return;

      const duration = Math.max(Math.round(currentFrame.duration / s.playbackSpeed), 16);

      if (elapsed >= duration) {
        frameIndexRef.current++;
        if (frameIndexRef.current >= d.frames.length) {
          if (s.playbackLoop) {
            frameIndexRef.current = 0;
          } else {
            useEditorStore.getState().stopPlayback();
            return;
          }
        }
        frameStartRef.current = now;
        const nextFrame = d.frames[frameIndexRef.current];
        if (nextFrame) {
          useEditorStore.getState().setPlaybackFrameId(nextFrame.id);
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying]);
}
