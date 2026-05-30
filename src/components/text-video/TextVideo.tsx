const DEFAULT_GIF =
  'https://i.pinimg.com/originals/80/b7/5e/80b75eb774b647c67b2efa531b57ba13.gif';

type Props = {
  children: React.ReactNode;
  gifUrl?: string;
  className?: string;
};

export default function TextVideo({ children, gifUrl = DEFAULT_GIF, className = '' }: Props) {
  return (
    <div
      className={`bg-clip-text text-transparent ${className}`}
      style={{
        backgroundImage: `url('${gifUrl}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {children}
    </div>
  );
}
