// The ONE copy of the stylesheet self-heal (11/09/2026). Pages and both page templates carry
// CSS_BLOCK byte-for-byte right after the /styles.css link; check:css-heal enforces that AND runs
// CSS_HEAL against a stub DOM (behavior, not just text).
// Why: a stylesheet whose download fails (flaky phone network) is never retried by the browser,
// so Safari showed a bare page. This re-fetches any failed same-origin stylesheet (max 2 retries
// each), inserting the retry right after the original so the page's own inline <style> still wins.
// "Failed" = no sheet, a sheet with 0 rules (404, wrong MIME, empty 200), or a sheet whose
// cssRules THROWS (a network failure, in WebKit and Chromium). Cross-origin and disabled sheets
// are skipped. A retry that is still loading is waited on; one that errors or loads empty counts
// as failed and the next try follows 1.5 s later.
// When it runs: once synchronously (the stylesheets above it have settled: WebKit fires the
// link 'error' before this script could listen), on a captured 'error' from any later <link>
// (only that link is healed, so siblings still loading are not retried), on load and on pageshow.
// Change the script ONLY here, then re-sweep every page (the fence fails until you do).
export const CSS_LINK = '<link rel="stylesheet" href="/styles.css" id="ss-css">';
export const CSS_HEAL = "<script>/* css self-heal: re-fetch any same-origin stylesheet whose download failed */(function(){function bad(l){try{return !l.sheet||!l.sheet.cssRules.length;}catch(e){return true;}}function fail(){this._f=1;setTimeout(heal,1500);}function heal(one){var ls=one&&one.nodeType===1?[one]:document.querySelectorAll('link[rel=\"stylesheet\"]');for(var i=0;i<ls.length;i++){var l=ls[i];if(l.hasAttribute('data-retry')||l.disabled||l.href.indexOf(location.origin+'/')!==0||!bad(l))continue;var r=l._r;if(r&&!r._f)continue;var n=l._n||0;if(n>=2)continue;l._n=n+1;if(r&&r.parentNode)r.parentNode.removeChild(r);r=document.createElement('link');r.rel='stylesheet';r.setAttribute('data-retry','');r.href=l.href.split('?')[0]+'?retry='+Date.now();r.onerror=fail;r.onload=function(){if(bad(this))fail.call(this);};l._r=r;l.parentNode.insertBefore(r,l.nextSibling);}}heal();document.addEventListener('error',function(e){var t=e.target;if(t&&t.tagName==='LINK'&&t.rel==='stylesheet')heal(t);},true);window.addEventListener('load',heal);window.addEventListener('pageshow',heal);})();</script>";
export const CSS_BLOCK = CSS_LINK + '\n' + CSS_HEAL;
