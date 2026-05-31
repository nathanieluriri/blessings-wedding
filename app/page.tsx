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
  getRsvpDeadline,
  formatMonthDayOrdinal,
  formatNumericPeriods,
  formatLongDate,
  formatRevealParts,
  getVisibleSocialLinks,
} from "@/lib/settings";
import { getActivePublicSong } from "@/lib/music/read";

export default async function Home() {
  const [weddingDateISO, weddingDate, rsvpDeadlineDate, socialLinks, activeSong] =
    await Promise.all([
      getWeddingDateISO(),
      getWeddingDate(),
      getRsvpDeadline(),
      getVisibleSocialLinks(),
      getActivePublicSong(),
    ]);
  // Every public date string is derived from the backend values above, so the
  // reveal, thank-you card, countdown, RSVP and Q&A can never drift apart.
  const monthDay = formatMonthDayOrdinal(weddingDate);
  const revealParts = formatRevealParts(weddingDate);
  const numericDate = formatNumericPeriods(weddingDate);
  const rsvpDeadline = formatLongDate(rsvpDeadlineDate);

  return (
    <main className="relative bg-[color:var(--cream)]">
      <BackgroundMusic song={activeSong} />
      <OpeningSequence socialLinks={socialLinks} />
      <ScratchReveal
        day={revealParts.day}
        month={revealParts.month}
        year={revealParts.year}
      />
      <Itinerary />
      <Location />
      <DressCode />
      <Hashtag />
      <RSVP monthDay={monthDay} rsvpDeadline={rsvpDeadline} />
      <Registry />
      <QnA rsvpDeadline={rsvpDeadline} />
      <Countdown weddingDate={weddingDateISO} />
      <ThankYou numericDate={numericDate} />
    </main>
  );
}
