import { useState, useEffect } from 'react';
import {
    collection,
    onSnapshot,
    doc,
    setDoc,
    deleteDoc,
    query,
    orderBy,
    runTransaction
} from 'firebase/firestore';
import { db } from '../firebase';

export function useFirestoreSync<T extends { id: string }>(
    collectionName: string,
    initialData: T[] = [],
    sortField?: string,
    options?: { enabled?: boolean }
) {
    const { enabled = true } = options || {};
    const [data, setData] = useState<T[]>(initialData);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!enabled) {
            setLoading(false);
            return;
        }

        let q = collection(db, collectionName);

        // Simple sort if requested
        const firestoreQuery = sortField ? query(q, orderBy(sortField)) : q;

        const unsubscribe = onSnapshot(
            firestoreQuery,
            (snapshot) => {
                const items: T[] = [];
                snapshot.forEach((doc) => {
                    items.push({ id: doc.id, ...doc.data() } as T);
                });
                setData(items);
                setLoading(false);
            },
            (err) => {
                console.error(`Error syncing ${collectionName}:`, err);
                setError(err);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [collectionName, sortField, enabled]);

    const addOrUpdateItem = async (item: T) => {
        try {
            const { id, ...itemData } = item;
            await setDoc(doc(db, collectionName, id), itemData);
        } catch (err) {
            console.error(`Error updating ${collectionName}:`, err);
            throw err;
        }
    };

    const removeItem = async (id: string) => {
        try {
            await deleteDoc(doc(db, collectionName, id));
        } catch (err) {
            console.error(`Error deleting from ${collectionName}:`, err);
            throw err;
        }
    };

    return { data, setData, loading, error, addOrUpdateItem, removeItem };
}
