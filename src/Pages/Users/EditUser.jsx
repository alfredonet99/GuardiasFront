import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { privateInstance } from "../../api/axios";

import ExitConfirm from "../../components/UI/ConfirmBtn/ExitConfirm";
import FieldError from "../../components/UI/Errors/ElementsErrors";
import PasswordSectionUI from "../../components/UI/Users/Password";
import FlashMessage from "../../components/UI/Errors/ErrorsGlobal";
import FormLoader from "../../components/UI/Loaders/FormLoader";
import UserPermissionsUI from "../../components/UI/Users/PermissionDirect";
import PermissionDenied from "../Errors/PermissionDenied";

import { useFieldErrors } from "../../hooks/Errors/MessageInputs";
import { useAutoClearErrors } from "../../hooks/Errors/clearErrorMessage";
import { useTouchedFields } from "../../hooks/Errors/TouchedFields";
import useFlashMessage from "../../hooks/Errors/ErrorMessage";
import { useFormPage } from "../../hooks/Forms/useForm";
import { useAuthMe } from "../../hooks/Auth/AuthMe";

export default function EditUser() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isAdmin, loading: loadingMe } = useAuthMe();
  const [denied, setDenied] = useState(false);

  const [targetIsAdmin, setTargetIsAdmin] = useState(null);

  const { localErrors, errorKey, validateFields, clearError } = useFieldErrors();
  const { isTouched, markTouched, markAllTouched } = useTouchedFields();
  const { message, showMessage, clearMessage } = useFlashMessage();

  const [roles, setRoles] = useState([]);
  const [activo, setActivo] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [roleSelected, setRoleSelected] = useState("");
  const [directPerms, setDirectPerms] = useState([]);

  const [changePassword, setChangePassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const baseRules = useMemo(() => {
    return {
      name: { required: true, message: "Ingresa un nombre" },
      ...(isAdmin
        ? {
            email: {
              required: true,
              pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "Ingresa un correo válido (ej. usuario@empresa.com)",
            },
          }
        : {}),
      roleSelected: { required: true, message: "Selecciona un rol" },
    };
  }, [isAdmin]);

  const passwordRules = useMemo(() => {
    return {
      password: {
        required: true,
        minLength: 6,
        message: "La contraseña debe tener al menos 6 caracteres",
      },
      confirm: {
        required: true,
        equals: password,
        message: "Las contraseñas no coinciden",
      },
    };
  }, [password]);

  const rules = useMemo(() => {
    return changePassword ? { ...baseRules, ...passwordRules } : baseRules;
  }, [changePassword, baseRules, passwordRules]);

  const formValues = useMemo(() => {
    return {
      name,
      email,
      roleSelected,
      activo,
      ...(changePassword ? { password, confirm } : {}),
    };
  }, [name, email, roleSelected, activo, changePassword, password, confirm]);

  useAutoClearErrors(formValues, localErrors, clearError, rules);

  const { loadingPage, submitting, setSubmitting } = useFormPage(async () => {
    const res = await privateInstance.get(`/users/${id}/edit`);

    setRoles(res.data.roles || []);

    const u = res.data.user || {};

    setName(u.name || "");
    setEmail(u.email || "");

    const rawActivo = u.activo ?? u.Activo;
    setActivo(rawActivo === true || rawActivo === 1 || rawActivo === "1");

    const rolesFromUser = Array.isArray(u.roles) ? u.roles : [];
    const roleNames = rolesFromUser
      .map((r) => (typeof r === "string" ? r : r?.name))
      .filter(Boolean);

    setTargetIsAdmin(roleNames.includes("Administrador"));

    const firstRole = roleNames[0] || "";
    setRoleSelected(firstRole);
  });

  useEffect(() => {
    if (loadingMe) return;
    if (loadingPage) return;
    if (targetIsAdmin === null) return;

    if (!isAdmin && targetIsAdmin && !denied) {
      showMessage("No tienes permiso para editar un usuario Administrador.", "error");
      setDenied(true);
    }
  }, [loadingMe, loadingPage, isAdmin, targetIsAdmin, denied, showMessage]);

  useEffect(() => {
    if (loadingMe) return;
    if (loadingPage) return;
    if (!id) return;

    if (!isAdmin) {
      setDirectPerms([]);
      return;
    }

    const loadPerms = async () => {
      try {
        const resPerm = await privateInstance.get(`/users/${id}/vpermission`);
        const direct = Array.isArray(resPerm.data?.direct_permissions)
          ? resPerm.data.direct_permissions
          : [];
        setDirectPerms(direct);
      } catch (e) {
        console.error("[EditUser] vpermission error:", e);
        setDirectPerms([]);
      }
    };

    loadPerms();
  }, [loadingMe, loadingPage, isAdmin, id]);

  useEffect(() => {
    if (!changePassword) {
      setPassword("");
      setConfirm("");
      clearError("password");
      clearError("confirm");
    }
  }, [changePassword]);

  const handleUpdateUser = async () => {
    clearMessage();

    const touched = ["name", "roleSelected"];
    if (isAdmin) touched.push("email");
    if (changePassword) touched.push("password", "confirm");
    markAllTouched(touched);

    if (!validateFields(rules, formValues)) return;

    setSubmitting(true);

    try {
      const payload = {
        name: name.trim(),
        role: roleSelected,
        activo,
      };

      if (isAdmin) payload.email = email.trim();

      if (changePassword) {
        payload.password = password;
        payload.password_confirmation = confirm;
      }

      await privateInstance.put(`/users/${id}/update`, payload);

      if (isAdmin) {
        const resPerm = await privateInstance.get(`/users/${id}/vpermission`);

        const roleNow = Array.isArray(resPerm.data?.role_permissions)
          ? resPerm.data.role_permissions
          : [];

        const roleSet = new Set(roleNow);
        const toSend = (directPerms || []).filter((p) => !roleSet.has(p));

        await privateInstance.put(`/users/${id}/permissionup`, {
          permissions: toSend,
        });
      }

      navigate("/admin/users");
    } catch (error) {
      if (error.response?.status === 422) {
        const errors = error.response.data?.errors || {};
        const msg = errors.email?.[0] || Object.values(errors).flat()?.[0];
        showMessage(msg || "Revisa los campos del formulario.", "error");
      } else {
        showMessage("Error al actualizar usuario.", "error");
      }
    } finally {
      setSubmitting(false);
    }
  };
  
  if (denied) return <PermissionDenied />;
  if (loadingPage) return <FormLoader />;

  return (
    <div className="min-h-screen w-full px-6 py-6 bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold mx-1">Editar Usuario</h1>
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
            <input type="email" value={email} onBlur={() => isAdmin && markTouched("email")} onChange={(e) => setEmail(e.target.value)} placeholder="correo@empresa.com" disabled={!isAdmin}
              className={`mt-1 w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-600 outline-none ${
                !isAdmin ? "opacity-60 cursor-not-allowed" : ""
              }`}
            />
            {isAdmin && isTouched("email") && (
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

          {/* Activo */}
          <div className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 px-4 py-3">
            <div>
              <div className="font-semibold text-sm">Activo</div>
              <div className="text-xs text-slate-500 dark:text-slate-400"> Si está desactivado, el usuario no podrá iniciar sesión. </div>
            </div>

            <button type="button" onClick={() => setActivo((prev) => !prev)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${ activo ? "bg-blue-600" : "bg-slate-400"}`}
              aria-pressed={activo}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${activo ? "translate-x-5" : "translate-x-1"}`}/>
            </button>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 px-4 py-3">
            <div>
              <div className="font-semibold text-sm">Cambiar contraseña</div>
              <div className="text-xs text-slate-500 dark:text-slate-400"> Actívalo solo si deseas actualizar la contraseña. </div>
            </div>

            <button type="button" onClick={() => setChangePassword((prev) => !prev)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${changePassword ? "bg-blue-600" : "bg-slate-400"}`}
              aria-pressed={changePassword}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${changePassword ? "translate-x-5" : "translate-x-1"}`}
              />
            </button>
          </div>

          {changePassword && (
            <PasswordSectionUI password={password} setPassword={setPassword} confirm={confirm} setConfirm={setConfirm} errors={localErrors} errorKey={errorKey} isTouched={isTouched} markTouched={markTouched}/>
          )}
        </div>

        {isAdmin && (
          <UserPermissionsUI userId={id} showMessage={showMessage} value={directPerms} onChange={setDirectPerms} disabled={false}/>
        )}

        <FlashMessage message={message} />

        <div className="mt-6 flex justify-end">
          <button type="button" disabled={submitting} onClick={handleUpdateUser} className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm disabled:opacity-60">
            Guardar cambios
          </button>
        </div>
      </section>
    </div>
  );
}