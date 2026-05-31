import OpeningSequence from "./components/OpeningSequence";
import BackgroundMusic from "./components/BackgroundMusic";
import ScratchReveal from "./components/sections/ScratchReveal";
import Itinerary from "./components/sections/Itinerary";
import Location from "./components/sections/Location";
import DressCode from "./components/sections/DressCode";
import Hashtag from "./components/sections/Hashtag";
import RSVP from "./components/sections/RSVP";
import Registry from "./components/sections/Registry";
import QnA from "./components/sections/QnA";
import Countdown from "./components/sections/Countdown";
import ThankYou from "./components/sections/ThankYou";
import {
  getWeddingDate,
  getWeddingDateISO,
  formatMonthDayOrdinal,
  getVisibleSocialLinks,
} from "@/lib/settings";
import { getActivePublicSong } from "@/lib/music/read";

export default async function Home() {
  const [weddingDateISO, weddingDate, socialLinks, activeSong] =
    await Promise.all([
      getWeddingDateISO(),
      getWeddingDate(),
      getVisibleSocialLinks(),
      getActivePublicSong(),
    ]);
  const monthDay = formatMonthDayOrdinal(weddingDate);

  return (
    <main className="relative bg-[color:var(--cream)]">
      <BackgroundMusic song={activeSong} />
      <OpeningSequence socialLinks={socialLinks} />
      <ScratchReveal />
      <Itinerary />
      <Location />
      <DressCode />
      <Hashtag />
      <RSVP monthDay={monthDay} />
      <Registry />
      <QnA />
      <Countdown weddingDate={weddingDateISO} />
      <ThankYou />
    </main>
  );
}
