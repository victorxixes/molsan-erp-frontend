(function() {
    const version = Date.now();
    document.querySelectorAll("script[data-nocache]").forEach(s => {
        s.src = s.src + "?v=" + version;
    });
})();
