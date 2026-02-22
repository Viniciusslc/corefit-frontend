"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/services/api";
import { useRequireAuth } from "@/hooks/useRequireAuth";

type User = {
  id: string;
  name: string;
  email: string;
};

export default function UsersPage() {
  const router = useRouter();
  const { handleAuthError } = useRequireAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadUsers() {
    setLoading(true);
    setError(null);

    try {
      const data = await apiFetch<User[]>("/users");
      setUsers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      if (handleAuthError(err)) return;
      setError(err?.message || "Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleLogout() {
    localStorage.removeItem("token");
    router.push("/login");
  }

  return (
    <main className="min-h-[calc(100vh-56px)] bg-gray-900 text-white">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Usuários</h1>
            <p className="text-sm text-gray-300">
              Lista carregada do backend com JWT
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={loadUsers}
              className="rounded bg-white/10 px-4 py-2 text-sm hover:bg-white/20"
            >
              Recarregar
            </button>

            <button
              onClick={handleLogout}
              className="rounded bg-red-600 px-4 py-2 text-sm hover:bg-red-700"
            >
              Sair
            </button>
          </div>
        </div>

        {loading && (
          <div className="rounded border border-white/10 bg-white/5 p-4">
            Carregando usuários...
          </div>
        )}

        {!loading && error && (
          <div className="rounded border border-red-500/30 bg-red-500/10 p-4 text-red-200">
            {error}
          </div>
        )}

        {!loading && !error && (
          <ul className="space-y-2">
            {users.map((user) => (
              <li
                key={user.id}
                className="rounded border border-white/10 bg-white/5 px-4 py-2"
              >
                <strong>{user.name}</strong> — {user.email}
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
