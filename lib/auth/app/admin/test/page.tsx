import { requireAdmin } from "@/lib/auth/require-admin";

export default async function AdminTestPage() {
  const { user } = await requireAdmin();

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold">
        Test administrateur réussi
      </h1>

      <p className="mt-4">
        Connecté avec : {user.email}
      </p>
    </main>
  );
}
