# YouTube Mobile Repeated Recommendations Hider

Hide from YouTube's mobile browser any videos that are recommended more than twice. You can also hide by channel or by partial title.

## About

This userscript enables you to keep your YouTube mobile fresh with only new recommendations, automatically hiding any video that is recommended more than two times.

The script works by storing in your script-manager's local storage the URL of every video that appears in your homepage or related videos section (the one below the video you are watching). After the second time the same video is recommended, you won't see it ever more, as long as the script is enabled or the respective recommendation is included in the script's storage.

In case you want to make it hide after only one time, so that only brand new recommendations are shown, you can freely change in the script the max number of repetitions to 1.

If you want to know what videos are repeated but don't want to hide them, you have the option of dimming them.

Optionally you can also hide all videos of a specific channel, or videos that contain a specific text in the title. To do that, you just need to click on the recommended video's menu (the three dots button) and choose the option you want.

![Hide buttons](https://i.imgur.com/lCHgtDe.png)

Make sure to change the settings in the script to your preference.

This userscript was tested and works in Kiwi Browser with Tampermonkey on Android. Other mobile browsers that support installing script-managers may also work, although not tested.

**Known issue:** The script doesn't work when you open a video on the same tab (i.e, when you just touch the recommendation), but it does work when you open it in a new tab. This happens because of how YouTube is coded and how userscripts work. I may implement a workaround anyday.

## License
- You can view the code, download copies to your devices, install, run, use the features and uninstall this software.
- Feel free to refer to this userscript, just make sure to include a link to its [GitHub homepage](https://github.com/hjk789/Userscripts/tree/master/YouTube-Mobile-Repeated-Recommendations-Hider) or to it's [GreasyFork page](https://greasyfork.org/scripts/419666-youtube-mobile-repeated-recommendations-hider).
- You can modify your copy as you like.
- You cannot do any other action not allowed in this license.
