'use strict';
(() => {
  const PROJECT_URL = 'https://mjwuhcxwkingmkgofjjl.supabase.co';
  const PUBLISHABLE_KEY = 'sb_publishable_3q0TpNW92yFZZYKHlOm1Jw_ZKg_-3XT';
  const SESSION_KEY = 'catalogos-personales-auth-v1';
  const CACHE_PREFIX = 'catalogos-personales-offline-v1:';

  const readCache = (key, fallback = null) => {
    try {
      const raw = localStorage.getItem(CACHE_PREFIX + key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (_) {
      return fallback;
    }
  };
  const writeCache = (key, value) => {
    try {
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(value));
    } catch (error) {
      console.warn('No se pudo guardar la copia local del catálogo:', error);
    }
  };
  const removeCache = key => {
    try { localStorage.removeItem(CACHE_PREFIX + key); } catch (_) {}
  };
  const requireOnlineSession = cloud => {
    if (!cloud.user?.id) throw new Error('Conéctate a Internet para iniciar una sesión segura antes de enviar datos.');
    if (!navigator.onLine) throw new Error('Sin Internet: los cambios no se enviaron a Supabase. Vuelve a conectarte e inténtalo otra vez.');
  };

  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    window.catalogCloudReady = Promise.reject(new Error('No se pudo cargar la biblioteca de conexión. Comprueba Internet y vuelve a abrir la aplicación.'));
    return;
  }

  const client = window.supabase.createClient(PROJECT_URL, PUBLISHABLE_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      storageKey: SESSION_KEY
    }
  });

  const cloud = {
    client,
    user: null,
    offline: !navigator.onLine,
    async init() {
      let sessionResult;
      try {
        sessionResult = await client.auth.getSession();
      } catch (error) {
        if (!navigator.onLine) {
          this.offline = true;
          this.user = null;
          return this;
        }
        throw error;
      }
      if (sessionResult.error) {
        if (!navigator.onLine) {
          this.offline = true;
          this.user = null;
          return this;
        }
        throw sessionResult.error;
      }

      let session = sessionResult.data?.session || null;
      if (!session && navigator.onLine) {
        const result = await client.auth.signInAnonymously();
        if (result.error) {
          if (/anonymous|disabled|not enabled/i.test(result.error.message || '')) {
            throw new Error('Activa el acceso anónimo en Supabase: Authentication → Sign In / Providers → Anonymous Sign-Ins.');
          }
          throw result.error;
        }
        session = result.data?.session || null;
      }

      this.user = session?.user?.id ? session.user : null;
      this.offline = !navigator.onLine;
      return this;
    },
    async items(storeCode) {
      const key = 'items:' + storeCode;
      try {
        const { data, error } = await client.from('catalog_items')
          .select('*').eq('store_code', storeCode).eq('available', true).order('sort_order');
        if (error) throw error;
        const rows = data || [];
        writeCache(key, rows);
        this.offline = !navigator.onLine;
        return rows;
      } catch (error) {
        const cached = readCache(key, null);
        if (Array.isArray(cached)) {
          this.offline = true;
          return cached;
        }
        throw error;
      }
    },
    async profile(storeCode) {
      if (!this.user?.id) return null;
      const key = 'profile:' + storeCode + ':' + this.user.id;
      try {
        const { data, error } = await client.from('catalog_profiles').select('*')
          .eq('store_code', storeCode).eq('user_id', this.user.id).maybeSingle();
        if (error) throw error;
        if (data) writeCache(key, data);
        else removeCache(key);
        return data;
      } catch (error) {
        const cached = readCache(key, null);
        if (cached) {
          this.offline = true;
          return cached;
        }
        if (!navigator.onLine) return null;
        throw error;
      }
    },
    async saveProfile(storeCode, profile) {
      requireOnlineSession(this);
      const { data, error } = await client.from('catalog_profiles')
        .upsert({ ...profile, store_code: storeCode, user_id: this.user.id, updated_at: new Date().toISOString() },
          { onConflict: 'store_code,user_id' }).select().single();
      if (error) throw error;
      writeCache('profile:' + storeCode + ':' + this.user.id, data);
      return data;
    },
    async deleteProfile(storeCode) {
      requireOnlineSession(this);
      const { error } = await client.from('catalog_profiles').delete()
        .eq('store_code', storeCode).eq('user_id', this.user.id);
      if (error) throw error;
      removeCache('profile:' + storeCode + ':' + this.user.id);
    },
    async requests(storeCode) {
      if (!this.user?.id) return [];
      const key = 'requests:' + storeCode + ':' + this.user.id;
      try {
        const { data, error } = await client.from('catalog_requests').select('*')
          .eq('store_code', storeCode).eq('user_id', this.user.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        const rows = data || [];
        writeCache(key, rows);
        return rows;
      } catch (error) {
        const cached = readCache(key, null);
        if (Array.isArray(cached)) {
          this.offline = true;
          return cached;
        }
        if (!navigator.onLine) return [];
        throw error;
      }
    },
    async submit(storeCode, type, contactName, phone, extra = {}) {
      requireOnlineSession(this);
      const { data, error } = await client.from('catalog_requests').insert({
        store_code: storeCode,
        user_id: this.user.id,
        request_type: type,
        contact_name: contactName,
        phone,
        requested_for: extra.requested_for ?? null,
        delivery_method: extra.delivery_method ?? null,
        address: extra.address ?? null,
        reference: extra.reference ?? null,
        request_data: extra.request_data ?? {}
      }).select().single();
      if (error) throw error;
      const key = 'requests:' + storeCode + ':' + this.user.id;
      const rows = readCache(key, []);
      writeCache(key, [data, ...(Array.isArray(rows) ? rows.filter(row => row.id !== data.id) : [])]);
      return data;
    },
    async deleteRequests(storeCode) {
      requireOnlineSession(this);
      const { error } = await client.from('catalog_requests').delete()
        .eq('store_code', storeCode).eq('user_id', this.user.id);
      if (error) throw error;
      writeCache('requests:' + storeCode + ':' + this.user.id, []);
    },
    async userState(storeCode, key, fallback) {
      if (!this.user?.id) return fallback;
      const cacheKey = 'state:' + storeCode + ':' + this.user.id + ':' + key;
      try {
        const { data, error } = await client.from('catalog_user_state').select('state_data')
          .eq('store_code', storeCode).eq('user_id', this.user.id).eq('state_key', key).maybeSingle();
        if (error) throw error;
        const value = data?.state_data ?? fallback;
        writeCache(cacheKey, value);
        return value;
      } catch (error) {
        const cached = readCache(cacheKey, undefined);
        if (cached !== undefined) {
          this.offline = true;
          return cached;
        }
        if (!navigator.onLine) return fallback;
        throw error;
      }
    },
    async saveUserState(storeCode, key, stateData) {
      requireOnlineSession(this);
      const { error } = await client.from('catalog_user_state').upsert({
        store_code: storeCode, user_id: this.user.id, state_key: key, state_data: stateData, updated_at: new Date().toISOString()
      }, { onConflict: 'store_code,user_id,state_key' });
      if (error) throw error;
      writeCache('state:' + storeCode + ':' + this.user.id + ':' + key, stateData);
    },
    async clearUserState(storeCode, key) {
      requireOnlineSession(this);
      const { error } = await client.from('catalog_user_state').delete()
        .eq('store_code', storeCode).eq('user_id', this.user.id).eq('state_key', key);
      if (error) throw error;
      removeCache('state:' + storeCode + ':' + this.user.id + ':' + key);
    }
  };

  window.catalogCloud = cloud;
  window.catalogCloudReady = cloud.init();
})();
