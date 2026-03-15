"use client";

import { useEffect, useState } from "react";
import { reverseGeocode } from "@/lib/kakao/reverseGeocode";
import type { LatLng } from "@/types/game";

type State = {
  address: string | null;
  loading: boolean;
  error: string | null;
};

export function useReverseGeocodeCache(location: LatLng | null) {
  const [state, setState] = useState<State>({
    address: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!location) {
      setState({ address: null, loading: false, error: null });
      return;
    }

    let cancelled = false;
    setState({ address: null, loading: true, error: null });

    reverseGeocode(location)
      .then((address) => {
        if (cancelled) return;
        setState({ address, loading: false, error: null });
      })
      .catch((error: Error) => {
        if (cancelled) return;
        setState({
          address: null,
          loading: false,
          error: error.message || "Failed to reverse geocode.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [location]);

  return state;
}

