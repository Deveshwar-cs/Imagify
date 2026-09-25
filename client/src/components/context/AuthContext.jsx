import {createContext, useContext, useEffect, useState} from "react";

import {getCurrentUser, googleLogin} from "../../services/auth.service";

const AuthContext = createContext(null);

export const AuthProvider = ({children}) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuthentication = async () => {
    try {
      const response = await getCurrentUser();

      if (response?.success && response?.user) {
        setUser(response.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.log("Authentication error: ", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuthentication();
  }, []);

  const loginWithGoogle = async (credential) => {
    const response = await googleLogin(credential);

    if (response?.success && response?.user) {
      setUser(response.user);
    }

    return response;
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: Boolean(user),
        loginWithGoogle,
        logout,
        refreshUser: checkAuthentication,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};

export default AuthContext;
