import {
	FiBriefcase,
	FiCloud,
	FiHome,
	FiKey,
	FiPackage,
	FiShield,
	FiTerminal,
	FiUser,
	FiUsers,
} from "react-icons/fi";
import { useLocation } from "react-router-dom";
import usePageTitleLabel from "../../hooks/PageNames";

const ROUTE_META = [
	{ pattern: /^\/inicio$/, label: "INICIO", icon: FiHome },
	{ pattern: /^\/profile(\/.*)?$/, label: "PERFIL", icon: FiUser },
	{ pattern: /^\/admin\/users(\/.*)?$/, label: "USUARIOS", icon: FiUsers },
	{ pattern: /^\/admin\/roles(\/.*)?$/, label: "ROLES", icon: FiShield },
	{ pattern: /^\/admin\/permisos(\/.*)?$/, label: "PERMISOS", icon: FiKey },
	{ pattern: /^\/admin\/console(\/.*)?$/, label: "CONSOLA", icon: FiTerminal },
	{ pattern: /^\/admin\/areas(\/.*)?$/, label: "AREAS", icon: FiBriefcase },

	{
		pattern: /^\/operaciones\/clientes\/netsuite(\/.*)?$/,
		label: "CLIENTES NETSUITE",
		icon: FiPackage,
	},
	{
		pattern: /^\/operaciones\/clientes\/veeam(\/.*)?$/,
		label: "Clientes Veeam",
		icon: FiCloud,
	},
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
