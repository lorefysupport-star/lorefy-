(function (root) {
  'use strict';
  var busy = false;
  async function pickInto(input) {
    var cap = root.Capacitor;
    var camera = cap && cap.Plugins && cap.Plugins.Camera;
    if (!camera || !cap.isNativePlatform() || busy) return false;
    busy = true;
    try {
      var photo = await camera.getPhoto({source:'PHOTOS', resultType:'base64', quality:85,
        width:1400, height:1400, correctOrientation:true, saveToGallery:false});
      if (!photo.base64String) throw new Error('Photo data unavailable');
      var format = String(photo.format || 'jpeg').toLowerCase();
      var extension = format === 'jpeg' || format === 'jpg' ? 'jpg' : format;
      var mime = {jpg:'image/jpeg',png:'image/png',webp:'image/webp'}[extension];
      if (!mime) throw new Error('Unsupported photo format');
      var binary = root.atob(photo.base64String);
      var bytes = new Uint8Array(binary.length);
      for (var i=0; i<binary.length; i++) bytes[i]=binary.charCodeAt(i);
      var transfer = new root.DataTransfer();
      transfer.items.add(new root.File([bytes], 'lorefy-photo.' + extension, {type:mime}));
      input.files=transfer.files;
      input.dispatchEvent(new root.Event('change', {bubbles:true}));
      return true;
    } catch (error) {
      if (!/cancel/i.test(String(error && error.message))) {
        if (root.dispatchEvent && root.CustomEvent) root.dispatchEvent(new root.CustomEvent('lorefy:image-error',
          {detail:{message:'تعذر اختيار الصورة. حاول مرة أخرى من مكتبة الصور.'}}));
      }
      return false;
    } finally { busy=false; }
  }
  root.LorefyNativePhotos={pickInto:pickInto};
  if (root.document) root.document.addEventListener('click', function (event) {
    var input=event.target;
    var cap=root.Capacitor;
    if (!input || input.type!=='file' || !/image/i.test(input.accept || '') ||
        !cap || !cap.isNativePlatform() || !cap.Plugins || !cap.Plugins.Camera) return;
    event.preventDefault();
    pickInto(input);
  }, true);
})(typeof window !== 'undefined' ? window : globalThis);
