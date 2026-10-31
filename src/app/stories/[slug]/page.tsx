"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { MobileNav } from "@/components/mobile-nav";
import { originalStories } from "@/lib/lifemode/original-stories";

const stories: Record<string, { category: string; title: string; subtitle: string; symbol: string; paragraphs: string[]; reflection: string }> = {
  "the-girl-who-collected-mornings": {
    category: "A LITTLE MAGIC · 4 MIN READ", title: "The Girl Who Collected Mornings", subtitle: "A story about beginning before you're ready.", symbol: "☼",
    paragraphs: [
      "Every morning, before the buses grumbled awake and the first shutters rattled open, Mira climbed to the roof with a notebook and a cup of warm milk. She collected things no one else seemed to notice: the first bird-call, the smell of rain left in the air, a window glowing gold on the opposite building.",
      "She wrote them down because she was afraid of forgetting how the world felt when it was still quiet. The rest of the day always seemed to ask her to be faster, louder, more certain. On the roof, she could simply be curious.",
      "On the last page of her notebook, she had written an idea for a tiny app that helped people save small moments. She had rewritten the first sentence seventeen times. Every version sounded foolish by sunrise.",
      "One morning, the power went out across the street. A little girl stood on a balcony, bored and frowning. Mira waved. The girl waved back. They spent ten minutes naming cloud shapes, then another ten inventing stories about the people who lived in the buildings around them.",
      "When Mira returned downstairs, she opened her laptop and built the smallest possible version of her idea: one button, one blank page, one place to save a moment. It wasn't the finished dream. It was a beginning someone could actually touch.",
      "Months later, she still collected mornings. She had learned that courage rarely arrived as a thunderclap. Sometimes it looked like a quiet roof, a blank page, and the decision to make one small thing real."
    ], reflection: "What is one thing you could begin in a tiny, imperfect version?"
  },
  "the-last-light-in-the-library": {
    category: "MYSTERY · 5 MIN READ", title: "The Last Light in the Library", subtitle: "Some mysteries are invitations.", symbol: "✦",
    paragraphs: [
      "At exactly 8:17 every evening, a light glowed in the top floor of the old library. The building had been closed for years, its windows clouded with dust, its front steps slowly swallowed by ivy.",
      "Noor noticed it while walking home from class. For a week, she told herself it was a timer, or a faulty wire, or a reflection from a passing car. On Friday, carrying a flashlight and more curiosity than sense, she went to the side door.",
      "It wasn't locked. Inside, the air smelled of paper and rain. Her flashlight found shelves, a crooked desk, and a trail of small paper stars leading up the stairs. At the top, the mysterious light came from a desk lamp beside a stack of books.",
      "An elderly woman sat there, repairing the spine of a book with careful hands. She introduced herself as the retired librarian. Each evening, she came to rescue one book from the damp before the building was finally demolished.",
      "Noor looked at the stack. There were hundreds left. The librarian handed her a brush and showed her how to clean a cover without tearing it. They worked until the lamp flickered, and Noor forgot to check her phone even once.",
      "The next evening, Noor returned with two friends. By the following week, the library had become a small volunteer workshop. The light at 8:17 no longer belonged to one person. It was a signal that someone had come back."
    ], reflection: "What quiet thing in your world might be worth showing up for?"
  },
  "a-map-made-of-mistakes": {
    category: "COMING OF AGE · 4 MIN READ", title: "A Map Made of Mistakes", subtitle: "A wrong turn can still teach you the way.", symbol: "⌁",
    paragraphs: [
      "Dev kept a notebook of failed plans. The robot that spun in circles. The presentation that froze. The tiny business idea nobody understood. He drew a red X beside each one, as if the page were a map of places he should never visit again.",
      "One afternoon, after his latest prototype refused to move, he carried the notebook to a park and sat beside a woman painting a city map. Her map had smudges, crossed-out streets, and notes in three different inks.",
      "“Your map is messy,” Dev said. “Of course,” she replied. “I'm making it while I travel.” She showed him how a road that ended at a wall could still reveal where the next road ought to begin.",
      "He opened his notebook. The robot's circles had taught him the wheel encoder was reversed. The frozen presentation had taught him to keep a local copy. The business idea had shown him that he was solving a problem his friends didn't actually have.",
      "The red Xs did not disappear. He added arrows beside them, then questions, then small notes about what he would try next. The page began to look less like a list of failures and more like a place he had explored.",
      "That night, Dev started a new prototype. It failed too. He wrote down what happened, drew an arrow, and kept going. For the first time, the notebook felt like a map leading somewhere."
    ], reflection: "Which past mistake contains a clue you can use now?"
  },
  "the-smallest-planet": {
    category: "SCI-FI · 6 MIN READ", title: "The Smallest Planet", subtitle: "A tiny world can hold a very big question.", symbol: "✧",
    paragraphs: [
      "Asha found the planet while testing a telescope she had built from discarded parts. It was a pinprick of blue beside a star no catalogue listed. The readings made no sense: the planet was barely larger than a house, yet it had clouds, oceans, and a thin ring of silver dust.",
      "She sent a signal. Nothing happened for six days. On the seventh, the telescope printed a message in uneven letters: HELLO. PLEASE DO NOT MAKE US BIGGER.",
      "Asha stared at the screen. She had imagined discovering life, meeting explorers, becoming famous. She had not imagined a whole world asking her for privacy.",
      "She sent back one question: WHY? The answer arrived slowly. Their planet was small because they had chosen to live lightly. Their cities were gardens, their machines borrowed energy only when needed, and their greatest invention was a way to share knowledge without taking more space.",
      "Asha could have published the coordinates and let the world rush toward her discovery. Instead, she recorded the signal privately and wrote a paper about the limits of what scientists should claim as theirs. It was the hardest decision she had made, and almost nobody applauded it.",
      "Years later, she still looked at the little blue dot. She never knew whether its people were real, or whether the strange signal had come from some natural pattern she did not yet understand. She learned to love the question without forcing it to become an answer.",
      "Sometimes discovery means reaching farther. Sometimes it means knowing when to leave a door unopened."
    ], reflection: "Can you stay curious about something without needing to own or solve it?"
  }
};

export default function StoryReaderPage() {
  const params = useParams<{ slug: string }>();
  const story = stories[params.slug] ?? originalStories.find((item) => item.slug === params.slug);
  return <main className="lm-reader min-h-screen pb-28 text-[#f7f1e8] lg:pb-8">
    <header className="lm-story-nav"><Link href="/stories" className="lm-story-brand"><span>L</span> STORY ROOM.</Link><Link href="/play" className="lm-story-nav-link">Take a break · Play ↗</Link></header>
    {!story ? <section className="lm-reader-error"><h1>This story has drifted away.</h1><Link href="/stories">Choose another story ↗</Link></section> : <>
      <section className="lm-reader-hero"><div className="lm-reader-art" aria-hidden="true"><i/><i/><i/><span>{story.symbol}</span></div><p className="lm-story-eyebrow">{story.category}</p><h1>{story.title}</h1><p>{story.subtitle}</p><span className="lm-reader-scroll">SCROLL TO ENTER ↓</span></section>
      <article className="lm-reader-body"><div className="lm-reader-chapter">A LIFEMODE ORIGINAL <span>✦</span></div>{story.paragraphs.map((paragraph, index) => <p key={index} className="lm-reader-paragraph" style={{ animationDelay: (index * 90) + "ms" }}>{paragraph}</p>)}<section className="lm-reader-reflection"><span>✧ A THOUGHT TO KEEP</span><h2>{story.reflection}</h2><p>No need to have the perfect answer. Let the question travel with you.</p></section><div className="lm-reader-end"><span>THE END · FOR NOW</span><h2>Every ending<br/><em>opens a door.</em></h2><div><Link href="/stories">Read another ↗</Link><Link href="/play">Play a little ↗</Link><Link href="/discover">Back to Discover ↗</Link></div></div></article>
    </>}
    <MobileNav/>
  </main>;
}
