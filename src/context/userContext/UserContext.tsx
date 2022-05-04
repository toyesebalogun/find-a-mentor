import React, { FC, useContext, useEffect, useState } from 'react';
import { User } from '../../types/models';
import { useAuth } from '../authContext/AuthContext';
import { useApi } from '../apiContext/ApiContext';
import { daysAgo } from '../../helpers/time';

type EmailNotVerifiedInfo = {
  isVerified: true;
} | {
  email: string;
  isVerified: false;
  isRegisteredRecently: boolean;
}

type UserProviderContext = {
  isAdmin: boolean;
  isMentor: boolean;
  isLoading: boolean;
  currentUser?: User;
  emailVerifedInfo?: EmailNotVerifiedInfo;
  isNotYetVerified: boolean;
  isAuthenticated: boolean;
  updateCurrentUser(user: User): void;
  logout(): void;
};

const UserContext = React.createContext<UserProviderContext | undefined>(
  undefined
);

export const UserProvider: FC = ({ children }) => {
  const [isLoading, setIsloading] = useState(true);
  const [currentUser, updateCurrentUser] = useState<User>();
  const [emailVerifedInfo, setEmailVerifedInfo] = useState<EmailNotVerifiedInfo>();
  const auth = useAuth();
  const api = useApi();
  const isAuthenticated = auth.isAuthenticated();
  const isMentor = !!currentUser?.roles?.includes('Mentor');
  const isAdmin = !!currentUser?.roles?.includes('Admin');
  const isNotYetVerified = emailVerifedInfo?.isVerified === false;

  const logout = () => {
    auth.doLogout(api);
  };

  useEffect(() => {
    async function getCurrentUser() {
      const user = await api.getCurrentUser();
      setIsloading(false);
      if (!user) {
        return;
      }

      setEmailVerifedInfo({
        isVerified: user.email_verified,
        isRegisteredRecently: daysAgo(user.createdAt) <= 5,
        email: user.email,
      });

      if (user.email_verified) {
        updateCurrentUser(user);
      }
    }
    getCurrentUser();
  }, [api]);

  return (
    <UserContext.Provider
      value={{
        isAdmin,
        isMentor,
        isLoading,
        currentUser,
        emailVerifedInfo,
        isNotYetVerified,
        isAuthenticated,
        logout,
        updateCurrentUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

type ShouldForceRequired<T> = T extends false
  ? UserProviderContext
  : Required<UserProviderContext>;

export const useUser = <
  ExpectedNotNull extends boolean
>(): ShouldForceRequired<ExpectedNotNull> => {
  const userContext = useContext(UserContext);
  if (!userContext) {
    throw new Error(`"useUser" has to be called inside UserProvider`);
  }
  return userContext as ShouldForceRequired<ExpectedNotNull>;
};

export default UserContext;
