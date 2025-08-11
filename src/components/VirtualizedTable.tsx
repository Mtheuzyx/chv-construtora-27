import React, { useMemo, useState, useEffect, memo, useRef } from 'react';
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
  const scrollRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const visibleRange = useMemo(() => {
    const overscan = 5;
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

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    scrollRef.current = e.currentTarget.scrollTop;
    if (rafRef.current == null) {
      rafRef.current = requestAnimationFrame(() => {
        setScrollTop(scrollRef.current);
        rafRef.current = null;
      });
    }
  };

  return (
    <div
      className="overflow-auto scroll-smooth"
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            {headers}
          </TableHeader>
          <TableBody style={{ transform: `translateY(${offsetY}px)`, willChange: 'transform' }}>
            {visibleItems.map((item, index) => (
              <TableRow key={keyExtractor(item, visibleRange.startIndex + index)}>
                {renderRow(item, visibleRange.startIndex + index)}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}