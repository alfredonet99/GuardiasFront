const r = (path, component, module, permissions) => ({
	path,
	component,
	module,
	permissions,
});

export default [
	//=== Clientes ===
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

	r(
		"/operaciones/clientes/veeam/ver-client-veeam",
		"ListClientVeeam",
		"clientveeam",
		["browse"],
	),
];
