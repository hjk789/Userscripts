# Media Speed Changer

Enables you to change the speed of video and audio with hotkeys (even if the media is inside an iframe)

## About

This userscript enables you to change the speed of video and audio with the PrintScreen, ScrollLock, Pause and Insert keys. It does this both for media in the page (HTML5 video or audio) or embeded media inside an IFRAME element. It was tested in both GreaseMonkey and TamperMonkey, although in GreaseMonkey some embeds won't change the speed, because of a bug in GreaseMonkey 4's IFRAME handling. So it works best on Tampermonkey or Violentmonkey.

### Hotkeys

- PrintScreen: 0.5x slower
- Pause/Break: 0.5x faster
- Shift + PrintScreen: 0.25x slower
- Shift + Pause/Break: 0.25x faster
- ScrollLock: Sets to 2x speed
- Shift + Insert: Sets to 3x speed
- Ctrl + ScrollLock: Sets to 4x speed
- Ctrl + Insert: Sets to 8x speed
- Insert: Sets to 16x speed
- Shift + ScrollLock: Sets to normal speed (1x)

You can freely change the keys or the speeds as you like. These are the ones that work best for me.

**Known issue:** In Firefox, a few sites (such as Twitter) block the script-managers from applying the userscript to the page. To workaround that you have to disable the `security.csp.enable` setting in about:config (not recommended for security reasons). An alternative workaround is using the bookmarklet below on these sites, it is the same code as the userscript, but shorter and adapted to be used as a bookmarklet which is run whenever you click on it.

```
javascript:(function(){function changeSpeed(e,n="absolute"){const a=document.querySelectorAll("video, audio");for(i=0;i<a.length;i++)a[i].playbackRate="absolute"==n?e:a[i].playbackRate+e;for(i=0;i<window.frames.length;i++)window.frames[i].postMessage("changeSpeed("+e+",'"+n+"')","*")}document.onkeyup=function(e){e.shiftKey&&"Pause"==e.key?changeSpeed(.25,"relative"):e.shiftKey&&"PrintScreen"==e.key?changeSpeed(-.25,"relative"):"Pause"==e.key?changeSpeed(.5,"relative"):"PrintScreen"==e.key?changeSpeed(-.5,"relative"):e.shiftKey&&"ScrollLock"==e.key?changeSpeed(1):e.shiftKey&&"Insert"==e.key?changeSpeed(3):!e.ctrlKey||"Cancel"!=e.key&&"ScrollLock"!=e.key?"ScrollLock"==e.key?changeSpeed(2):e.ctrlKey&&"Insert"==e.key?changeSpeed(16):"Insert"==e.key&&changeSpeed(8):changeSpeed(4)},window.self!=window.top&&window.addEventListener("message",function(e){try{eval(e.data)}catch(e){}});})();
```

## License

- You can view the code, download copies to your devices, install, run, use the features and uninstall this software.
- Feel free to refer to this userscript, just make sure to include a link to its [repository homepage](https://github.com/hjk789/Userscripts/tree/master/Media-Speed-Changer) or to its [GreasyFork page](https://greasyfork.org/scripts/409500-media-speed-changer).
- You can modify your copy as you like.
- You cannot do any other action not allowed in this license.
