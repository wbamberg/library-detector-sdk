const tabs = require('tabs');
const widgets = require('widget');
const data = require('self').data;
const pageMod = require('page-mod');
const panel = require('panel');

const htmlContentPreamble = 
                      '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"' +
                      ' "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">' +
                      ' <html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">' +
                      '   <head>' +
                      '     <style type="text/css" media="all">' +
                      '       img {display: inline;}' +
                      '     </style>' +
                      '  </head>' +
                      '  <body>'

const htmlContentPostamble = 
                      '  </body>' +
                      '</html>'

const icons = {
  'jQuery' : 'jquery.ico',
  'jQuery UI' : 'jquery_ui.ico',
  'Dojo' : 'dojo.ico',
  'Prototype' : 'prototype.png',
  'Scriptaculous' : 'scriptaculous.ico',
  'MooTools' : 'mootools.png',
  'Spry' : 'spry.png',
  'YUI' : 'yui.ico',
  'Qooxdoo' : 'qooxdoo.ico',
  'Ext JS' : 'extjs.ico',
  'base2' : 'base2.gif',
  'Closure' : 'closure.ico',
  'Raphael': 'raphael.ico',
  'Modernizr': 'modernizr.ico',
  'Processing.js': 'processingjs.ico',
  'Backbone.js': 'backbone.ico',
  'Underscore.js': 'underscore.ico',
  'Sammy.js': 'sammy.ico',
  'Rico': 'rico.ico',
  'MochiKit': 'mochikit.ico',
  'gRaphael': 'graphael.ico',
  'Glow': 'glow.ico',
  'Socket.IO': 'default.ico',
  'Mustache.js': 'mustache.ico',
  'Fabric.js': 'default.ico',
  'FuseJS': 'fusejs.ico',
  'Tween.js': 'default.ico',
  'SproutCore': 'sproutcore.ico',
  'Zepto.js': 'zepto.ico',
  'three.js': 'default.ico',
  'OpenAjaxHub': 'openajax.ico',
  'Lightstreamer': 'lightstreamer.ico',
  'GWT': 'gwt.ico'
}

const ICON_WIDTH = 32;

function buildIconHtml(imageName, libraryInfo) {
  return '<img src="' + data.url("icons/" + imageName) + '" title="' + libraryInfo + '">';
}

function buildWidgetViewContent(libraryList) {
  widgetContent = htmlContentPreamble;
  libraryList.forEach(function(library) {
      widgetContent += buildIconHtml(icons[library.name], library.name + "<br>Version: " + library.version);
  });
  widgetContent += htmlContentPostamble;
  return widgetContent;
}

function updateWidgetView(tab) {
  let widgetView = widget.getView(tab.window);
  if (tab.libraries) {
    widgetView.content = buildWidgetViewContent(tab.libraries);
    widgetView.width = tab.libraries.length * ICON_WIDTH;
  }
}

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

tabs.on('activate', function(tab) {
  updateWidgetView(tab);
});

/*
For opening a new tab
*/
tabs.on('open', function(tab) {
  tab.libraries = [];
});

/*
For change of location
*/
tabs.on('ready', function(tab) {
  tab.libraries = [];
});