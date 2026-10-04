// 레코드 종류별 매니페스트 (data/<kind>/_index.json).
// list* 함수가 전체 디렉토리 walk 대신 매니페스트 한 번만 읽도록 최적화.
// unstable_cache 와 결합하면: cold cache = 1 API 호출, warm cache = 0.
//
// 쓰기 때는 manifest + 개별 레코드 를 둘 다 갱신. 매니페스트 유실 시
// 다음 조회에서 자동으로 walk → rebuild 하므로 self-healing.
//
// 포함되는 레코드: visits/appointments/checkups/health. 나머지는 양이
// 작아 walk 비용이 미미해서 적용 안 함.

import "server-only";

import { readJSON, writeJSON } from "./github";

const INDEX_VERSION = 1;

export type Manifest<T> = {
  version: number;
  updatedAt: string;
  items: T[];
};

function manifestPath(kind: string): string {
  return `data/${kind}/_index.json`;
}

export async function readManifest<T>(
  kind: string,
): Promise<Manifest<T> | null> {
  const data = await readJSON<Manifest<T>>(manifestPath(kind));
  if (!data || data.version !== INDEX_VERSION) return null;
  return data;
}

export async function writeManifest<T>(
  kind: string,
  items: T[],
): Promise<void> {
  const manifest: Manifest<T> = {
    version: INDEX_VERSION,
    updatedAt: new Date().toISOString(),
    items,
  };
  await writeJSON(
    manifestPath(kind),
    manifest,
    `update ${kind} index (${items.length} items)`,
  );
}

// Upsert — 매니페스트에 1건 추가 또는 교체.
// 매니페스트 없으면 fallback 으로 walkAll 돌려 전체 재구성.
export async function upsertManifestItem<T extends { id: string }>(
  kind: string,
  item: T,
  walkAll: () => Promise<T[]>,
): Promise<void> {
  const existing = await readManifest<T>(kind);
  let items: T[];
  if (existing) {
    const idx = existing.items.findIndex((x) => x.id === item.id);
    if (idx >= 0) {
      items = [...existing.items];
      items[idx] = item;
    } else {
      items = [...existing.items, item];
    }
  } else {
    items = await walkAll();
    const idx = items.findIndex((x) => x.id === item.id);
    if (idx >= 0) items[idx] = item;
    else items.push(item);
  }
  await writeManifest(kind, items);
}

// Remove — 매니페스트에서 1건 삭제.
export async function removeManifestItem<T extends { id: string }>(
  kind: string,
  id: string,
  walkAll: () => Promise<T[]>,
): Promise<void> {
  const existing = await readManifest<T>(kind);
  let items: T[];
  if (existing) {
    items = existing.items.filter((x) => x.id !== id);
  } else {
    items = (await walkAll()).filter((x) => x.id !== id);
  }
  await writeManifest(kind, items);
}

// list* 함수용 fast-path 헬퍼.
// 매니페스트 있으면 그 안의 items 반환, 없으면 walkAll 후 매니페스트 작성.
export async function listViaManifest<T>(
  kind: string,
  walkAll: () => Promise<T[]>,
): Promise<T[]> {
  const manifest = await readManifest<T>(kind);
  if (manifest) return manifest.items;
  // Cold path: walk + 매니페스트 생성.
  const items = await walkAll();
  // 매니페스트 작성 실패해도 데이터는 반환 (self-healing 은 다음 호출에서).
  try {
    await writeManifest(kind, items);
  } catch (err) {
    console.warn(`manifest rebuild failed for ${kind}:`, err);
  }
  return items;
}
