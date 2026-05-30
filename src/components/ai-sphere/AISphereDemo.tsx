import AISphere from './AISphere';

type Props = {
  compact?: boolean;
};

export default function AISphereDemo({ compact }: Props) {
  if (compact) {
    return (
      <div className="relative w-full h-full">
        <AISphere autoCycle compact />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[26rem]">
      <AISphere showSwatches />
    </div>
  );
}
