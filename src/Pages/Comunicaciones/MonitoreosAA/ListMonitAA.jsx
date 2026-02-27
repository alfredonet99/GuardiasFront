import { privateInstance } from "../../../api/axios";
import SearchInputLong from "../../../components/UI/Search/SearchLong";
import {
	IconCreate,
	IconDelete,
	IconEdit,
	IconShow,
} from "../../../components/icons/Crud/exportCrud";
export default function ListMonitAA() {
	return (
		<div className="min-h-screen w-full bg-slate-100 dark:bg-slate-950 px-6 py-6 text-slate-800 dark:text-slate-200">
			<header className="mb-6 flex items-center justify-between">
				<h1 className="px-2 text-2xl font-bold text-slate-800 dark:text-slate-100">
					Lista Monitoreos Redes
				</h1>
			</header>

			<section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
				<div className="mb-4 flex flex-col gap-3">
					<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
						<div className="relative w-full md:max-w-lg">
							<SearchInputLong />
						</div>
						<div className="flex items-center gap-3">
							<span className="text-xs text-slate-500 dark:text-slate-400"></span>

							<IconCreate
								label="Monitoreo"
								to="/comunicaciones/monitoreos-aa/crear"
							/>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
