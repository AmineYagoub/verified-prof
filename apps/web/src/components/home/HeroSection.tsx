import { WordFlipper } from './WordFlipper';

export const HeroSection = () => (
  <section className="text-center py-12 mt-12">
    <h1 className="text-5xl md:text-7xl font-bold">
      Profiles Should Be
      <br />
      <WordFlipper
        words={['Verified', 'Proof-Based', 'Trusted', 'Automated', 'Spoked']}
      />
    </h1>

    <p className="text-xl text-base-content/70 max-w-2xl mx-auto">
      A living, verifiable profile that updates with every commit.
      <br />
      Your AI vTwin proves what you’ve actually built.
    </p>
  </section>
);
