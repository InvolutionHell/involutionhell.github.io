/**
 * 文档历史面板共享类型。
 * 抽出到独立模块避免 client 组件从 Route Handler（server 文件）直接 import 类型，
 * 防止未来 route 文件引入 node-only 依赖时 client bundle 踩边界问题。
 */
export interface HistoryItem {
  sha: string;
  authorName: string;
  authorLogin: string;
  avatarUrl: string;
  date: string;
  message: string;
  htmlUrl: string;
}
