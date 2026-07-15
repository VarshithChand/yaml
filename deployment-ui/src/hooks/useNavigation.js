import { useContext } from "react";
import { NavigationContext } from "../context/NavigationContext";

export default function useNavigation(){

    return useContext(NavigationContext);

}
