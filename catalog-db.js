'use strict';
(() => {
  const PROJECT_URL = 'https://mjwuhcxwkingmkgofjjl.supabase.co';
  const PUBLISHABLE_KEY = 'sb_publishable_3q0TpNW92yFZZYKHlOm1Jw_ZKg_-3XT';
  const SESSION_KEY = 'catalogos-personales-auth-v1';

  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    window.catalogCloudReady = Promise.reject(new Error('No se pudo cargar la biblioteca de conexión. Recarga la página con internet.'));
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
    async init() {
      let { data, error } = await client.auth.getSession();
      if (error) throw error;
      if (!data.session) {
        const result = await client.auth.signInAnonymously();
        if (result.error) {
          if (/anonymous|disabled|not enabled/i.test(result.error.message || '')) {
            throw new Error('Activa el acceso anónimo en Supabase: Authentication → Sign In / Providers → Anonymous Sign-Ins.');
          }
          throw result.error;
        }
        data = { session: result.data.session };
      }
      if (!data.session?.user?.id) throw new Error('No se pudo iniciar una sesión segura.');
      this.user = data.session.user;
      return this;
    },
    async items(storeCode) {
      const { data, error } = await client.from('catalog_items')
        .select('*').eq('store_code', storeCode).eq('available', true).order('sort_order');
      if (error) throw error;
      return data || [];
    },
    async profile(storeCode) {
      const { data, error } = await client.from('catalog_profiles').select('*')
        .eq('store_code', storeCode).eq('user_id', this.user.id).maybeSingle();
      if (error) throw error;
      return data;
    },
    async saveProfile(storeCode, profile) {
      const { data, error } = await client.from('catalog_profiles')
        .upsert({ store_code: storeCode, user_id: this.user.id, ...profile, updated_at: new Date().toISOString() },
          { onConflict: 'store_code,user_id' }).select().single();
      if (error) throw error;
      return data;
    },
    async deleteProfile(storeCode) {
      const { error } = await client.from('catalog_profiles').delete()
        .eq('store_code', storeCode).eq('user_id', this.user.id);
      if (error) throw error;
    },
    async requests(storeCode) {
      const { data, error } = await client.from('catalog_requests').select('*')
        .eq('store_code', storeCode).eq('user_id', this.user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    async submit(storeCode, type, contactName, phone, extra = {}) {
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
      return data;
    },
    async deleteRequests(storeCode) {
      const { error } = await client.from('catalog_requests').delete()
        .eq('store_code', storeCode).eq('user_id', this.user.id);
      if (error) throw error;
    },
    async userState(storeCode, key, fallback) {
      const { data, error } = await client.from('catalog_user_state').select('state_data')
        .eq('store_code', storeCode).eq('user_id', this.user.id).eq('state_key', key).maybeSingle();
      if (error) throw error;
      return data?.state_data ?? fallback;
    },
    async saveUserState(storeCode, key, stateData) {
      const { error } = await client.from('catalog_user_state').upsert({
        store_code: storeCode, user_id: this.user.id, state_key: key, state_data: stateData, updated_at: new Date().toISOString()
      }, { onConflict: 'store_code,user_id,state_key' });
      if (error) throw error;
    },
    async clearUserState(storeCode, key) {
      const { error } = await client.from('catalog_user_state').delete()
        .eq('store_code', storeCode).eq('user_id', this.user.id).eq('state_key', key);
      if (error) throw error;
    }
  };

  window.catalogCloud = cloud;
  window.catalogCloudReady = cloud.init();
})();