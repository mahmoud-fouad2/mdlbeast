import { Request, Response, NextFunction } from 'express'

const polyfillScript = `\n<script>try{new MessageChannel()}catch(e){(function(){function Port(){this.onmessage=null;}Port.prototype.postMessage=function(m){var s=this;setTimeout(function(){try{if(typeof s.onmessage==='function')s.onmessage({data:m})}catch(e){}},0)};window.MessageChannel=function(){return{port1:new Port(),port2:new Port()}}})()}try{new CustomEvent('__zaco_test',{detail:{}})}catch(e){(function(){function CustomEventPoly(t,p){p=p||{bubbles:false,cancelable:false,detail:null};var ev=document.createEvent('CustomEvent');ev.initCustomEvent(t,p.bubbles,p.cancelable,p.detail);return ev}CustomEventPoly.prototype=(window.Event||function(){}).prototype;window.CustomEvent=CustomEventPoly})();} </script>\n`

export default function injectHtmlPolyfill(req: Request, res: Response, next: NextFunction) {
  // Only target GET requests for archive pages that return HTML
  if (req.method !== 'GET') return next()
  if (!req.path.startsWith('/archive')) return next()

  const originalSend = res.send.bind(res)

  res.send = function (body?: any) {
    try {
      if (typeof body === 'string' && body.indexOf('<head') !== -1) {
        // Insert polyfill right after opening <head> tag
        body = body.replace(/<head(.*?)>/i, match => match + polyfillScript)

        // NOTE: previously we removed a specific chunk (249261e921aeebba.js) as an emergency hotfix.
        // Removing that strip so we don't mask the root cause; instead log occurrences so we can diagnose in production.
        try {
          if (/<script[^>]*src=["'][^"']*249261e921aeebba\\.js(?:\\?[^"']*)?["'][^>]*>/i.test(body)) {
            try { console.warn('[injectHtmlPolyfill] detected reference to problematic chunk 249261e921aeebba.js for', req.path) } catch(e) {}
          }
        } catch (e) {
          // ignore
        }
      }
    } catch (e) {
      // ignore
    }

    return originalSend(body)
  }

  next()
}
