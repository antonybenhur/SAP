import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { KPI } from '../../types';

interface KPICardProps {
  kpi: KPI;
}

export const KPICard: React.FC<KPICardProps> = ({ kpi }) => {
  const formatValue = (value: number | string, format: KPI['format']) => {
    if (typeof value === 'string') return value;
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(value);
      case 'percentage':
        return `${value}%`;
      case 'days':
        return `${value} days`;
      default:
        return value.toLocaleString();
    }
  };

  const getTrendIcon = () => {
    switch (kpi.trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTrendColor = () => {
    switch (kpi.trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="bg-card p-6 rounded-lg border border-border hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {kpi.name}
          </p>
          <p className="text-2xl font-bold text-foreground mt-2">
            {formatValue(kpi.value, kpi.format)}
          </p>
        </div>
        
        {kpi.trend && (
          <div className="flex items-center ml-4">
            {getTrendIcon()}
          </div>
        )}
      </div>
      
      {kpi.change !== undefined && (
        <div className="mt-4 flex items-center">
          <span className={`text-sm font-medium ${getTrendColor()}`}>
            {kpi.change > 0 ? '+' : ''}{kpi.change}%
          </span>
          <span className="text-sm text-muted-foreground ml-2">vs last month</span>
        </div>
      )}
    </div>
  );
};