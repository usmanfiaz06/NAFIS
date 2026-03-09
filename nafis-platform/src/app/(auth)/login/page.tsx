"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    companyName: "",
    role: "IMPORTER",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        const res = await signIn("credentials", {
          email: form.email,
          password: form.password,
          redirect: false,
        });
        if (res?.error) {
          setError("Invalid email or password");
        } else {
          router.push("/dashboard");
        }
      } else {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Registration failed");
        } else {
          await signIn("credentials", {
            email: form.email,
            password: form.password,
            redirect: false,
          });
          router.push("/dashboard");
        }
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f4f4] flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#161616] flex-col justify-between p-12">
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-[#0f62fe] rounded-lg flex items-center justify-center">
              <span className="text-white text-lg font-bold">N</span>
            </div>
            <span className="text-white text-xl font-semibold tracking-wide">
              NAFIS
            </span>
          </div>
          <h1 className="text-white text-4xl font-semibold leading-tight mb-6">
            National Agri-Food
            <br />
            Intelligence System
          </h1>
          <p className="text-[#8d8d8d] text-lg leading-relaxed max-w-lg">
            A strategic platform giving governments early visibility into the
            national food import pipeline — from order to arrival.
          </p>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-[#42be65] rounded-full" />
            <span className="text-[#c6c6c6] text-sm">
              Real-time vessel tracking
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-[#42be65] rounded-full" />
            <span className="text-[#c6c6c6] text-sm">
              30-90 day arrival forecasting
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-[#42be65] rounded-full" />
            <span className="text-[#c6c6c6] text-sm">
              Origin concentration risk alerts
            </span>
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-[#0f62fe] rounded-lg flex items-center justify-center">
              <span className="text-white text-lg font-bold">N</span>
            </div>
            <span className="text-[#161616] text-xl font-semibold">NAFIS</span>
          </div>

          <h2 className="text-2xl font-semibold text-[#161616] mb-2">
            {isLogin ? "Sign in" : "Create account"}
          </h2>
          <p className="text-sm text-[#525252] mb-8">
            {isLogin
              ? "Enter your credentials to access the platform"
              : "Register as an importer to start tracking"}
          </p>

          {error && (
            <div className="mb-6 p-3 bg-[#fff1f1] border-l-4 border-[#da1e28] text-sm text-[#da1e28]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-xs font-medium text-[#525252] mb-1.5">
                    Full name
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    className="w-full h-10 px-4 bg-white border border-[#e0e0e0] rounded text-sm focus:outline-none focus:border-[#0f62fe] focus:ring-1 focus:ring-[#0f62fe]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#525252] mb-1.5">
                    Company name
                  </label>
                  <input
                    type="text"
                    value={form.companyName}
                    onChange={(e) =>
                      setForm({ ...form, companyName: e.target.value })
                    }
                    className="w-full h-10 px-4 bg-white border border-[#e0e0e0] rounded text-sm focus:outline-none focus:border-[#0f62fe] focus:ring-1 focus:ring-[#0f62fe]"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-[#525252] mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full h-10 px-4 bg-white border border-[#e0e0e0] rounded text-sm focus:outline-none focus:border-[#0f62fe] focus:ring-1 focus:ring-[#0f62fe]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#525252] mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
                className="w-full h-10 px-4 bg-white border border-[#e0e0e0] rounded text-sm focus:outline-none focus:border-[#0f62fe] focus:ring-1 focus:ring-[#0f62fe]"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#0f62fe] text-white text-sm font-medium rounded hover:bg-[#0353e9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "Please wait..."
                : isLogin
                ? "Sign in"
                : "Create account"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
              }}
              className="text-sm text-[#0f62fe] hover:text-[#0353e9]"
            >
              {isLogin
                ? "Don't have an account? Register"
                : "Already have an account? Sign in"}
            </button>
          </div>

          {isLogin && (
            <div className="mt-8 p-4 bg-white rounded-lg border border-[#e0e0e0]">
              <p className="text-xs text-[#8d8d8d] mb-3 font-medium">
                Demo accounts
              </p>
              <div className="space-y-2 text-xs text-[#525252]">
                <div className="flex justify-between">
                  <span>Importer:</span>
                  <span className="font-mono">importer@nafis.sa / demo123</span>
                </div>
                <div className="flex justify-between">
                  <span>Regulator:</span>
                  <span className="font-mono">regulator@nafis.sa / demo123</span>
                </div>
                <div className="flex justify-between">
                  <span>Admin:</span>
                  <span className="font-mono">admin@nafis.sa / demo123</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
