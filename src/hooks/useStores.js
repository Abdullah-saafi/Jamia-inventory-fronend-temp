import { useEffect, useState, useCallback } from "react";
import { getStores } from "../services/api";

export function useStores() {
  const [subStores, setSubStores] = useState([]);
  const [mainStores, setMainStores] = useState([]);
  const [storesLoading, setStoresLoading] = useState(true);
  const [storesError, setStoresError] = useState("");

  const loadStores = useCallback(async () => {
    setStoresLoading(true);
    try {
      const res = await getStores();
      const all = res.data.data || [];
      setSubStores(all.filter((s) => s.store_type === "SUB_STORE"));
      setMainStores(all.filter((s) => s.store_type === "MAIN_STORE"));
      setStoresError("");
    } catch (err) {
      setStoresError("Failed to load stores");
    } finally {
      setStoresLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStores();
  }, [loadStores]);

  return { subStores, mainStores, storesLoading, storesError, refetchStores: loadStores };
}
