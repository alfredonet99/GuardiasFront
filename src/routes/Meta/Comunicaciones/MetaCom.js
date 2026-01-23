import { FaMicrosoft } from "react-icons/fa";
import { FiMapPin } from "react-icons/fi";

export const COMUNICACIONES_ROUTE_META = [
	{
		pattern: /^\/comunicaciones\/sucursales(\/.*)?$/,
		label: "SUCURSALES",
		icon: FiMapPin,
	},

	{
		pattern: /^\/comunicaciones\/microsoft(\/.*)?$/,
		label: "MICROSOFT",
		icon: FaMicrosoft,
	},
];
