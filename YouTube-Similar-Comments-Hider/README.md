# YouTube Similar Comments Hider

Ensure originality in YouTube's comment section by hiding all sorts of repeated comments, copy-paste comments, repeated quotes from the video and saturated memes.

## About

This userscript enables you to clean YouTube of mindless repetitive comments that pollute the videos' comment section. It works by comparing the comments to each other and calculating their similarity percentage, and any comment that has a similarity above the determined limit is hidden.

There are five tolerance levels you can choose to best suit your preference. The lower the tolerance the more similar comments will get hidden, but also the more false positives, and the higher the tolerance, the lower the false positives, but also the less able the script is to detect similarity. The default tolerance is level 3, "Very similar", which is the most balanced. Some comment sections require a lower or higher tolerance than others, so if you are not happy with the results, just choose a different tolerance in the dropdown menu. 

![tolerance menu](https://i.imgur.com/x0jLgnA.png)

All changes are instantly applied, although it may take some seconds on slow computers with a long list of loaded comments. The changes made in the dropdown are temporary, which means that when you refresh the page or open another video it will reset to the default settings. If you want to keep your preferences, just open the script and change the default values in the "Settings" section.

You can also choose to just mark the filtered comments instead of completely hiding them.

![lightened comments](https://i.imgur.com/OQXefYL.png)

**Known issue:** The script doesn't work when you are in any page of YouTube that is not a video and then left-click on a video, but it does work when you middle-click the video link or open it in a new tab. After the video is open in another tab, you can left-click in other videos from there with no problem. This happens because of how YouTube is coded and how userscripts work. I may implement a workaround anyday.

## License

- You can view the code, download copies to your devices, install, run, use the features and uninstall this software.
- Feel free to refer to this userscript, just make sure to include a link to its [GitHub homepage](https://github.com/hjk789/Creations/tree/master/JavaScript/Userscripts/YouTube-Similar-Comments-Hider) or to its [GreasyFork page](https://greasyfork.org/en/scripts/433914-youtube-similar-comments-hider).
- You can modify your copy as you like.
- You cannot do any other action not allowed in this license.
