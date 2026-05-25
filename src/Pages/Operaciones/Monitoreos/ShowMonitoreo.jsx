import BackButton from "../../../components/UI/ConfirmBtn/ExitConfirmShow";
import IconEditShow from "../../../components/icons/Crud/EditShow";
import FlashMessage from "../../../components/UI/Errors/ErrorsGlobal";
import useFlashMessage from "../../../hooks/Errors/ErrorMessage";
import { useState } from "react";

export default function ShowMonitoreo() {
	const [monitoreo, setMonitoreo] = useState(null);
	const { message, showMessage, clearMessage } = useFlashMessage();
	return (
		<div className="min-h-screen w-full px-8 py-8 bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
			<header className="flex items-center justify-between mb-8">
				<div className="space-y-1">
					<h1 className="text-3xl font-bold mx-1">Detalle del Monitoreo</h1>
				</div>
				<div className="flex items-center gap-2">
					<BackButton to="/operaciones/monitoreos" />
					<IconEditShow to={``} />
				</div>
			</header>
			<section className="bg-white dark:bg-slate-900 rounded-2xl shadow border border-slate-200 dark:border-slate-800 p-8 max-w-5xl mx-auto">
				<FlashMessage message={message} />
				{monitoreo && (
					<div className="space-y-6">
						<div className="flex items-center justify-between gap-3">
							<h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">
								Monitoreo #
							</h2>
						</div>
					</div>
				)}
			</section>
		</div>
	);
}
