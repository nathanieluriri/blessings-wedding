import CurtainScroll from "./components/CurtainScroll";
import OpeningSequence from "./components/OpeningSequence";
import Countdown from "./components/sections/Countdown";
import ScratchReveal from "./components/sections/ScratchReveal";
import Itinerary from "./components/sections/Itinerary";
import Location from "./components/sections/Location";
import DressCode from "./components/sections/DressCode";
import Hashtag from "./components/sections/Hashtag";
import RSVP from "./components/sections/RSVP";
import ThankYou from "./components/sections/ThankYou";

export default function Home() {
  return (
    <main className="relative bg-[color:var(--cream)]">
      <CurtainScroll />
      <Countdown />
      <ScratchReveal />
      <Itinerary />
      <Location />
      <DressCode />
      <Hashtag />
      <RSVP />
      <ThankYou />
      <OpeningSequence />
    </main>
  );
}
