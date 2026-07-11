import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useAuthModal } from '../auth/AuthModalContext';
import { recipesApi } from '../services/recipesApi';
import { Recipe } from '../components/recipes/types';
import {
  formatPrice,
  getRecipeVisual,
  RECIPE_IMAGE_PLACEHOLDER,
} from '../components/recipes/utils';
import './Home.css';

const features = [
  {
    icon: '/icons/fridge-icon.svg',
    title: 'Moj frižider',
    text: 'Unesi namirnice koje imaš kod kuće i dobij recepte kojima nedostaju najviše 2 sastojka.',
  },
  {
    icon: '/icons/recepies-icon.svg',
    title: 'Recepti po kategorijama',
    text: 'Pretraži i filtriraj recepte po kategorijama, ceni i oceni ostalih korisnika.',
  },
  {
    icon: '/icons/fav-icon.svg',
    title: 'Omiljeni i jelovnik',
    text: 'Sačuvaj omiljene recepte i od njih napravi nedeljni jelovnik po danima.',
  },
  {
    icon: '/icons/user-icon.svg',
    title: 'Ocene i komentari',
    text: 'Oceni recepte i podeli svoje mišljenje kroz komentare sa zajednicom.',
  },
];

const steps = [
  { number: '1', title: 'Registruj se', text: 'Napravi nalog i aktiviraj ga preko linka u e-mailu.' },
  { number: '2', title: 'Popuni frižider', text: 'Dodaj namirnice koje imaš i pretraži šta možeš da skuvaš.' },
  { number: '3', title: 'Kuvaj i deli', text: 'Sačuvaj omiljene, napravi jelovnik i oceni recepte.' },
];

function Home() {
  const { user } = useAuth();
  const { openLoginModal } = useAuthModal();
  const [featured, setFeatured] = useState<Recipe[]>([]);

  useEffect(() => {
    let active = true;
    recipesApi
      .list()
      .then((recipes) => {
        if (!active) {
          return;
        }
        setFeatured(recipes.filter((recipe) => recipe.is_approved).slice(0, 3));
      })
      .catch(() => {
        // The landing page still works without the featured strip.
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="home">
      <section className="home-hero">
        <div className="home-hero-content">
          <p className="home-hero-eyebrow">Moj Frižider</p>
          <h1>
            Skuvaj nešto ukusno od <span>onoga što već imaš</span>
          </h1>
          <p className="home-hero-subtitle">
            Unesi namirnice iz svog frižidera i pronađi recepte koje možeš da
            napraviš odmah. Čuvaj omiljena jela, pravi nedeljni jelovnik i deli
            ocene sa zajednicom.
          </p>

          <div className="home-hero-actions">
            <Link to="/recipes" className="home-btn home-btn-primary">
              Pregledaj recepte
            </Link>
            {user ? (
              <Link to="/fridge/search" className="home-btn home-btn-ghost">
                Otvori moj frižider
              </Link>
            ) : (
              <button type="button" className="home-btn home-btn-ghost" onClick={openLoginModal}>
                Prijavi se
              </button>
            )}
          </div>

          <dl className="home-hero-stats">
            <div>
              <dt>2</dt>
              <dd>sastojka koja smeš da nemaš</dd>
            </div>
            <div>
              <dt>7</dt>
              <dd>dana u nedeljnom jelovniku</dd>
            </div>
            <div>
              <dt>★</dt>
              <dd>ocene i komentari zajednice</dd>
            </div>
          </dl>
        </div>

        <div className="home-hero-visual" aria-hidden="true">
          <img src="/images/logo.png" alt="" className="home-hero-logo" />
          <div className="home-hero-badge home-hero-badge-1">🥕 Imaš sve sastojke!</div>
          <div className="home-hero-badge home-hero-badge-2">🍅 Fali samo 1</div>
        </div>
      </section>

      <section className="home-section">
        <header className="home-section-head">
          <h2>Šta možeš da radiš</h2>
          <p>Sve što ti treba da organizuješ kuvanje na jednom mestu.</p>
        </header>

        <div className="home-features">
          {features.map((feature) => (
            <article key={feature.title} className="home-feature-card">
              <span className="home-feature-icon">
                <img src={feature.icon} alt="" />
              </span>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-section home-steps-section">
        <header className="home-section-head">
          <h2>Kako radi</h2>
          <p>Tri koraka do sledećeg obroka.</p>
        </header>

        <div className="home-steps">
          {steps.map((step) => (
            <article key={step.number} className="home-step">
              <span className="home-step-number">{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      {featured.length > 0 ? (
        <section className="home-section">
          <header className="home-section-head home-section-head-row">
            <div>
              <h2>Izdvojeni recepti</h2>
              <p>Nekoliko predloga da počneš.</p>
            </div>
            <Link to="/recipes" className="home-section-link">
              Svi recepti →
            </Link>
          </header>

          <div className="home-featured">
            {featured.map((recipe) => {
              const visual = getRecipeVisual(recipe);
              return (
                <Link key={recipe.id} to={`/recipes/${recipe.id}`} className="home-featured-card">
                  <div className="home-featured-image">
                    <img
                      src={visual.imageUrl}
                      alt={recipe.name}
                      onError={(event) => {
                        event.currentTarget.src = RECIPE_IMAGE_PLACEHOLDER;
                      }}
                    />
                    {recipe.categories[0]?.name ? (
                      <span className="home-featured-tag">{recipe.categories[0].name}</span>
                    ) : null}
                  </div>
                  <div className="home-featured-body">
                    <h3>{recipe.name}</h3>
                    <p>{recipe.description ?? 'Pogledaj detalje recepta.'}</p>
                    <strong>{formatPrice(recipe.estimated_price)}</strong>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="home-cta">
        <div className="home-cta-inner">
          <h2>{user ? 'Šta ima u frižideru danas?' : 'Spreman za kuvanje?'}</h2>
          <p>
            {user
              ? 'Dodaj namirnice i pusti da ti Moj Frižider predloži recepte.'
              : 'Napravi nalog i počni da čuvaš omiljene recepte i praviš jelovnike.'}
          </p>
          <div className="home-hero-actions">
            {user ? (
              <Link to="/fridge/search" className="home-btn home-btn-primary">
                Otvori moj frižider
              </Link>
            ) : (
              <Link to="/register" className="home-btn home-btn-primary">
                Registruj se
              </Link>
            )}
            <Link to="/recipes" className="home-btn home-btn-ghost">
              Pregledaj recepte
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
