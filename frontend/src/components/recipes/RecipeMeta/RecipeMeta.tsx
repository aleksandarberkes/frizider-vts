import './RecipeMeta.css';

type RecipeMetaProps = {
  items: Array<{
    label: string;
    value: string;
    tone?: 'blue' | 'purple' | 'yellow' | 'green';
  }>;
};

function RecipeMeta({ items }: RecipeMetaProps) {
  return (
    <div className="recipe-meta">
      {items.map((item) => (
        <div key={`${item.label}-${item.value}`} className={`recipe-meta__item recipe-meta__item--${item.tone ?? 'blue'}`}>
          <span className="recipe-meta__label">{item.label}</span>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}

export default RecipeMeta;
