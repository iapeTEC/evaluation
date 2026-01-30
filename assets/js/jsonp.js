function jsonp(url, params) {
  return new Promise((resolve, reject) => {
    const cbName = "cb_" + Math.random().toString(36).slice(2);
    const u = new URL(url);
    Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v));
    u.searchParams.set("callback", cbName);

    const script = document.createElement("script");
    script.src = u.toString();

    window[cbName] = (data) => { cleanup(); resolve(data); };
    script.onerror = () => { cleanup(); reject(new Error("JSONP request failed")); };

    function cleanup() {
      try { delete window[cbName]; } catch {}
      script.remove();
    }
    document.head.appendChild(script);
  });
}
