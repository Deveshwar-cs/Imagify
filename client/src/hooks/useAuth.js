import {useEffect, useState} from "react";
import {getCurrentUser} from "../services/auth.service";

const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const response = await getCurrentUser();

        if (response.success) {
          setUser(response.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.log("Authentication error:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuthentication();
  }, []);

  return {
    user,
    loading,
    isAuthenticated: Boolean(user),
  };
};

export default useAuth;
