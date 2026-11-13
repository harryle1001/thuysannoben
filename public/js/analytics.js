// Google Analytics 4 (the measurement ID comes from the script tag's data-ga attribute).
(function () {
  var el = document.currentScript;
  var id = el && el.getAttribute('data-ga');
  if (!id) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', id);
  // Count the actions that matter: calls, Zalo, Messenger, chatbot, contact form.
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a, button');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    var name = href.indexOf('tel:') === 0 ? 'click_call'
      : href.indexOf('zalo.me') > -1 ? 'click_zalo'
      : href.indexOf('m.me') > -1 ? 'click_messenger'
      : a.hasAttribute('data-chat-open') ? 'open_chatbot' : '';
    if (name) window.gtag('event', name, { link_url: href, page_path: location.pathname });
  });
  document.addEventListener('submit', function (e) {
    if (e.target.matches && e.target.matches('[data-lead-form]')) window.gtag('event', 'generate_lead', { page_path: location.pathname });
  });
})();
