import React from 'react';
import { Link } from 'react-router-dom';
import { SpotlightCard } from './ui/SpotlightCard';

interface FeatureCardProps {
  to: string;
  icon: React.ReactNode;
  title: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ to, icon, title }) => (
  <Link
    to={to}
    className="group focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 rounded-xl"
  >
    <SpotlightCard className="flex flex-col items-center p-7 text-center h-full">
      <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-primary-50 text-primary-600 mb-4 group-hover:bg-primary-100 group-hover:scale-110 transition-all duration-200">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-[#091e42] group-hover:text-[#ed3b91] transition-colors">
        {title}
      </h3>
    </SpotlightCard>
  </Link>
);
