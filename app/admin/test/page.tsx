import { requireAdmin } from "@/lib/auth/require-admin";

export default async function AdminTestPage() {
  const { user } = await requireAdmin();

  return (
    <main style={{ padding: "40px", color: "#111" }}>
      <h1>Test administrateur réussi</h1>

      <p>
        Connecté avec : {user.email}
      </p>
    </main>
  );
}
