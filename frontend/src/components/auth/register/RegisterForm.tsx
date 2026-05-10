import "./registerForm.css";
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, ApiError } from "../../../api";
import { useAuth } from "../../../auth/AuthContext";

const RegisterForm = () => {
	const navigate = useNavigate();
	const { login } = useAuth();
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setError(null);
		setSuccessMessage(null);

		if (password !== confirmPassword) {
			setError("Lozinke se ne poklapaju.");
			return;
		}

		setSubmitting(true);

		try {
			await api.post("/api/auth/register", {
				email,
				password,
				first_name: firstName.trim(),
				last_name: lastName.trim(),
			});
			await login(email, password);
			setSuccessMessage("Nalog je uspešno kreiran.");
			navigate("/");
		} catch (err) {
			if (err instanceof TypeError) {
				setError("Backend nije dostupan na http://localhost/frizider-vts/backend.");
			} else if (err instanceof ApiError || err instanceof Error) {
				setError(err.message);
			} else {
				setError("Registracija nije uspela.");
			}
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<section className="register-main-container">
			<div className="register-card">
				<header className="register-form-header">
					<h1>Kreirajte Nalog</h1>
					<p>Pridružite se našoj zajednici ljubitelja kuvanja</p>
				</header>

				<form className="register-form" onSubmit={handleSubmit}>
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
									value={firstName}
									onChange={(event) => setFirstName(event.target.value)}
									autoComplete="given-name"
									required
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
								value={lastName}
								onChange={(event) => setLastName(event.target.value)}
								autoComplete="family-name"
								required
							/>
						</div>
					</div>

					<div className="register-field">
						<label htmlFor="email">Email Adresa</label>
						<div className="register-input-wrap">
							<img src="/icons/email-icon.svg" alt="" className="register-input-icon" />
							<input
								className="register-input"
								type="email"
								name="email"
								id="email"
								placeholder="markomarkovic@gmail.com"
								value={email}
								onChange={(event) => setEmail(event.target.value)}
								autoComplete="email"
								required
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
								value={password}
								onChange={(event) => setPassword(event.target.value)}
								autoComplete="new-password"
								minLength={6}
								required
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
								value={confirmPassword}
								onChange={(event) => setConfirmPassword(event.target.value)}
								autoComplete="new-password"
								minLength={6}
								required
							/>
						</div>
					</div>

					{error ? <p className="register-form-message register-form-error">{error}</p> : null}
					{successMessage ? (
						<p className="register-form-message register-form-success">{successMessage}</p>
					) : null}

					<button type="submit" className="register-submit-button" disabled={submitting}>
						{submitting ? "Kreiranje naloga..." : "Registruj Se"}
					</button>
				</form>
			</div>
		</section>
	);
};

export default RegisterForm;
