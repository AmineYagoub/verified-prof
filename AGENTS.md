# Coding Rules - VerifiedProf

## React Components

- **ALWAYS use arrow functions** for components (NEVER function declarations)
- **NEVER add comments** inside React component code (keep code self-explanatory)
- **Use semantic HTML** (proper `<form>`, `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, etc.)
- Keep components small and focused
- Use functional components with hooks
- Separate presentational and container components
- Use TypeScript for all components

## NestJS API Development

### Request/Response DTOs

- **ALWAYS define DTOs in libs/shared** for type safety between API and UI
- Use **interfaces for response DTOs** (lightweight, serializable)
- Use **classes for request DTOs** when validation is needed (with class-validator decorators)
- Export all DTOs from libs/shared/src/types/index.ts for easy imports

Example:

```typescript
// libs/shared/src/types/quality-api.ts
import { IsEnum, IsOptional } from 'class-validator';

// Response DTO - use interface
export interface QualityMetricsResponse {
  userId: string;
  overallScore: number;
  trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
}

// Request/Query DTO - use class with validators
export class TemporalMetricsQuery {
  @IsOptional()
  @IsEnum(['30', '60', '90'])
  window?: '30' | '60' | '90';
}
```

### Object Schema Validation

- **ALWAYS enable ValidationPipe globally** in main.ts
- Use strict validation options:
  - `transform: true` - auto-transform payloads to DTO instances
  - `whitelist: true` - strip non-whitelisted properties
  - `forbidNonWhitelisted: true` - throw error on unknown properties
  - `transformOptions.enableImplicitConversion: true` - convert types

Example:

```typescript
// apps/worker/src/main.ts
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  await app.listen(port);
}
```

### Controller Best Practices

- Import DTOs from @verified-prof/shared (NEVER local dto/ folders)
- Use @Query() with DTO class for query parameters
- Use @Body() with DTO class for request body
- Use @Param() for path parameters
- Always specify return type with Promise<ResponseDTO>

Example:

```typescript
import { Controller, Get, Query } from '@nestjs/common';
import {
  TemporalMetricsQuery,
  TemporalMetricsResponse,
} from '@verified-prof/shared';

@Controller('quality')
export class QualityController {
  @Get('temporal')
  async getTemporalMetrics(
    @Query() query: TemporalMetricsQuery,
  ): Promise<TemporalMetricsResponse> {
    return this.service.getMetrics(query.window);
  }
}
```

### Service Best Practices

- Import response DTOs from @verified-prof/shared
- Return plain objects that match interface shapes (no class instantiation needed)
- Use PrismaService with type safety
- Handle errors with NestJS exceptions (NotFoundException, BadRequestException, etc.)
- **NO inline comments** - code should be self-explanatory
- **Only method-level documentation** when necessary
- **Maximum 250 lines per service class** - extract helper services if needed
- Keep services focused on single responsibility
- **Event-driven cross-module communication:** If a service needs to trigger behavior in a class that belongs to another module, **emit an event** (prefer `EventEmitter2`) instead of injecting and calling that class directly. **Always emit an event if the target class is in a different module.** Define event name constants in `libs/shared` (or another shared location) and place event payload DTOs in `@verified-prof/shared/src/types` so payloads can be validated with `class-validator`.

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
