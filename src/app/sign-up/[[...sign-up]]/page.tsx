import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f7f4] px-6 py-12">
      <SignUp />
    </main>
  );
}

