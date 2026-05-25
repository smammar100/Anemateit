'use client';
import { useState, Children } from 'react';
import Button from '@/components/fundations/elements/Button';

type Props = {
  children: React.ReactNode;
  initialVisible: number;
  step: number;
};

export default function SitesPreviewClient({ children, initialVisible, step }: Props) {
  const items = Children.toArray(children);
  const [visible, setVisible] = useState(initialVisible);
  return (
    <>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 mt-8">
        {items.slice(0, visible).map((child, i) => (
          <div key={i}>{child}</div>
        ))}
      </div>
      {visible < items.length && (
        <div className="flex justify-center mt-10">
          <Button
            type="button"
            variant="muted"
            size="sm"
            onClick={() => setVisible((v) => v + step)}
            className="px-6"
          >
            Show more
          </Button>
        </div>
      )}
    </>
  );
}
