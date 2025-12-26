import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { ReactNode } from "react";

export const getContext = () => {
  const queryClient = new QueryClient();
  return {
    queryClient,
  };
};

export const Provider = ({
  children,
  queryClient,
}: {
  children: ReactNode;
  queryClient: QueryClient;
}) => {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
