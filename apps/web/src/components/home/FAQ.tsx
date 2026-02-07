export const FAQ_ITEMS = [
  {
    question: 'What is this exactly?',
    answer:
      'This platform verifies your coding skills and experience by analyzing your real contributions. It creates a live profile showcasing your technical abilities to employers, collaborators, and recruiters.',
  },
  {
    question: 'What exactly is the vTwin?',
    answer:
      'Think of the vTwin as your AI-powered technical representative, built from your real code. It mirrors your skills and experience with high fidelity, acting as your 24/7 proof of expertise.',
    list: [
      {
        title: 'Lives in the Logic',
        description:
          "It doesn't just know you 'know TypeScript'; it understands how you specifically handle asynchronous streams, dependency injection, and real-world patterns because it has analyzed your actual code.",
      },
      {
        title: 'Speaks "Engineer"',
        description:
          'It can discuss your design patterns and architectural choices in real time with recruiters, defending your work as if it were you never nervous, never forgetting a line of code you wrote.',
      },
      {
        title: 'Acts as a Truth Layer',
        description:
          'It cannot claim skills you don’t have. If the code isn’t there, the vTwin won’t invent it, making it a highly trusted entity in the hiring pipeline.',
      },
      {
        title: 'In short',
        description:
          'It’s your technical representative for first-round screenings, ensuring you only spend time on interviews where the company already understands your depth.',
      },
    ],
  },
  {
    question: 'Who is this for?',
    answer:
      "If you write code, or if you're hiring developers, this platform is for you. Students, freelancers, and engineers of all levels can benefit.",
  },
  {
    question: 'Does this replace my CV completely?',
    answer:
      'No. This platform complements your CV by providing a verified and dynamic representation of your skills and contributions. It enhances your profile but does not entirely replace traditional resumes.',
  },
  {
    question: 'How does the verification process work?',
    answer:
      'You sign in with your provider account to prove ownership. We analyze your contributions commits, repositories, and project history and our AI generates a comprehensive, verified profile of your skills.',
  },
  {
    question: 'Is my data secure?',
    answer:
      'Yes. We never access private code or sensitive data without your explicit permission. Your privacy and security are our top priorities.',
  },
  {
    question: 'Is my private code safe?',
    answer:
      'Yes. We only analyze metadata and activity signals. We do not copy, store, or expose private repositories or source code.',
  },
  {
    question: 'How long does verification take?',
    answer:
      'Verification typically takes just a few minutes. Once you connect your account, our system automatically analyzes your contributions and generates your profile.',
  },
  {
    question: 'Can I update my profile?',
    answer:
      'Your profile updates automatically as you make new contributions. We periodically refresh your data to ensure it always reflects your latest work.',
  },
  {
    question: 'Can I connect other platforms besides GitHub?',
    answer:
      'Yes. Currently GitHub is supported, but we plan to add GitLab, Bitbucket, LinkedIn, and more. Your profile will combine all verified activity into one unified view.',
  },
  {
    question: 'Are there limits for free users?',
    answer:
      'Free users can connect one provider and analyze up to a limited number of contributions per month. Premium users unlock multiple providers, unlimited activity analysis, and priority verification.',
  },
];

export const FAQ = () => {
  return (
    <section className="mt-18 max-w-3xl mx-auto text-center">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-2">
        Frequently Asked Questions
      </h2>
      <p className="text-base-content/60 text-center mb-10 max-w-2xl mx-auto">
        Everything you need to know about our platform.
      </p>

      {FAQ_ITEMS.map((item, index) => (
        <div
          key={index}
          tabIndex={0}
          className="collapse collapse-plus bg-base-200 border border-base-300 text-left relative z-1000"
        >
          <div className="collapse-title text-lg font-medium">
            {item.question}
          </div>
          <div className="collapse-content text-base-content/70">
            <p className="mb-4">{item.answer}</p>
            {'list' in item && item.list && (
              <ul className="space-y-3">
                {item.list.map((listItem, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="text-blue-500 font-bold mt-1">•</span>
                    <div>
                      <span className="font-semibold text-base-content">
                        {listItem.title}:
                      </span>{' '}
                      <span>{listItem.description}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ))}
    </section>
  );
};
