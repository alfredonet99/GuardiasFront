const r = (path, component, module, permissions) => ({
	path,
	component,
	module,
	permissions,
});

export default [
	// === SUCURSALES ===
	r("/comunicaciones/sucursales", "ListSucursales", "sucursales", ["browse"]),
	r(
		"/comunicaciones/sucursales/crear-sucursal",
		"CreateSucursal",
		"sucursales",
		["create"],
	),

	r("/comunicaciones/sucursales/:id/editar", "EditSucursal", "sucursales", [
		"edit",
	]),

	// === Microsoft ===
	r("/comunicaciones/microsoft", "ListMicrosoft", "microsoft", ["browse"]),
];
