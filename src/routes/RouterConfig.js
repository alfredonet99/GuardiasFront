import Admin from "./Admin";
import Operaciones from "./Operaciones";

const routeConfig = [
	...Admin,
	//=== PERFIL ===
	{ path: "/perfil", component: "Profile", permissions: ["browse", "edit"] },
	{ path: "/profile/editar", component: "EditProfile" },

	// === USER ZONE ===
	{ path: "/inicio", component: "HomePage", permissions: ["browse"] },

	// === OPERACIONES ===
	...Operaciones,
];

export default routeConfig;
