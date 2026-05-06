import { Nav } from "@/components/Nav";

export default function Loading() {
  return (
    <>
      <Nav />
      <main className="container-narrow py-4 sm:py-6">
        <div className="mb-4 flex items-center justify-between gap-3 sm:mb-5">
          <div className="h-7 w-32 animate-pulse rounded bg-muted" />
          <div className="h-9 w-24 animate-pulse rounded bg-muted" />
        </div>
        <div className="space-y-3">
          <div className="h-12 animate-pulse rounded-lg border bg-card" />
          <div className="h-24 animate-pulse rounded-lg border bg-card" />
          <div className="h-24 animate-pulse rounded-lg border bg-card" />
          <div className="h-24 animate-pulse rounded-lg border bg-card" />
        </div>
      </main>
    </>
  );
}
