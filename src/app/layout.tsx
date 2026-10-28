import type { Metadata } from "next";
import "./globals.css";
import LabViewWrapper from "@/components/LabViewWrapper";
import BootSequence from "@/components/BootSequence";
import RouteTransition from "@/components/RouteTransition";
import RouterBridge from "@/components/RouterBridge";

const TITLE = "Vaibhav Jain — Cybersecurity Researcher & Developer";
const DESCRIPTION =
  "Vaibhav Jain — cybersecurity researcher with 10+ responsibly disclosed bug bounty findings and three government cybercrime internships. An interactive isometric 3D portfolio built with React Three Fiber.";

// No metadataBase/canonical/og:url set — this project has no confirmed
// deployment URL yet (unlike its live GitHub Pages sibling project). Add one
// once a real production domain exists rather than inventing a placeholder.
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* Persistent across every route — layout.tsx is not remounted on
            navigation within the same segment, so the WebGL context, camera
            state, and loaded GLTFs survive route changes. */}
        <LabViewWrapper />
        {/* Owns the router reference from outside the Canvas/dynamic-import
            tree — see navigationBridge.ts. */}
        <RouterBridge />
        <RouteTransition>{children}</RouteTransition>
        {/* Highest layer — opaque, masks GLB load/shader-compile pop-in
            until every asset queued via useGLTF.preload() has resolved. */}
        <BootSequence />
      </body>
    </html>
  );
}
