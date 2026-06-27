import cacheManager from "@/utils/cache";
import axios from "axios";

const GITEE_BASE = "https://gitee.com";

const giteeRequest = axios.create({
  baseURL: `${GITEE_BASE}/api/v5`,
  timeout: 15000,
  headers: {
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    Referer: "https://gitee.com",
    Origin: "https://gitee.com",
  },
});

interface Contributor {
  name: string;
  email: string;
  commits: number;
}

interface CleanedContributors {
  contributors: Contributor[];
  contributors_count: number;
  contributions: number;
}

interface RepoItem {
  name: string;
  url: string;
}

interface LatestCommit {
  author: string;
  date: string;
  message: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function cleanContributors(rawData: any[]): CleanedContributors {
  const contributors: Contributor[] = [];
  let contributions = 0;

  for (const item of rawData) {
    const name =
      typeof item?.name === "string" ? item.name : (item?.login ?? "unknown");
    const email = typeof item?.email === "string" ? item.email : "";
    const commits: number =
      typeof item?.contributions === "number" ? item.contributions : 0;

    contributors.push({ name, email, commits });
    contributions = contributions + commits;
  }

  return {
    contributors,
    contributors_count: contributors.length,
    contributions,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function cleanLatestCommit(rawData: any[]): LatestCommit | null {
  if (rawData.length === 0) return null;
  const commit = rawData[0];
  return {
    author: commit?.commit?.author?.name ?? commit?.author?.login ?? "unknown",
    date: commit?.commit?.author?.date ?? "",
    message: commit?.commit?.message ?? "",
  };
}

const CACHE_KEY_CONTRIBUTORS = "gitee_contributors";
const CACHE_KEY_REPOS = "gitee_repos";
const CACHE_KEY_COMMIT = "gitee_latest_commit";

export async function getContributor(
  force = false,
): Promise<CleanedContributors | null> {
  if (!force) {
    const cached = await cacheManager.getAsync<CleanedContributors>(
      CACHE_KEY_CONTRIBUTORS,
    );
    if (cached) return cached;
  }

  try {
    const response = await giteeRequest.get(
      "/repos/dzh258/taro_mini/contributors",
    );
    if (response.status !== 200 || !response.data) return null;

    const result = cleanContributors(response.data);
    void cacheManager.setAsync(CACHE_KEY_CONTRIBUTORS, result);
    return result;
  } catch {
    return null;
  }
}

export async function getRepos(force = false): Promise<RepoItem[]> {
  if (!force) {
    const cached = await cacheManager.getAsync<RepoItem[]>(CACHE_KEY_REPOS);
    if (cached) return cached;
  }

  try {
    const response = await giteeRequest.get("/users/dzh258/repos", {
      params: { page: 1, per_page: 100, sort: "full_name", direction: "asc" },
    });
    if (response.status !== 200 || !response.data) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const repos: RepoItem[] = (response.data as any[]).map((r: any) => ({
      name: r.full_name as string,
      url: r.html_url as string,
    }));
    void cacheManager.setAsync(CACHE_KEY_REPOS, repos);
    return repos;
  } catch {
    return [];
  }
}

export async function getLatestCommit(
  force = false,
): Promise<LatestCommit | null> {
  if (!force) {
    const cached = await cacheManager.getAsync<LatestCommit>(CACHE_KEY_COMMIT);
    if (cached) return cached;
  }

  try {
    const response = await giteeRequest.get("/repos/dzh258/taro_mini/commits", {
      params: { page: 1, per_page: 1 },
    });
    if (response.status !== 200 || !response.data) return null;

    const result = cleanLatestCommit(response.data);
    if (result) void cacheManager.setAsync(CACHE_KEY_COMMIT, result);
    return result;
  } catch {
    return null;
  }
}
