import { create } from 'zustand'

export type Account = 'josh' | 'joint' | 'anna'

interface ProfileState {
  profile: Account
  setProfile: (profile: Account) => void
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: 'josh',
  setProfile: (profile) => set({ profile }),
}))
