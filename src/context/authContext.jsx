import { createContext, useContext, useEffect, useState } from "react";
import { refreshToken, setAccessTokenInApi } from "../services/api";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const ContextProvider = ({ children }) => {
  const [auth, setAuth] = useState({
    accessToken: null,
    username: null,
    role: null,
    storeName: null,
    store_id: null,
    message: null,
    isBlocked: false,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setAccessTokenInApi(auth.accessToken);
  }, [auth.accessToken]);

  useEffect(() => {
    const restoreSession = async () => {
      if (window.location.pathname !== "/login") {
        try {
          const response = await refreshToken();

          const data = response.data;
          if (data?.accessToken) {
            setAuth({
              accessToken: data.accessToken,
              username: data.username,
              role: data.role,
              storeName: data.storeName,
              store_id: data.storeId,
            });
            console.log("full auth:", auth);
          }
        } catch (error) {
          if (window.location.pathname !== "/login") {
            navigate("/login", { replace: true });
            return;
          }
        }
      }
      setLoading(false);
    };
    restoreSession();
  }, []);

  return (
    <AuthContext.Provider value={{ auth, setAuth, loading }}>
      {loading ? null : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
