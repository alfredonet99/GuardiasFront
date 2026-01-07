import { useEffect, useState } from "react";
import { privateInstance } from "../api/axios";
import CreateGuardiaModal from "../components/Modals/Guardias/CreateGuardia";
import ActiveGuardiaModal from "../components/Modals/Guardias/GuardiaActiva";

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

	useEffect(() => {
		const shouldShow =
			sessionStorage.getItem(GUARDIA_MODAL_SHOW_ON_LOGIN) === "1";

		if (shouldShow) sessionStorage.removeItem(GUARDIA_MODAL_SHOW_ON_LOGIN);
		if (!shouldShow) return;

		const u = getCachedUser();
		const areaId = Number(u?.area_id || 0);
		const isAdmin =
			Array.isArray(u?.roles) &&
			u.roles.some((r) => r?.name === "Administrador");

		if (areaId !== 1) return;
		if (isAdmin) return;

		(async () => {
			try {
				const res = await privateInstance.get("/operaciones/guardias/active");
				if (res.data?.hasActive) {
					setOpenActive(true); // ✅ mensaje de guardia activa
				} else {
					setOpenCreate(true); // ✅ modal de iniciar guardia
				}
			} catch {
				// si falla el check, mejor no molestamos
				return;
			}
		})();
	}, []);

	return (
		<>
			<p>Hola</p>

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
