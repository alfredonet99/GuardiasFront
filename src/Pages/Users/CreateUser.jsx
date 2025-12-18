import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { privateInstance } from "../../api/axios";

import ExitConfirm from "../../components/UI/ConfirmBtn/ExitConfirm";
import FieldError from "../../components/UI/Errors/ElementsErrors";
import PasswordSectionUI from "../../components/UI/Users/Password";
import FlashMessage from "../../components/UI/Errors/ErrorsGlobal";
import FormLoader from "../../components/UI/Loaders/FormLoader";

import { useFieldErrors } from "../../hooks/Errors/MessageInputs";
import { useAutoClearErrors } from "../../hooks/Errors/clearErrorMessage";
import { useTouchedFields } from "../../hooks/Errors/TouchedFields";
import useFlashMessage from "../../hooks/Errors/ErrorMessage";
import { useFormPage } from "../../hooks/Forms/useForm";

export default function CreateUser() {
  const navigate = useNavigate();

  const { localErrors, errorKey, validateFields, clearError } = useFieldErrors();
  const { isTouched, markTouched, markAllTouched } = useTouchedFields();
  const { message, showMessage, clearMessage } = useFlashMessage();

  const [roles, setRoles] = useState([]);
  const [activo, setActivo] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [roleSelected, setRoleSelected] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const rules = { 
    name: { required: true, message: "Ingresa un nombre" },
    email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Ingresa un correo válido (ej. usuario@empresa.com)",},
    roleSelected: { required: true, message: "Selecciona un rol" },
    password: { required: true, minLength: 6, message: "La contraseña debe tener al menos 6 caracteres",},
    confirm: { required: true, equals: password, message: "Las contraseñas no coinciden",},
  };

  const formValues = { name, email, roleSelected, password, confirm, activo,};

  useAutoClearErrors(formValues, localErrors, clearError, rules);

  const { loadingPage, submitting, setSubmitting } = useFormPage(async () => {
    const res = await privateInstance.get("/users/crear");
    setRoles(res.data.roles || []);
  });

  const handleCreateUser = async () => {
    clearMessage();
    markAllTouched(["name", "email", "roleSelected", "password", "confirm"]);

    if (!validateFields(rules, formValues)) return;
    setSubmitting(true);

    try {
      await privateInstance.post("/users/store", {
        name: name.trim(),
        email: email.trim(),
        password,
        password_confirmation: confirm,
        role: roleSelected,
        activo,
      });

      showMessage("Usuario creado correctamente.", "success");
      navigate("/admin/users");
    } catch (error) {
      if (error.response?.status === 422) {
        const errors = error.response.data.errors || {};
        const msg =
          errors.email?.[0] || Object.values(errors).flat()?.[0];
        showMessage(msg || "Revisa los campos del formulario.", "error");
      } else {
        showMessage("Error al crear usuario.", "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingPage) {
    return <FormLoader />;
  }

  return (
    <div className="min-h-screen w-full px-6 py-6 bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold mx-1">Crear Usuario</h1>
        <ExitConfirm to="/admin/users" />
      </header>

      <section className="bg-white dark:bg-slate-900 rounded-xl shadow border border-slate-200 dark:border-slate-800 p-6 max-w-3xl mx-auto">
        <div className="space-y-5">
          <div>
            <label className="font-semibold text-sm">Nombre</label>
            <input type="text" value={name} onBlur={() => markTouched("name")} onChange={(e) => setName(e.target.value)} placeholder="Ej. Juan Pérez"
              className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-600 outline-none"
            />
            {isTouched("name") && (
                <FieldError message={localErrors.name} resetKey={errorKey} />
            )}
          </div>

          <div>
            <label className="font-semibold text-sm">Correo</label>
            <input type="email" value={email} onBlur={() => markTouched("email")} onChange={(e) => setEmail(e.target.value)} placeholder="correo@empresa.com"
              className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-600 outline-none"
            />
            {isTouched("email") && (
                <FieldError message={localErrors.email} resetKey={errorKey} />
            )}
          </div>

          <div>
            <label className="font-semibold text-sm">Rol</label>
            <select value={roleSelected} onChange={(e) => setRoleSelected(e.target.value)} onBlur={() => markTouched("roleSelected")}
              className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-600 outline-none"
            >
              <option value="">Selecciona un rol...</option>
              {roles.map((r) => (
                <option key={r.id} value={r.name}>
                  {r.name}
                </option>
              ))}
            </select>
            {isTouched("roleSelected") && (
              <FieldError message={localErrors.roleSelected} resetKey={errorKey} />
            )}
          </div>

          <PasswordSectionUI password={password} setPassword={setPassword} confirm={confirm} setConfirm={setConfirm} errors={localErrors} errorKey={errorKey} isTouched={isTouched} markTouched={markTouched}/>

          <div className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 px-4 py-3">
            <div>
              <div className="font-semibold text-sm">Activo</div>
              <div className="text-xs text-slate-500 dark:text-slate-400"> Si está desactivado, el usuario no podrá iniciar sesión. </div>
            </div>

            <button type="button" onClick={() => setActivo((prev) => !prev)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${activo ? "bg-blue-600" : "bg-slate-400"}`} aria-pressed={activo}>
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${activo ? "translate-x-5" : "translate-x-1"}`}/>
            </button>
          </div>
        </div>
        
      <FlashMessage message={message} />
        <div className="mt-6 flex justify-end">
          <button type="button" onClick={handleCreateUser} className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm">
            Crear usuario
          </button>
        </div>
      </section>
    </div>
  );
}
