import './RecipesHero.css';

type RecipesHeroProps = {
  onCreateRecipe: () => void;
};

function RecipesHero({ onCreateRecipe }: RecipesHeroProps) {
  return (
    <div className="recipes-hero">
      <div className="recipes-hero__content">
        <p className="recipes-hero__eyebrow">Kolekcija recepata</p>
        <h1>Svi recepti</h1>
        <p className="recipes-hero__subtitle">
          Pregledaj recepte po kategorijama, pretrazi omiljena jela i kao ulogovan korisnik dodaj
          svoj recept, sacuvaj favorite i oceni druga jela.
        </p>
      </div>

      <button type="button" className="recipes-hero__button" onClick={onCreateRecipe}>
        Dodaj recept
      </button>
    </div>
  );
}

export default RecipesHero;
