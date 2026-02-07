import React from 'react';

const CtaSection = () => {
  return (
    <section className="my-14 max-w-3xl mx-auto text-center">
      <h3 className="text-3xl md:text-4xl font-bold text-center">
        AI won't take your job
      </h3>
      <p className="text-base-content/60 text-center mb-12 max-w-2xl mx-auto">
        We help you get the one you deserve.
      </p>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="card bg-base-200 shadow-xl hover:shadow-2xl transition">
          <div className="card-body items-center text-center gap-4">
            <h3 className="card-title text-xl font-bold">
              Connect your accounts
            </h3>
            <p className="text-base-content/70">
              Sign in with GitHub and other providers. We verify ownership and
              import your real activity automatically.
            </p>
            <button className="btn btn-primary btn-sm mt-4 min-w-[150px]">
              Connect now
            </button>
          </div>
        </div>

        <div className="card bg-base-200 shadow-xl hover:shadow-2xl transition">
          <div className="card-body items-center text-center gap-4">
            <h3 className="card-title text-xl font-bold">
              Turn activity into proof
            </h3>
            <p className="text-base-content/70">
              We analyze commits, PRs, and projects to build a trusted,
              proof-based engineering profile.
            </p>
            <button className="btn btn-primary btn-sm mt-4 min-w-[150px]">
              See how it works
            </button>
          </div>
        </div>

        <div className="card bg-base-200 shadow-xl hover:shadow-2xl transition">
          <div className="card-body items-center text-center gap-4">
            <h3 className="card-title text-xl font-bold">
              Get discovered faster
            </h3>
            <p className="text-base-content/70">
              Share your live profile or let your AI Twin speak for you.
              Recruiters see verified skills, not claims.
            </p>
            <button className="btn btn-primary btn-sm mt-4 min-w-[150px]">
              Create profile
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;
