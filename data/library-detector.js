var LD_tests = {
    
    'jQuery': {
        test: function(win) {
            var jq = win.jQuery || win.$ || win.$jq || win.$j;
            if(jq && jq.fn && jq.fn.jquery) {
                return { version: jq.fn.jquery };
            } else {
                return false;
            }
        }
    },
    
    'jQuery UI': {
        //phonehome: 'http://jqueryui.com/phone_home',
        test: function(win) {
            
            var jq = win.jQuery || win.$ || win.$jq || win.$j;
            if(jq && jq.fn && jq.fn.jquery && jq.ui) {

                var plugins = 'accordion,datepicker,dialog,draggable,droppable,progressbar,resizable,selectable,slider,menu,grid,tabs'.split(','), concat = [];
                for (var i=0; i < plugins.length; i++) { if(jq.ui[plugins[i]]) concat.push(plugins[i].substr(0,1).toUpperCase() + plugins[i].substr(1)); };
            
                return { version: jq.ui.version, details: concat.length ? 'Plugins used: '+concat.join(',') : '' };
            } else {
                return false;
            }
            
        }
    },
    
    'Dojo': {
        test: function(win) {
            if(win.dojo) {
                return { version: win.dojo.version.toString(), details: 'Details: '+(win.dijit ? 'Uses Dijit' : 'none') };
            } else {
                return false;
            }
        }
    },
    
    'Prototype': {
        test: function(win) {
            if(win.Prototype && win.Prototype.Version) {
                return { version: win.Prototype.Version };
            } else {
                return false;
            }
        }
    },
    
    'Scriptaculous': {
        test: function(win) {
            if(win.Scriptaculous && win.Scriptaculous.Version) {
                return { version: win.Scriptaculous.Version };
            } else {
                return false;
            }
        }
    },
    
    'MooTools': {
        test: function(win) {
            if(win.MooTools && win.MooTools.version) {
                return { version: win.MooTools.version };
            } else {
                return false;
            }
        }
    },
    
    'Spry': {
        test: function(win) {
            if(win.Spry) {
                return { version: '(not detectable)' };
            } else {
                return false;
            }
        }
    },
    
    'YUI': {
        test: function(win) {
            if(win.YAHOO && win.YAHOO.VERSION) {
                return { version: win.YAHOO.VERSION };
            } else {
                return false;
            }
        }
    },
    
    'Qooxdoo': {
        test: function(win) {
            if(win.qx && win.qx.Bootstrap) {
                return { version: '(not detectable)' };
            } else {
                return false;
            }
        }
    },
    
    'Ext JS': {
        test: function(win) {
            if(win.Ext && win.Ext.version) {
                return { version: win.Ext.version };
            } else {
                return false;
            }
        }
    },
    
    'base2': {
        test: function(win) {
            if(win.base2 && win.base2.version) {
                return { version: win.base2.version };
            } else {
                return false;
            }
        }
    },
    
    'Closure': {
        test: function(win) {
            if(win.goog) {
                return { version: '2.0' };
            }
            return false;
        } 
    },
    
    'Raphael': {
        test: function(win) {
            if(win.Raphael) {
                return { version: win.Raphael.version };
            }
            return false;
        }
    },
    
    'Modernizr': {
        test: function(win) {
            if(win.Modernizr) {
                return { version: win.Modernizr._version };
            }
            return false;
        }
    },

    'Processing.js': {
        test: function(win) {
            if(win.Processing) {
                return { version: win.Processing.version };
            }
            return false;
        }
    },
    
    'Backbone.js': {
        test: function(win) {
            if (win.Backbone) {
                return {version: win.Backbone.VERSION};
            }
            return false;
        }
    },
    
    'Underscore.js': {
        test: function(win) {
            // *should* be safeish for sites that have assigned a generic "_" to something else
            if (win._ && win._.VERSION && typeof win._.tap === 'function') {
                return {version: win._.VERSION};
            }
            return false;
        }
    },
    
    'Sammy.js': {
        test: function(win) {
            if (win.Sammy && win.Sammy.VERSION) {
                return {version: win.Sammy.VERSION};
            }
            return false;
        }
    },
    
    'Rico': {
        test:  function(win) {
            if (win.Rico && win.Rico.Version) {
                return {version: win.Rico.Version};
            }
            return false;
        }
    },
    
    'MochiKit': {
        test: function(win) {
            if (win.MochiKit) {
                return {version: win.MochiKit.VERSION}; 
            }
            return false;
        }
    },
    
    'gRaphael': {
        test: function(win) {
            if (win.Raphael && win.Raphael.fn.g) {
                return {version: '(not detectable)'};
            }
            return false;
        }
    },
    
    'Glow': {
        test: function(win) {
            if (win.gloader) {
                return {version: '(not detectable)'};
            }
            else if (win.glow) {
                return {version: win.glow.VERSION};
            }
            else if (win.Glow) {
                return {version: win.Glow.version};
            }
            return false;
        }       
    },
    
    'Socket.IO': {
        test: function(win) {
            if (win.io) {
                return {version: win.io.version};
            }
            return false;
        }
    },
    
    'Mustache.js': {
        test: function(win) {
            if (win.Mustache) {
                return {version: win.Mustache.version};
            }
            return false;
        }
    },
    
    'Fabric.js': {
        test: function(win) {
            if (win.fabric) {
                return {version: win.fabric.version};
            }
            return false;
        }
    },
    
    'FuseJS': {
        test: function(win) {
            if (win.fuse) {
                return {version: win.fuse.version};
            }
            return false;
        }
    },
    
    'Tween.js': {
        test: function(win) {
            if (win.TWEEN) {
                return {version: '(not detectable)'};
            }
            return false;
        }
    },
    
    'SproutCore': {
        test: function(win) {
            if (win.SC) {
                return {version: '(not detectable)'};
            }
            return false;
        }
    },
    
    'Zepto.js': {
        test: function(win) {
            if (win.Zepto && win.Zepto.fn) {
                return {version: '(not detectable)'};
            }
            return false;
        }
    },
    
    'three.js': {
        test: function(win) {
            if (win.THREE) {
                return {version: '(not detectable)'};
            }
            return false;
        }
    },
        
    'OpenAjaxHub' : {
        test: function(win) {
            if(win.OpenAjax) {
                if (win.OpenAjax.hub && win.OpenAjax.hub.implVersion) {
                    return { version: win.OpenAjax.hub.implVersion };
                } else {
                    return { version: '(not detectable)' };
                }
            }
            return false;
        }
    },
    
    'Lightstreamer': {
        test: function(win) {
            if(win.Lightstreamer && win.Lightstreamer.version) {
                    return { version: win.Lightstreamer.version };
            } else if (win.PushPage && win.NonVisualTable) { //<=4.3
                    return { version: '(not detectable)' };
            }
            return false;
        }
    },
    
    'GWT' : {
        test: function(win) {
            return win.__gwt_scriptsLoaded ? {version: '(not detectable)' } : false;
        }
    }
    
};

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