import { privateInstance } from "../api/axios";
import { User } from "../types/user";

export const fetchAllUsers = async () => {
  const { data } = await privateInstance.get<User>("/users");
  return data;
};
