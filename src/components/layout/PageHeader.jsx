import { usePageTitle } from "../context/TitlePage";

export default function PageHeader() {
  const { pageTitle } = usePageTitle();
  const { title, icon: Icon } = pageTitle;

  return (
    <div className="flex items-center gap-3">
      
      {Icon && (
        <Icon className="text-3xl text-slate-700 dark:text-slate-200" />
      )}

      <h1 className="text-3xl font-bold text-slate-700 dark:text-slate-200 transition-colors">
        {title}
      </h1>
    </div>
  );
}
