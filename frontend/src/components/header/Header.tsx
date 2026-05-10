import "./Header.css";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const Header = () => {
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	useEffect(() => {
		const desktopMediaQuery = window.matchMedia("(min-width: 1024px)");

		const closeMobileMenuOnDesktop = (
			event: MediaQueryListEvent | MediaQueryList,
		) => {
			if (event.matches) {
				setIsMenuOpen(false);
			}
		};

		closeMobileMenuOnDesktop(desktopMediaQuery);
		desktopMediaQuery.addEventListener("change", closeMobileMenuOnDesktop);

		return () => {
			desktopMediaQuery.removeEventListener("change", closeMobileMenuOnDesktop);
		};
	}, []);

	const toggleMenu = () => {
		setIsMenuOpen((prev) => !prev);
	};

	const mobileNavClass = isMenuOpen
		? "mobile-navigation mobile-navigation--open"
		: "mobile-navigation";

	return (
		<nav className="navbar">
			<div className="navbar-container">
				<div className="navbar-inner">
					<Link to="/" className="navbar-logo">
						<img
							className="navbar-logo-image"
							src="/images/logo.png"
							alt="Moj Frižider"
						/>
						<span className="navbar-logo-text">Moj Frižider</span>
					</Link>

					<div className="desktop-navigation">
						<Link to="/" className="nav-link">
							<img src="/icons/home-icon.svg" alt="Home page icon" />
							<p>Početna</p>
						</Link>

						<Link to="/recipes" className="nav-link">
							<img src="/icons/recepies-icon.svg" alt="Recipes icon" />
							<span>Recepti</span>
						</Link>

						<Link to="/favorites" className="nav-link">
							<img src="/icons/fav-icon.svg" alt="Favorites icon" />
							<span>Omiljeni</span>
						</Link>

						<Link to="/fridge" className="nav-link">
							<img src="/icons/fridge-icon.svg" alt="Fridge icon" />
							<span>Moj frižider</span>
						</Link>
					</div>

					<div className="desktop-auth-buttons">
						<a href="/login" className="btn btn-ghost">
							Prijava
						</a>
						<a href="/register" className="btn btn-primary">
							Registracija
						</a>
					</div>

					<button
						onClick={toggleMenu}
						className={`mobile-menu-button ${isMenuOpen ? "mobile-menu-button--open" : ""}`}
						type="button"
						aria-label={isMenuOpen ? "Close menu" : "Open menu"}
						aria-expanded={isMenuOpen}
					>
						{isMenuOpen ? (
							<img src="/icons/close-icon.svg" alt="Close menu" />
						) : (
							<img src="/icons/menu-icon.svg" alt="Open menu" />
						)}
					</button>
				</div>

				<div className={mobileNavClass}>
					<div className="mobile-navigation-list">
						<Link to="/" className="nav-link">
							<img src="/icons/home-icon.svg" alt="Home page icon" />
							<span>Početna</span>
						</Link>

						<Link to="/recipes" className="nav-link">
							<img src="/icons/recepies-icon.svg" alt="Recipes icon" />
							<span>Recepti</span>
						</Link>

						<Link to="/favorites" className="nav-link">
							<img src="/icons/fav-icon.svg" alt="Favorites icon" />
							<span>Omiljeni</span>
						</Link>

						<Link to="/fridge" className="nav-link">
							<span className="nav-link-icon">
								<img src="/icons/fridge-icon.svg" alt="Fridge icon" />
							</span>
							<span>Moj frižider</span>
						</Link>

						<div className="mobile-divider"></div>

						<Link to="/login" className="btn btn-mobile btn-ghost">
							Prijava
						</Link>
						<Link to="/register" className="btn btn-mobile btn-primary">
							Registracija
						</Link>
					</div>
				</div>
			</div>
		</nav>
	);
};

export default Header;
