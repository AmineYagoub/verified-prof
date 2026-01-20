import { WordFlipper } from './WordFlipper';

export const HeroSection = () => (
  <section className="space-y-8">
    <div className="space-y-4">
      <h1 className="text-5xl md:text-7xl font-bold leading-tight">
        Land your next role
      </h1>
      <h2 className="text-3xl md:text-4xl font-semibold text-primary">
        <WordFlipper
          words={[
            'With Zero Resume Maintenance',
            'And Skip the Cover Letter',
            'And No Interview Anxiety',
            'Blind & Private',
            'Always Online',
          ]}
          interval={3000}
        />
      </h2>
      <p className="text-xl text-base-content/70 max-w-2xl mx-auto">
        Stop rewriting your life story for every application. Your
        Verified Profile automatically adapts to the specific needs of
        the recruiter.
      </p>
    </div>
  </section>
);
