import { useState, useMemo } from "react";
import { privateInstance } from "../../api/axios";
import { useNavigate } from "react-router-dom";

import ExitConfirm from "../../components/UI/ConfirmBtn/ExitConfirm"
import FieldError from "../../components/UI/Errors/ElementsErrors";
import FlashMessage from "../../components/UI/Errors/ErrorsGlobal";

import { useFieldErrors } from "../../hooks/Errors/MessageInputs";
import { useAutoClearErrors } from "../../hooks/Errors/clearErrorMessage";
import { useTouchedFields } from "../../hooks/Errors/TouchedFields";
import useFlashMessage from "../../hooks/Errors/ErrorMessage";

export default function CreateArea() {
    const navigate = useNavigate();

    const { localErrors, errorKey, validateFields, clearError } = useFieldErrors();
    const { isTouched, markTouched, markAllTouched } = useTouchedFields();
    const { message, showMessage, clearMessage } = useFlashMessage();

    const [name, setName] = useState("");
    const [activo, setActivo] = useState(true);
    const [saving, setSaving] = useState(false);

    const rules = useMemo(() => ({name: { required: true, message: "Ingresa un nombre de área" },}),[]);
    const formValues = useMemo(() => ({ name }), [name]);
    useAutoClearErrors(formValues, localErrors, clearError, rules);

    const handleCreateArea = async () => {
        clearMessage();
        markAllTouched(["name"]);
        if (!validateFields(rules, formValues)) return;
        setSaving(true);

        try {
            await privateInstance.post("/areas/store", {
                name: name.trim(),
                activo, 
            });

            showMessage("Área creada correctamente.", "success");
            navigate("/admin/areas");
        } catch (error) {
            const status = error.response?.status;

            if (status === 422) {
                const errs = error.response?.data?.errors || {};
                const first = errs.name?.[0] || Object.values(errs).flat()?.[0];
                showMessage(first || "Revisa los campos del formulario.", "error");
            } else if (status === 403) {
                showMessage(error.response?.data?.message || "No tienes permiso.", "error");
            } else {
                showMessage("No se pudo crear el área. Intenta de nuevo.", "error");
            }
        } finally {
            setSaving(false);
        }
        
    };
    return (
        <div className="min-h-screen w-full px-6 py-6 bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
            <header className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold mx-1">Crear Area</h1>
                <ExitConfirm to="/admin/areas" />
            </header>
            
            <section className="bg-white dark:bg-slate-900 rounded-xl shadow border border-slate-200 dark:border-slate-800 p-6 max-w-3xl mx-auto">
                <div className="space-y-5">
                    <div>
                        <label className="font-semibold text-sm">Nombre del Area</label>
                        <input type="text" value={name} onBlur={() => markTouched("name")}  onChange={(e) => setName(e.target.value)} placeholder="Ej. Operación"
                            className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-600 outline-none"
                        />
                        {isTouched("name") && (
                            <FieldError message={localErrors.name} resetKey={errorKey} />
                        )}
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 px-4 py-3">
                        <div>
                        <div className="font-semibold text-sm">Activo</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400"> Si está desactivado, el usuario no podrá iniciar sesión. </div>
                        </div>

                        <button type="button" onClick={() => setActivo((prev) => !prev)}  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${activo ? "bg-blue-600" : "bg-slate-400"}`} aria-pressed={activo}>
                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${activo ? "translate-x-5" : "translate-x-1"}`}/>
                        </button>
                    </div>
                    <FlashMessage message={message} />
                </div>
                <div className="mt-6 flex justify-end">
                    <button type="button" onClick={handleCreateArea} disabled={saving} className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm">
                       {saving ? "Creando..." : "Crear Área"}
                    </button>
                </div>
            </section>
        </div>
    )
}