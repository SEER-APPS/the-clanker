"use client";

export function AdminPageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}): React.ReactElement {
  return (
    <header>
      <h1 className="admin-page-title">{title}</h1>
      {subtitle ? <p className="admin-page-sub">{subtitle}</p> : null}
    </header>
  );
}

