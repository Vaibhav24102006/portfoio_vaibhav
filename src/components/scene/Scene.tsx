"use client";

import { Component, ReactNode, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import IsometricCamera from "./IsometricCamera";
import SceneContent from "./SceneContent";
import Effects from "./Effects";
import RenderGate from "./RenderGate";
import type { FocusTarget } from "./models/types";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class WebGLErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn("WebGL Context/Scene Error caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex items-center justify-center h-full w-full bg-slate-900 text-slate-400 text-sm p-4 text-center">
            WebGL context could not be created in this environment.
          </div>
        )
      );
    }
    return this.props.children;
  }
}

function isWebGLAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

export default function Scene({
  focusProp,
  setFocusProp,
}: {
  focusProp?: FocusTarget | null;
  setFocusProp?: (focus: FocusTarget | null) => void;
}) {
  const [webGlSupported, setWebGlSupported] = useState<boolean>(true);

  useEffect(() => {
    setWebGlSupported(isWebGLAvailable());
  }, []);

  const [internalFocus, setInternalFocus] = useState<FocusTarget | null>(null);
  const activeFocus = focusProp !== undefined ? focusProp : internalFocus;

  const handleFocus = useCallback(
    (target: FocusTarget) => {
      if (setFocusProp) {
        setFocusProp(target);
      } else {
        setInternalFocus(target);
      }
    },
    [setFocusProp]
  );

  const handleClose = useCallback(() => {
    if (setFocusProp) {
      setFocusProp(null);
    } else {
      setInternalFocus(null);
    }
  }, [setFocusProp]);

  const transitionRef = useRef(0);
  const renderFadeRef = useRef(0);

  if (!webGlSupported) {
    return (
      <div className="scene-canvas flex items-center justify-center bg-slate-900 text-slate-400 text-sm p-4 text-center">
        WebGL is not supported or context creation is disabled in this environment.
      </div>
    );
  }

  return (
    <div className="scene-canvas">
      <WebGLErrorBoundary>
        <Canvas shadows dpr={[1, 2]}>
          <IsometricCamera focus={activeFocus} transitionRef={transitionRef} />
          <Suspense fallback={null}>
            <SceneContent
              focus={activeFocus}
              onFocus={handleFocus}
              onClose={handleClose}
              renderFadeRef={renderFadeRef}
            />
            <RenderGate renderFadeRef={renderFadeRef} />
          </Suspense>
          <Effects transitionRef={transitionRef} renderFadeRef={renderFadeRef} />
        </Canvas>
      </WebGLErrorBoundary>
    </div>
  );
}

