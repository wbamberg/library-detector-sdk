Now we've shipped the first stable release, one of our top priorities is to make it easier for people to port their add-ons to the [new Add-on SDK](https://addons.mozilla.org/en-US/developers/builder). I thought a small experiment would help me understand better what's involved in porting to the SDK, and highlight some of the rough edges which make it harder than it needs to be. [Louis-Rémi Babe](http://www.louisremi.com/) suggested porting [Paul Bakaus's Library Detector](https://addons.mozilla.org/de/firefox/addon/library-detector/), since it's really simple, but still a useful tool.

# What the Library Detector does #

The Library Detector tells you which JavaScript frameworks the current web page is using. It does this by checking whether particular objects that those libraries add to the global window object are defined. For example, if `window.jQuery` is defined, then the page has loaded jQuery.

For each library that it finds, the library detector adds an icon representing that library to the status bar. It adds a tooltip to each icon, which contains the library name and version.

# How the Library Detector works #

All the work is done inside a single file, ["librarydetector.xul"](http://code.google.com/p/librarydetector/source/browse/trunk/chrome/content/librarydetector.xul). This contains:

* a XUL modification to the browser chrome
* a script

The XUL modification adds a `box` element to the browser's status bar:

    <statusbar id="status-bar">
      <box orient="horizontal" id="librarydetector">
      </box>
    </statusbar>

The script does everything else.

## Library Detector script ##

The bulk of the script is an array of test objects, one for each library. Each test object contains a `test` attribute which is a function: if the function finds the library, it defines various additional properties for the test object, such as a `version` property containing the library version. Each test also contains a `chrome://` URL pointing to the icon associated with its library.

The script listens to gBrowser's `DOMContentLoaded` event. When this is triggered, the `testLibraries` function builds an array of libraries by iterating through the tests and adding an entry for each library which passes.

If a library is loaded into an iframe, then its objects will only be added to that iframe's embedded window. The existing script will run for every window that generates the `DOMContentLoaded` event. It will look for libraries loaded into that window, and if it finds any, it will add the library information to that window's topmost window, via `window.top`. It also avoids duplicates, to ensure that each library is only added once even if it is loaded into multiple iframes that share a topmost window.

Once the list is built, the `switchLibraries` function constructs a XUL `statusbarpanel` element for each library it found, populates it with the icon at the corresponding `chrome://` URL, and adds it to the box.

Finally, it listen to gBrowser's `TabSelect` event, to update the contents of the box for that window.

# Porting #

The [widget](https://addons.mozilla.org/en-US/developers/docs/sdk/latest/packages/addon-kit/docs/widget.html) module is a natural fit for this add-on's UI. We'll want to specify its content using HTML, so we can display an array of icons. The widget must be able to display different content for different windows, so we'll use the new [`WidgetView`](https://addons.mozilla.org/en-US/developers/docs/sdk/latest/packages/addon-kit/docs/widget.html#WidgetView) object.

The test objects in the original script need access to the DOM window object, so we'll package those in a content script. In fact, they need access to the un-proxied DOM window, so they can see the objects added by libraries, so we'll need to use the experimental [`unsafeWindow`](https://wiki.mozilla.org/Labs/Jetpack/Release_Notes/1.0#Bug_601295:_Content_script_access_to_the_DOM_is_now_proxied) object. We'll use a [page-mod](https://addons.mozilla.org/en-US/developers/docs/sdk/latest/packages/addon-kit/docs/page-mod.html) to inject the content script into each page.

The content script is executed once for every `window.onload` event, so it will run multiple times when a single page containing multiple iframes is loaded. We just make a list of all the libraries we found in that window, and post the list to main.js using `self.postMessage`.

In main.js we handle the message by: fetching the tab corresponding to that worker using `worker.tab`, and adding the set of libraries to that tab's `libraries` property, avoiding duplicates.

So to begin with we'll have 2 scripts, a main.js and a content script which we'll call "library-detector.js".

### main.js ###

First, main.js creates a page-mod. The page-mod matches all URLs and runs scripts at `window.onload` (i.e. setting `contentScriptWhen: "end"`). It responds to messages from each of the page-mod's workers by updating a list of libraries which it will attach to the tab which corresponds to that worker.

<pre><code>
pageMod.PageMod({
  include: "*",
  contentScriptWhen: 'end',
  contentScriptFile: (data.url('library-detector.js')),
  onAttach: function(worker) {
    worker.on('message', function(libraryList) {
      if (!worker.tab.libraries) {
        worker.tab.libraries = [];
      }
      libraryList.forEach(function(library) {
        if (worker.tab.libraries.indexOf(library) == -1) {
          worker.tab.libraries.push(library);
        }
      });
      if (worker.tab == tabs.activeTab) {
        updateWidgetView(worker.tab);
      }
    });
  }
});
</code></pre>

Next we create a widget, and include some code to build the HTML content for the widget, given the information sent from the page mod's workers:

<pre><code>
var widget = widgets.Widget({
  id: "library-detector",
  label: "Library Detector",
  content: "<html></html>",
});

function buildWidgetViewContent(libraryList) {
  // some very boring code that constructs and returns the HTML
}
</code></pre>

Finally we listen for tab events: on `activate` a tab should update the content of the `WidgetView` attached to the tab's window:

<pre><code>
function updateWidgetView(tab) {
  let widgetView = widget.getView(tab.window);
  if (!tab.libraries) {
    tab.libraries = [];
  }
  widgetView.content = buildWidgetViewContent(tab.libraries);
  widgetView.width = tab.libraries.length * ICON_WIDTH;
}

tabs.on('activate', function(tab) {
  updateWidgetView(tab);
});
</code></pre>

To deal with location changes, on the `ready` event, reset the list:

<pre><code>
tabs.on('ready', function(tab) {
  tab.libraries = [];
});
</code></pre>

### library-detector.js ###

This keeps the existing script mostly intact, but:

* removes the `chrome://` URLs for icons, and the `switchLibraries` function, since we're now building the UI inside main.js

* rewrites and simplifies `testLibraries`:

<pre><code>
function testLibraries() {
  var win = unsafeWindow;
  var libraryList = [];
  for(var i in LD_tests) {
    var passed = LD_tests[i].test(win);
    if (passed) {
      let libraryInfo = {
        name: i,
        version: passed.version
      };
      libraryList.push(libraryInfo);
    }
  }
  self.postMessage(libraryList);
}

testLibraries();
</code></pre>

## Working around tooltips ##

So far the idea had been to make the interface identical to the existing version, in which the library information is shown as a tooltip. So the code that built the widget content inserted `title` attributes inside the `img` icon elements, and I thought this might be enough for tooltips to work. But it wasn't :(. With Alex's help I understood that it isn't possible to have tooltips associated with elements in a widget.

So instead, I decided to use a panel to show the library information. I need a content script for the widget, to listen to `mouseover` events in the widget and send a message containing the associated library information:

<pre><code>
function setLibraryInfo(element) {
  self.port.emit('setLibraryInfo', element.target.title);
}

var elements = document.getElementsByTagName('img');

for (var i = 0; i < elements.length; i++) {
  elements[i].addEventListener('mouseover', setLibraryInfo, false);
}
</code></pre>

In the event listener for this message I initially tried to display the panel by calling `panel.show`: that preserves the original UI in which the library information is shown on mouseover. But if I do that, I can't anchor the panel to the widget and it appears in the middle of the browser window. So I have to use the panel that belongs to the widget and is shown on click. So now, in the event listener I'll just update the panel's content.

Finally, I needed another content script to update the panel's content with the library information:

This was a bit of a pain, and I found myself wishing for a way to set the panel's content directly, in the same way I can with the widget. Then it would have been just a variable assignment. So the widget/panel code ends up looking like this:

<pre><code>
var widget = widgets.Widget({
  id: "library-detector",
  label: "Library Detector",
  content: "<html></html>",
  contentScriptFile: data.url("widget.js"),
  panel: panel.Panel({
    width: 240,
    height: 60,
    contentScript: 'self.on("message", function(libraryInfo) {' +
                   '  window.document.body.innerHTML = libraryInfo;' +
                   '});'
  }),
});

widget.port.on('setLibraryInfo', function(libraryInfo) {
  widget.panel.postMessage(libraryInfo);
});
</code></pre>

# Conclusions ##

It was mostly pretty smooth! Things I thought would have made it smoother:

* I spent a bit of time confused about gBrowser, and that makes me feel that we should do a better job of explaining what's available in a XUL script that isn't available in content scripts (though that may just be my inexperience with XUL, and thus not very applicable to this audience).

* Not being able to use tooltips was a bit of a pain. Actually, I like the new interface better, but specifying the interface declaratively using tooltips is nice, and it's a shame that that is harder with the SDK.

* Being able to anchor a panel to the widget would have given me more flexibility about the UI, although I think click-to-show is fine.

* It seemed clunky to have to use a content script to update the panel's content.

You can find the code [here](https://github.com/wbamberg/library-detector-sdk).
