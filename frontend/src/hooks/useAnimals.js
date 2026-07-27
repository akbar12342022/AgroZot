import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchAnimals } from '../api/animals';
import { normalizeAnimal } from '../utils/helpers';

const PAGE_SIZE = 10;

/** E'lonlarni API dan olish: filtrlash, qidirish, saralash, "yana yuklash" */
export function useAnimals({ category, region, search, sort }) {
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const requestIdRef = useRef(0);

  const load = useCallback(async (pageNum, append) => {
    const reqId = ++requestIdRef.current;
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await fetchAnimals({ category, region, search, sort, page: pageNum, limit: PAGE_SIZE });
      if (reqId !== requestIdRef.current) return; // eskirgan so'rov
      const items = (res.data || []).map(normalizeAnimal);
      setAnimals((prev) => (append ? [...prev, ...items] : items));
      setTotal(res.pagination?.total ?? items.length);
      setTotalPages(res.pagination?.totalPages ?? 1);
      setPage(pageNum);
    } catch (err) {
      if (reqId !== requestIdRef.current) return;
      setError(err.message);
      if (!append) setAnimals([]);
    } finally {
      if (reqId === requestIdRef.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [category, region, search, sort]);

  // Filtr o'zgarganda 1-sahifadan qayta yuklash (qidiruvda debounce)
  useEffect(() => {
    const timer = setTimeout(() => load(1, false), search ? 350 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  const hasMore = page < totalPages;
  const loadMore = () => {
    if (hasMore && !loadingMore && !loading) load(page + 1, true);
  };
  const refetch = () => load(1, false);

  return { animals, loading, loadingMore, error, total, hasMore, loadMore, refetch };
}
