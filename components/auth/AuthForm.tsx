"use client";
import React from "react";
import EmailInput from "@/components/reusable/EmailInput";
import PasswordInput from "@/components/reusable/PasswordInput";
import CustomButton from "@/components/reusable/CustomButton";
import RememberMeCheckbox from "@/components/reusable/RememberMeCheckbox";
import { signInWithEmail, signUpNewUser } from "@/lib/supabase/auth/EmailAuth";
import { useRouter } from "next/navigation";
import { AuthError } from "@supabase/supabase-js";

interface UserData {
  email?: string;
  isEmailEntered?: boolean;
  emailError?: string;
  password?: string;
  isPasswordEntered?: boolean;
  passwordError?: string;
}

interface AuthFormProps {
AuthMethod: typeof signUpNewUser | typeof signInWithEmail;
purpose: string
}

export default function AuthForm({ AuthMethod, purpose }: AuthFormProps) {
  const router = useRouter();
  const [userData, setUserData] = React.useState<UserData>({
    email: "",
    isEmailEntered: false,
    emailError: "",
    password: "",
    isPasswordEntered: false,
    passwordError: "",
  });

  const [signupError, setSignupError] = React.useState<AuthError | null>(null);

  const [disableButton, setDisableButton] = React.useState(false);

  const handleEmail = React.useCallback((emailData: UserData) => {
    setUserData((prevUserData) => ({ ...prevUserData, ...emailData }));
  }, []);

  const handlePassword = React.useCallback((passwordData: UserData) => {
    setUserData((prevUserData) => ({ ...prevUserData, ...passwordData }));
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      userData.email &&
      userData.isEmailEntered &&
      !userData.emailError &&
      userData.password &&
      userData.isPasswordEntered &&
      !userData.passwordError
    ) {
      setDisableButton(true);
      const { data, error } = await AuthMethod({
        email: userData.email,
        password: userData.password,
        redirectTo: "/",
      });

      if (data?.user && !error) {
        if (purpose === "Sign up") { 
          router.push("/confirm-mail");
        }else{
          router.push("/");
        }
      } else {
        setSignupError(error as AuthError);
      }
    }
  };

  return (
    
    <form onSubmit={(e) => handleAuth(e)} className="space-y-6">
      {signupError && <p>{signupError.message}</p>}
      <EmailInput handleEmail={handleEmail} />

      <PasswordInput handlePassword={handlePassword} />

      <RememberMeCheckbox />

      <div>
        <CustomButton
          type="submit"
          className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          disabled={disableButton}
        >
          {purpose}
        </CustomButton>
      </div>
    </form>
  );
}
