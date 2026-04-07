import { createContext, useContext } from "react";

import type { Locale } from "@/lib/types";

type Dictionary = Record<string, string>;

const dictionaries: Record<Locale, Dictionary> = {
  en: {
    appName: "Accepted",
    tagline: "Conference deadlines, grounded discussions, and AI-assisted submission planning.",
    trackerTitle: "Accepted DDL Tracker",
    trackerSubtitle: "Track CCF computer science deadlines with local-time countdowns and community context.",
    plannerTitle: "AI Submission Path Planner",
    plannerSubtitle: "Paste your abstract or keywords to get a pragmatic target and fallback route.",
    plannerPlaceholder: "Paste your draft abstract, contribution summary, or a set of keywords...",
    plannerSubmit: "Generate Route",
    plannerAuth: "Sign in to use the planner",
    filterRank: "CCF Rank",
    filterCategory: "Category",
    filterDeadline: "Time to DDL",
    filterSearch: "Search",
    all: "All",
    dueSoon: "Due Soon",
    active: "Open",
    unknown: "Unknown",
    detail: "View details",
    historical: "Historical snapshot",
    community: "Community",
    newThread: "Start a thread",
    threadTitle: "Thread title",
    threadContent: "Share your notes, review experience, rebuttal tips, or deadline reminders...",
    postThread: "Post thread",
    reply: "Reply",
    postReply: "Post reply",
    signIn: "Sign in",
    signOut: "Sign out",
    continueWithGoogle: "Continue with Google",
    continueWithGitHub: "Continue with GitHub",
    localTime: "Shown in your local time",
    deadlineZone: "Deadline basis",
    aoe: "Anywhere on Earth",
    conferenceLocal: "Conference local timezone",
    notAvailable: "Not available",
    translate: "Translate",
    translated: "Translated",
    translationUnavailable: "Translation is not configured yet.",
    commentsEmpty: "No discussions yet. Start the first thread for this venue.",
    authRequired: "You need to sign in for posting, voting, and AI actions.",
    loading: "Loading...",
    votes: "votes",
    nextDeadline: "Tracked deadline",
    pageLimit: "Page limit",
    acceptanceRate: "Acceptance rate",
    location: "Location",
    date: "Conference date",
    website: "Website",
    backHome: "Back to tracker",
    mode: "Mode",
    language: "Language",
    openTracker: "Open tracker",
    sourceFallback:
      "Supabase is not configured yet, so the app is showing the bundled local conference dataset.",
    plannerUnavailable:
      "AI routing is wired, but no provider key is configured yet. Add OpenRouter or Minimax credentials to enable it.",
    translationError: "Translation request failed. Please try again later.",
    routeError: "Route planning failed. Please try again later.",
  },
  zh: {
    appName: "Accepted",
    tagline: "面向 CCF 计算机会议的 DDL 追踪、学术讨论与 AI 投稿路径规划平台。",
    trackerTitle: "Accepted DDL 追踪器",
    trackerSubtitle: "用本地时区倒计时查看 CCF 计算机会议截止日期，并结合社区讨论判断投稿节奏。",
    plannerTitle: "AI 投稿路径规划",
    plannerSubtitle: "粘贴摘要或关键词，获取主目标会场与备选投稿路径建议。",
    plannerPlaceholder: "粘贴你的摘要草稿、工作贡献总结，或一组研究关键词……",
    plannerSubmit: "生成投稿路线",
    plannerAuth: "登录后可使用 AI 路径规划",
    filterRank: "CCF 等级",
    filterCategory: "类别",
    filterDeadline: "DDL 时间",
    filterSearch: "搜索",
    all: "全部",
    dueSoon: "即将截止",
    active: "仍可投稿",
    unknown: "未知",
    detail: "查看详情",
    historical: "历史信息",
    community: "社区讨论",
    newThread: "发起主题",
    threadTitle: "主题标题",
    threadContent: "分享你的投稿经验、审稿印象、rebuttal 建议或截止日期提醒……",
    postThread: "发布主题",
    reply: "回复",
    postReply: "发布回复",
    signIn: "登录",
    signOut: "退出登录",
    continueWithGoogle: "使用 Google 登录",
    continueWithGitHub: "使用 GitHub 登录",
    localTime: "已按你的本地时区显示",
    deadlineZone: "截止时间基准",
    aoe: "AoE 全球最晚时区",
    conferenceLocal: "会议本地时区",
    notAvailable: "暂无信息",
    translate: "翻译",
    translated: "已翻译",
    translationUnavailable: "暂未配置翻译模型。",
    commentsEmpty: "还没有讨论，来为这个会议发第一条主题吧。",
    authRequired: "登录后才可发帖、点赞和使用 AI 功能。",
    loading: "加载中...",
    votes: "赞",
    nextDeadline: "当前记录截止",
    pageLimit: "页数限制",
    acceptanceRate: "录用率",
    location: "地点",
    date: "会议时间",
    website: "官网",
    backHome: "返回追踪页",
    mode: "模式",
    language: "语言",
    openTracker: "进入追踪器",
    sourceFallback: "当前还未配置 Supabase，所以页面正在展示随项目附带的本地会议数据。",
    plannerUnavailable:
      "AI 路径规划接口已经接好，但目前还没有配置 OpenRouter 或 Minimax 的密钥。",
    translationError: "翻译请求失败，请稍后再试。",
    routeError: "投稿路径规划失败，请稍后再试。",
  },
};

export const LocaleContext = createContext<{
  locale: Locale;
  setLocale: (locale: Locale) => void;
  hydrated: boolean;
}>({
  locale: "zh",
  setLocale: () => undefined,
  hydrated: false,
});

export function useLocale() {
  return useContext(LocaleContext);
}

export function useDictionary() {
  const { locale } = useLocale();
  return dictionaries[locale];
}

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}
