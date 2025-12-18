import { createContext, useContext, useState } from "react";
import { getUser } from "../../api/auth";

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUserState] = useState(getUser());

  const updateUser = (newUser) => {
    localStorage.setItem("user", JSON.stringify(newUser));
    setUserState(newUser);
  };

  return (
    <UserContext.Provider value={{ user, updateUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser debe usarse dentro de UserProvider");
  return ctx;
}
