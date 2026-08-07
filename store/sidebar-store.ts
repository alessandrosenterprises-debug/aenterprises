import { create } from "zustand";

interface SidebarState {
  collapsed: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  collapsed: false,

  toggle: () =>
    set((state) => ({
      collapsed: !state.collapsed,
    })),

  open: () =>
    set({
      collapsed: false,
    }),

  close: () =>
    set({
      collapsed: true,
    }),
}));