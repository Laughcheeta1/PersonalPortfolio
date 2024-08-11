import {NavLink} from "react-router-dom";

const activeProperties: string = "text-blue-500 text-shadow-yellow";

const Navbar = () => {
    return (
        <header className={"header"}>
            <NavLink to={"/"} className={"w-10 h-10 rounded-lg bg-white items-center justify-center flex font-bold " +
                "shadow-md" }>
                <p className={"blue-gradient_text"}>SYM</p>
            </NavLink>
            <nav className={"flex text-lg gap-7 font-medium"}>
                <NavLink to={"/"} className={({ isActive }) => {
                        return isActive ? activeProperties : "text-black"
                    }
                }>
                    Home
                </NavLink>
                <NavLink to={"/about"} className={({ isActive }) => {
                        return isActive ? activeProperties : "text-black"
                    }
                }>
                    About
                </NavLink>
                <NavLink to={"/projects"} className={({ isActive }) => {
                        return isActive ? activeProperties : "text-black"
                    }
                }>
                    Projects
                </NavLink>
                <NavLink to={"/contact"} className={({ isActive }) => {
                        return isActive ? activeProperties : "text-black"
                    }
                }>
                    Contact Me
                </NavLink>
            </nav>
        </header>
    )
};

export default Navbar