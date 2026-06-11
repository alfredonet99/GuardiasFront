import { FaMicrosoft } from "react-icons/fa";
import { FiMapPin } from "react-icons/fi";
import { TbNetwork } from "react-icons/tb";

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

	{
		pattern: /^\/comunicaciones\/monitoreos-aa(\/.*)?$/,
		label: "MONITOREOS REDES",
		icon: TbNetwork,
	},
];
