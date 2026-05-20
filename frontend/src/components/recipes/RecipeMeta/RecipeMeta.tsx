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
        <div key={`${item.label}-${item.value}`} className={`recipe-meta-item recipe-meta-item-${item.tone ?? 'blue'}`}>
          <span className="recipe-meta-label">{item.label}</span>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}

export default RecipeMeta;
