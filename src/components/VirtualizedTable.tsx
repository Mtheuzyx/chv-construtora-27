import React, { useMemo, useState, useEffect, memo } from 'react';
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

  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / rowHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / rowHeight) + 1,
      data.length
    );
    return { startIndex, endIndex };
  }, [scrollTop, rowHeight, containerHeight, data.length]);

  const visibleItems = useMemo(() => {
    return data.slice(visibleRange.startIndex, visibleRange.endIndex);
  }, [data, visibleRange]);

  const totalHeight = data.length * rowHeight;
  const offsetY = visibleRange.startIndex * rowHeight;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div
      className="overflow-auto"
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            {headers}
          </TableHeader>
          <TableBody style={{ transform: `translateY(${offsetY}px)` }}>
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