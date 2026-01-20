import {
  SiGithub,
  SiGitlab,
  SiBitbucket,
} from '@icons-pack/react-simple-icons';
import { GitHubConnectButton } from './connect/GitHubConnect';

const PLATFORMS = [
  {
    name: 'Connect GitHub',
    icon: SiGithub,
    button: (
      <GitHubConnectButton className='btn-primary btn-sm' text='Connect' />
    ),
  },
  {
    name: 'Connect GitLab',
    icon: SiGitlab,
    button: (
      <button className='btn btn-primary btn-sm' disabled>
        Connect
      </button>
    ),
  },
  {
    name: 'Connect Bitbucket',
    icon: SiBitbucket,
    button: (
      <button className='btn btn-primary btn-sm' disabled>
        Connect
      </button>
    ),
  },
] as const;

export const ConnectionCard = ({
  icon: Icon,
  name,
  button,
}: (typeof PLATFORMS)[number]) => (
  <article className='card card-compact bg-base-100 shadow-xl w-60 border border-base-300 card-noisy hover-3d text-white bg-[radial-gradient(circle_at_bottom_left,#ffffff04_35%,transparent_36%),radial-gradient(circle_at_top_right,#ffffff04_35%,transparent_36%)] bg-size-[4.95em_4.95em]'>
    <figure className='px-10 pt-4'>
      <div className='p-4 rounded-full bg-base-200'>
        <Icon className='w-12 h-12' />
      </div>
    </figure>
    <div className='card-body items-center text-center'>
      <h2 className='card-title'>{name}</h2>
      <div className='card-actions my-4'>{button}</div>
    </div>
  </article>
);

export const ConnectionCards = () => (
  <div className='grid grid-cols-1 md:grid-cols-3 gap-2 max-w-3xl mx-auto pt-8'>
    {PLATFORMS.map((platform) => (
      <ConnectionCard key={platform.name} {...platform} />
    ))}
  </div>
);
