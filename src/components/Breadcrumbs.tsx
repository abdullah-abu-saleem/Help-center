import React from 'react';
import { Link } from 'react-router-dom';
import { BreadcrumbItem } from '../types';
import { useI18n } from '../lib/i18n';

interface Props {
  items: BreadcrumbItem[];
}

export const Breadcrumbs: React.FC<Props> = ({ items }) => {
  const { dir } = useI18n();
  const isRtl = dir === 'rtl';

  return (
    <nav className="flex items-center text-sm text-slate-500 mb-6 overflow-x-auto whitespace-nowrap">
      <Link to="/help" className="hover:text-primary-600 transition-colors">String</Link>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <span className="mx-2 text-slate-300">{'/'}</span>
          {index === items.length - 1 ? (
            <span className="font-medium text-[#091e42] truncate max-w-[200px]">{item.label}</span>
          ) : (
            <Link to={item.path} className="hover:text-primary-600 transition-colors truncate max-w-[150px]">
              {item.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};