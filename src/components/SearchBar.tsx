"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

export function SearchBar({
  placeholder = "검색",
  paramName = "q",
}: {
  placeholder?: string;
  paramName?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const initial = searchParams.get(paramName) ?? "";
  const [value, setValue] = useState(initial);

  // Debounced URL update
  useEffect(() => {
    const handle = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      const v = value.trim();
      if (v) params.set(paramName, v);
      else params.delete(paramName);
      const qs = params.toString();
      const next = qs ? `${pathname}?${qs}` : pathname;
      const cur = `${pathname}${
        searchParams.toString() ? `?${searchParams.toString()}` : ""
      }`;
      if (next !== cur) {
        startTransition(() => router.replace(next));
      }
    }, 250);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative">
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border bg-background px-3 py-2 pr-9 text-sm"
      />
      {pending && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          …
        </span>
      )}
    </div>
  );
}
