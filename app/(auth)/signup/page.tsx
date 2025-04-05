import Image from "next/image";
import mainLogo from "@/public/main.svg";
import GoogleAuthButton from "@/components/auth/GoogleAuthButton";
import GithubAuthButton from "@/components/auth/GithubAuthButton";
import AuthForm from "@/components/auth/AuthForm";
import { signUpNewUser } from "@/lib/supabase/auth/EmailAuth";
import Link from "next/link";
export function generateMetadata() {
  return {
    title: "Sign Up",
    description: "Sign Up",
    icons:
      "https://tailwindui.com/plus/img/logos/mark.svg?color=indigo&shade=600",
  };
}

export default function page() {
  return (
    <>
      <div>
        <Image
          alt="Your Company"
          src={mainLogo}
          width={158}
          height={158}
          className="h-10 w-auto"
        />
        <h2 className="mt-8 text-2xl/9 font-bold tracking-tight text-gray-900">
          Sign up for an account
        </h2>
        <p className="mt-2 text-sm/6 text-gray-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-indigo-600 hover:text-indigo-500"
          >
            Login
          </Link>
        </p>
      </div>

      <div className="mt-10">
        <div>
          <AuthForm AuthMethod={signUpNewUser} purpose= {"Sign up"}/>
        </div>

        <div className="mt-10">
          <div className="relative">
            <div
              aria-hidden="true"
              className="absolute inset-0 flex items-center"
            >
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm/6 font-medium">
              <span className="bg-white px-6 text-gray-900">
                Or continue with
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <GoogleAuthButton />
            <GithubAuthButton />
          </div>
        </div>
      </div>
    </>
  );
}

