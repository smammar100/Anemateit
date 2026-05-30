import TextVideo from './TextVideo';

type Props = {
  compact?: boolean;
};

export default function TextVideoDemo({ compact }: Props) {
  if (compact) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-white min-h-[100px]">
        <TextVideo className="text-5xl font-black tracking-tight leading-none select-none">
          ANIMATE
        </TextVideo>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-6 bg-white w-full h-full min-h-[320px] py-16 select-none">
      <TextVideo className="text-8xl font-black tracking-tight leading-none">
        ANIMATE
      </TextVideo>
      <TextVideo className="text-4xl font-bold tracking-widest uppercase">
        Motion
      </TextVideo>
      <TextVideo className="text-2xl font-semibold">
        Web animations, reimagined.
      </TextVideo>
    </div>
  );
}
