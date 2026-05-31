import OpeningSequence from "./components/OpeningSequence";
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

export default async function Home() {
  const [weddingDateISO, weddingDate, socialLinks] = await Promise.all([
    getWeddingDateISO(),
    getWeddingDate(),
    getVisibleSocialLinks(),
  ]);
  const monthDay = formatMonthDayOrdinal(weddingDate);

  return (
    <main className="relative bg-[color:var(--cream)]">
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
