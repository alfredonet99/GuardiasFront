const r = (path, component, module, permissions) => ({
	path,
	component,
	module,
	permissions,
});

export default [
	// === ADMIN ===
	// === USUARIOS ===
	r("/admin/users", "UserListPage", "users", ["browse"]),
	r("/admin/users/crear-usuario", "CreateUser", "users", ["create"]),
	r("/admin/users/:id/editar", "EditUser", "users", ["edit"]),
	r("/admin/users/:id/ver", "ShowUser", "users", ["show"]),

	//=== CONSOLA ===
	r("/admin/console", "LogsBack", "console", ["browse"]),

	//=== ROLES ===
	r("/admin/roles", "Rol", "roles", ["browse"]),
	r("/admin/roles/crear", "CreateRol", "roles", ["create"]),
	r("/admin/roles/:id/editar", "EditRol", "roles", ["edit"]),
	r("/admin/roles/:id/ver", "ShowRol", "roles", ["show"]),

	//=== PERMISOS ===
	r("/admin/permisos", "ListPermissions", "permisos", ["browse"]),
	r("/admin/permisos/crear", "CreatePermissions", "permisos", ["create"]),

	//=== AREAS ===
	r("/admin/areas", "ListAreas", "area", ["browse"]),
	r("/admin/areas/create", "CreateArea", "area", ["edit"]),
];
