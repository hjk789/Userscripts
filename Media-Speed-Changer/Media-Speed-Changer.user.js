// ==UserScript==
// @name            Media Speed Changer
// @description     Enables you to change the speed of video and audio with hotkeys (even if the video is inside an iframe)
// @author          BLBC (github.com/hjk789, greasyfork.org/users/679182-hjk789)
// @copyright       2020+, BLBC (github.com/hjk789, greasyfork.org/users/679182-hjk789)
// @version         1.1
// @homepage        https://github.com/hjk789/Creations/tree/master/Userscripts/Media-Speed-Changer
// @license         https://github.com/hjk789/Creations/tree/master/Userscripts/Media-Speed-Changer#license
// @grant           none
// @include         *
// @namespace https://greasyfork.org/users/679182
// ==/UserScript==

document.onkeyup = function(e)
{
    if      (e.shiftKey && e.key == "Pause")       changeSpeed(0.5,  "relative")
    else if (e.shiftKey && e.key == "PrintScreen") changeSpeed(-0.5, "relative")
    else if (e.key == "Pause")                     changeSpeed(0.25,  "relative")
    else if (e.key == "PrintScreen")               changeSpeed(-0.25, "relative")
    else if (e.shiftKey && e.key == "ScrollLock")  changeSpeed(1)
    else if (e.key == "ScrollLock")                changeSpeed(2.5)
    else if (e.ctrlKey && e.key == "Cancel")       changeSpeed(4)  // Ctrl + ScrollLock/Pause = Cancel
    else if (e.ctrlKey && e.key == "Insert")       changeSpeed(16)
}

function changeSpeed(value, mode = "absolute")
{
    const medias = document.querySelectorAll("video, audio")

    for (i=0; i < medias.length; i++)
        medias[i].playbackRate = (mode == "absolute" ? value : medias[i].playbackRate + value)

    for (i=0; i < window.frames.length; i++)
        window.frames[i].postMessage("changeSpeed(" + value + ",'" + mode + "')", "*")
}

if (window.self == window.top)
{
    // Workaround for GreaseMonkey's bug of not running inside IFRAMEs. But there are some embeded medias that still won't have the script running in it,
    // like YouTube's embeds. You'll have to use another script-engine, like Tampermonkey or Violentmonkey.

    if (typeof GM_info != "undefined" && GM_info.scriptHandler == "Greasemonkey")
    {
        setInterval(function()  // For sites that lazy-load the iframes
        {
            const iframes = document.querySelectorAll("iframe")

            for (i=0; i < iframes.length; i++)
            {
                if (/youtube|player|video|\.mp4|audio/.test(iframes[i].src) && !/comments/.test(iframes[i].src))  // Only frames that are likely for media embedding
                {
                    const frameParent = iframes[i].offsetParent
                    frameParent.innerHTML = frameParent.innerHTML.replace(/(<iframe .+?) src=/, "$1 data=").replace("<iframe ","<object ")  // Change the IFRAME element to an OBJECT element, so that the script can run inside it
                }
            }

        }, 2000)
    }

}
else
{
    window.addEventListener("message", function(e){
        try { eval(e.data) } // Some frames have CSP protection, which throws an error and breaks the script. This try-catch prevents it from breaking.
        catch(e) {}
    })
}
