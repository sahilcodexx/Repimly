"use client";
import { Calendar, ImagePlay } from "lucide-react";
import Container from "../common/container";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckoutButton } from "@clerk/nextjs/experimental";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import SectionHeading from "../common/section-heading";

export default function PricingCards({
  hideHeading = false,
  redirectUrl,
  onSubscriptionComplete,
}: {
  hideHeading?: boolean;
  redirectUrl?: string;
  onSubscriptionComplete?: () => void;
} = {}) {
  const pathname = usePathname();
  const effectiveRedirectUrl =
    redirectUrl ||
    (pathname?.startsWith("/editor") ? pathname : undefined);

  const planId = "cplan_38lbLCIiQTjK6kv6sp6hab6hXoX";

  const LightCheckIcon = ({ className = "" }: { className?: string }) => (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="8" className="fill-neutral-900" />
      <path
        d="M5.5 8.5L7 10L11 6"
        stroke="white"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const DarkCheckIcon = ({ className = "" }: { className?: string }) => (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="7.5" className="stroke-neutral-500" />
      <path
        d="M5.5 8.5L7 10L11 6"
        stroke="white"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const starterFeatures = [
    "1 design concept",
    "Custom code",
    "On-time delivery",
    "Email support",
    "3 projects maximum",
  ];
  const proFeatures = [
    "3 design   ",
    "Custom code",
    "On-time delivery",
    "Priority support",
    "Micro-interactions",
  ];

  return (
    <Container className={hideHeading ? "pb-4" : "pb-30"}>
      {!hideHeading && (
        <SectionHeading
          title="Pricing Plans"
          description="Choose the perfect plan for your needs and budget. we have a plan that's right for you."
        />
      )}
      <div className="m-auto max-w-3xl">
        <div className="mx-auto grid w-full max-w-225 grid-cols-1 gap-8 md:grid-cols-2">
          {/* Starter (Normal) Card: Light in light mode, Dark in dark mode */}
          <div
            className={[
              "rounded-3xl p-2 transition-colors",
              // Light mode: clean light card
              "bg-white/65 backdrop-blur-md border border-neutral-200/70 shadow-[0_12px_40px_-15px_rgba(0,0,0,0.15)] ring-1 ring-white/40 ring-inset",
              // Dark mode: subdued dark card
              "dark:bg-neutral-900/60 dark:border-neutral-800 dark:shadow-[0_12px_50px_-15px_rgba(0,0,0,0.55)] dark:ring-white/5",
            ].join(" ")}
          >
            <div
              className={[
                "mb-2 rounded-2xl p-8 backdrop-blur-sm ring-inset transition-colors",
                // Light mode:
                "bg-white/80 border border-neutral-200/80 ring-1 ring-neutral-900/5",
                // Dark mode:
                "dark:bg-neutral-900/70 dark:border-neutral-800 dark:ring-white/10",
              ].join(" ")}
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                    Starter
                  </h2>
                  <p className="mt-1 text-base leading-relaxed text-neutral-600 dark:text-neutral-400">
                    Launch quickly with a solid landing page and basic features.
                    Perfect for individuals and small teams.
                  </p>
                </div>
                <span className="inline-flex items-center rounded-full border border-neutral-200 bg-white/70 px-3 py-1 text-xs font-medium text-nowrap text-neutral-700 shadow-sm backdrop-blur dark:border-neutral-700 dark:bg-neutral-900/50 dark:text-neutral-300">
                  Most Friendly
                </span>
              </div>

              <div className="mb-8 flex items-baseline">
                <span className="text-5xl font-bold tracking-tighter text-neutral-900 dark:text-white">
                  $0
                </span>
                <span className="ml-1 text-lg text-neutral-400 dark:text-neutral-500">/free</span>
              </div>

              <Link href={"#"}>
                <button
                  className={[
                    "w-full cursor-pointer rounded-xl py-4 text-base font-semibold",
                    "flex items-center justify-center gap-2.5 ring-inset transition-all duration-200",
                    // Light mode: prominent dark button
                    "bg-neutral-900 text-white shadow-[0_4px_18px_-6px_rgba(0,0,0,0.4)] ring-1 ring-neutral-900/10 hover:opacity-95",
                    // Dark mode: subtle dark button
                    "dark:bg-neutral-800 dark:text-neutral-200 dark:shadow-none dark:ring-1 dark:ring-neutral-700 dark:hover:bg-neutral-700 dark:hover:text-white",
                  ].join(" ")}
                >
                  Get Started Free
                  <ImagePlay className="h-5 w-5 text-neutral-300 dark:text-neutral-400" />
                </button>
              </Link>
            </div>

            <div
              className={[
                "px-6 pt-4 pb-6 rounded-2xl backdrop-blur-sm ring-inset transition-colors",
                // Light mode:
                "bg-white/50 border border-neutral-200/70 ring-1 ring-white/30",
                // Dark mode:
                "dark:bg-neutral-900/55 dark:border-neutral-800 dark:ring-1 dark:ring-white/10",
              ].join(" ")}
            >
              <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                {starterFeatures.map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <LightCheckIcon className="h-4 w-4 shrink-0 dark:hidden" />
                    <DarkCheckIcon className="h-4 w-4 shrink-0 hidden dark:block" />
                    <span className="text-sm font-medium text-neutral-800 dark:text-neutral-300">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pro Card: Dark in light mode (pops out), Light in dark mode (pops out) */}
          <div
            className={[
              "rounded-3xl p-2 transition-colors",
              // Light mode: sleek dark card (pops out in light mode)
              "bg-neutral-900/60 backdrop-blur-md border border-neutral-800 shadow-[0_12px_50px_-15px_rgba(0,0,0,0.55)] ring-1 ring-white/5 ring-inset",
              // Dark mode: gleaming light card (pops out in dark mode)
              "dark:bg-white dark:backdrop-blur-md dark:border-white/90 dark:shadow-[0_12px_50px_-10px_rgba(255,255,255,0.22)] dark:ring-1 dark:ring-white/60",
            ].join(" ")}
          >
            <div
              className={[
                "mb-2 rounded-2xl p-8 backdrop-blur-sm ring-inset transition-colors",
                // Light mode: dark
                "bg-neutral-900/70 border border-neutral-800 ring-1 ring-white/10",
                // Dark mode: crisp white
                "dark:bg-white dark:border-neutral-200/90 dark:ring-1 dark:ring-neutral-900/5",
              ].join(" ")}
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight text-neutral-50 dark:text-neutral-900">
                    Pro
                  </h2>
                  <p className="mt-1 text-base leading-relaxed text-neutral-400 dark:text-neutral-600">
                    Go further with more concepts, advanced features, and
                    priority support. Ideal for Everyone.
                  </p>
                </div>
                <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium text-nowrap backdrop-blur shadow-sm border-neutral-700 bg-neutral-900/50 text-neutral-300 dark:border-neutral-200 dark:bg-neutral-100 dark:text-neutral-800">
                  Best Value
                </span>
              </div>

              <div className="mb-8 flex items-baseline">
                <span className="text-5xl font-bold tracking-tighter text-white dark:text-neutral-900">
                  $15
                </span>
                <span className="ml-1 text-lg text-neutral-500 dark:text-neutral-500">/fixed</span>
              </div>
              <SignedIn>
                <CheckoutButton
                  planId={planId}
                  planPeriod="month"
                  newSubscriptionRedirectUrl={effectiveRedirectUrl}
                  onSubscriptionComplete={onSubscriptionComplete}
                >
                  <button
                    className={[
                      "w-full cursor-pointer rounded-xl py-4 text-base font-semibold",
                      "flex items-center justify-center gap-2.5 ring-inset transition-opacity duration-200 hover:opacity-95",
                      // Light mode: white button on dark card
                      "bg-white text-neutral-900 shadow-[0_4px_18px_-6px_rgba(255,255,255,0.35)] ring-1 ring-white/30",
                      // Dark mode: dark button on light card
                      "dark:bg-neutral-900 dark:text-white dark:shadow-[0_4px_18px_-6px_rgba(0,0,0,0.4)] dark:ring-1 dark:ring-neutral-900/10",
                    ].join(" ")}
                  >
                    Book a call
                    <Calendar className="h-5 w-5 text-neutral-600 dark:text-neutral-300" />
                  </button>
                </CheckoutButton>
              </SignedIn>
              <SignedOut>
                <SignInButton
                  mode="modal"
                  fallbackRedirectUrl={effectiveRedirectUrl}
                >
                  <button
                    className={[
                      "w-full cursor-pointer rounded-xl py-4 text-base font-semibold",
                      "flex items-center justify-center gap-2.5 ring-inset transition-opacity duration-200 hover:opacity-95",
                      // Light mode: white button on dark card
                      "bg-white text-neutral-900 shadow-[0_4px_18px_-6px_rgba(255,255,255,0.35)] ring-1 ring-white/30",
                      // Dark mode: dark button on light card
                      "dark:bg-neutral-900 dark:text-white dark:shadow-[0_4px_18px_-6px_rgba(0,0,0,0.4)] dark:ring-1 dark:ring-neutral-900/10",
                    ].join(" ")}
                  >
                    Book a call
                    <Calendar className="h-5 w-5 text-neutral-600 dark:text-neutral-300" />
                  </button>
                </SignInButton>
              </SignedOut>
            </div>

            <div
              className={[
                "px-6 pt-4 pb-6 rounded-2xl backdrop-blur-sm ring-inset transition-colors",
                // Light mode: dark
                "bg-neutral-900/55 border border-neutral-800 ring-1 ring-white/10",
                // Dark mode: crisp light
                "dark:bg-white/80 dark:border-neutral-200/70 dark:ring-1 dark:ring-white/40",
              ].join(" ")}
            >
              <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                {proFeatures.map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <DarkCheckIcon className="h-4 w-4 shrink-0 dark:hidden" />
                    <LightCheckIcon className="h-4 w-4 shrink-0 hidden dark:block" />
                    <span className="text-sm font-medium text-neutral-300 dark:text-neutral-800">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
