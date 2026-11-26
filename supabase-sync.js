/* Sincronización POS con Supabase + Realtime (actualización entre dispositivos). */
(function () {
  "use strict";
  const KEYS = [
    "productosPOS","inventarioPOS","comprasPOS","ventasPOS","cotizacionesPOS",
    "clientesPOS","gastosPOS","proveedoresPOS","configNegocio","configImpuesto",
    "configImpresora","configPagos","usuariosPOS","cierresPOS","usuarioActualPOS"
  ];
  const FLAG = "__pos_supabase_hydrated_v2";
  const url = String(window.SUPABASE_URL || "").trim().replace(/\/rest\/v1\/?$/, "");
  const key = String(window.SUPABASE_ANON_KEY || "").trim();

  if (!url || !key || url.includes("TU-PROYECTO") || key.includes("PEGA_AQUI") ||
      key.includes("TU_SUPABASE") || key.startsWith("sb_secret_") ||
      key.startsWith("sb_service_role_")) {
    console.warn("Supabase POS: pega en supabase-config.js la URL y la clave PUBLICABLE/anon.");
    return;
  }

  function cargarSDK() {
    return new Promise((resolve, reject) => {
      if (window.supabase && window.supabase.createClient) return resolve();
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
      script.onload = resolve;
      script.onerror = () => reject(new Error("No se pudo cargar Supabase JS"));
      document.head.appendChild(script);
    });
  }

  cargarSDK().then(async () => {
    const db = window.supabase.createClient(url, key, {
      realtime: { params: { eventsPerSecond: 10 } }
    });
    window.posSupabase = db;

    const nativeSet = Storage.prototype.setItem;
    let applyingRemote = false;
    const pending = new Map();
    let timer = null;
    let writeChain = Promise.resolve();

    // Evita que una actualización recibida por Realtime vuelva a enviarse a la nube.
    function setLocalFromRemote(k, value) {
      applyingRemote = true;
      try {
        nativeSet.call(localStorage, k, JSON.stringify(value));
      } finally {
        applyingRemote = false;
      }
      window.dispatchEvent(new StorageEvent("storage", {
        key: k, newValue: JSON.stringify(value), storageArea: localStorage
      }));
      window.dispatchEvent(new CustomEvent("pos-data-updated", { detail: { key: k, remote: true } }));
    }

    async function enviarPendientes() {
      if (!pending.size) return;
      const rows = Array.from(pending, ([k, value]) => ({
        key: k, value, updated_at: new Date().toISOString()
      }));
      pending.clear();
      // Serializa escrituras para mantener el orden de cambios de esta sesión.
      writeChain = writeChain.then(async () => {
        const { error } = await db.from("pos_app_data").upsert(rows, { onConflict: "key" });
        if (error) {
          rows.forEach(row => pending.set(row.key, row.value));
          console.error("Supabase: error guardando datos", error.message);
          window.dispatchEvent(new CustomEvent("pos-sync-status", { detail: { state: "error", message: error.message } }));
        } else {
          window.dispatchEvent(new CustomEvent("pos-sync-status", { detail: { state: "synced" } }));
        }
      });
      return writeChain;
    }

    // Al primer acceso a esta pestaña, carga la copia central antes de inicializar módulos.
    if (sessionStorage.getItem(FLAG) !== "1") {
      try {
        const { data, error } = await db.from("pos_app_data").select("key,value");
        if (error) throw error;
        (data || []).forEach(row => {
          if (KEYS.includes(row.key)) setLocalFromRemote(row.key, row.value);
        });
        sessionStorage.setItem(FLAG, "1");
        location.reload();
        return;
      } catch (e) {
        console.error("Supabase: no se pudo cargar la información inicial", e.message);
      }
    }

    // Intercepta cambios de localStorage usados por los módulos actuales.
    const originalSet = localStorage.setItem.bind(localStorage);
    localStorage.setItem = function (k, v) {
      originalSet(k, v);
      if (applyingRemote || !KEYS.includes(k)) return;
      try {
        pending.set(k, JSON.parse(v));
        clearTimeout(timer);
        timer = setTimeout(enviarPendientes, 250);
      } catch (e) {
        console.warn("POS: valor local no válido para sincronizar", k);
      }
    };

    window.posSyncNow = async function () {
      KEYS.forEach(k => {
        const raw = localStorage.getItem(k);
        if (raw !== null) {
          try { pending.set(k, JSON.parse(raw)); } catch (_) {}
        }
      });
      await enviarPendientes();
      await writeChain;
      if (pending.size) throw new Error("Algunos datos no se pudieron sincronizar.");
      return true;
    };

    // Escucha INSERT/UPDATE/DELETE en la tabla publicada en Supabase Realtime.
    const channel = db.channel("pos-app-data-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "pos_app_data" }, payload => {
        const row = payload.new;
        if (payload.eventType === "DELETE") {
          const oldKey = payload.old && payload.old.key;
          if (KEYS.includes(oldKey)) {
            localStorage.removeItem(oldKey);
            window.dispatchEvent(new StorageEvent("storage", { key: oldKey, newValue: null, storageArea: localStorage }));
            window.dispatchEvent(new CustomEvent("pos-data-updated", { detail: { key: oldKey, remote: true, deleted: true } }));
          }
          return;
        }
        if (row && KEYS.includes(row.key)) setLocalFromRemote(row.key, row.value);
      })
      .subscribe(status => {
        window.dispatchEvent(new CustomEvent("pos-sync-status", { detail: { state: status } }));
        if (status === "SUBSCRIBED") console.info("POS: Realtime conectado.");
      });

    window.posSupabaseRealtime = channel;
    window.dispatchEvent(new CustomEvent("pos-supabase-ready"));
    console.info("POS conectado a Supabase; sincronización automática y Realtime activos.");
  }).catch(e => console.error("Supabase POS: no se pudo iniciar", e));
})();
