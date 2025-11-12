import React from 'react';
import { Construction, Clock, CheckCircle } from 'lucide-react';

interface ComingSoonProps {
  title: string;
  description: string;
  features?: string[];
}

export const ComingSoon: React.FC<ComingSoonProps> = ({ title, description, features = [] }) => {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-2xl mx-auto p-8">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Construction className="w-12 h-12 text-primary" />
        </div>
        
        <h2 className="text-3xl font-bold text-foreground mb-4">{title}</h2>
        <p className="text-xl text-muted-foreground mb-8">{description}</p>
        
        {features.length > 0 && (
          <div className="bg-card rounded-lg border border-border p-6 mb-8">
            <h3 className="text-lg font-semibold text-foreground mb-4">Planned Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center text-left">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-center text-primary">
          <Clock className="w-5 h-5 mr-2" />
          <span className="font-medium">Coming Soon</span>
        </div>
      </div>
    </div>
  );
};