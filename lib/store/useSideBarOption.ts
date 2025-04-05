import { create } from "zustand";

interface SidebarOptionState {
    isSidebarOpen: boolean,
    toggleSidebar: () => void
    sidebarOption: string,
    setSidebarOption: (option: string) => void
}

export const useSidebarOption = create<SidebarOptionState>((set) => ({
    isSidebarOpen: true,
    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
    sidebarOption: "Home",
    setSidebarOption: (option) => set({ sidebarOption: option })
}))