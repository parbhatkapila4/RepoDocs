"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  Users,
  FolderOpen,
  FileCode,
  MessageSquare,
  Share2,
  TrendingUp,
  Activity,
  Zap,
  BarChart3,
  PieChart,
  Calendar,
  Code,
  Database,
  Globe,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface AnalyticsData {
  overview: {
    totalUsers: number;
    activeUsers: number;
    totalProjects: number;
    totalEmbeddings: number;
    totalQuestions: number;
    totalActiveShares: number;
  };
  userMetrics: {
    totalUsers: number;
    activeUsers: number;
    usersByPlan: Array<{ plan: string; count: number }>;
    avgProjectsPerUser: number;
  };
  projectMetrics: {
    totalProjects: number;
    projectsWithReadme: number;
    projectsWithDocs: number;
    avgFilesPerProject: number;
    topProjects: Array<{
      id: string;
      name: string;
      repoUrl: string;
      createdAt: string;
      fileCount: number;
    }>;
  };
  codeMetrics: {
    totalEmbeddings: number;
    avgFilesPerProject: number;
    languageDistribution: Array<{ language: string; count: number }>;
  };
  engagementMetrics: {
    totalQuestions: number;
    totalReadmeQuestions: number;
    totalDocsQuestions: number;
    avgQuestionsPerProject: number;
    totalActiveShares: number;
  };
  recentActivity: {
    last30Days: {
      newUsers: number;
      newProjects: number;
      newQuestions: number;
    };
    dailyActivity: Array<{
      date: string;
      projects: number;
      questions: number;
    }>;
  };
}

const COLORS = [
  "#50fa7b",
  "#8be9fd",
  "#bd93f9",
  "#ff79c6",
  "#f1fa8c",
  "#ffb86c",
  "#ff5555",
];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(() => {
      fetchAnalytics();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const mainElement = document.querySelector(
      'main[data-slot="sidebar-inset"]'
    );
    if (mainElement) {
      (mainElement as HTMLElement).style.backgroundColor = "#000000";
    }
    return () => {
      if (mainElement) {
        (mainElement as HTMLElement).style.backgroundColor = "";
      }
    };
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/analytics");
      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }
      const analyticsData = await response.json();
      setData(analyticsData);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics");
      console.error("Error fetching analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] relative flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-[#333] border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#666] font-mono text-sm">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] relative flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            Error Loading Analytics
          </h2>
          <p className="text-[#666] text-sm mb-4">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-white text-black font-medium rounded-lg hover:bg-[#eee] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-black relative">
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 pb-20">
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <span className="text-[#666] text-xs font-mono tracking-wide uppercase mb-2 block">
                Platform Analytics
              </span>
              <h1 className="text-3xl sm:text-4xl font-bold text-white">
                Real-Time Insights
              </h1>
              <p className="text-[#666] text-sm mt-2">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            </div>
            <button
              onClick={fetchAnalytics}
              disabled={loading}
              className="px-4 py-2 bg-[#1a1a1a] text-white font-medium rounded-lg flex items-center gap-2 hover:bg-[#252525] transition-colors border border-[#333] hover:border-[#444] disabled:opacity-50"
            >
              <Activity
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {[
            {
              icon: Users,
              label: "Total Users",
              value: data.overview.totalUsers,
              change: `+${data.recentActivity.last30Days.newUsers} this month`,
              color: "#50fa7b",
            },
            {
              icon: FolderOpen,
              label: "Total Projects",
              value: data.overview.totalProjects,
              change: `+${data.recentActivity.last30Days.newProjects} this month`,
              color: "#8be9fd",
            },
            {
              icon: FileCode,
              label: "Files Indexed",
              value: data.overview.totalEmbeddings,
              change: `${data.codeMetrics.avgFilesPerProject.toFixed(0)} avg per project`,
              color: "#bd93f9",
            },
            {
              icon: MessageSquare,
              label: "Questions Asked",
              value: data.overview.totalQuestions,
              change: `+${data.recentActivity.last30Days.newQuestions} this month`,
              color: "#ff79c6",
            },
            {
              icon: Share2,
              label: "Active Shares",
              value: data.overview.totalActiveShares,
              change: "Public documentation links",
              color: "#f1fa8c",
            },
            {
              icon: Zap,
              label: "Active Users",
              value: data.overview.activeUsers,
              change: `${((data.overview.activeUsers / data.overview.totalUsers) * 100).toFixed(0)}% of total`,
              color: "#ffb86c",
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6 hover:border-[#444] transition-colors"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-[#252525] border border-[#333] flex items-center justify-center">
                  <stat.icon
                    className="w-6 h-6"
                    style={{ color: stat.color }}
                  />
                </div>
                <ArrowUpRight className="w-4 h-4 text-[#666]" />
              </div>
              <div className="mb-2">
                <p className="text-3xl font-bold text-white font-mono">
                  {formatNumber(stat.value)}
                </p>
                <p className="text-[#666] text-sm mt-1">{stat.label}</p>
              </div>
              <p className="text-[#888] text-xs flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {stat.change}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div
            className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-[#8be9fd]" />
              <h3 className="text-white font-semibold">
                Daily Activity (Last 30 Days)
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.recentActivity.dailyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis
                  dataKey="date"
                  stroke="#666"
                  tick={{ fill: "#666", fontSize: 12 }}
                  tickFormatter={(value) => formatDate(value)}
                />
                <YAxis stroke="#666" tick={{ fill: "#666", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a1a",
                    border: "1px solid #444",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                  labelStyle={{ color: "#fff", fontWeight: "bold" }}
                  itemStyle={{ color: "#fff" }}
                />
                <Legend wrapperStyle={{ color: "#fff" }} iconType="square" />
                <Bar
                  dataKey="projects"
                  fill="#8be9fd"
                  name="Projects"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="questions"
                  fill="#bd93f9"
                  name="Questions"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <div className="flex items-center gap-2 mb-6">
              <PieChart className="w-5 h-5 text-[#bd93f9]" />
              <h3 className="text-white font-semibold">
                User Plan Distribution
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={data.userMetrics.usersByPlan}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {data.userMetrics.usersByPlan.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a1a",
                    border: "1px solid #444",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                  labelStyle={{ color: "#fff", fontWeight: "bold" }}
                  itemStyle={{ color: "#fff" }}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {data.userMetrics.usersByPlan.map((plan, index) => (
                <div
                  key={plan.plan}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-white capitalize">{plan.plan}</span>
                  </div>
                  <span className="text-[#666] font-mono">
                    {plan.count} users
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div
            className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <div className="flex items-center gap-2 mb-6">
              <Code className="w-5 h-5 text-[#50fa7b]" />
              <h3 className="text-white font-semibold">
                Language Distribution
              </h3>
            </div>
            <div className="space-y-3 mb-6">
              {data.codeMetrics.languageDistribution
                .slice(0, 8)
                .map((lang, index) => {
                  const total = data.codeMetrics.languageDistribution.reduce(
                    (sum, l) => sum + l.count,
                    0
                  );
                  const percentage = (lang.count / total) * 100;
                  return (
                    <div key={lang.language}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white text-sm">
                          {lang.language}
                        </span>
                        <span className="text-[#666] text-xs font-mono">
                          {lang.count} files ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-2 bg-[#252525] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>

            {(() => {
              const total = data.codeMetrics.languageDistribution.reduce(
                (sum, l) => sum + l.count,
                0
              );
              const totalLanguages =
                data.codeMetrics.languageDistribution.length;
              const topLanguage = data.codeMetrics.languageDistribution[0];
              const topLanguagePercentage = topLanguage
                ? (topLanguage.count / total) * 100
                : 0;

              let cumulativePercentage = 0;
              let languagesFor80Percent = 0;
              for (const lang of data.codeMetrics.languageDistribution) {
                cumulativePercentage += (lang.count / total) * 100;
                languagesFor80Percent++;
                if (cumulativePercentage >= 80) break;
              }

              const avgFilesPerLanguage =
                totalLanguages > 0 ? (total / totalLanguages).toFixed(0) : 0;

              return (
                <div className="pt-4 border-t border-[#333] space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-[#252525] rounded-lg border border-[#333]">
                      <p className="text-[#888] text-xs mb-1">
                        Total Languages
                      </p>
                      <p className="text-lg font-bold text-white font-mono">
                        {totalLanguages}
                      </p>
                    </div>
                    <div className="p-3 bg-[#252525] rounded-lg border border-[#333]">
                      <p className="text-[#888] text-xs mb-1">Top Language</p>
                      <p className="text-lg font-bold text-white font-mono">
                        {topLanguage ? topLanguage.language : "N/A"}
                      </p>
                      {topLanguage && (
                        <p className="text-[#666] text-xs mt-0.5">
                          {topLanguagePercentage.toFixed(1)}% of codebase
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="p-3 bg-[#252525] rounded-lg border border-[#333]">
                    <p className="text-[#888] text-xs mb-2">
                      Codebase Diversity
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-linear-to-r from-[#50fa7b] to-[#8be9fd] rounded-full"
                          style={{
                            width: `${Math.min((languagesFor80Percent / totalLanguages) * 100, 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-white text-xs font-mono">
                        {languagesFor80Percent}/{totalLanguages}
                      </span>
                    </div>
                    <p className="text-[#666] text-xs mt-1.5">
                      {languagesFor80Percent} language
                      {languagesFor80Percent !== 1 ? "s" : ""} cover 80% of
                      files
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-[#252525] rounded-lg border border-[#333]">
                    <div>
                      <p className="text-[#888] text-xs mb-0.5">
                        Avg Files per Language
                      </p>
                      <p className="text-white text-sm font-mono">
                        {avgFilesPerLanguage} files
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#888] text-xs mb-0.5">Total Files</p>
                      <p className="text-white text-sm font-mono">
                        {total.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </motion.div>

          <motion.div
            className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <div className="flex items-center gap-2 mb-6">
              <Database className="w-5 h-5 text-[#ff79c6]" />
              <h3 className="text-white font-semibold">
                Most Indexed Projects
              </h3>
            </div>
            <div className="space-y-3">
              {data.projectMetrics.topProjects
                .slice(0, 8)
                .map((project, index) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-3 bg-[#252525] rounded-lg border border-[#333] hover:border-[#444] transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {project.name}
                      </p>
                      <p className="text-[#666] text-xs truncate">
                        {project.repoUrl}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <div className="text-right">
                        <p className="text-white text-sm font-mono">
                          {project.fileCount}
                        </p>
                        <p className="text-[#666] text-xs">files</p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-[#333] flex items-center justify-center text-[#666] text-xs font-bold">
                        {index + 1}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </motion.div>
        </div>

        <motion.div
          className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
        >
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-[#f1fa8c]" />
            <h3 className="text-white font-semibold">Engagement Metrics</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-[#252525] rounded-lg border border-[#444]">
              <p className="text-[#888] text-xs mb-2 font-medium">
                Avg Questions per Project
              </p>
              <p className="text-2xl font-bold text-white font-mono">
                {data.engagementMetrics.avgQuestionsPerProject.toFixed(1)}
              </p>
            </div>
            <div className="p-4 bg-[#252525] rounded-lg border border-[#444]">
              <p className="text-[#888] text-xs mb-2 font-medium">
                Avg Projects per User
              </p>
              <p className="text-2xl font-bold text-white font-mono">
                {data.userMetrics.avgProjectsPerUser.toFixed(1)}
              </p>
            </div>
            <div className="p-4 bg-[#252525] rounded-lg border border-[#444]">
              <p className="text-[#888] text-xs mb-2 font-medium">
                Projects with README
              </p>
              <p className="text-2xl font-bold text-white font-mono">
                {data.projectMetrics.projectsWithReadme}
              </p>
              <p className="text-[#888] text-xs mt-1">
                {(
                  (data.projectMetrics.projectsWithReadme /
                    data.overview.totalProjects) *
                  100
                ).toFixed(0)}
                % of total
              </p>
            </div>
            <div className="p-4 bg-[#252525] rounded-lg border border-[#444]">
              <p className="text-[#888] text-xs mb-2 font-medium">
                Projects with Docs
              </p>
              <p className="text-2xl font-bold text-white font-mono">
                {data.projectMetrics.projectsWithDocs}
              </p>
              <p className="text-[#888] text-xs mt-1">
                {(
                  (data.projectMetrics.projectsWithDocs /
                    data.overview.totalProjects) *
                  100
                ).toFixed(0)}
                % of total
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
