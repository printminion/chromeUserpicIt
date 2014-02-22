'use strict';

var pageInfo = {
    url: document.location.href,
    title: document.title,
    selection: window.getSelection().toString(),
    imageUrl: null
};

// Unique ID for the className.
var MOUSE_VISITED_CLASSNAME = 'crx_mouse_visited';

// Previous dom, that we want to track, so we can remove the previous styling.
var prevDOM = null;

function mousemoveActivate(on) {

    if (!on) {
        document.removeEventListener('mousemove', onMousemove, false);
        if (prevDOM != null) {
            prevDOM.classList.remove(MOUSE_VISITED_CLASSNAME);
        }
        return;
    }

    if (document.onmousemove != undefined && document.onmousemove != null) {
        console.log('mousemove already registered');
    }

    // Mouse listener for any move event on the current document.
    document.addEventListener('mousemove', onMousemove, false);

}

function onMousemove(e) {
    var srcElement = e.srcElement;

    if (prevDOM == e.srcElement) {
        return;
    }

    // Lets check if our underlying element is a DIV.
    if (srcElement.nodeName == 'DIV' || srcElement.nodeName == 'IMG'
        || srcElement.nodeName == 'SPAN' || srcElement.nodeName == 'P'
        || srcElement.nodeName == 'H1' || srcElement.nodeName == 'BODY'
        || srcElement.nodeName == 'INPUT'

        ) {

        // For NPE checking, we check safely. We need to remove the class name
        // Since we will be styling the new one after.
        if (prevDOM != null) {
            prevDOM.classList.remove(MOUSE_VISITED_CLASSNAME);
        }

        if (srcElement instanceof HTMLImageElement) {
            // Add a visited class name to the element. So we can style it.
            srcElement.classList.add(MOUSE_VISITED_CLASSNAME);
            // The current element is now the previous. So we can remove the
            // class
            // during the next iteration.
            prevDOM = srcElement;
            pageInfo.imageUrl = srcElement.getAttribute('src');

            chrome.extension.connect().postMessage({
                msg: "got_picture",
                pageInfo: pageInfo
            });
            return;
        }

        var computed = document.defaultView.getComputedStyle(srcElement, null);
        // console.log(computed);
        // console.log(computed.getPropertyValue('background-image'));

        if (computed.getPropertyValue('background-image') != 'none') {
            // Add a visited class name to the element. So we can style it.
            srcElement.classList.add(MOUSE_VISITED_CLASSNAME);

            pageInfo.imageUrl = computed.getPropertyValue('background-image');
            pageInfo.imageUrl = stripUrl(pageInfo.imageUrl);

            chrome.extension.connect().postMessage({
                msg: "got_picture",
                pageInfo: pageInfo
            });

        } else {
            pageInfo.imageUrl = null;
            chrome.extension.connect().postMessage({
                msg: "no_picture",
                pageInfo: pageInfo
            });
        }

        // The current element is now the previous. So we can remove the class
        // during the next iteration.
        prevDOM = srcElement;
    } else {
        // For NPE checking, we check safely. We need to remove the class name
        // Since we will be styling the new one after.
        if (prevDOM != null) {
            prevDOM.classList.remove(MOUSE_VISITED_CLASSNAME);
            prevDOM = null;
            chrome.extension.connect().postMessage({
                msg: "no_picture",
                pageInfo: pageInfo
            });
        }

    }
}

/*
 * get messages from background.html
 */

chrome.extension.onRequest.addListener(function (request, sender, sendResponse) {
    switch (request.msg) {
        case 'mousemove_on':
            mousemoveActivate(true);
            break;
        case 'mousemove_off':
            mousemoveActivate(false);
            break;
    }
});

function stripUrl(str) {
    str = str.slice(4, str.length);
    str = str.slice(0, str.length - 1);
    return str;
}