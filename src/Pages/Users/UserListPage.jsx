import usePageTitleLabel from "../../hooks/PageNames";
import UserDataEst from "../../components/UI/Users/userData";
import TableUsers from "../../components/UI/Users/TableUsers";
import { FiUsers } from "react-icons/fi";
import useCrudPermission from "../../hooks/Auth/CrudPermissions";

export default function UserListPage() {
  const { canDo } = useCrudPermission();
  const canSeeUserData = canDo("stats", "users");

  return (
    <div className="min-h-screen w-full bg-slate-100 dark:bg-slate-950 px-6 py-6 text-slate-800 dark:text-slate-200">
        {canSeeUserData && <UserDataEst />}
        <TableUsers/>
    </div>
  );
}
