# Coding Rules - VerifiedProf

## React Components

- **ALWAYS use arrow functions** for components (NEVER function declarations)
- **NEVER add comments** inside React component code (keep code self-explanatory)
- **Use semantic HTML** (proper `<form>`, `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, etc.)
- Keep components small and focused
- Use functional components with hooks
- Separate presentational and container components
- Use TypeScript for all components

## File Naming Conventions

- **kebab-case** for hooks, services, utilities
  - Examples: `auth.service.ts`, `use-user.hook.tsx`, `api-client.ts`
  - Test files: `auth.service.spec.ts`, `user-profile.test.tsx`

- **PascalCase** for components
  - Examples: `GitHubConnectButton.tsx`, `UserProfile.tsx`, `DashboardPage.tsx`

## Naming Conventions

### Variables and Functions
- **camelCase** for variables and functions
- Examples: `userId`, `getUserProfile()`, `handleLogin()`
- Bad: `user_id`, `GetUserProfile`, `handle_login`

### Constants
- **UPPER_SNAKE_CASE** for constants
- Examples: `MAX_RETRIES`, `API_BASE_URL`, `DEFAULT_TIMEOUT`

### Classes, Interfaces, Types, Enums
- **PascalCase** for classes, interfaces, types, and enums
- Examples: `AuthService`, `User`, `UserRole`, `LoginSchema`

## Examples

### DO - Arrow Function Component
```tsx
const MyComponent = ({ prop1, prop2 }: Props) => {
  const [state, setState] = useState(null);

  return <div>{state}</div>;
};
```

### DON'T - Function Declaration
```tsx
function MyComponent({ prop1, prop2 }: Props) {
  const [state, setState] = useState(null);

  return <div>{state}</div>;
}
```

### DO - Semantic HTML
```tsx
const Page = () => (
  <main>
    <header>
      <nav>...</nav>
    </header>
    <section>
      <article>...</article>
    </section>
    <footer>...</footer>
  </main>
);
```

### DON'T - Non-Semantic HTML
```tsx
const Page = () => (
  <div>
    <div>
      <div>...</div>
    </div>
    <div>
      <div>...</div>
    </div>
    <div>...</div>
  </div>
);
```
