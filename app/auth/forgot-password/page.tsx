import { ForgotPasswordForm } from "@/components/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto flex min-h-[calc(100vh-80px)] max-w-[1500px] items-center justify-center px-8 py-12">
        <div className="w-full max-w-md">
          <ForgotPasswordForm />
        </div>
      </section>
    </main>
  );
}
