"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { PageWipeFinish } from "@/components/shared/PageWipe";
import { ButtonFeedback } from "@/components/shared/ButtonFeedback";
import { MotionKit } from "@/components/shared/MotionKit";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchInterval: false,
            refetchOnWindowFocus: false,
            staleTime: Infinity,
            retry: false,
          },
          mutations: {
            retry: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <PageWipeFinish />
      <ButtonFeedback />
      <MotionKit />
    </QueryClientProvider>
  );
}
