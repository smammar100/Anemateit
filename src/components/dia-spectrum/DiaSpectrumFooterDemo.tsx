import DiaSpectrumFooter from './DiaSpectrumFooter';

type Props = {
  compact?: boolean;
};

export default function DiaSpectrumFooterDemo({ compact }: Props) {
  if (compact) {
    return (
      <div className="relative w-full h-full bg-[#f5f5f5]">
        <DiaSpectrumFooter autoCycle compact />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[26rem]">
      <DiaSpectrumFooter showControls scrollReveal />
    </div>
  );
}
