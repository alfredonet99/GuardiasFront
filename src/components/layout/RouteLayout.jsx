import {
	FiBriefcase,
	FiHome,
	FiKey,
	FiShield,
	FiTerminal,
	FiUser,
	FiUsers,
} from "react-icons/fi";
import { useLocation } from "react-router-dom";
import usePageTitleLabel from "../../hooks/PageNames";
import { OPERACIONES_ROUTE_META } from "../../routes/Meta/Operaciones/MetaOp";

const ROUTE_META = [
	{ pattern: /^\/inicio$/, label: "INICIO", icon: FiHome },
	{ pattern: /^\/profile(\/.*)?$/, label: "PERFIL", icon: FiUser },
	{ pattern: /^\/admin\/users(\/.*)?$/, label: "USUARIOS", icon: FiUsers },
	{ pattern: /^\/admin\/roles(\/.*)?$/, label: "ROLES", icon: FiShield },
	{ pattern: /^\/admin\/permisos(\/.*)?$/, label: "PERMISOS", icon: FiKey },
	{ pattern: /^\/admin\/console(\/.*)?$/, label: "CONSOLA", icon: FiTerminal },
	{ pattern: /^\/admin\/areas(\/.*)?$/, label: "AREAS", icon: FiBriefcase },

	...OPERACIONES_ROUTE_META,
];

export default function RoutePageTitleManager() {
	const { pathname } = useLocation();

	const meta = ROUTE_META.find((r) => r.pattern.test(pathname)) ?? {
		label: "APP",
		icon: FiHome,
	};

	usePageTitleLabel(meta.label, meta.icon);

	return null;
}
