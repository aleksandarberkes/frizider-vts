import './adminTabs.css';

export type AdminTabId = 'categories' | 'recipes' | 'comments';

type AdminTabsProps = {
  activeTab: AdminTabId;
  onTabChange: (tab: AdminTabId) => void;
};

const tabs: Array<{ id: AdminTabId; label: string }> = [
  { id: 'categories', label: 'Kategorije' },
  { id: 'recipes', label: 'Recepti' },
  { id: 'comments', label: 'Komentari' },
];

function AdminTabs({ activeTab, onTabChange }: AdminTabsProps) {
  return (
    <nav className="admin-tabs" aria-label="Admin sekcije">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={activeTab === tab.id ? 'admin-tab admin-tab-active' : 'admin-tab'}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

export default AdminTabs;
