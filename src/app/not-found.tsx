import NotFoundPage from "@/components/ui/page-not-found";

// RouteTransition's <main> sets pointer-events: none (globals.css) and relies
// on each route's root to opt back in — see about/page.tsx for the same
// pattern — otherwise the buttons here would render but never receive clicks.
export default function NotFound() {
  return (
    <div className="pointer-events-auto h-full w-full">
      <NotFoundPage />
    </div>
  );
}
