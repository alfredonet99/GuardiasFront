import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FiPlusCircle, FiLayers } from "react-icons/fi";
import routeConfig from "../../routes/RouterConfig";
import { privateInstance } from "../../api/axios";
import FieldError from "../../components/UI/Errors/ElementsErrors";
import { useFieldErrors } from "../../hooks/Errors/MessageInputs";
import { useAutoClearErrors } from "../../hooks/Errors/clearErrorMessage";
import FlashMessage from "../../components/UI/Errors/ErrorsGlobal";
import useFlashMessage from "../../hooks/Errors/ErrorMessage";
import ExitConfirm from "../../components/UI/ConfirmBtn/ExitConfirm";
import { useAuthMe } from "../../hooks/Auth/AuthMe";
import PermissionDenied from "../Errors/PermissionDenied";

export default function CreatePermissions() {
  const { isAdmin, loading: loadingMe } = useAuthMe();
  
  const navigate = useNavigate();
  const modules = useMemo(() => {
    const all = routeConfig
      .filter(r => r.module)
      .map(r => r.module);

    return Array.from(new Set(all));
  }, []);


  const { localErrors, errorKey, validateFields, clearError } = useFieldErrors();
  const { message, showMessage, clearMessage } = useFlashMessage();
  
  const [tab, setTab] = useState("single");
  const [moduleSelected, setModuleSelected] = useState("");
  const [permName, setPermName] = useState("");
  const [permDescription, setPermDescription] = useState("");

  const [moduleCRUD, setModuleCRUD] = useState("");
  const [crudSelected, setCrudSelected] = useState({ browse: true, create: true, edit: true, delete: true, show: true,});

  const formValues = { moduleSelected, permName, moduleCRUD, crudSelected };
  useAutoClearErrors(formValues, localErrors, clearError);

  const toggleCrud = (key) => { setCrudSelected((prev) => ({ ...prev, [key]: !prev[key] })); };
  const handleCreateSingle = async () => {
    
    const rules = { moduleSelected: { required: true, message: "Debes seleccionar un módulo." }, permName: { required: true, message: "Escribe un nombre de permiso." }, };
    const isValid = validateFields(rules, { moduleSelected, permName });
    if (!isValid) return;
    
    try {
      await privateInstance.post("/permissions/crear", { module: moduleSelected, name: permName, description: permDescription, });
      navigate("/admin/permisos");
    } catch (err) {
      console.error(err);
      if (err.response?.status === 422) {
        showMessage("El permiso ya existe");
      } else {
        showMessage("Error al crear el permiso.");
      }
    }
  };
  

  const handleCreateCrud = async () => {
    const rules = { moduleCRUD: { required: true, message: "Debes seleccionar un módulo." }, crudSelected : { required: true, message: "Selecciona al menos una acción CRUD." }, };

    const selectedCRUD = Object.entries(crudSelected)
      .filter(([_, val]) => val)
      .map(([key]) => key);

    const isValid = validateFields(rules, { moduleCRUD,  crudSelected: selectedCRUD.length > 0 ? selectedCRUD : "" });
    if (!isValid) return;

    const descriptions = {
      browse: `Método que permite navegar en la sección ${moduleCRUD}.`,
      create: `Método que permite visualizar la sección para crear un ${moduleCRUD}.`,
      edit: `Método que permite visualizar la sección para editar un ${moduleCRUD}.`,
      delete: `Método que permite eliminar un ${moduleCRUD}.`,
      show: `Método que permite visualizar los detalles de un ${moduleCRUD}.`
    };

    const crudPayload = selectedCRUD.map(action => ({ action, description: descriptions[action] }));

    try {
      await privateInstance.post("/permissions/crear-crud", {
        module: moduleCRUD,
        crud: crudPayload
      });
      navigate("/admin/permisos");
    } catch (err) {
      console.error(err);
      if (err.response?.status === 422) {
        const existing = err.response?.data?.existing;
        if (Array.isArray(existing) && existing.length > 0) {
          showMessage(`Algunos permisos ya existen: ${existing.join(", ")}`, "error");
        } 
        } else {
          showMessage("Error al crear los permisos CRUD.", "error");
      }
    }
  };

  if (loadingMe) return null;
  if (!isAdmin) return <PermissionDenied />;

  return (
    <div className="min-h-screen w-full px-6 py-6 bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"> Crear Permiso </h1>
        <ExitConfirm to="/admin/permisos"/>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow border border-slate-200 dark:border-slate-800 p-5 max-w-3xl mx-auto">
        <div className="flex border-b border-slate-300 dark:border-slate-700 mb-6">
          <button className={`px-4 py-2 font-semibold flex items-center gap-2 border-b-2 transition ${tab === "single" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
            onClick={() => setTab("single")}
          >
            <FiPlusCircle /> Permiso Individual
          </button>

          <button className={`px-4 py-2 font-semibold flex items-center gap-2 border-b-2 transition ${tab === "crud" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300" }`}
            onClick={() => setTab("crud")}
          >
            <FiLayers /> CRUD Automático
          </button>
        </div>

        {tab === "single" && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <label className="font-medium">Módulo</label>
              <select value={moduleSelected} onChange={(e) => setModuleSelected(e.target.value)}
                className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-600 outline-none"
              >
                <option value="">Selecciona un módulo...</option>
                {modules.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <FieldError message={localErrors.moduleSelected} resetKey={errorKey} />
            </div>

            <div>
              <label className="font-medium">Nombre del Permiso</label>
              <input type="text" value={permName} onChange={(e) => setPermName(e.target.value)} placeholder="Ejemplo: export, approve, validate"
                className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-600 outline-none"
              />
              <FieldError message={localErrors.permName} resetKey={errorKey} />
            </div>

            <div>
              <label className="font-medium">Descripción (opcional)</label>
              <textarea value={permDescription} onChange={(e) => setPermDescription(e.target.value)} className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 
              bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-600 outline-none resize-none h-24"
              />
            </div>

            <button onClick={handleCreateSingle} className="w-full py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"> Guardar Permiso </button>
            <FlashMessage message={message} />
          </div>
        )}

        {tab === "crud" && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <label className="font-medium">Módulo para generar CRUD</label>
              <select value={moduleCRUD} onChange={(e) => setModuleCRUD(e.target.value)} className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 
              bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-600 outline-none"
              >
                <option value="">Selecciona un módulo...</option>
                {modules.map((m) => ( <option key={m} value={m}>{m}</option> ))}
              </select>
              <FieldError message={localErrors.moduleCRUD} resetKey={errorKey} />
            </div>

            <div>
              <label className="font-medium">Selecciona los permisos CRUD</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                {Object.entries(crudSelected).map(([key, value]) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700">
                    <input type="checkbox" checked={value} onChange={() => toggleCrud(key)}/> 
                    {key.toUpperCase()}
                  </label>
                ))}
              </div>
              <FieldError message={localErrors.crudSelected } resetKey={errorKey} />
            </div>
            <FlashMessage message={message} />
            <button onClick={handleCreateCrud} className="w-full py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"> Crear Permisos del CRUD </button>
          </div>
        )}

      </div>
    </div>
  );
}
