// ==UserScript==
// @name            YouTube Similar Comments Hider
// @version         1.1
// @description     Ensure originality in YouTube's comment section by hiding all sorts of repeated comments, copy-paste comments, quotes from the video and saturated memes.
// @author          BLBC (github.com/hjk789, greasyfork.org/users/679182-hjk789)
// @copyright       2021+, BLBC (github.com/hjk789, greasyfork.org/users/679182-hjk789)
// @homepage        https://github.com/hjk789/Creations/tree/master/JavaScript/Userscripts/YouTube-Similar-Comments-Hider
// @license         https://github.com/hjk789/Creations/tree/master/JavaScript/Userscripts/YouTube-Similar-Comments-Hider#license
// @match           https://www.youtube.com/watch*
// @grant           none
// ==/UserScript==


//--------------- SETTINGS ---------------

const tolerance = 3
// 1 - Loosely similar: Pretty much all similar comments will be detected, but there will be many false positives. False positives are comments that are *worded* similarly but have two totally different subjects.
// 2 - Significantly similar: Many similar comments will be detected, but with some false positives.
// 3 - Very similar: An acceptable detection rate with few false positives, but several comments that are similar, but worded differently, won't be detected.
// 4 - Mostly similar: Detects only comments that are very close variations of another, such as several comments repeating the same quote from the video with just few differences.
// 5 - Almost identical: Detects only comments that are mostly copy-pasted with little to no variation.

let lightenSimilarComments = false     // If set to true, all similar comments will be dimmed (faded) instead of completely hidden.

//----------------------------------------



let treshold = getTreshold(tolerance)       // Set the minimum similarity percentage to treat the comment as similar, depending on the tolerance level.

let samples = []

const waitForCommentSection = setInterval(function()
{
    let commentSection = document.getElementById("comments").querySelector("#contents")

    if (!commentSection)
        return

    clearInterval(waitForCommentSection)


    /* Attach a mutation observer to the comments section to detect when more comments are loaded, and process them */

    const loadedCommentsObserver = new MutationObserver(function(mutations)
    {
        for (let i=0; i < mutations.length; i++)
        {
            if (!!mutations[i].addedNodes)
                processComments(mutations[i].addedNodes)
        }
    })

    loadedCommentsObserver.observe(commentSection, {childList: true})



    const waitForCommentSectionHeader = setInterval(function()
    {
        if (!document.getElementById("sort-menu"))
            return

        clearInterval(waitForCommentSectionHeader)


        /* Create the "Filter tolerance" dropdown menu */

        const style = document.createElement("style")
        style.innerHTML = "#toleranceMenu div div div:hover { background-color: #e7e7e7 !important; }"
        document.head.appendChild(style)

        const toleranceMenuContainer = document.createElement("div")
        toleranceMenuContainer.id = "toleranceMenu"
        toleranceMenuContainer.innerHTML = "FILTER TOLERANCE"
        toleranceMenuContainer.style = "width: 130px; height: 24px; margin-left: 50px; font-size: 14px; font-weight: 500; z-index: 99; cursor: pointer;"
        toleranceMenuContainer.onclick = function() { this.lastChild.style.visibility = this.lastChild.style.visibility ? "" : "hidden"; event.stopPropagation() }

        const dropdownContainer = document.createElement("div")
        dropdownContainer.style = "background-color: white; width: max-content; margin-left: -15px; margin-top: 16px; border: lightgray 1px solid; border-radius: 3px; visibility: hidden;"

        const dropdownItemsContainer = document.createElement("div")
        dropdownItemsContainer.style = "font-weight: initial; letter-spacing: 0.3px; padding-top: 7px;"

        createToleranceDropdownItem("Loosely similar", 1, dropdownItemsContainer)
        createToleranceDropdownItem("Significantly similar", 2, dropdownItemsContainer)
        createToleranceDropdownItem("Very similar", 3, dropdownItemsContainer)
        createToleranceDropdownItem("Mostly similar", 4, dropdownItemsContainer)
        createToleranceDropdownItem("Almost indentical", 5, dropdownItemsContainer)


        /* Create the "Hide comments" checkbox */

        const hideCommentsCheckbox = document.createElement("input")
        hideCommentsCheckbox.id = "hideComments"
        hideCommentsCheckbox.type = "checkbox"
        hideCommentsCheckbox.style = "margin-top: 10px; margin-bottom: 10px;"
        hideCommentsCheckbox.checked = !lightenSimilarComments
        hideCommentsCheckbox.onchange = function()
        {
            lightenSimilarComments = !this.checked

            if (this.checked)
            {
                const comments = document.getElementById("comments").querySelectorAll("ytd-comment-thread-renderer[style^='opacity']")

                for (let i=0; i < comments.length; i++)
                    comments[i].style = "display: none;"
            }
            else
            {
                const comments = document.getElementById("comments").querySelectorAll("ytd-comment-thread-renderer[style^='display']")

                for (let i=0; i < comments.length; i++)
                    comments[i].style = "opacity: 0.5;"
            }

        }

        const hideCommentsLabel = document.createElement("label")
        hideCommentsLabel.for = "hideComments"
        hideCommentsLabel.style = "padding: 8px 19px; border-top: 1px solid; user-select: none;"
        hideCommentsLabel.innerHTML = "Hide comments"

        hideCommentsLabel.insertBefore(hideCommentsCheckbox, hideCommentsLabel.firstChild)

        dropdownItemsContainer.appendChild(hideCommentsLabel)

        dropdownContainer.appendChild(dropdownItemsContainer)

        toleranceMenuContainer.appendChild(dropdownContainer)

        document.getElementById("sort-menu").parentElement.appendChild(toleranceMenuContainer)

        document.body.onclick = function() { document.getElementById("toleranceMenu").lastChild.style.visibility = "hidden" }        // Make the dropdown be dismissed when clicked outside of it.


    }, 100)

}, 100)



function getTreshold(tolerance)
{
    return tolerance == 1 ? 25 : tolerance == 2 ? 35 : tolerance == 3 ? 45 : tolerance == 4 ? 55 : 65
}

function createToleranceDropdownItem(text, toleranceLevel, container)
{
    const item = document.createElement("div")
    item.innerHTML = text
    item.style.padding = "15px"
    item.onclick = function()
    {
        this.parentElement.querySelector("[style*='background-color']").style.backgroundColor = ""        // Remove the selected style from the previous selected item.
        this.style.backgroundColor = "#e7e7e7"
        this.parentElement.parentElement.style.visibility = "hidden !important"        // Hide the dropdown list when an item is selected.

        reprocessComments(toleranceLevel)
    }

    if (tolerance == toleranceLevel)
        item.style.backgroundColor = "#e7e7e7"

    container.appendChild(item)
}

function reprocessComments(tolerance)
{
    treshold = getTreshold(tolerance)

    const comments = document.getElementById("comments").querySelector("#contents").children

    processComments(comments, true)
}

function processComments(comments, reprocess = false)
{
    for (let i=0; i < comments.length; i++)
    {
        const commentBody = comments[i].querySelector("#content-text")
        if (!commentBody)          // Sometimes the comments list includes an empty object. When it's such a case, skip to the next one.
            continue

        // Standardize the comments for the processing by making them lowercase and without punctuation marks, diacritics or linebreaks, so that the differences between comments are in the words used instead of the characters.
        const comment = commentBody.textContent.toLocaleLowerCase().replace(/[.,!\-\n]/g, " ").replace(/ +/g, " ").normalize("NFD").replace(/[\u0300-\u036f*"'’“”]/g, "").trim()

        if (!reprocess)             // If it's a reprocess, don't add the comment again to the samples list, otherwise the list would get duplicated.
            samples.push(comment)
        else
        {
            // Reset the style of the filtered comments
            if (comments[i].style.opacity || comments[i].style.display)
                comments[i].removeAttribute("style")
        }

        let n = samples.length
        if (!reprocess)  n--               // The first time the processing is done, the comment should not be compared to the sample added last, as it would be comparing to itself ...

        for (let j=0; j < n; j++)
        {
            if (reprocess && i == j)       // ... On the other hand, in the reprocessings, the comparison should stop on equal indexes to not compare to itself.
                break

            const sample = samples[j]

            let similarity1 = calculateSimilarity(sample, comment)

            if (similarity1 >= treshold)
            {
                let similarity2 = calculateSimilarity(comment, sample)    // Recalculate the other way round to ensure that these two comments are similar to each other in both ways.

                if (similarity2 >= treshold)
                {
                    console.log("Similarity C->S: "+similarity1+"   ###   Similarity S->C: "+similarity2+"   ###   Treshold: "+treshold+"   ###   Sample: "+sample+"   ###   Comment: "+comment)

                    if (lightenSimilarComments)
                        comments[i].style.opacity = 0.5
                    else
                        comments[i].style.display = "none"

                    break
                }
            }
        }
    }
}

function calculateSimilarity(a, b)
{
    let hits = 0
    let string = ""

    for (let i=0; i < b.length; i++)       // For each character of the comment ...
    {
        string += b[i]                     // ... append it to a string ...

        if (a.includes(string))            // ... and check if the resulting string can be found in the other comment, and if so, continue appending the characters.
        {
            if (string.length > 2)         // When the other comment contains the string, when it's at least 3 characters long ...
            {
                hits++                     // ... start counting the number of hits for each character.

                if (string.length == 3)    // If the string has three characters, recover the two uncounted hits.
                    hits += 2
            }
        }
        else string = ""                   // If the comment doesn't contain the string, clear the string and start building it again with the rest of the characters.
    }

    const similarity = hits/b.length*100      // Get the proportion of hits out of the total of characters of the comment.

    return similarity
}