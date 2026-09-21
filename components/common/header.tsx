"use client";
import { useTheme } from "next-themes";
import Link from "next/link";
import { ModeToggle } from "../theme-toggle";
import { SignInButton, SignUpButton, useAuth, UserButton } from "@clerk/nextjs";
import { Button } from "../ui/button";
import { usePathname } from "next/navigation";
import { useStoreUserEffect } from "@/hooks/use-storeuser-effect";
import { BarLoader } from "react-spinners";
import { Authenticated, Unauthenticated } from "convex/react";
import { LayoutDashboard } from "lucide-react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { useState } from "react";

const Header = () => {
  const { theme } = useTheme();
  const path = usePathname();
  const { isLoading } = useStoreUserEffect();
  const { isSignedIn } = useAuth();

  const [scrolled, setScrolled] = useState<boolean>(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 20) {
      setScrolled(true);
    } else {
      setScrolled(false);
    }
  });

  if (path.startsWith("/editor") || path.startsWith("/sign-in") || path.startsWith("/sign-up")) {
    return null;
  }

  return (
    <header className="fixed top-0 z-50 flex w-full justify-center px-4 pt-2">
      <motion.div
        layout
        transition={{
          type: "spring",
          stiffness: 380,
          damping: 30,
        }}
        className={`flex items-center justify-between px-4 py-3 backdrop-blur-2xl transition-colors duration-300 ${
          scrolled
            ? "w-[90%] md:w-3/5 max-w-4xl rounded-2xl border border-neutral-300/80 bg-white/40 shadow-lg dark:border-neutral-600/40 dark:bg-neutral-900/60 md:px-7"
            : "w-full max-w-7xl rounded-none border-transparent bg-transparent md:px-7"
        }`}
      >
        <Link href={"/"} className="flex items-end text-xl md:text-2xl font-semibold">
          <h2 className="h-full [font-family:var(--font-atma)]">Repimly</h2>
        </Link>
        {/* <div className="hidden md:flex">
          <ul className="flex gap-4 text-sm">
            <li>
              <Link
                href={"/#features"}
                className="cursor-pointer transition-all duration-200 hover:text-neutral-500 dark:hover:text-neutral-400"
              >
                Feature
              </Link>
            </li>{" "}
            <li>
              <Link
                href={"/pricing"}
                className="cursor-pointer transition-all duration-200 hover:text-neutral-500 dark:hover:text-neutral-400"
              >
                Pricing
              </Link>
            </li>{" "}
            <li>
              <Link
                href={"/pricing"}
                className="cursor-pointer transition-all duration-200 hover:text-neutral-500 dark:hover:text-neutral-400"
              >
                Contact
              </Link>
            </li>{" "}
          </ul>
        </div> */}
        <motion.div
          layout
          transition={{
            layout: {
              duration: 0.3,
              ease: [0.22, 1, 0.36, 1],
            },
          }}
          className="flex items-center gap-3"
        >
          <ModeToggle />

          <Unauthenticated>
            <div className="flex items-center gap-2">
              <AnimatePresence mode="popLayout" initial={false}>
                {scrolled ? (
                  <motion.div
                    key="scrolled-join"
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <SignUpButton>
                      <Button size="sm">Join Now</Button>
                    </SignUpButton>
                  </motion.div>
                ) : (
                  <motion.div
                    key="full-auth-buttons"
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-2"
                  >
                    <SignInButton>
                      <Button variant="outline" size="sm" className="hidden sm:inline-flex">
                        Sign In
                      </Button>
                    </SignInButton>
                    <SignUpButton>
                      <Button size="sm">Register</Button>
                    </SignUpButton>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Unauthenticated>

          {isSignedIn && (
            <motion.div layout>
              <Link href={"/dashboard"}>
                <Button variant={"default"} size="sm" className="hidden sm:inline-flex">
                  <LayoutDashboard className="mr-2" size={16} />
                  Dashboard
                </Button>
              </Link>
            </motion.div>
          )}

          <Authenticated>
            <motion.div layout className="flex items-center">
              <UserButton />
            </motion.div>
          </Authenticated>
        </motion.div>
        {isLoading && (
          <div className="fixed bottom-0 left-0 z-40 flex w-full justify-center">
            <BarLoader
              height="0.5px"
              width="100%"
              color={theme === "light" ? "#0a0a0a" : "#fafafa"}
            />
          </div>
        )}
      </motion.div>
    </header>
  );
};

export default Header;
