import { useEffect, useState } from 'react';

// Port of preloader.js. Shown once when the app first loads (in a SPA there are no further full page loads).
const FACTS = [
  'Did you know? Indian Railways is the 4th largest rail network in the world.',
  'Trivia: The first train in India ran on 16th April 1853 between Mumbai and Thane.',
  'Fact: IRCTC books over 800,000 tickets every single day!',
  "Wow! The Gorakhpur Railway Station has the world's longest platform (1,366m).",
  "Did you know? The 'Fairy Queen' is the oldest working steam engine in the world.",
  "Trivia: Indian Railways has a mascot named 'Bholu', the guard elephant.",
  'Fact: The Vivek Express covers the longest route: 4,273 km from Dibrugarh to Kanyakumari.',
  'Amazing: Indian Railways carries over 23 million passengers daily (Population of Australia!)',
  'History: The Chhatrapati Shivaji Maharaj Terminus is a UNESCO World Heritage Site.',
  "Tech: IRCTC's website handles over 300,000 concurrent users during Tatkal hours.",
];

export default function Preloader() {
  const [fact] = useState(() => FACTS[Math.floor(Math.random() * FACTS.length)]);
  const [phase, setPhase] = useState('show'); // show -> fade -> gone

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('fade'), 3000);
    const t2 = setTimeout(() => setPhase('gone'), 3800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (phase === 'gone') return null;
  return (
    <div id="preloader" style={{ opacity: phase === 'fade' ? 0 : 1 }} onClick={() => setPhase('fade')} role="status">
      <div className="loader-container">
        <div className="ring ring-one" />
        <div className="ring ring-two" />
        <img src="/assets/images/IRCTC.jpg" className="loader-logo" alt="Loading..." />
      </div>
      <div className="loading-text">{fact}</div>
    </div>
  );
}
