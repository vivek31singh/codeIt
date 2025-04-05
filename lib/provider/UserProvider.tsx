"use client";
import gql from "graphql-tag";
import React from "react";
import { useUser, useWelcomeNotification } from "../store/useUser";
import { supabase } from "../supabase/supabaseClient";
import { useMutation } from "@apollo/client";

const SAVEUSER = gql`
  mutation createUser($email: String!, $fullName: String, $profileImg: String) {
    createUser(email: $email, fullName: $fullName, profileImg: $profileImg) {
      id
      email
      fullName
      profileImg
      message
    }
  }
`;

const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [createUser] = useMutation(SAVEUSER);

  const { user, setUser } = useUser();

  const { setWelcomeMessage, toggleWelcomeNotificationVisibility } =
    useWelcomeNotification();

  const toggleNotificationVisibility = () => {
    toggleWelcomeNotificationVisibility();
  };

  React.useEffect(() => {
    const saveUserData = async () => {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();
      if (authError || (authData?.user?.aud !== "authenticated" && !authData))
        return;

      try {
        const { data, errors } = await createUser({
          variables: {
            email: authData?.user?.email ?? "",
            profileImg:
              authData?.user?.user_metadata?.avatar_url ||
              authData?.user?.user_metadata?.picture ||
              "",
            fullName: authData?.user?.user_metadata?.full_name || "",
          },
        });

        if (errors) {
          console.error(errors);
          return;
        }

        if (data) {
          setUser({
            userId: data.createUser.id,
            email: data.createUser.email,
            fullName: data.createUser.fullName,
            profileImg: data.createUser.profileImg,
          });

          setWelcomeMessage(data.createUser.message);
        }
        if (data?.createUser?.message) {
          toggleNotificationVisibility();
        }
      } catch (error) {
        console.error("An error occurred while creating the user:", error);
      }
    };

    if (!user) saveUserData();
  }, [user, setUser, createUser, setWelcomeMessage]);

  return <>{children}</>;
};

export default UserProvider;
