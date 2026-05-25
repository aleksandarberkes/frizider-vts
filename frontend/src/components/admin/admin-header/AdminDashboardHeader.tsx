import { ReactNode } from 'react';

type AdminDashboardHeaderProps = {
  refreshAction: ReactNode;
};

function AdminDashboardHeader({ refreshAction }: AdminDashboardHeaderProps) {
  return (
    <div className="admin-dashboard-header">
      <div>
        <p className="admin-dashboard-eyebrow">Administracija</p>
        <h1>Admin kontrolna tabla</h1>
        <p>Dashboard sada pokriva kategorije, odobravanje recepata i moderaciju komentara.</p>
      </div>
      <div className="admin-dashboard-actions">{refreshAction}</div>
    </div>
  );
}

export default AdminDashboardHeader;
