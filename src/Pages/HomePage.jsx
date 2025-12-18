import usePageTitleLabel from "../hooks/PageNames"
import { FiGrid } from "react-icons/fi";
export default function HomePage(){
    usePageTitleLabel("DASHBOARD",FiGrid);
    return(
        <>
        <p>Hola</p>
        </>
    )
}