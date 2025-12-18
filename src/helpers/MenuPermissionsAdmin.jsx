import routeConfig from "../routes/RouterConfig";

export function useMenuVisibilityFromRoutes() {
  const raw = localStorage.getItem("permissions");
  let userPermissions = [];

  try {
    userPermissions = JSON.parse(raw) || [];
  } catch {
    userPermissions = [];
  }

  /**
   * 🔹 findRouteModule(path)
   * Busca la ruta exacta o parcial dentro del routeConfig
   * para obtener su módulo declarado.
   */
  const findRouteModule = (path) => {
    const route = routeConfig.find((r) => path.startsWith(r.path));
    return route?.module || null;
  };

  /**
   * ✅ canView(path)
   * Retorna true si el usuario tiene permiso .browse
   * del módulo definido en el routeConfig
   */
  const canView = (path) => {
    const module = findRouteModule(path);
    if (!module) return true; // rutas sin módulo => visibles
    const key = `${module}.browse`;
    return userPermissions.includes(key);
  };

  return { canView };
}
