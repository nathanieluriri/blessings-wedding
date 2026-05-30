import OpeningSequence from "./components/OpeningSequence";
import Hero from "./components/sections/Hero";
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

export default function Home() {
  return (
    <main className="relative bg-[color:var(--cream)]">
      <Hero />
      <ScratchReveal />
      <Itinerary />
      <Location />
      <DressCode />
      <Hashtag />
      <RSVP />
      <Registry />
      <QnA />
      <Countdown />
      <ThankYou />
      <OpeningSequence />
    </main>
  );
}
