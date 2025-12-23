import { useEffect } from "react";
import { usePageTitle } from "../components/context/TitlePage";

export default function usePageTitleLabel(title, icon = null) {
	const { setPageTitle } = usePageTitle();

	useEffect(() => {
		setPageTitle({ title, icon });
	}, [title, icon, setPageTitle]);
}
