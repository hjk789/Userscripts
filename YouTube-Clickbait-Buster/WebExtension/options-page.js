
(async ()=>
{
    // Load all YouTube Clickbait-Buster's settings. All these functions are imported from the utils.js script.
    await loadYCBsettings()

    const numberChunkColumnsInput = document.getElementById("numberChunkColumns")
    const fullTitlesInput = document.getElementById("fullTitles")
    const sortByTopCommentsInput = document.getElementById("sortByTopComments")
    const preferredTranscriptLanguageInput = document.getElementById("preferredTranscriptLanguage")

    /* Display the current settings values */
    numberChunkColumnsInput.value = YCBsettings.numberChunkColumns
    fullTitlesInput.checked = YCBsettings.fullTitles
    sortByTopCommentsInput.checked = YCBsettings.sortByTopComments
    preferredTranscriptLanguageInput.value = YCBsettings.preferredTranscriptLanguage

    /* Save the settings when changed */
    numberChunkColumnsInput.onchange = function() { YCBsettings.numberChunkColumns = this.value; saveSettings() }
    fullTitlesInput.onchange = function() { YCBsettings.fullTitles = this.checked; saveSettings() }
    sortByTopCommentsInput.onchange = function() { YCBsettings.sortByTopComments = this.checked; saveSettings() }
    preferredTranscriptLanguageInput.onchange = function() { YCBsettings.preferredTranscriptLanguage = this.value; saveSettings() }

})()
