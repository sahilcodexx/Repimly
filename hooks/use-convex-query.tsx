import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const useConvexQuery = (query: unknown, ...args: unknown[]) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = useQuery(query as any, ...(args as any)) as any;

  const [data, setData] = useState<unknown>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (result === undefined) {
      setIsLoading(true);
    } else {
      try {
        setData(result);
        setError(null);
      } catch (err) {
        setError(err as Error);
        toast.error(err instanceof Error ? err.message : String(err));
      } finally {
        setIsLoading(false);
      }
    }
  }, [result]);
  return {
    data,
    isLoading,
    error,
  };
};
export const useConvexMutation = (mutation: unknown) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mutationFn = useMutation(mutation as any);

  const [data, setData] = useState<unknown>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = async (...agrs: unknown[]) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await mutationFn(...(agrs as any));
      setData(res);
      return res;
    } catch (err) {
      setError(err as Error);
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    mutate,
    data,
    isLoading,
    error,
  };
};
