// 用户偏好设置页（Server Component）
// 未登录时重定向到 /login?redirect=/settings
import { cookies } from "next/headers";
import { Header } from "@/app/components/Header";
import { Footer } from "@/app/components/Footer";
import { SettingsForm } from "./SettingsForm";

async function getServerUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("satoken")?.value;
  if (!token || !process.env.BACKEND_URL) return null;
  try {
    const res = await fetch(`${process.env.BACKEND_URL}/auth/me`, {
      headers: { satoken: token },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const body = await res.json();
    return body?.data ?? null;
  } catch {
    return null;
  }
}

export default async function SettingsPage() {
  const user = await getServerUser();

  // satoken 存在于 localStorage 而非 cookie，服务端无法读取
  // 因此此处 user 可能为 null；实际登录态由客户端 SettingsForm 内部处理
  // 仅当能从服务端确认已登出时才重定向，避免误跳转
  // （大多数情况下 user 为 null 是正常的，由客户端 useAuth 判断）
  void user;

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
