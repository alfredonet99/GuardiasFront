import { useEffect, useMemo, useState } from "react";
import { privateInstance } from "../api/axios";
import CreateGuardiaModal from "../components/Modals/Guardias/CreateGuardia";
import ActiveGuardiaModal from "../components/Modals/Guardias/GuardiaActiva";
import OperacionesDash from "./Dashboard/OperacionesDash";

const GUARDIA_MODAL_SHOW_ON_LOGIN = "guardia_modal_show_on_login_v1";

function getCachedUser() {
	try {
		const raw = localStorage.getItem("user");
		return raw ? JSON.parse(raw) : null;
	} catch {
		return null;
	}
}

export default function HomePage() {
	const [openCreate, setOpenCreate] = useState(false);
	const [openActive, setOpenActive] = useState(false);

	const user = useMemo(() => getCachedUser(), []);
	const areaId = Number(user?.area_id || 0);
	const isAdmin =
		Array.isArray(user?.roles) &&
		user.roles.some((r) => r?.name === "Administrador");

	const isOperacionesUser = areaId === 1 && !isAdmin;

	useEffect(() => {
		const shouldShow =
			sessionStorage.getItem(GUARDIA_MODAL_SHOW_ON_LOGIN) === "1";

		if (shouldShow) sessionStorage.removeItem(GUARDIA_MODAL_SHOW_ON_LOGIN);
		if (!shouldShow) return;

		// ✅ solo aplica para operaciones (area 1) y NO admin
		if (!isOperacionesUser) return;

		(async () => {
			try {
				const res = await privateInstance.get("/operaciones/guardias/active");
				if (res.data?.hasActive) setOpenActive(true);
				else setOpenCreate(true);
			} catch {
				// si falla el check, mejor no molestamos
			}
		})();
	}, [isOperacionesUser]);

	return (
		<>
			{/* ✅ Dashboard según el area */}
			{isOperacionesUser ? <OperacionesDash /> : <p>Hola</p>}

			{/* ✅ Modales (solo sentido para Operaciones, pero no estorban si están cerrados) */}
			<CreateGuardiaModal
				isOpen={openCreate}
				onClose={() => setOpenCreate(false)}
				onConfirm={() => {
					// aquí luego conectamos el POST store
					setOpenCreate(false);
				}}
			/>

			<ActiveGuardiaModal
				isOpen={openActive}
				onClose={() => setOpenActive(false)}
			/>
		</>
	);
}
