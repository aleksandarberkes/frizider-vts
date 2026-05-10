import "./registerForm.css";

const RegisterForm = () => {
	return (
		<section className="register-main-container">
			<div className="register-card">
				<header className="register-form-header">
					<h1>Kreirajte Nalog</h1>
					<p>Pridružite se našoj zajednici ljubitelja kuvanja</p>
				</header>

				<form className="register-form">
					<div className="register-row">
						<div className="register-field">
							<label htmlFor="firstName">Ime</label>
							<div className="register-input-wrap">
								<img src="/icons/user-icon.svg" alt="" className="register-input-icon" />
								<input
									className="register-input"
									type="text"
									name="firstName"
									id="firstName"
									placeholder="Marko"
								/>
							</div>
						</div>

						<div className="register-field">
							<label htmlFor="lastName">Prezime</label>
							<input
								className="register-input"
								type="text"
								name="lastName"
								id="lastName"
								placeholder="Marković"
							/>
						</div>
					</div>

					<div className="register-field">
						<label htmlFor="email">Email Adresa</label>
						<div className="register-input-wrap register-input-email">
							<img src="/icons/email-icon.svg" alt="" className="register-input-icon" />
							<input
								className="register-input"
								type="email"
								name="email"
								id="email"
								placeholder="markomarkovic@gmail.com"
							/>
						</div>
					</div>

					<div className="register-field">
						<label htmlFor="password">Lozinka</label>
						<div className="register-input-wrap">
							<img src="/icons/password-icon.svg" alt="" className="register-input-icon" />
							<input
								className="register-input"
								type="password"
								name="password"
								id="password"
								placeholder="••••••••"
							/>
						</div>
					</div>

					<div className="register-field">
						<label htmlFor="confirmPassword">Potvrdite Lozinku</label>
						<div className="register-input-wrap">
							<img src="/icons/password-icon.svg" alt="" className="register-input-icon" />
							<input
								className="register-input"
								type="password"
								name="confirmPassword"
								id="confirmPassword"
								placeholder="••••••••"
							/>
						</div>
					</div>

					<button type="submit" className="register-submit-button">
						Registruj Se
					</button>
				</form>
			</div>
		</section>
	);
};

export default RegisterForm;
