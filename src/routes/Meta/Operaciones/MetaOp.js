import { FiCloud, FiLayers, FiPackage, FiUserCheck } from "react-icons/fi";

export const OPERACIONES_ROUTE_META = [
	{
		pattern: /^\/operaciones\/clientes\/netsuite(\/.*)?$/,
		label: "CLIENTES NETSUITE",
		icon: FiPackage,
	},
	{
		pattern: /^\/operaciones\/clientes\/veeam(\/.*)?$/,
		label: "CLIENTES VEEAM",
		icon: FiCloud,
	},
	{
		pattern: /^\/operaciones\/app(\/.*)?$/,
		label: "APLICATIVOS",
		icon: FiLayers,
	},
	{
		pattern: /^\/operaciones\/guardias(\/.*)?$/,
		label: "GUARDIAS",
		icon: FiUserCheck,
	},
];
