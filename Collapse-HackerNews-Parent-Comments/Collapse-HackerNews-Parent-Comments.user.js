// ==UserScript==
// @name            Collapse HackerNews Parent Comments
// @description     Adds vertical bars to the left of the comments, enabling you to easily collapse the parent comments. It also can leave only a specified number of comments expanded and auto-collapse the rest.
// @author          BLBC (github.com/hjk789, greasyfork.org/users/679182-hjk789)
// @copyright       2020+, BLBC (github.com/hjk789, greasyfork.org/users/679182-hjk789)
// @version         1.2
// @homepage        https://github.com/hjk789/Creations/tree/master/Userscripts/Collapse-HackerNews-Parent-Comments
// @license         https://github.com/hjk789/Creations/tree/master/Userscripts/Collapse-HackerNews-Parent-Comments#license
// @grant           none
// @include         https://news.ycombinator.com/item*
// ==/UserScript==


//--------------- Settings -----------------

const collapse = true   // Whether all comments, other than the number of comments below, should be collapsed.
                        // If set to false, all comments will be left expanded and the settings below have no effect.
    const numberOfRoots = 3
    const numberOfReplies = 2
    const numberOfRepliesOfReplies = 1

//------------------------------------------


const fadeOnHoverStyle = document.createElement("style")
fadeOnHoverStyle.innerHTML = ".verticalBar:hover { background-color: gray !important; }"
document.body.appendChild(fadeOnHoverStyle)

// HackerNews puts a 1x1 image before each comment and sets it's width according to each comment depth. Each level of depth adds
// 40px of width to this image, starting from 0 which are the root comments. The ones with a 14px width are flagged comments and
// the "More comments" link. And because HackerNews layout doesn't have any easier way of identifying the hierarchy of the
// comments (it's just a list of comments pushed to the right), that's the only way I've found to achieve this.

spacingImgs = document.querySelectorAll(".ind img[height='1']:not([width='14'])")

let root = 0
let i = spacingImgs.length-1    // It's required to loop backwards, otherwise the hidden comments reappear when collapsed.
let commentHier = []

collapseAll = setInterval(function()   // An interval of 1ms is being used to prevent the page from freezing until it finishes. Also, it creates a cool effect when
{                                      // the comments are being collapsed. It does make it take a few more seconds to finish in comment-heavy posts (150+) though.
    const commentContainer = spacingImgs[i].parentElement.parentElement.parentElement.parentElement.parentElement
    commentContainer.style = "border-top: 5px transparent solid"  // To visually separate each vertical bar.
    spacingImgs[i].parentElement.style = "position: relative"

    let commentToggle = spacingImgs[i].parentElement.parentElement.querySelector(".togg")

    if (collapse && !commentContainer.parentElement.classList.contains("coll"))   // Collapse only if it's not collapsed yet. This is for signed-in users, as HN remembers which comments were collapsed.
        commentToggle.click()

    i--

    if (i == -1)    // When finished collapsing and adding the vertical bars to all comments, now it's time to expand only a few of the first comments.
    {
        clearInterval(collapseAll)

        for (i=0; i < spacingImgs.length; i++)
        {
            const level = spacingImgs[i].width / 40

            let commentToggle = spacingImgs[i].parentElement.parentElement.querySelector(".togg")

            // Store the current hierarchy in an array
            commentHier[level] = commentToggle


            let divs = []
            for (j = spacingImgs[i].width; j >= 0; j -= 40)  // Start adding the vertical bar from the current depth and go backwards.
            {
                // Create the vertical bar

                const div = document.createElement("div")
                div.className = "verticalBar"
                div.commentHier = commentHier[j/40]        // Store in an attribute of the element this comment's parent respective to the level of the vertical bar, for easy access.
                div.onclick = commentHier[j/40].onclick    // When a vertical bar is clicked, collapse the respective parent comment.
                div.onmouseup = function(e)
                {
                    if (e.target.commentHier.getBoundingClientRect().y < 0)  // If the parent comment is off-screen above,
                        e.target.commentHier.scrollIntoView()                // scroll to it.
                }

                let style = "left: " + (-5 + j) + "px; width: 12px; background-color: lightgray; position: absolute; z-index: 99; transition: 0.15s; "

                // Make it so that the vertical bars are only separated when followed by comments of same level of depth

                if (j == spacingImgs[i].width && spacingImgs[i-1] != null && spacingImgs[i].width <= spacingImgs[i-1].width)
                    style += "top: 5px; height: calc(100% + 8px); "
                else
                    style += "top: 0px; height: calc(100% + 13px); "

                div.style = style

                divs.push(div)
            }

            for (j = divs.length - 1; j >= 0; j--)
                spacingImgs[i].parentElement.appendChild(divs[j])
        }

        if (collapse)
        {
            root = 0
            for (i=0; i < spacingImgs.length; i++)
            {
                commentToggle = spacingImgs[i].parentElement.parentElement.querySelector(".togg")

                if (spacingImgs[i].width == 0)  // If it's a root comment.
                {
                    root++
                    if (root == numberOfRoots + 1)  break  // If there's already <numberOfRoots> comments expanded, then stop expanding.

                    commentToggle.click()
                    sub40 = 0
                    sub80 = 0
                }
                else if (spacingImgs[i].width == 40 && sub40 < numberOfReplies)  // If it's a reply to the root comment, only expand up to <numberOfReplies>.
                {
                    commentToggle.click()
                    sub40++
                    sub80 = 0
                }
                else if (spacingImgs[i].width == 80 && sub80 < numberOfRepliesOfReplies)  // If it's a reply to the reply, only expand up to <numberOfRepliesOfReplies>.
                {
                    commentToggle.click()
                    sub80++
                }
            }
        }
    }

}, 1)

