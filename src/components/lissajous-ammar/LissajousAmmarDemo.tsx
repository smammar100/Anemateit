import LissajousAmmar from './LissajousAmmar';

type Props = {
  compact?: boolean;
};

export default function LissajousAmmarDemo({ compact }: Props) {
  if (compact) {
    return (
      <div className="relative w-full h-full">
        <LissajousAmmar compact />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[26rem]">
      <LissajousAmmar />
    </div>
  );
}
