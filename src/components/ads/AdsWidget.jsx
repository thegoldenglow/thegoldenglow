import React, { useEffect, useMemo, useState } from 'react';
import { supabase, isSupabaseAvailable } from '../../utils/supabase';

// Minimal YouTube URL parser supporting common patterns
function extractYouTubeId(url) {
  if (!url) return null;
  try {
    // Handle shorts, watch, and youtu.be links
    const shorts = url.match(/youtube\.com\/shorts\/([\w-]{6,})/i);
    if (shorts) return shorts[1];
    const watch = url.match(/[?&]v=([\w-]{6,})/i);
    if (watch) return watch[1];
    const youtu = url.match(/youtu\.be\/([\w-]{6,})/i);
    if (youtu) return youtu[1];
    // Fallback: try last path segment if it looks like an ID
    const u = new URL(url);
    const seg = u.pathname.split('/').filter(Boolean).pop();
    if (seg && /^[\w-]{6,}$/.test(seg)) return seg;
  } catch (_) {
    return null;
  }
  return null;
}

function toYouTubeEmbedUrl(url) {
  const id = extractYouTubeId(url);
  if (!id) return null;
  return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&autoplay=0`;
}

// Local storage fallback key
const LOCAL_KEY = 'gg_ads_fallback';

export default function AdsWidget() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [newLink, setNewLink] = useState('');
  const [adding, setAdding] = useState(false);
  const [backendEnabled, setBackendEnabled] = useState(isSupabaseAvailable());

  const selectedAd = ads.length > 0 ? ads[selectedIndex] : null;
  const selectedEmbed = useMemo(() => selectedAd ? toYouTubeEmbedUrl(selectedAd.url) : null, [selectedAd]);

  useEffect(() => {
    loadAds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function syncLocalToSupabaseIfNeeded(current) {
    if (!isSupabaseAvailable()) return;
    // Read local
    let local = [];
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      local = raw ? JSON.parse(raw) : [];
    } catch {}
    if (!local || local.length === 0) return;

    // Compute missing by URL
    const currentUrls = new Set((current || []).map((r) => (r && r.url) || ''));
    const missing = local
      .filter((item) => item && item.url && extractYouTubeId(item.url))
      .filter((item) => !currentUrls.has(item.url));

    if (missing.length === 0) return;

    try {
      const { error: insErr } = await supabase
        .from('ad_videos')
        .insert(missing.map((m) => ({ url: m.url })));
      if (insErr) throw insErr;
      setInfo(`Synced ${missing.length} local ad(s) to cloud`);
      // Remove synced from local
      const remaining = local.filter((item) => !missing.find((m) => m.url === item.url));
      try { localStorage.setItem(LOCAL_KEY, JSON.stringify(remaining)); } catch {}
    } catch (e) {
      // Keep silent, show gentle message
      console.warn('Ad sync skipped:', e?.message || e);
    }
  }

  function shouldFallbackToLocal(err) {
    const msg = (err && (err.message || err.error_description || String(err))) || '';
    return /relation .*ad_videos.* does not exist/i.test(msg) || /42P01/.test(msg) || /permission denied/i.test(msg);
  }

  async function loadAds() {
    setLoading(true);
    setError('');
    setInfo('');
    try {
      if (isSupabaseAvailable() && backendEnabled) {
        const { data, error: dbError } = await supabase
          .from('ad_videos')
          .select('id, url, created_at')
          .order('created_at', { ascending: false });
        if (dbError) throw dbError;
        const cleaned = (data || []).filter((row) => !!extractYouTubeId(row.url));
        // Attempt to sync local items that are not yet in DB
        await syncLocalToSupabaseIfNeeded(cleaned);
        // Refetch after potential sync to reflect latest
        let finalList = cleaned;
        if (isSupabaseAvailable()) {
          const { data: data2 } = await supabase
            .from('ad_videos')
            .select('id, url, created_at')
            .order('created_at', { ascending: false });
          if (data2) {
            finalList = (data2 || []).filter((row) => !!extractYouTubeId(row.url));
          }
        }
        setAds(finalList);
        if (finalList.length > 0) {
          setSelectedIndex(Math.floor(Math.random() * finalList.length));
        }
        setInfo(finalList.length === 0 ? 'No ads configured yet.' : '');
      } else {
        // Fallback to local storage when Supabase unavailable or backend disabled
        let local = [];
        try {
          const raw = localStorage.getItem(LOCAL_KEY);
          local = raw ? JSON.parse(raw) : [];
        } catch {}
        const cleaned = (local || []).filter((item) => !!extractYouTubeId(item.url));
        setAds(cleaned);
        if (cleaned.length > 0) {
          setSelectedIndex(Math.floor(Math.random() * cleaned.length));
        }
        setInfo('Guest mode: using local storage');
      }
    } catch (e) {
      console.error('Failed to load ads', e);
      if (shouldFallbackToLocal(e)) {
        setBackendEnabled(false);
        let local = [];
        try { const raw = localStorage.getItem(LOCAL_KEY); local = raw ? JSON.parse(raw) : []; } catch {}
        const cleaned = (local || []).filter((item) => !!extractYouTubeId(item.url));
        setAds(cleaned);
        if (cleaned.length > 0) setSelectedIndex(Math.floor(Math.random() * cleaned.length));
        setInfo('Guest mode: using local storage');
        setError('');
      } else {
        setError(e?.message || 'Failed to load ads');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    setError('');
    setInfo('');
    const id = extractYouTubeId(newLink.trim());
    if (!newLink.trim() || !id) {
      setError('Please enter a valid YouTube URL');
      return;
    }

    setAdding(true);
    try {
      if (isSupabaseAvailable() && backendEnabled) {
        const { data, error: insError } = await supabase
          .from('ad_videos')
          .insert({ url: newLink.trim() })
          .select('id, url, created_at')
          .single();
        if (insError) {
          if (shouldFallbackToLocal(insError)) {
            setBackendEnabled(false);
            throw insError; // jump to catch and do local insert
          }
          throw insError;
        }
        setAds((prev) => [data, ...prev]);
        setInfo('Ad link added successfully');
      }

      if (!isSupabaseAvailable() || !backendEnabled) {
        // Local fallback insert
        let local = [];
        try {
          const raw = localStorage.getItem(LOCAL_KEY);
          local = raw ? JSON.parse(raw) : [];
        } catch {}
        // Prevent duplicates by URL
        const exists = (local || []).some((x) => x.url === newLink.trim());
        if (exists) {
          setInfo('Link already exists locally');
        } else {
          const entry = {
            id: `local-${Date.now()}`,
            url: newLink.trim(),
            created_at: new Date().toISOString(),
          };
          const next = [entry, ...local];
          try {
            localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
          } catch {}
          setAds((prev) => [entry, ...prev]);
          setInfo('Saved locally (guest mode). Will sync when online.');
        }
      }
      // Select the newly added ad
      setSelectedIndex(0);
      setNewLink('');
    } catch (e) {
      // If we got here due to fallback condition, perform local insert path
      if (shouldFallbackToLocal(e)) {
        let local = [];
        try { const raw = localStorage.getItem(LOCAL_KEY); local = raw ? JSON.parse(raw) : []; } catch {}
        const exists = (local || []).some((x) => x.url === newLink.trim());
        if (!exists) {
          const entry = { id: `local-${Date.now()}`, url: newLink.trim(), created_at: new Date().toISOString() };
          const next = [entry, ...local];
          try { localStorage.setItem(LOCAL_KEY, JSON.stringify(next)); } catch {}
          setAds((prev) => [entry, ...prev]);
          setInfo('Saved locally (guest mode). Will sync when online.');
          setSelectedIndex(0);
          setNewLink('');
        } else {
          setInfo('Link already exists locally');
        }
      } else {
        console.error('Failed to add ad link', e);
        setError(e?.message || 'Failed to add link');
      }
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(ad) {
    setError('');
    setInfo('');
    try {
      if (!ad) return;
      // If local entry or backend disabled, remove from local storage
      if (!isSupabaseAvailable() || !backendEnabled || String(ad.id).startsWith('local-')) {
        let local = [];
        try { const raw = localStorage.getItem(LOCAL_KEY); local = raw ? JSON.parse(raw) : []; } catch {}
        const next = (local || []).filter((x) => x.url !== ad.url);
        try { localStorage.setItem(LOCAL_KEY, JSON.stringify(next)); } catch {}
        setAds((prev) => prev.filter((x) => x.url !== ad.url));
        setInfo('Removed');
        return;
      }

      const { error: delErr } = await supabase
        .from('ad_videos')
        .delete()
        .eq('id', ad.id);
      if (delErr) {
        if (shouldFallbackToLocal(delErr)) {
          setBackendEnabled(false);
          return handleDelete(ad); // retry as local
        }
        throw delErr;
      }
      setAds((prev) => prev.filter((x) => x.id !== ad.id));
      setInfo('Removed');
    } catch (e) {
      console.error('Delete failed', e);
      setError(e?.message || 'Failed to delete');
    }
  }

  function shuffleAd() {
    if (ads.length < 2) return;
    let next = Math.floor(Math.random() * ads.length);
    if (next === selectedIndex) {
      next = (next + 1) % ads.length;
    }
    setSelectedIndex(next);
  }

  return (
    <div className="bg-deepLapisDark/60 rounded-lg p-4 border border-royalGold/30">
      <h3 className="text-lg font-primary text-textGold mb-3">Sponsored Videos</h3>

      {loading ? (
        <div className="py-6 text-center text-textLight/70">Loading ads...</div>
      ) : error ? (
        <div className="mb-3 p-3 bg-rubyRed/10 border border-rubyRed/30 rounded text-rubyRed text-sm">{error}</div>
      ) : null}

      {selectedEmbed ? (
        <div className="mb-4">
          <div className="aspect-video w-full overflow-hidden rounded-lg border border-royalGold/30">
            <iframe
              src={selectedEmbed}
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Ad video"
            />
          </div>
          <div className="mt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={shuffleAd}
              className="text-xs px-3 py-1.5 rounded border border-royalGold/30 text-textLight/80 hover:bg-royalGold/10"
            >
              Shuffle
            </button>
            <a
              href={selectedAd?.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-royalGold hover:text-textGold"
            >
              Open on YouTube
            </a>
          </div>
        </div>
      ) : (
        <div className="mb-4 p-4 text-sm text-textLight/60 bg-deepLapis/40 rounded border border-royalGold/20">
          {info || 'No valid YouTube ads to show yet.'}
        </div>
      )}

      {/* List of available ads */}
      <div className="mb-4">
        <div className="text-sm text-textLight/70 mb-2">Available Ads</div>
        <div className="space-y-2 max-h-40 overflow-auto pr-1">
          {ads.length === 0 ? (
            <div className="text-xs text-textLight/50">No ads in the list.</div>
          ) : (
            ads.map((ad, idx) => {
              const id = extractYouTubeId(ad.url);
              return (
                <div key={ad.id} className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    className={`truncate text-left mr-2 hover:text-textGold ${idx === selectedIndex ? 'text-textGold' : 'text-textLight/80'}`}
                    title={ad.url}
                    onClick={() => setSelectedIndex(idx)}
                  >
                    {id ? `YouTube: ${id}` : ad.url}
                  </button>
                  <div className="flex items-center gap-2 shrink-0">
                    <a href={ad.url} target="_blank" rel="noopener noreferrer" className="text-royalGold hover:text-textGold">
                      View
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDelete(ad)}
                      className="text-red-300 hover:text-red-400"
                      title="Delete"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add new link */}
      <div className="mt-2">
        <div className="text-sm text-textLight/70 mb-2">Add YouTube link</div>
        <div className="flex items-center gap-2">
          <input
            type="url"
            value={newLink}
            onChange={(e) => setNewLink(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
            placeholder="https://www.youtube.com/watch?v=..."
            className="flex-1 p-2 bg-deepLapisLight/60 border border-royalGold/30 rounded-md focus:ring-royalGold focus:border-royalGold text-textLight placeholder-textLight/50"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={adding}
            className="px-3 py-2 text-sm font-medium text-deepLapisDark bg-royalGold hover:bg-goldHover rounded-md transition-colors disabled:opacity-50 disabled:bg-royalGold/50"
          >
            {adding ? 'Adding...' : 'Add'}
          </button>
        </div>
        {info && !error ? (
          <div className="mt-2 text-xs text-emeraldGreen">{info}</div>
        ) : null}
      </div>

      {/* Controls */}
      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={loadAds}
          className="text-xs px-3 py-1.5 rounded border border-royalGold/30 text-textLight/80 hover:bg-royalGold/10"
        >
          Refresh
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => syncLocalToSupabaseIfNeeded(ads).then(() => loadAds())}
            className="text-[11px] px-2 py-1 rounded border border-royalGold/30 text-textLight/70 hover:bg-royalGold/10"
            title="Sync local links to cloud"
          >
            Sync
          </button>
          <div className="text-[11px] text-textLight/50">
            Data source: {isSupabaseAvailable() && backendEnabled ? 'Supabase' : 'Local'}
          </div>
        </div>
      </div>
    </div>
  );
}