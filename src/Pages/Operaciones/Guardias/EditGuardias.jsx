import ExitConfirm from "../../../components/UI/ConfirmBtn/ExitConfirm";
import TicketGuardiaEdit from "../../../components/UI/GuardiasClose/TicketsEditGuard";
export default function EditGuardias() {
	return (
		<div className="min-h-screen w-full px-6 py-6 bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
			<header className="flex items-center justify-between mb-6">
				<h1 className="text-2xl font-bold mx-1">CERRAR GUARDIA</h1>
				<ExitConfirm to="/operaciones/guardias" />
			</header>

			<TicketGuardiaEdit />
		</div>
	);
}
