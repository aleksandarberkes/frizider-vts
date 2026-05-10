import "./Header.css";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { useAuthModal } from "../../auth/AuthModalContext";

const Header = () => {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const navigate = useNavigate();
	const { user, logout } = useAuth();
	const { openLoginModal } = useAuthModal();

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

	const closeMenu = () => {
		setIsMenuOpen(false);
	};

	const handleProtectedNavigation = (path: string) => {
		closeMenu();

		if (!user) {
			openLoginModal();
			return;
		}

		navigate(path);
	};

	const handleLogout = async () => {
		closeMenu();
		await logout();
		navigate("/");
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

						<button
							type="button"
							className="nav-link nav-link-button"
							onClick={() => handleProtectedNavigation("/fridge")}
						>
							<img src="/icons/fridge-icon.svg" alt="Fridge icon" />
							<span>Moj frižider</span>
						</button>

						{user?.role_name === "admin" ? (
							<Link to="/admin/dashboard" className="nav-link" onClick={closeMenu}>
								<img src="/icons/user-icon.svg" alt="Admin panel icon" />
								<span>Admin panel</span>
							</Link>
						) : null}
					</div>

					<div className="desktop-auth-buttons">
						{user ? (
							<>
								<span className="navbar-user-badge">
									{user.role_name === "admin" ? "Admin" : "Korisnik"}
								</span>
								<button type="button" className="btn btn-ghost" onClick={handleLogout}>
									Odjava
								</button>
							</>
						) : (
							<>
								<button type="button" className="btn btn-ghost" onClick={openLoginModal}>
									Prijava
								</button>
								<Link to="/register" className="btn btn-primary">
									Registracija
								</Link>
							</>
						)}
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
						<Link to="/" className="nav-link" onClick={closeMenu}>
							<img src="/icons/home-icon.svg" alt="Home page icon" />
							<span>Početna</span>
						</Link>

						<Link to="/recipes" className="nav-link" onClick={closeMenu}>
							<img src="/icons/recepies-icon.svg" alt="Recipes icon" />
							<span>Recepti</span>
						</Link>

						<Link to="/favorites" className="nav-link" onClick={closeMenu}>
							<img src="/icons/fav-icon.svg" alt="Favorites icon" />
							<span>Omiljeni</span>
						</Link>

						<button
							type="button"
							className="nav-link nav-link-button"
							onClick={() => handleProtectedNavigation("/fridge")}
						>
							<span className="nav-link-icon">
								<img src="/icons/fridge-icon.svg" alt="Fridge icon" />
							</span>
							<span>Moj frižider</span>
						</button>

						{user?.role_name === "admin" ? (
							<Link to="/admin/dashboard" className="nav-link" onClick={closeMenu}>
								<span className="nav-link-icon">
									<img src="/icons/user-icon.svg" alt="Admin panel icon" />
								</span>
								<span>Admin panel</span>
							</Link>
						) : null}

						<div className="mobile-divider"></div>

						{user ? (
							<>
								<span className="navbar-user-badge navbar-user-badge--mobile">
									Uloga: {user.role_name === "admin" ? "Admin" : "Korisnik"}
								</span>
								<button
									type="button"
									className="btn btn-mobile btn-ghost"
									onClick={handleLogout}
								>
									Odjava
								</button>
							</>
						) : (
							<>
								<button
									type="button"
									className="btn btn-mobile btn-ghost"
									onClick={() => {
										closeMenu();
										openLoginModal();
									}}
								>
									Prijava
								</button>
								<Link
									to="/register"
									className="btn btn-mobile btn-primary"
									onClick={closeMenu}
								>
									Registracija
								</Link>
							</>
						)}
					</div>
				</div>
			</div>
		</nav>
	);
};

export default Header;
