import { Octokit } from "@octokit/rest";
import { revalidateTag } from "next/cache";
import { pathToTag } from "./cache-tags";

let _octokit: Octokit | null = null;

function getOctokit() {
  if (!_octokit) {
    const token = process.env.GITHUB_TOKEN;
    if (!token) throw new Error("GITHUB_TOKEN is not set");
    _octokit = new Octokit({ auth: token });
  }
  return _octokit;
}

function getRepo() {
  const owner = process.env.GITHUB_DATA_OWNER || "yourjini";
  const repo = process.env.GITHUB_DATA_REPO || "MyDoctor_db";
  const branch = process.env.GITHUB_DATA_BRANCH || "main";
  return { owner, repo, branch };
}

export type GhFile = {
  path: string;
  sha: string;
  size: number;
  type: "file" | "dir";
};

export async function listDir(path: string): Promise<GhFile[]> {
  const { owner, repo, branch } = getRepo();
  try {
    const res = await getOctokit().repos.getContent({
      owner,
      repo,
      path,
      ref: branch,
    });
    if (!Array.isArray(res.data)) return [];
    return res.data.map((item) => ({
      path: item.path,
      sha: item.sha,
      size: item.size,
      type: item.type as "file" | "dir",
    }));
  } catch (err: unknown) {
    if (isNotFound(err)) return [];
    throw err;
  }
}

export async function readFile(path: string): Promise<{
  content: Buffer;
  sha: string;
} | null> {
  const { owner, repo, branch } = getRepo();
  try {
    const res = await getOctokit().repos.getContent({
      owner,
      repo,
      path,
      ref: branch,
    });
    if (Array.isArray(res.data) || res.data.type !== "file") return null;
    const data = res.data as { content: string; encoding: string; sha: string };
    // GitHub Contents API only returns content for files <=1MB.
    // For larger files, content is empty — fall back to the Git Blob API
    // (supports up to 100MB).
    if (data.content && data.content.length > 0) {
      const buf = Buffer.from(data.content, data.encoding as BufferEncoding);
      return { content: buf, sha: data.sha };
    }
    const blob = await getOctokit().git.getBlob({
      owner,
      repo,
      file_sha: data.sha,
    });
    const buf = Buffer.from(
      blob.data.content,
      blob.data.encoding as BufferEncoding,
    );
    return { content: buf, sha: data.sha };
  } catch (err: unknown) {
    if (isNotFound(err)) return null;
    throw err;
  }
}

export async function readJSON<T>(path: string): Promise<T | null> {
  const file = await readFile(path);
  if (!file) return null;
  return JSON.parse(file.content.toString("utf-8")) as T;
}

export async function writeFile(
  path: string,
  content: Buffer | string,
  message: string,
): Promise<void> {
  const { owner, repo, branch } = getRepo();
  const buf = typeof content === "string" ? Buffer.from(content, "utf-8") : content;
  const existing = await readFile(path);
  await getOctokit().repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message,
    content: buf.toString("base64"),
    branch,
    sha: existing?.sha,
  });
  invalidatePathTag(path);
}

export async function writeJSON(
  path: string,
  data: unknown,
  message: string,
): Promise<void> {
  await writeFile(path, JSON.stringify(data, null, 2), message);
}

export async function deleteFile(path: string, message: string): Promise<void> {
  const { owner, repo, branch } = getRepo();
  const existing = await readFile(path);
  if (!existing) return;
  await getOctokit().repos.deleteFile({
    owner,
    repo,
    path,
    message,
    sha: existing.sha,
    branch,
  });
  invalidatePathTag(path);
}

// 쓰기/삭제 후 해당 레코드 종류의 캐시 태그를 무효화. list* 가 다음 호출때
// GitHub API 를 다시 치도록. revalidateTag 는 server-only 라서 server
// action/route 경로에서만 호출되어야 하는데, 이 모듈은 저장소 레이어 전용
// 이므로 그 조건이 자연히 성립.
function invalidatePathTag(path: string) {
  const tag = pathToTag(path);
  if (!tag) return;
  try {
    // Next 16: 두 번째 인자로 CacheLife 프로파일 또는 { expire } 필요.
    // 즉시 만료시켜 다음 조회 때 바로 새 데이터를 받음.
    revalidateTag(tag, { expire: 0 });
  } catch {
    // 매우 드문 경우 (예: build time 호출) 를 조용히 무시 — 다음 실제 요청
    // 때 revalidate (60s TTL) 로 어차피 새 데이터가 들어옴.
  }
}

export async function listAllJSON<T>(prefix: string): Promise<T[]> {
  const out: T[] = [];
  await walk(prefix, async (file) => {
    if (file.type !== "file") return;
    if (!file.path.endsWith(".json")) return;
    // 매니페스트 파일 (_index.json) 은 레코드가 아니므로 건너뜀.
    if (file.path.endsWith("/_index.json")) return;
    const data = await readJSON<T>(file.path);
    if (data) out.push(data);
  });
  return out;
}

async function walk(path: string, cb: (file: GhFile) => Promise<void>) {
  const entries = await listDir(path);
  for (const entry of entries) {
    if (entry.type === "dir") {
      await walk(entry.path, cb);
    } else {
      await cb(entry);
    }
  }
}

export function rawFileUrl(path: string): string {
  const { owner, repo, branch } = getRepo();
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
}

function isNotFound(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "status" in err &&
    (err as { status: number }).status === 404
  );
}
