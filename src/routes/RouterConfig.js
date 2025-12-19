const routeConfig = [
  // === ADMIN ===
  // === USUARIOS ===
    {path: "/admin/users", component: "UserListPage", module: "users", permissions: ["browse"],},

    {path: "/admin/users/crear-usuario", component: "CreateUser", module: "users", permissions: ["create"],},

    {path: "/admin/users/:id/editar", component: "EditUser", module: "users", permissions: ["edit"],},

    {path: "/admin/users/:id/ver", component: "ShowUser", module: "users", permissions: ["show"],},

   //=== CONSOLA ===
    {path: "/admin/console", component: "LogsBack", module: "console", permissions: ["browse"],},

  //=== ROLES ===
    {path: "/admin/roles",component: "Rol",module: "roles",permissions: ["browse"],},

    {path: "/admin/roles/crear", component: "CreateRol", module: "roles", permissions: ["create"],},

    {path: "/admin/roles/:id/editar", component: "EditRol", module: "roles", permissions: ["edit"],},

    {path: "/admin/roles/:id/ver", component: "ShowRol", module: "roles", permissions: ["show"],},

  //=== PERMISOS ===
    {path: "/admin/permisos", component: "ListPermissions", module: "permisos", permissions: ["browse"],},

    {path: "/admin/permisos/crear", component: "CreatePermissions", module: "permisos", permissions: ["create"],},

  //=== AREAS ===  
    {path: "/admin/areas", component: "ListAreas", module: "area", permissions: ["browse"],},
    {path: "/admin/areas/create", component: "CreateArea", module: "area", permissions: ["edit"],},
  //=== PERFIL ===
    {path: "/perfil", component: "Profile", permissions: ["browse", "edit"],},
    {path: "/profile/editar", component: "EditProfile",}, 


  // === USER ZONE ===
  {path: "/inicio", component: "HomePage", permissions: ["browse"],},

 
];

export default routeConfig;
