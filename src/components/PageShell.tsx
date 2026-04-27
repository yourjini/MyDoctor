import { Nav } from "./Nav";

export function PageShell({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <>
      <Nav />
      <main className="container-narrow py-6">
        <div className="mb-5 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">{title}</h1>
          {action}
        </div>
        {children}
      </main>
    </>
  );
}
