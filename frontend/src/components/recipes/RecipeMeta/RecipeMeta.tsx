import './RecipeMeta.css';

type RecipeMetaProps = {
  items: Array<{
    label: string;
    value: string;
    category?: string;
    tone?: 'blue' | 'purple' | 'yellow' | 'green' | 'category';
  }>;
};

function RecipeMeta({ items }: RecipeMetaProps) {
  return (
    <div className="recipe-meta">
      {items.map((item) => (
        <div
          key={`${item.label}-${item.category ?? item.value}`}
          className={`recipe-meta-item recipe-meta-item-${item.tone ?? 'blue'}`}
        >
          <span className="recipe-meta-label">{item.label}</span>
          <strong>{item.tone === 'category' ? item.category ?? item.value : item.value}</strong>
        </div>
      ))}
    </div>
  );
}

export default RecipeMeta;
