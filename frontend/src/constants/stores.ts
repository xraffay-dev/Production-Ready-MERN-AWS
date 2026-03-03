import { Store } from "../types";
import alFatahLogo from "../data/al-fatah-logo-1.jpg";
import jalalSonsLogo from "../data/jalal-sons-logo1.jpg";
import metroLogo from "../data/metro-logo-1.png";
import rahimStoreLogo from "../data/rahim-store-logo-1.jpg";
import rajaSahibLogo from "../data/raja-sahib-logo-1.jpg";

export const stores: Store[] = [
    {
        id: "1",
        name: "Al-Fatah",
        logo: alFatahLogo,
        path: "/stores/al-fatah",
    },
    {
        id: "2",
        name: "Metro",
        logo: metroLogo,
        path: "/stores/metro",
    },
    {
        id: "3",
        name: "Jalal Sons",
        logo: jalalSonsLogo,
        path: "/stores/jalal-sons",
    },
    {
        id: "4",
        name: "Raja Sahib",
        logo: rajaSahibLogo,
        path: "/stores/raja-sahib",
    },
    {
        id: "5",
        name: "Rahim Store",
        logo: rahimStoreLogo,
        path: "/stores/rahim-store",
    },
];
