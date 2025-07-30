import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface LoadingSkeletonProps {
  type?: 'cards' | 'table' | 'filters';
  count?: number;
}

export function LoadingSkeleton({ type = 'cards', count = 4 }: LoadingSkeletonProps) {
  if (type === 'cards') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
        {Array.from({ length: count }).map((_, i) => (
          <Card key={i} className="hover-lift">
            <CardContent className="p-4">
              <div className="skeleton h-8 w-24 mb-2"></div>
              <div className="skeleton h-4 w-16"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="space-y-3 animate-fade-in">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
            <div className="skeleton h-4 w-32"></div>
            <div className="skeleton h-4 w-16"></div>
            <div className="skeleton h-4 w-20"></div>
            <div className="skeleton h-4 w-24"></div>
            <div className="skeleton h-4 w-20"></div>
            <div className="skeleton h-6 w-16"></div>
            <div className="skeleton h-8 w-20"></div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'filters') {
    return (
      <Card className="animate-fade-in">
        <CardHeader>
          <div className="skeleton h-6 w-32"></div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="skeleton h-4 w-20"></div>
                <div className="skeleton h-10 w-full"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}