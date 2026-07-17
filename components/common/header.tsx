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
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { useEffect, useState } from "react";

const Header = () => {
  const { theme } = useTheme();
  const path = usePathname();
  const { isLoading } = useStoreUserEffect();
  const { isSignedIn } = useAuth();

  const [scrolled, setScrolled] = useState<boolean>(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (lastest) => {
    if (lastest > 20) {
      setScrolled(true);
    } else {
      setScrolled(false);
    }
  });
  const [width, setWidth] = useState("100%");

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setWidth(scrolled ? "80%" : "100%");
      } else {
        setWidth(scrolled ? "50%" : "100%");
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [scrolled]);
  if (path.startsWith("/editor") || path.startsWith("/sign-in") || path.startsWith("/sign-up")) {
    return null;
  }

  return (
    <header className="fixed top-0 z-50 w-full overflow-x-hidden">
      <motion.div
        animate={{ width }}
        layout
        transition={{
          layout: {
            duration: 0.3,
            ease: [0.22, 1, 0.36, 1],
          },
        }}
        className={`mx-auto mt-2 flex w-full max-w-sm items-center justify-between px-4 py-4 backdrop-blur-2xl md:max-w-5xl md:px-7 ${
          scrolled &&
          "rounded-2xl border border-neutral-300/80 bg-white/20 shadow-lg dark:border-neutral-600/40 dark:bg-neutral-900/50"
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
          className="flex items-center gap-4"
        >
          <span>
            <ModeToggle />
          </span>
          <Unauthenticated>
            {scrolled ? (
              <SignUpButton>
                <Button>Join Now</Button>
              </SignUpButton>
            ) : (
              <>
                <SignInButton>
                  <Button variant={"outline"} className="hidden sm:flex">
                    Sign In
                  </Button>
                </SignInButton>
                <SignUpButton>
                  <Button>Register</Button>
                </SignUpButton>
              </>
            )}
          </Unauthenticated>

          {!isSignedIn || (
            <Link href={"/dashboard"}>
              <Button variant={"default"} className="hidden sm:flex">
                <LayoutDashboard className="mr-2" size={18} />
                Dashboard
              </Button>
            </Link>
          )}

          <Authenticated>
            <UserButton />
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
