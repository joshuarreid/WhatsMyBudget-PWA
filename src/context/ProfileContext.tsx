import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

export type Account = 'josh' | 'joint' | 'anna';

interface ProfileContextType {
  profile: Account;
  setProfile: (profile: Account) => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

const PROFILE_STORAGE_KEY = 'selectedProfile';

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
  const [profile, setProfileState] = useState<Account>(() => {
    const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (stored === 'josh' || stored === 'joint' || stored === 'anna') return stored;
    return 'josh';
  });

  useEffect(() => {
    localStorage.setItem(PROFILE_STORAGE_KEY, profile);
  }, [profile]);

  const setProfile = (acct: Account) => {
    setProfileState(acct);
  };

  return (
    <ProfileContext.Provider value={{ profile, setProfile }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) throw new Error('useProfile must be used within a ProfileProvider');
  return context;
};
