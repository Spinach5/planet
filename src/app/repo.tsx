import { HeadStatus } from "@/components/layout/HeadStatus";
import { MaterialIcon } from "@/components/base/MaterialIcon";
import { ThemedView } from "@/components/themed/ThemedView";
import { useTheme } from "@/hooks/use-theme";
import { getContributor, getLatestCommit, getRepos } from "@/service/gitee";
import { useToast } from "@/utils/toast";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { router, Stack } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function getHashCode(str: string): number {
  let hash = 0;
  for (const ch of str) {
    hash = (hash << 5) - hash + ch.charCodeAt(0);
    hash |= 0;
  }
  return Math.abs(hash);
}

function hashToHsl(str: string): string {
  const hue = getHashCode(str) % 360;
  return `hsl(${String(hue)}, 55%, 60%)`;
}

interface Contributor {
  name: string;
  email: string;
  commits: number;
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

function ContributorBar({
  contributor,
  maxCommits,
  index,
}: {
  contributor: Contributor;
  maxCommits: number;
  index: number;
}) {
  const barWidth =
    maxCommits > 0 ? (contributor.commits / maxCommits) * 100 : 0;
  const bgColor = hashToHsl(contributor.name);

  return (
    <View style={cs.row}>
      <Text style={cs.rank}>{index + 1}</Text>
      <View style={[cs.avatar, { backgroundColor: bgColor }]}>
        <Text style={cs.avatarText}>{contributor.name.charAt(0)}</Text>
      </View>
      <View style={cs.info}>
        <View style={cs.nameRow}>
          <View style={cs.nameWrap}>
            <Text style={cs.name}>{contributor.name}</Text>
            {contributor.email ? (
              <Text style={cs.email}>{contributor.email}</Text>
            ) : null}
          </View>
          <Text style={cs.commits}>{contributor.commits} commits</Text>
        </View>
        <View style={cs.barTrack}>
          <View
            style={[
              cs.barFill,
              {
                width: `${barWidth}%`,
                backgroundColor: bgColor,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const cs = StyleSheet.create({
  gradient: { flex: 1, paddingBottom: 20 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  rank: {
    width: 22,
    fontSize: 11,
    fontWeight: "600",
    color: "#999",
    textAlign: "center",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 12, fontWeight: "600", color: "#fff" },
  info: { flex: 1 },
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 6,
  },
  nameWrap: { flex: 1 },
  name: { fontSize: 11, fontWeight: "500", color: "#333" },
  email: { fontSize: 10, color: "#999", marginTop: 1 },
  commits: { fontSize: 10, color: "#888" },
  barTrack: {
    width: "100%",
    height: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    overflow: "hidden",
  },
  barFill: { height: "100%", borderRadius: 4 },
});

export default function RepoPage() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();

  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [contributorsCount, setContributorsCount] = useState(0);
  const [contributionsCount, setContributionsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [repos, setRepos] = useState<RepoItem[]>([]);
  const [reposLoading, setReposLoading] = useState(true);
  const [latestCommit, setLatestCommit] = useState<LatestCommit | null>(null);
  const [latestCommitLoading, setLatestCommitLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchContributors = useCallback(async (force = false) => {
    setLoading(true);
    try {
      const data = await getContributor(force);
      if (data?.contributors.length) {
        const sorted = [...data.contributors].sort(
          (a, b) => b.commits - a.commits,
        );
        setContributors(sorted);
        setContributorsCount(data.contributors_count);
        setContributionsCount(data.contributions);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRepos = useCallback(async (force = false) => {
    setReposLoading(true);
    try {
      const data = await getRepos(force);
      setRepos(data);
    } catch {
      // silent
    } finally {
      setReposLoading(false);
    }
  }, []);

  const fetchLatestCommit = useCallback(async (force = false) => {
    setLatestCommitLoading(true);
    try {
      const data = await getLatestCommit(force);
      setLatestCommit(data);
    } catch {
      // silent
    } finally {
      setLatestCommitLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      void fetchContributors();
      void fetchRepos();
      void fetchLatestCommit();
    }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void Promise.all([
      fetchContributors(true),
      fetchRepos(true),
      fetchLatestCommit(true),
    ]).finally(() => {
      setRefreshing(false);
    });
  }, [fetchContributors, fetchRepos, fetchLatestCommit]);

  const maxCommits = contributors.length > 0 ? contributors[0].commits : 0;
  const isDark = theme.background === "#000000";
  const cardBg = { backgroundColor: theme.surface };
  const sectionBg = { backgroundColor: theme.surface };

  const copyToClipboard = useCallback(
    async (text: string) => {
      await Clipboard.setStringAsync(text);
      showToast({ message: "已复制", type: "success" });
    },
    [showToast],
  );

  return (
    <ThemedView style={s.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={
          isDark
            ? ["rgb(26,29,46)", "rgb(35,39,64)", "rgb(26,29,46)"]
            : ["#47a5fd", "#cce5ff", "#f2f5f9"]
        }
        locations={[0, 0.28, 1]}
        style={[s.gradient, { paddingTop: insets.top + 8 }]}
      >
        <ScrollView
          style={s.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#47a5fd"]}
              tintColor="#47a5fd"
            />
          }
        >
          {/* Header */}
          <View style={s.headerRow}>
            <TouchableOpacity
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace("/(tabs)/user");
                }
              }}
            >
              <MaterialIcon name="arrow-left" size={24} color="#fff" />
            </TouchableOpacity>
            <HeadStatus text="项目仓库" />
          </View>

          {/* ============ 1. REPO INFO CARD ============ */}
          <View style={[s.card, cardBg]}>
            <Text style={s.repoName}>taro_mini</Text>

            <View style={s.urlRow}>
              <Text style={s.urlLabel}>仓库地址：</Text>
              <Text
                style={s.url}
                onPress={() => {
                  void copyToClipboard("https://gitee.com/dzh258/taro_mini");
                }}
              >
                https://gitee.com/dzh258/taro_mini
              </Text>
            </View>

            <Text style={s.countText}>{contributorsCount} 位贡献者</Text>
            <Text style={s.countText}>一共{contributionsCount} 次提交</Text>

            {/* Latest Commit */}
            {latestCommitLoading ? (
              <View style={s.lcLoading}>
                <Text style={s.lcLoadingText}>加载最新提交...</Text>
              </View>
            ) : latestCommit ? (
              <View style={s.lcSection}>
                <Text style={s.lcLabel}>最新提交</Text>
                <View style={s.lcInfo}>
                  <View style={s.lcRow}>
                    <Text style={s.lcField}>提交人：</Text>
                    <Text style={s.lcValue}>{latestCommit.author}</Text>
                  </View>
                  <View style={s.lcRow}>
                    <Text style={s.lcField}>时间：</Text>
                    <Text style={s.lcValue}>{latestCommit.date}</Text>
                  </View>
                  <View style={s.lcRow}>
                    <Text style={s.lcField}>提交信息：</Text>
                    <Text style={s.lcValue}>{latestCommit.message}</Text>
                  </View>
                </View>
              </View>
            ) : null}
          </View>

          {/* ============ 2. CONTRIBUTORS RANKING ============ */}
          <View style={[s.card, sectionBg]}>
            <Text style={s.sectionTitle}>贡献度排行</Text>
            {loading ? (
              <View style={s.stateWrap}>
                <Text style={s.stateText}>加载中...</Text>
              </View>
            ) : contributors.length === 0 ? (
              <View style={s.stateWrap}>
                <Text style={s.stateText}>暂无贡献数据</Text>
              </View>
            ) : (
              <View style={s.contributorsList}>
                {contributors.map((item, index) => (
                  <ContributorBar
                    key={item.name}
                    contributor={item}
                    maxCommits={maxCommits}
                    index={index}
                  />
                ))}
              </View>
            )}
          </View>

          {/* ============ 3. OPEN SOURCE REPOS ============ */}
          <View style={[s.card, sectionBg, { marginTop: 16 }]}>
            <Text style={s.sectionTitle}>开源项目</Text>
            {reposLoading ? (
              <View style={s.stateWrap}>
                <Text style={s.stateText}>加载中...</Text>
              </View>
            ) : repos.length === 0 ? (
              <View style={s.stateWrap}>
                <Text style={s.stateText}>暂无仓库数据</Text>
              </View>
            ) : (
              <View style={s.reposList}>
                {repos.map((repo) => (
                  <View key={repo.name} style={s.repoItem}>
                    <View style={s.repoIcon}>
                      <Text style={s.repoIconText}>R</Text>
                    </View>
                    <View style={s.repoInfo}>
                      <Text style={s.repoItemName}>{repo.name}</Text>
                      <Text
                        style={s.repoItemUrl}
                        onPress={() => {
                          void copyToClipboard(repo.url);
                        }}
                      >
                        {repo.url}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </LinearGradient>
    </ThemedView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  scroll: { flex: 1, paddingHorizontal: 8 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  // Card
  card: {
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 8,
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  repoName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 12,
  },
  urlRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    flexWrap: "wrap",
  },
  urlLabel: { fontSize: 11, color: "#666" },
  url: { fontSize: 11, color: "#2563eb", textDecorationLine: "underline" },
  countText: { fontSize: 11, color: "#888" },

  // Latest commit
  lcLoading: { alignItems: "center", paddingTop: 20 },
  lcLoadingText: { fontSize: 11, color: "#999" },
  lcSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  lcLabel: { fontSize: 12, fontWeight: "600", color: "#333", marginBottom: 12 },
  lcInfo: { gap: 8 },
  lcRow: { flexDirection: "row" },
  lcField: { fontSize: 11, color: "#666" },
  lcValue: { fontSize: 11, color: "#333", flex: 1 },

  // Section
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },

  // State
  stateWrap: { alignItems: "center", paddingVertical: 40 },
  stateText: { fontSize: 11, color: "#999" },

  // Contributors
  contributorsList: { gap: 14 },

  // Repos
  reposList: { gap: 12 },
  repoItem: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  repoIcon: {
    width: 36,
    height: 36,
    backgroundColor: "#f0f5ff",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  repoIconText: { fontSize: 12, fontWeight: "700", color: "#2563eb" },
  repoInfo: { flex: 1 },
  repoItemName: {
    fontSize: 11,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  repoItemUrl: {
    fontSize: 10,
    color: "#2563eb",
    textDecorationLine: "underline",
  },
});
