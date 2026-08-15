import { Show, SignInButton } from "@clerk/nextjs";
import {
  ArrowRight,
  ClipboardList,
  LockKeyhole,
  WalletCards,
} from "lucide-react";
import Link from "next/link";

const features = [
  {
    title: "Lead pipeline",
    body: "Capture source, quote, partner, and event details.",
    icon: ClipboardList,
  },
  {
    title: "Protected access",
    body: "Clerk authentication plus server-side role checks.",
    icon: LockKeyhole,
  },
  {
    title: "Financial tracking",
    body: "Decimal money fields, payments, expenses, and audit logs.",
    icon: WalletCards,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f6f7f4] text-[#20231f]">
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8">
        <nav className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[#647067]">
              Custom Return Gift
            </p>
            <h1 className="text-xl font-semibold">Return Gift Manager</h1>
          </div>
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="inline-flex h-10 items-center gap-2 rounded-md bg-[#20231f] px-4 text-sm font-medium text-white transition hover:bg-[#3b4038]">
                Sign in
                <ArrowRight className="size-4" aria-hidden />
              </button>
            </SignInButton>
          </Show>
          <Show when="signed-in">
            <Link
              href="/dashboard"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-[#20231f] px-4 text-sm font-medium text-white transition hover:bg-[#3b4038]"
            >
              Dashboard
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Show>
        </nav>

        <section className="grid flex-1 items-center gap-10 py-16 md:grid-cols-[1.08fr_0.92fr]">
          <div className="max-w-2xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-[#6d6657]">
              Internal operations and finance
            </p>
            <h2 className="text-4xl font-semibold leading-tight tracking-normal md:text-6xl">
              One source of truth for leads, orders, payments, and profit.
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[#586057]">
              Built for the three-partner return-gift business workflow:
              WhatsApp and Instagram enquiries become tracked leads, orders,
              payments, expenses, and audit history.
            </p>
          </div>

          <div className="grid gap-3">
            {features.map(({ title, body, icon: Icon }) => (
              <div
                key={title}
                className="rounded-lg border border-[#d8ded2] bg-white p-5 shadow-sm"
              >
                <div className="mb-4 flex size-10 items-center justify-center rounded-md bg-[#e5eadf]">
                  <Icon className="size-5 text-[#3f563f]" aria-hidden />
                </div>
                <h3 className="text-base font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#5f685e]">{body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
