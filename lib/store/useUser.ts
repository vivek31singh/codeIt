import { create } from "zustand";

type User = {
  userId: string;
  email: string;
  fullName: string;
  profileImg: string;
};

interface UserState {
  user: User | null;
  setUser: (user: User) => void;
  resetUser: () => void;
}

interface WelcomeNotificationState {
  welcomeMessage: string;
  setWelcomeMessage: (message: string) => void;
  isWelcomeNotificationVisible: boolean;
  toggleWelcomeNotificationVisibility: () => void;
}

export const useUser = create<UserState>((set) => ({
  user: null,
  setUser: (user: User) => set({ user }),
  resetUser: () => set({ user: null }),
}));

export const useWelcomeNotification = create<WelcomeNotificationState>(
  (set) => ({
    welcomeMessage: "",

    setWelcomeMessage: (message: string) => set({ welcomeMessage: message }),

    isWelcomeNotificationVisible: false,
    toggleWelcomeNotificationVisibility: () =>
      set((state) => ({
        isWelcomeNotificationVisible: !state.isWelcomeNotificationVisible,
      })),
  })
);
