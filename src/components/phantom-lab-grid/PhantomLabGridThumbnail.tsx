/**
 * Server-rendered thumbnail for the Phantom Lab Grid project card on the
 * homepage. Plays a short looping screen capture of the live WebGL grid
 * so the card previews the real interaction without spawning a WebGL
 * context inside every homepage tile.
 */
export default function PhantomLabGridThumbnail() {
  return (
    <video
      src="/videos/phantom-lab-grid.mp4"
      className="object-cover aspect-[8/5] w-full object-top rounded shadow bg-black"
      autoPlay
      loop
      muted
      playsInline
      preload="metadata"
      disablePictureInPicture
    />
  );
}
