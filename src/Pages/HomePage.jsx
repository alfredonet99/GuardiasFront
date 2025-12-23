import { FiGrid } from "react-icons/fi";
import usePageTitleLabel from "../hooks/PageNames";
export default function HomePage() {
	usePageTitleLabel("DASHBOARD", FiGrid);
	return <p>Hola</p>;
}
