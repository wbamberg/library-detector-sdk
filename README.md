
This is an account of my experience of porting Paul Bakaus's Library Detector (https://addons.mozilla.org/de/firefox/addon/library-detector/) to the SDK. It was suggested to me by Louis-Rémi Babe, as an add-on that's really simple but still useful.

# What the Library Detector Does #

The Library Detector tells you which JavaScript frameworks the current web page is using. It does this by checking whether particular objects that those libraries add to the global window object are defined. For example, if window.jQuery is defined, then the page has loaded jQuery.

For each library that it finds, the library detector adds an icon representing that library to the status bar. It adds a tooltip to each icon containing the library name and version.

# How the Library Detector Works #

All the work is done inside a single file "librarydetector.xul". This contains two main things: a XUL overlay an a script. The XUL overlay adds a `box` element to the statusbar:

    <statusbar id="status-bar">
      <box orient="horizontal" id="librarydetector">
      </box>
    </statusbar>

The script does everything else.

## Library Detector Script ##

The bulk of the script is an array of test objects, one for each library. Each test object contains a test function: if the function passes, the function defines various additional properties for the test object, such as a `version` property containing the library version. Each test also contains a chrome URL pointing to the icon associated with its library.

The script listens to gBrowser's DOMContentLoaded event. When it is triggered, the `testLibraries` function builds an array of libraries by iterating through the tests and adding information for libraries which pass. There is some cleverness in here which I think is to find libraries which are loaded into iframes, without allowing duplicate elements in the list.

Once the list is built, the `switchLibraries` function constructs a XUL statusbarpanel element for each library it found, and adds it to the box.

Finally, it listen to gBrowser's TabSelect event, to update the contents of the box for that window.

# Porting #

The widget module is a natural fit for this add-on's UI. We'll want to specify its content using HTML, so we can supply an array of icons, but it doesn't look like that will be a problem. The widget must display different content for different windows, so we'll use the new WidgetView object.

The test objects in the original script need access to the DOM window object, so we'll package those in a content script. In fact, they need access to the un-proxied DOM window, so they can see the objects added by libraries, so we'll need to use the experimental unsafeWindow object. We'll use a page-mod to inject the content script into each page.

So at the high level, we'll have:

1 - a main.js which:

* creates the page-mod to match all URLs and run scripts at window.onload (i.e. setting contentScriptWhen="end")
* creates a widget
* responds to messages from each of the page-mod's workers by updating a list of libraries which it will attach to the tab which corresponds to that worker
* listens for tab events: when a tab becomes active it should update the widgetview's content
* has some code to build the HTML content for the widget, given the information sent from the page mod's workers

2 - a content script which keeps the existing script mostly intact, but removes the chrome:// URLs for icons, and the `switchLibraries` function, since we're now building the UI inside main.js. Instead, we'll add the code to send the list of libraries back to main.js.

Finally, the existing script uses gBrowser to register event listeners and work out which tab is active, and it stores the list of libraries in the DOM. Content scripts don't have access to gBrowser, so we'll manage all that inside main.js.

## Dealing with iframes ##

If a library is loaded into an iframe, then its objects will only be added to that iframe's embedded window (I think, or something like that). The existing script will run for every window that generates the DOMContentLoaded event. It will look for libraries loaded into that window, and if it finds any, it will add the library information to that window's topmost window, via `window.top`. It also avoids duplicates, to ensure that each library is only added once even if it is loaded into multiple iframes that share a topmost window.

We need to do something similar, except that we are maintaining the list of libraries in the addon code. So in our version the code in the content script is substantially simpler. The content script is executed once for every window.onload event, so it will run multiple times when a single page containing multiple iframes is loaded. We just make the list of all libraries in that window, and post the list to main.js using `postMessage`.

In main.js we handle the message by: fetching the tab corresponding to that worker using `worker.tab`, and adding the set of libraries to that tab's `libraries` property, avoiding duplicates.

## Working Around Tooltips ##

So far my idea had been to make the interface identical to the existing version, in which the library information is shown as a tooltip. So the code that built the widget content inserted `title` attributes inside the `img` icon elements, and I thought this might be enough for tooltips to work. But it wasn't :(. With Alex's help I understood that it isn't possible to have tooltips associated with elements in a widget.

So instead, I decided to use a panel to show the library information. I need a content script for the widget, to listen to `mouseover` events in the widget and send a message containing the associated library information. In the event listener for this message I initially tried to display the panel: that preserves the original UI in which the library information is shown on mouseover. But if I do that, I can't anchor the panel to the widget and it appears in the middle of the browser window. So I have to use the panel that belongs to the widget and is shown on click.

Finally, I needed another content script to update the panel's content with the library information. This was a bit of a pain, and I found myself wishing for a way to set the panel's content directly, in the same way I can with the widget. Then would have been just a variable assignment.

# Conclusions ##

It was mostly pretty smooth! Things I thought would have made it smoother:

* I spent a bit of time confused about gBrowser, and that makes me feel that we should do a better job of explaining what's available in a XUL script that isn't available in content scripts (though that may just be my inexperience with XUL, and thus not very applicable to this audience).

* Not being able to use tooltips was a bit of a pain. Actually, I like the new interface better, but specifying the interface declaratively using tooltips is nice, and it's a shame that that is harder with the SDK.

* Being able to anchor a panel to the widget would have given me more flexibility about the UI, although I think click-to-show is fine.

* It seemed clunky to have to use a content script to update the panel's content.
