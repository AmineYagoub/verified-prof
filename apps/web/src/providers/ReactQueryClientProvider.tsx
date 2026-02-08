'use client';

import { QueryClient, QueryClientProvider as Provider, DehydratedState } from '@tanstack/react-query';
import { useState } from 'react';
import { ReactNode } from 'react';
import { Toaster } from 'sonner';
import { HydrationBoundary } from '@tanstack/react-query';

const ReactQueryClientProvider = ({
  children,
  dehydratedState,
}: {
  children: ReactNode;
  dehydratedState?: DehydratedState;
}) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60,
            retry: 1,
          },
        },
      }),
  );

  return (
    <Provider client={queryClient}>
      <HydrationBoundary state={dehydratedState}>
        {children}
        <Toaster />
      </HydrationBoundary>
    </Provider>
  );
};

export default ReactQueryClientProvider;
