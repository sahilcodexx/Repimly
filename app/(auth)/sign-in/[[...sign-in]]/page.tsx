"use client";

import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { SignInPage, Testimonial } from "@/components/ui/sign-in";
import { toast } from "sonner";

const testimonials: Testimonial[] = [
  {
    avatarSrc: "https://unavatar.io/twitter/dhruvtwt_",
    name: "Dhruv",
    handle: "@dhruvtwt_",
    text: "Removed my image background in seconds. The AI tools are incredibly fast and accurate."
  },
  {
    avatarSrc: "https://unavatar.io/twitter/athrix_codes",
    name: "Athrix",
    handle: "@athrix_codes",
    text: "Finally an editor that doesn't slow me down. The AI extend feature is a game changer."
  },
  {
    avatarSrc: "https://unavatar.io/twitter/sahilcodex",
    name: "Sahil",
    handle: "@sahilcodex",
    text: "Clean interface, powerful tools. Been using it for all my product photography."
  },
];

const SignIn = () => {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isLoaded) return;

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const result = await signIn.create({ identifier: email, password });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push("/dashboard");
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Invalid email or password";
      toast.error(message);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!isLoaded) return;
    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/dashboard",
      });
    } catch {
      toast.error("Failed to sign in with Google");
    }
  };

  const handleCreateAccount = () => {
    router.push("/sign-up");
  };

  return (
    <SignInPage
      heroImageSrc="https://images.unsplash.com/photo-1642615835477-d303d7dc9ee9?w=2160&q=80"
      testimonials={testimonials}
      onSignIn={handleSignIn}
      onGoogleSignIn={handleGoogleSignIn}
      onCreateAccount={handleCreateAccount}
    />
  );
};

export default SignIn;
