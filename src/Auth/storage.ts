export const getToken = () => localStorage.getItem("token");
export const isTokenPresent = () => !!getToken();
