// 用户偏好设置页（Server Component）
// 登录态由客户端 SettingsForm 内部的 useAuth 处理：token 存在 localStorage，服务端无法读取，
// 所以这里不做服务端鉴权，仅负责渲染页面壳。未登录 → 客户端 router.replace 到 /login?redirect=/settings。
import { Header } from "@/app/components/Header";
import { Footer } from "@/app/components/Footer";
import { SettingsForm } from "./SettingsForm";

export default function SettingsPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-32 pb-16 newsprint-texture">
        <div className="container mx-auto px-6 max-w-2xl">
          <div className="mb-10 border-b-4 border-[var(--foreground)] pb-4">
            <h1 className="text-5xl font-serif font-black uppercase text-[var(--foreground)]">
              Settings
            </h1>
            <p className="font-mono text-sm uppercase tracking-widest mt-3 text-neutral-500">
              User Preferences — Customize your experience
            </p>
          </div>
          <SettingsForm />
        </div>
      </main>
      <Footer />
    </>
  );
}
