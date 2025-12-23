import { publicInstance, privateInstance } from "./axios";

// Función de login
export const login = async ({ email, password }: { email: string; password: string }) => {
  const { data } = await publicInstance.post("/login", { email, password });
  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));
  localStorage.removeItem("sessionExpired");
  localStorage.removeItem("expired_at");
  return data;
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.assign("/login");
};


export const getUser = () => {
  const user = localStorage.getItem("user");
  
  return user ? JSON.parse(user) : null;
};


/*export const me = async () => {
  const { data } = await privateInstance.get("/profile");
  return data;
};*/
