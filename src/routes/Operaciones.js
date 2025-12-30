const r = (path, component, module, permissions) => ({
	path,
	component,
	module,
	permissions,
});

export default [
	//=== Clientes ===

	//=== NETSUITE ===
	r(
		"/operaciones/clientes/netsuite/list-client-net",
		"ListClientNet",
		"clientnet",
		["browse"],
	),
	r(
		"/operaciones/clientes/netsuite/:id/ver-client-net",
		"ShowClientNet",
		"clientnet",
		["show"],
	),

	//=== VEEAM ===

	r(
		"/operaciones/clientes/veeam/lista-client-veeam",
		"ListClientVeeam",
		"clientveeam",
		["browse"],
	),

	r(
		"/operaciones/clientes/veeam/crear-client-veeam",
		"CreateClientVeeam",
		"clientveeam",
		["create"],
	),

	r(
		"/operaciones/clientes/veeam/:id/editar-client-veeam",
		"EditClientVeeam",
		"clientveeam",
		["edit"],
	),

	r(
		"/operaciones/clientes/veeam/:id/ver-client-veeam",
		"ShowClientVeeam",
		"clientveeam",
		["show"],
	),

	//=== Guardias ===
	r("/operaciones/guardias", "ListGuardias", "guardias", ["browse"]),
	//=== App ===
	r("/operaciones/app", "ListApp", "appclient", ["browse"]),
	r("/operaciones/app/crear", "CreateApp", "appclient", ["create"]),
	r("/operaciones/app/:id/editar", "EditApp", "appclient", ["edit"]),
];
