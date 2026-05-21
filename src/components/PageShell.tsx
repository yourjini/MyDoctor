import { Nav } from "./Nav";
import { currentSubject } from "@/lib/current-subject";

export async function PageShell({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const person = await currentSubject("박란하");
  return (
    <>
      <Nav currentPerson={person} />
      <main className="container-narrow py-4 pb-24 sm:py-6 sm:pb-6">
        <div className="mb-4 flex items-center justify-between gap-3 sm:mb-5">
          <h1 className="text-xl font-semibold sm:text-2xl">{title}</h1>
          {action}
        </div>
        {children}
      </main>
    </>
  );
}
