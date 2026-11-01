import { createElement } from 'react';
import { iconoVacio } from '../../shared/utils/iconos';

interface EmptyStateProps {
  title: string;
  description?: string;
}

export default function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="empty-state" role="status">
      {createElement(iconoVacio(title), { className: 'empty-state__icono', size: 34, strokeWidth: 1.5, 'aria-hidden': true })}
      <strong>{title}</strong>
      {description && <p>{description}</p>}
    </div>
  );
}
