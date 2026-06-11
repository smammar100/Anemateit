import Lissajous from './Lissajous';

type Props = {
  compact?: boolean;
};

export default function LissajousDemo({ compact }: Props) {
  if (compact) {
    return (
      <div className="relative w-full h-full">
        <Lissajous compact />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[26rem]">
      <Lissajous />
    </div>
  );
}
