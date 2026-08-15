import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f7f4] px-6">
      <div className="max-w-md rounded-lg border border-[#d8ded2] bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#6d6657]">
          Access restricted
        </p>
        <h1 className="mt-3 text-2xl font-semibold">User not provisioned</h1>
        <p className="mt-3 text-sm leading-6 text-[#5f685e]">
          Your Clerk account is signed in, but this internal system needs a
          matching active user record in PostgreSQL before access is granted.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-10 items-center rounded-md bg-[#20231f] px-4 text-sm font-medium text-white transition hover:bg-[#3b4038]"
        >
          Back home
        </Link>
      </div>
    </main>
  );
}

