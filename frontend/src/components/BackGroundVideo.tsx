import { POSTER_SRC, VIDEO_SRC } from "../constants";

type GlobeVideoProps = { id: string; active?: boolean };

function GlobeVideo({ id, active = false }: GlobeVideoProps) {
  return (
    <video
      className={active ? "bg-video is-active" : "bg-video"}
      id={id}
      autoPlay={active}
      muted
      loop
      playsInline
      preload="auto"
      disablePictureInPicture
      aria-hidden="true"
      poster={POSTER_SRC}
    >
      <source src={VIDEO_SRC} type="video/mp4" />
    </video>
  );
}

export function BackgroundVideo() {
  return (
    <div
      className="bg"
      role="img"
      aria-label="Stylised globe of Earth rendered as a purple dot matrix against a starfield, slowly rotating"
    >
      <GlobeVideo id="bgVideoA" active />
      <GlobeVideo id="bgVideoB" />
    </div>
  );
}