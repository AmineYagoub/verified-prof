import {
  SiGithub,
  SiGitlab,
  SiBitbucket,
} from '@icons-pack/react-simple-icons';
import { GitHubConnect } from './GitHubConnect';

const PLATFORMS = [
  {
    name: 'Connect GitHub',
    icon: SiGithub,
    button: <GitHubConnect text="Connect" />,
  },
  {
    name: 'Connect GitLab',
    icon: SiGitlab,
    button: (
      <button className="btn btn-soft btn-sm min-w-[150px]" disabled>
        Coming Soon
      </button>
    ),
  },
  {
    name: 'Connect Bitbucket',
    icon: SiBitbucket,
    button: (
      <button className="btn btn-soft btn-sm min-w-[150px]" disabled>
        Coming Soon
      </button>
    ),
  },
] as const;

export const ConnectionCard = ({
  icon: Icon,
  name,
  button,
}: (typeof PLATFORMS)[number]) => (
  <article className="card card-compact bg-base-100 shadow-xl w-60 border border-base-300 card-noisy hover-3d text-white bg-[radial-gradient(circle_at_bottom_left,#ffffff04_35%,transparent_36%),radial-gradient(circle_at_top_right,#ffffff04_35%,transparent_36%)] bg-size-[4.95em_4.95em]">
    <figure className="px-10 py-4">
      <Icon className="w-12 h-12" />
    </figure>
    <div className="card-body items-center text-center">
      <h2 className="card-title">{name}</h2>
      <div className="card-actions my-4">{button}</div>
    </div>
  </article>
);

export const ConnectionCards = () => (
  <section className="flex flex-col items-center pt-8 relative z-1000">
    <div className="relative mb-4 w-full max-w-4xl">
      <div className="flex items-center gap-4">
        <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent to-white/40" />
        <h2 className="text-xl font-medium whitespace-nowrap">
          Connect once. Stay verified
        </h2>
        <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent to-white/40" />
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 max-w-3xl mx-auto">
      {PLATFORMS.map((platform) => (
        <ConnectionCard key={platform.name} {...platform} />
      ))}
    </div>
  </section>
);
