/* Memoria local IndexedDB com sincronizacao opcional no Supabase. */
(function () {
    const DB_NAME = 'sexta-feira-memory';
    const DB_VERSION = 1;
    const STORES = ['tasks', 'memories', 'corrections', 'searches', 'settings'];
    let databasePromise;

    function openDatabase() {
        if (databasePromise) return databasePromise;
        databasePromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = () => {
                STORES.forEach((store) => {
                    if (!request.result.objectStoreNames.contains(store)) {
                        request.result.createObjectStore(store, { keyPath: 'id' });
                    }
                });
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
        return databasePromise;
    }

    async function readAll(storeName) {
        const db = await openDatabase();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readonly');
            const request = tx.objectStore(storeName).getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    async function replaceAll(storeName, values) {
        const db = await openDatabase();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            store.clear();
            values.forEach((value) => store.put(value));
            tx.oncomplete = resolve;
            tx.onerror = () => reject(tx.error);
        });
    }

    function legacyItems() {
        return {
            tasks: JSON.parse(localStorage.getItem('sexta_feira.tasks.v1') || localStorage.getItem('utron.tasks.v1') || '[]'),
            memories: JSON.parse(localStorage.getItem('sexta_feira.fatos.v1') || localStorage.getItem('utron.fatos.v1') || '[]'),
            searches: JSON.parse(localStorage.getItem('sexta_feira.pesquisas.v1') || localStorage.getItem('utron.pesquisas.v1') || '[]')
        };
    }

    async function migrateLegacy() {
        const legacy = legacyItems();
        const existingTasks = await readAll('tasks');
        if (!existingTasks.length && legacy.tasks.length) {
            await replaceAll('tasks', legacy.tasks.map((text) => ({ id: uuid(), text, completed: false })));
        }
        const existingMemories = await readAll('memories');
        if (!existingMemories.length && legacy.memories.length) {
            await replaceAll('memories', legacy.memories.map((item, index) => ({
                id: uuid(),
                kind: 'fact',
                content: item.frase || String(item),
                confidence: 1,
                source: 'legacy'
            })));
        }
        const existingSearches = await readAll('searches');
        if (!existingSearches.length && legacy.searches.length) {
            await replaceAll('searches', legacy.searches.map((item) => ({ id: uuid(), ...item })));
        }
    }

    function uuid() {
        return crypto.randomUUID ? crypto.randomUUID() : Date.now() + '-' + Math.random();
    }

    async function save(store, value) {
        const item = { ...value, id: value.id || uuid(), updated_at: new Date().toISOString() };
        const values = await readAll(store);
        const index = values.findIndex((entry) => entry.id === item.id);
        if (index >= 0) values[index] = item; else values.push(item);
        await replaceAll(store, values.slice(-200));
        return item;
    }

    async function getClient() {
        const config = window.SEXTA_CONFIG || {};
        if (!config.sincronizarSupabase || !window.supabase || !config.supabaseUrl || !config.supabaseAnonKey) return;
        const client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
        const { data: sessionData } = await client.auth.getSession();
        if (sessionData && sessionData.session) return { client, user: sessionData.session.user };
        const { data, error } = await client.auth.signInAnonymously();
        if (error || !data.session) return null;
        return { client, user: data.session.user };
    }

    async function sync(store, table) {
        const connection = await getClient();
        if (!connection) return;
        const rows = (await readAll(store)).map((row) => ({ ...row, user_id: connection.user.id }));
        if (rows.length) await connection.client.from(table).upsert(rows, { onConflict: 'id' });
    }

    async function syncAll() {
        const connection = await getClient();
        if (!connection) return;
        const [tasks, memories, corrections, searches] = await Promise.all([
            readAll('tasks'), readAll('memories'), readAll('corrections'), readAll('searches')
        ]);
        if (tasks.length) await connection.client.from('ai_tasks').upsert(tasks.map((row) => ({ ...row, user_id: connection.user.id })), { onConflict: 'id' });
        if (memories.length) await connection.client.from('ai_memories').upsert(memories.map((row) => ({ ...row, user_id: connection.user.id })), { onConflict: 'id' });
        if (corrections.length) await connection.client.from('ai_corrections').upsert(corrections.map((row) => ({ ...row, user_id: connection.user.id })), { onConflict: 'id' });
        if (searches.length) await connection.client.from('ai_searches').upsert(searches.map((row) => ({
            id: row.id, user_id: connection.user.id, question: row.pergunta || row.question || '',
            source: row.fonte || row.source || '', title: row.titulo || row.title || '',
            url: row.url || '', summary: row.resumo || row.summary || ''
        })), { onConflict: 'id' });
    }

    window.SextaStorage = {
        init: migrateLegacy,
        readAll,
        save,
        replaceAll,
        sync,
        syncAll,
        newId: uuid
    };
})();
