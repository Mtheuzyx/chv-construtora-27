import React, { useMemo, useState, useEffect, memo, useRef, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';

interface VirtualizedTableProps<T> {
  data: T[];
  rowHeight: number;
  containerHeight: number;
  renderRow: (item: T, index: number) => React.ReactNode;
  headers: React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
}

export function VirtualizedTable<T>({
  data,
  rowHeight,
  containerHeight,
  renderRow,
  headers,
  keyExtractor
}: VirtualizedTableProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastScrollTop = useRef(0);

  // Otimizar cálculo do range visível
  const visibleRange = useMemo(() => {
    const overscan = 3; // Reduzir overscan para melhor performance
    const baseStart = Math.floor(scrollTop / rowHeight);
    const visibleCount = Math.ceil(containerHeight / rowHeight) + 1;
    const startIndex = Math.max(0, baseStart - overscan);
    const endIndex = Math.min(data.length, baseStart + visibleCount + overscan);
    return { startIndex, endIndex };
  }, [scrollTop, rowHeight, containerHeight, data.length]);

  const visibleItems = useMemo(() => {
    return data.slice(visibleRange.startIndex, visibleRange.endIndex);
  }, [data, visibleRange]);

  const totalHeight = data.length * rowHeight;
  const offsetY = visibleRange.startIndex * rowHeight;

  // Otimizar handler de scroll com throttling
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const currentScrollTop = e.currentTarget.scrollTop;
    
    // Evitar atualizações desnecessárias
    if (Math.abs(currentScrollTop - lastScrollTop.current) < 5) {
      return;
    }
    
    lastScrollTop.current = currentScrollTop;
    
    if (rafRef.current == null) {
      rafRef.current = requestAnimationFrame(() => {
        setScrollTop(currentScrollTop);
        rafRef.current = null;
      });
    }
  }, []);

  // Cleanup do RAF
  useEffect(() => {
    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  // Scroll suave para o topo quando necessário
  const scrollToTop = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }, []);

  // Reset scroll quando dados mudam
  useEffect(() => {
    if (scrollRef.current && scrollTop > 0) {
      scrollToTop();
    }
  }, [data.length, scrollToTop]);

  return (
    <div
      ref={scrollRef}
      className="overflow-auto scroll-container"
      style={{ 
        height: containerHeight,
        position: 'relative'
      }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
            {headers}
          </TableHeader>
          <TableBody 
            style={{ 
              transform: `translateY(${offsetY}px)`, 
              willChange: 'transform',
              position: 'relative'
            }}
          >
            {visibleItems.map((item, index) => (
              <TableRow 
                key={keyExtractor(item, visibleRange.startIndex + index)}
                className="hover:bg-muted/50 transition-colors duration-150"
                style={{ height: rowHeight }}
              >
                {renderRow(item, visibleRange.startIndex + index)}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Indicador de scroll para melhor UX */}
      {scrollTop > 100 && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-4 right-4 z-50 p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-all duration-200 opacity-80 hover:opacity-100"
          title="Voltar ao topo"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}
    </div>
  );
}