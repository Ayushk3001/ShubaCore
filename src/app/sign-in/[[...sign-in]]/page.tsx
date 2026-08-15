import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f7f4] px-6 py-12">
      <SignIn />
    </main>
  );
}

