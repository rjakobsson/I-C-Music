/*************************************************
**  jQuery Masonry version 1.0.1
**  copyright David DeSandro, licensed GPL & MIT
**  http://desandro.com/resources/jquery-masonry
**************************************************/
;(function($){  

    $.fn.masonry = function(options, callback) { 

        function placeBrick($brick, setCount, setY, setSpan, props) {
            var shortCol = 0;
            
            for ( i=0; i < setCount; i++ ) {
                if ( setY[i] < setY[ shortCol ] ) shortCol = i;
            }

            $brick.css({
                top: setY[ shortCol ],
                left: props.colW * shortCol + props.posLeft
            });

            for ( i=0; i < setSpan; i++ ) {
                props.colY[ shortCol + i ] = setY[ shortCol ] + $brick.outerHeight(true) ;
            }
        }


        function masonrySetup($wall, opts, props) {
            props.$bricks = opts.itemSelector == undefined ?
                        opts.$brickParent.children() :
                        opts.$brickParent.find(opts.itemSelector);

            if ( opts.columnWidth == undefined) {
                props.colW = props.masoned ?
                        $wall.data('masonry').colW :
                        props.$bricks.outerWidth(true);
            } else {
                props.colW = opts.columnWidth;
            }

            props.colCount = Math.floor( $wall.width() / props.colW ) ;
            props.colCount = Math.max( props.colCount, 1 );
        }


        function masonryArrange($wall, opts, props) {
            // if masonry hasn't been called before
            if( !props.masoned ) $wall.css( 'position', 'relative' );            
            
            if ( !props.masoned || opts.appendedContent != undefined ) {
                // just the new bricks
                props.$bricks.css( 'position', 'absolute' );
            }

            // get top left position of where the bricks should be
            var cursor = $('<div />');
            $wall.prepend( cursor );
            props.posTop =  Math.round( cursor.position().top );
            props.posLeft = Math.round( cursor.position().left );
            cursor.remove();

            // set up column Y array
            if ( props.masoned && opts.appendedContent != undefined ) {
                // if appendedContent is set, use colY from last call
                props.colY = $wall.data('masonry').colY;
                
                /*
                *  in the case that the wall is not resizeable,
                *  but the colCount has changed from the previous time
                *  masonry has been called
                */
                for (i= $wall.data('masonry').colCount; i < props.colCount; i++) {
                    props.colY[i] = props.posTop;
                };
                
            } else {
                props.colY = [];
                for ( i=0; i < props.colCount; i++) {
                    props.colY[i] = props.posTop;
                }    
            }

            // layout logic
            if ( opts.singleMode ) {
                props.$bricks.each(function(){
                    var $brick = $(this);
                    placeBrick($brick, props.colCount, props.colY, 1, props);
                });            
            } else {
                props.$bricks.each(function() {
                    var $brick = $(this);
                
                    //how many columns does this brick span
                    var colSpan = Math.ceil( $brick.outerWidth(true) / props.colW);
                    colSpan = Math.min( colSpan, props.colCount );

                    if ( colSpan == 1 ) {
                        // if brick spans only one column, just like singleMode
                        placeBrick($brick, props.colCount, props.colY, 1, props);
                    } else {
                        // brick spans more than one column

                        //how many different places could this brick fit horizontally
                        var groupCount = props.colCount + 1 - colSpan; 
                        var groupY = [0];
                        // for each group potential horizontal position
                        for ( i=0; i < groupCount; i++ ) {
                            groupY[i] = 0;
                            // for each column in that group
                            for ( j=0; j < colSpan; j++ ) {
                                // get the maximum column height in that group
                                groupY[i] = Math.max( groupY[i], props.colY[i+j] );
                            }
                        }
                
                        placeBrick($brick, groupCount, groupY, colSpan, props);
                    }
                }); //        /props.bricks.each(function() {
            }  //         /layout logic
        
            // set the height of the wall to the tallest column
            props.wallH = 0;
            for ( i=0; i < props.colCount; i++ ) {
                props.wallH = Math.max( props.wallH, props.colY[i] );
            }
            $wall.height( props.wallH - props.posTop );

            // provide props.bricks as context for the callback
            callback.call( props.$bricks );
            
            // set all data so we can retrieve it for appended appendedContent
            //        or anyone else's crazy jquery fun
            $wall.data('masonry', props );


        } //  /masonryArrange function


        function masonryResize($wall, opts, props) {
            var prevColCount = $wall.data('masonry').colCount;
            masonrySetup($wall, opts, props);
            if ( props.colCount != prevColCount ) masonryArrange($wall, opts, props); 
        }


        /*
        *  let's begin
        *  IN A WORLD...
        */
        return this.each(function() {  

            var $wall = $(this);

            var props = $.extend( {}, $.masonry );

            // checks if masonry has been called before on this object
           // props.masoned = $wall.data('masonry') != undefined;
        
            var previousOptions = props.masoned ? $wall.data('masonry').options : {};

            var opts =  $.extend(
                            {},
                            props.defaults,
                            previousOptions,
                            options
                        );  

            // should we save these options for next time?
            props.options = opts.saveOptions ? opts : previousOptions;

            //picked up from Paul Irish
            callback = callback || function(){};

            if ( props.masoned && opts.appendedContent != undefined ) {
                // if we're dealing with appendedContent
                opts.$brickParent = opts.appendedContent;
            } else {
                opts.$brickParent = $wall;
            }
            
            if ( opts.$brickParent.children().length > 0  ) {
                // call masonry layout
                masonrySetup($wall, opts, props);
                masonryArrange($wall, opts, props);
            
                // binding window resizing
                var resizeOn = previousOptions.resizeable;
                if ( !resizeOn && opts.resizeable ) {
                    $(window).bind('resize.masonry', function() { masonryResize($wall, opts, props); } );
                }
                if ( resizeOn && !opts.resizeable ) $(window).unbind('resize.masonry');
            } else {
                // brickParent is empty, do nothing, go back home and eat chips
                return this;
            }

        });        //        /return this.each(function()
    };            //        /$.fn.masonry = function(options)



    $.masonry = {
        defaults : {
            singleMode: false,
            columnWidth: undefined,
            itemSelector: undefined,
            appendedContent: undefined,
            saveOptions: true,
            resizeable: true
        },
        colW: undefined,
        colCount: undefined,
        colY: undefined,
        wallH: undefined,
        masoned: undefined,
        posTop: 0,
        posLeft: 0,
        options: undefined,
        $bricks: undefined,
        $brickParent: undefined
    };

})(jQuery);  

/*
 * Modernizr JavaScript library 1.1
 * http://modernizr.com/
 *
 * Copyright (c) 2009 Faruk Ates - http://farukat.es/
 * Licensed under the MIT license.
 * http://modernizr.com/license/
 *
 * Featuring major contributions by
 * Paul Irish  - http://paulirish.com
 * Ben Alman   - http://benalman.com/
 */
 window.Modernizr=(function(P,l){var _='1.1', J={},T=true,ab=true,M=100,ad=l.documentElement,U=l.createElement("modernizr"),k=U.style,Z=l.createElement("input"),o="canvas",Y="canvastext",V="rgba",g="hsla",Q="multiplebgs",x="borderimage",D="borderradius",v="boxshadow",X="opacity",B="cssanimations",R="csscolumns",a="cssgradients",p="cssreflections",h="csstransforms",w="csstransforms3d",aa="csstransitions",F="fontface",K="geolocation",e="video",A="audio",d="input",u=d+"types",N="background",b=N+"Color",G="canPlayType",H="localstorage",j="sessionstorage",C="webworkers",O="applicationcache",c=" -o- -moz- -ms- -webkit- ".split(" "),s={},z={},r={},q,S,W,L,n=[];function y(f){k.cssText=f}function E(i,f){return y(c.join(i+";")+(f||""))}function I(i,f){return i.indexOf(f)!==-1}function ac(m,ae){for(var f in m){if(k[m[f]]!==undefined&&(!ae||ae(m[f]))){return true}}}function t(ae,m){var i=ae.charAt(0).toUpperCase()+ae.substr(1),f=[ae,"webkit"+i,"Moz"+i,"moz"+i,"o"+i,"ms"+i];return !!ac(f,m)}s[o]=function(){return !!l.createElement(o).getContext};s[Y]=function(){return !!(s[o]()&&typeof l.createElement(o).getContext("2d").fillText=="function")};s[K]=function(){return !!navigator.geolocation};s[V]=function(){y(N+"-color:rgba(150,255,150,.5)");return I(k[b],V)};s[g]=function(){y(N+"-color:hsla(120,40%,100%,.5)");return I(k[b],V)};s[Q]=function(){y(N+":url(m.png),url(a.png),#f99 url(m.png)");return/(url\s*\(.*?){3}/.test(k[N])};s[x]=function(){return t("borderImage")};s[D]=function(){return t("borderRadius","",function(f){return I(f,"orderRadius")})};s[v]=function(){return t("boxShadow")};s[X]=function(){y("opacity:.5");return I(k[X],"0.5")};s[B]=function(){return t("animationName")};s[R]=function(){return t("columnCount")};s[a]=function(){var m=N+"-image:",i="gradient(linear,left top,right bottom,from(#9f9),to(white));",f="linear-gradient(left top,#9f9, white);";y(m+i+m+"-webkit-"+i+m+"-moz-"+i+m+"-o-"+i+m+"-ms-"+i+m+f+m+"-webkit-"+f+m+"-moz-"+f+m+"-o-"+f+m+"-ms-"+f);return I(k.backgroundImage,"gradient")};s[p]=function(){return t("boxReflect")};s[h]=function(){return !!ac(["transformProperty","webkitTransform","MozTransform","mozTransform","oTransform","msTransform"])};s[w]=function(){return !!ac(["perspectiveProperty","webkitPerspective","MozPerspective","mozPerspective","oPerspective","msPerspective"])};s[aa]=function(){return t("transitionProperty")};s[F]=(function(){var i;if(!(!/*@cc_on@if(@_jscript_version>=5)!@end@*/0)){i=true}else{var aj=l.createElement("style"),ae=l.createElement("span"),ak,af,ah=false,ag=l.body,ai,m;aj.textContent="@font-face{font-family:testfont;src:url('data:font/ttf;base64,AAEAAAAMAIAAAwBAT1MvMliohmwAAADMAAAAVmNtYXCp5qrBAAABJAAAANhjdnQgACICiAAAAfwAAAAEZ2FzcP//AAMAAAIAAAAACGdseWYv5OZoAAACCAAAANxoZWFk69bnvwAAAuQAAAA2aGhlYQUJAt8AAAMcAAAAJGhtdHgGDgC4AAADQAAAABRsb2NhAIQAwgAAA1QAAAAMbWF4cABVANgAAANgAAAAIG5hbWUgXduAAAADgAAABPVwb3N03NkzmgAACHgAAAA4AAECBAEsAAUAAAKZAswAAACPApkCzAAAAesAMwEJAAACAAMDAAAAAAAAgAACbwAAAAoAAAAAAAAAAFBmRWQAAAAgqS8DM/8zAFwDMwDNAAAABQAAAAAAAAAAAAMAAAADAAAAHAABAAAAAABGAAMAAQAAAK4ABAAqAAAABgAEAAEAAgAuqQD//wAAAC6pAP///9ZXAwAAAAAAAAACAAAABgBoAAAAAAAvAAEAAAAAAAAAAAAAAAAAAAABAAIAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAEACoAAAAGAAQAAQACAC6pAP//AAAALqkA////1lcDAAAAAAAAAAIAAAAiAogAAAAB//8AAgACACIAAAEyAqoAAwAHAC6xAQAvPLIHBADtMrEGBdw8sgMCAO0yALEDAC88sgUEAO0ysgcGAfw8sgECAO0yMxEhESczESMiARDuzMwCqv1WIgJmAAACAFUAAAIRAc0ADwAfAAATFRQWOwEyNj0BNCYrASIGARQGKwEiJj0BNDY7ATIWFX8aIvAiGhoi8CIaAZIoN/43KCg3/jcoAWD0JB4eJPQkHh7++EY2NkbVRjY2RgAAAAABAEH/+QCdAEEACQAANjQ2MzIWFAYjIkEeEA8fHw8QDxwWFhwWAAAAAQAAAAIAAIuYbWpfDzz1AAsEAAAAAADFn9IuAAAAAMWf0i797/8zA4gDMwAAAAgAAgAAAAAAAAABAAADM/8zAFwDx/3v/98DiAABAAAAAAAAAAAAAAAAAAAABQF2ACIAAAAAAVUAAAJmAFUA3QBBAAAAKgAqACoAWgBuAAEAAAAFAFAABwBUAAQAAgAAAAEAAQAAAEAALgADAAMAAAAQAMYAAQAAAAAAAACLAAAAAQAAAAAAAQAhAIsAAQAAAAAAAgAFAKwAAQAAAAAAAwBDALEAAQAAAAAABAAnAPQAAQAAAAAABQAKARsAAQAAAAAABgAmASUAAQAAAAAADgAaAUsAAwABBAkAAAEWAWUAAwABBAkAAQBCAnsAAwABBAkAAgAKAr0AAwABBAkAAwCGAscAAwABBAkABABOA00AAwABBAkABQAUA5sAAwABBAkABgBMA68AAwABBAkADgA0A/tDb3B5cmlnaHQgMjAwOSBieSBEYW5pZWwgSm9obnNvbi4gIFJlbGVhc2VkIHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgT3BlbiBGb250IExpY2Vuc2UuIEtheWFoIExpIGdseXBocyBhcmUgcmVsZWFzZWQgdW5kZXIgdGhlIEdQTCB2ZXJzaW9uIDMuYmFlYzJhOTJiZmZlNTAzMiAtIHN1YnNldCBvZiBKdXJhTGlnaHRiYWVjMmE5MmJmZmU1MDMyIC0gc3Vic2V0IG9mIEZvbnRGb3JnZSAyLjAgOiBKdXJhIExpZ2h0IDogMjMtMS0yMDA5YmFlYzJhOTJiZmZlNTAzMiAtIHN1YnNldCBvZiBKdXJhIExpZ2h0VmVyc2lvbiAyIGJhZWMyYTkyYmZmZTUwMzIgLSBzdWJzZXQgb2YgSnVyYUxpZ2h0aHR0cDovL3NjcmlwdHMuc2lsLm9yZy9PRkwAQwBvAHAAeQByAGkAZwBoAHQAIAAyADAAMAA5ACAAYgB5ACAARABhAG4AaQBlAGwAIABKAG8AaABuAHMAbwBuAC4AIAAgAFIAZQBsAGUAYQBzAGUAZAAgAHUAbgBkAGUAcgAgAHQAaABlACAAdABlAHIAbQBzACAAbwBmACAAdABoAGUAIABPAHAAZQBuACAARgBvAG4AdAAgAEwAaQBjAGUAbgBzAGUALgAgAEsAYQB5AGEAaAAgAEwAaQAgAGcAbAB5AHAAaABzACAAYQByAGUAIAByAGUAbABlAGEAcwBlAGQAIAB1AG4AZABlAHIAIAB0AGgAZQAgAEcAUABMACAAdgBlAHIAcwBpAG8AbgAgADMALgBiAGEAZQBjADIAYQA5ADIAYgBmAGYAZQA1ADAAMwAyACAALQAgAHMAdQBiAHMAZQB0ACAAbwBmACAASgB1AHIAYQBMAGkAZwBoAHQAYgBhAGUAYwAyAGEAOQAyAGIAZgBmAGUANQAwADMAMgAgAC0AIABzAHUAYgBzAGUAdAAgAG8AZgAgAEYAbwBuAHQARgBvAHIAZwBlACAAMgAuADAAIAA6ACAASgB1AHIAYQAgAEwAaQBnAGgAdAAgADoAIAAyADMALQAxAC0AMgAwADAAOQBiAGEAZQBjADIAYQA5ADIAYgBmAGYAZQA1ADAAMwAyACAALQAgAHMAdQBiAHMAZQB0ACAAbwBmACAASgB1AHIAYQAgAEwAaQBnAGgAdABWAGUAcgBzAGkAbwBuACAAMgAgAGIAYQBlAGMAMgBhADkAMgBiAGYAZgBlADUAMAAzADIAIAAtACAAcwB1AGIAcwBlAHQAIABvAGYAIABKAHUAcgBhAEwAaQBnAGgAdABoAHQAdABwADoALwAvAHMAYwByAGkAcAB0AHMALgBzAGkAbAAuAG8AcgBnAC8ATwBGAEwAAAAAAgAAAAAAAP+BADMAAAAAAAAAAAAAAAAAAAAAAAAAAAAFAAAAAQACAQIAEQt6ZXJva2F5YWhsaQ==')}";l.getElementsByTagName("head")[0].appendChild(aj);ae.setAttribute("style","font:99px _,serif;position:absolute;visibility:hidden");if(!ag){ag=ad.appendChild(l.createElement(F));ah=true}ae.innerHTML="........";ae.id="fonttest";ag.appendChild(ae);ak=ae.offsetWidth;ae.style.font="99px testfont,_,serif";i=ak!==ae.offsetWidth;var f=function(){i=J[F]=ak!==ae.offsetWidth;ad.className=ad.className.replace(/(no-)?font.*?\b/,"")+(i?" ":" no-")+F;ai&&(m=true)&&ai(i);ah&&setTimeout(function(){ag.parentNode.removeChild(ag)},50)};setTimeout(f,M)}J._fontfaceready=function(al){(m||i)?al(i):(ai=al)};return function(){return i||ak!==ae.offsetWidth}})();s[e]=function(){var i=l.createElement(e),f=!!i[G];if(f){f=new Boolean(f);f.ogg=i[G]('video/ogg; codecs="theora, vorbis"');f.h264=i[G]('video/mp4; codecs="avc1.42E01E, mp4a.40.2"')}return f};s[A]=function(){var i=l.createElement(A),f=!!i[G];if(f){f=new Boolean(f);f.ogg=i[G]('audio/ogg; codecs="vorbis"');f.mp3=i[G]("audio/mpeg3;");f.wav=i[G]('audio/wav; codecs="1"');f.m4a=i[G]("audio/x-m4a;")}return f};s[H]=function(){return"localStorage" in P};s[j]=function(){return"sessionStorage" in P};s[C]=function(){return !!P.Worker};s[O]=function(){return !!P.applicationCache};for(L in s){if(s.hasOwnProperty(L)){n.push((!(J[L]=s[L]())&&ab?"no-":"")+L)}}J.addTest=function(f,i){if(this.hasOwnProperty(f)){}i=!!(i());ad.className+=" "+(!i&&ab?"no-":"")+f;J[f]=i};J[d]=(function(m){for(var f in m){r[m[f]]=!!(m[f] in Z)}return r})("autocomplete autofocus list placeholder max min multiple pattern required step".split(" "));J[u]=(function(m){for(var f in m){Z.setAttribute("type",m[f]);z[m[f]]=!!(Z.type!=="text")}return z})("search tel url email datetime date month week time datetime-local number range color".split(" "));y("");U=Z=null;if(T&&!(!/*@cc_on!@*/0)){q="abbr article aside audio canvas datalist details eventsource figure footer header hgroup mark menu meter nav output progress section time video".split(" ");W=q.length+1;while(--W){S=l.createElement(q[W])}S=null}J._enableHTML5=T;J._enableNoClasses=ab;J._version=_;(function(f,i){f[i]=f[i].replace(/\bno-js\b/,"js")})(ad,"className");ad.className+=" "+n.join(" ");return J})(this,this.document);
 /*!
 * Galleria v 1.1.5 2010-06-05
 * http://galleria.aino.se
 *
 * Copyright (c) 2010, Aino
 * Licensed under the MIT license.
 */

(function() {

var initializing = false,
    fnTest = /xyz/.test(function(){xyz;}) ? /\b__super\b/ : /.*/,
    Class = function(){},
    window = this;

Class.extend = function(prop) {
    var __super = this.prototype;
    initializing = true;
    var proto = new this();
    initializing = false;
    for (var name in prop) {
        if (name) {
            proto[name] = typeof prop[name] == "function" && 
                typeof __super[name] == "function" && fnTest.test(prop[name]) ? 
                (function(name, fn) { 
                    return function() { 
                        var tmp = this.__super; 
                        this.__super = __super[name]; 
                        var ret = fn.apply(this, arguments);       
                        this.__super = tmp; 
                        return ret; 
                    }; 
                })(name, prop[name]) : prop[name]; 
        } 
    }

    function Class() {
        if ( !initializing && this.__constructor ) {
            this.__constructor.apply(this, arguments);
        }
    }
    Class.prototype = proto;
    Class.constructor = Class;
    Class.extend = arguments.callee;
    return Class;
};

var Base = Class.extend({
    loop : function( elem, fn) {
        var scope = this;
        if (typeof elem == 'number') {
            elem = new Array(elem);
        }
        jQuery.each(elem, function() {
            fn.call(scope, arguments[1], arguments[0]);
        });
        return elem;
    },
    create : function( elem, className ) {
        elem = elem || 'div';
        var el = document.createElement(elem);
        if (className) {
            el.className = className;
        }
        return el;
    },
    getElements : function( selector ) {
        var elems = {};
        this.loop( jQuery(selector), this.proxy(function( elem ) {
            this.push(elem, elems);
        }));
        return elems;
    },
    setStyle : function( elem, css ) {
        jQuery(elem).css(css);
        return this;
    },
    cssText : function( string ) {
        var style = document.createElement('style');
        this.getElements('head')[0].appendChild(style);
        if (style.styleSheet) { // IE
            style.styleSheet.cssText = string;
        } else {
            var cssText = document.createTextNode(string);
            style.appendChild(cssText);
        }
        return this;
    },
    cssFile : function(src) {
        var link = document.createElement('link');
        link.media = 'all';
        link.rel = 'stylesheet';
        link.href = src;
        document.getElementsByTagName('head')[0].appendChild(link);
    },
    moveOut : function( elem ) {
        return this.setStyle(elem, {
            position: 'absolute',
            left: '-10000px',
            display: 'block'
        });
    },
    moveIn : function( elem ) {
        return this.setStyle(elem, {
            left: '0'
        }); 
    },
    reveal : function( elem ) {
        return jQuery( elem ).show();
    },
    hide : function( elem ) {
        return jQuery( elem ).hide();
    },
    mix : function( obj, ext ) {
        return jQuery.extend(obj, ext);
    },
    proxy : function( fn, scope ) {
        if ( typeof fn !== 'function' ) {
            return function() {};
        }
        scope = scope || this;
        return function() {
            return fn.apply( scope, Array.prototype.slice.call(arguments) );
        };
    },
    listen : function( elem, type, fn ) {
        jQuery(elem).bind( type, fn );
    },
    forget : function( elem, type ) {
        jQuery(elem).unbind(type);
    },
    dispatch : function( elem, type ) {
        jQuery(elem).trigger(type);
    },
    clone : function( elem, keepEvents ) {
        keepEvents = keepEvents || false;
        return jQuery(elem).clone(keepEvents)[0];
    },
    removeAttr : function( elem, attributes ) {
        this.loop( attributes.split(' '), function(attr) {
            jQuery(elem).removeAttr(attr);
        });
    },
    push : function( elem, obj ) {
        if (typeof obj.length == 'undefined') {
            obj.length = 0;
        }
        Array.prototype.push.call( obj, elem );
        return elem;
    },
    width : function( elem, outer ) {
        return this.meassure(elem, outer, 'Width');
    },
    height : function( elem, outer ) {
        return this.meassure(elem, outer, 'Height');
    },
    meassure : function(el, outer, meassure) {
        var elem = jQuery( el );
        var ret = outer ? elem['outer'+meassure](true) : elem[meassure.toLowerCase()]();
        // fix quirks mode
        if (G.QUIRK) {
            var which = meassure == "Width" ? [ "left", "right" ] : [ "top", "bottom" ];
            this.loop(which, function(s) {
                ret += elem.css('border-' + s + '-width').replace(/[^\d]/g,'') * 1;
                ret += elem.css('padding-' + s).replace(/[^\d]/g,'') * 1;
            });
        }
        return ret;
    },
    toggleClass : function( elem, className, arg ) {
        if (typeof arg !== 'undefined') {
            var fn = arg ? 'addClass' : 'removeClass';
            jQuery(elem)[fn](className);
            return this;
        }
        jQuery(elem).toggleClass(className);
        return this;
    },
    hideAll : function( el ) {
        jQuery(el).find('*').hide();
    },
    animate : function( el, options ) {
        var elem = jQuery(el);
        if (!elem.length) {
            return;
        }
        if (options.from) {
            elem.css(from);
        }
        elem.animate(options.to, {
            duration: options.duration || 400,
            complete: options.complete || function(){}
        });
    },
    wait : function(fn, callback, err, max) {
        fn = this.proxy(fn);
        callback = this.proxy(callback);
        err = this.proxy(err);
        var ts = new Date().getTime() + (max || 3000);
        window.setTimeout(function() {
            if (fn()) {
                callback();
                return false;
            }
            if (new Date().getTime() >= ts) {
                err();
                callback();
                return false;
            }
            window.setTimeout(arguments.callee, 1);
        }, 1);
        return this;
    },
    getScript: function(url, callback) {
       var script = document.createElement('script');
       script.src = url;
       script.async = true; // HTML5
       callback = this.proxy(callback);

       // Handle Script loading
       {
          var done = false;

          // Attach handlers for all browsers
          script.onload = script.onreadystatechange = function(){
             if ( !done && (!this.readyState ||
                   this.readyState == "loaded" || this.readyState == "complete") ) {
                done = true;
                callback();

                // Handle memory leak in IE
                script.onload = script.onreadystatechange = null;
             }
          };
       }
       
       var ex = document.getElementsByTagName('script');
       ex = ex[ex.length-1];
       ex.parentNode.insertBefore(script, ex.nextSibling);
       return this;
    }
});

var Picture = Base.extend({
    __constructor : function(order) {
        this.image = null;
        this.elem = this.create('div', 'galleria-image');
        this.setStyle( this.elem, {
            overflow: 'hidden',
            position: 'relative' // for IE Standards mode
        } );
        this.order = order;
        this.orig = { w:0, h:0, r:1 };
    },
    
    cache: {},
    
    add: function(src) {
        if (this.cache[src]) {
            return this.cache[src];
        }
        var image = new Image();
        image.src = src;
        this.setStyle(image, {display: 'block'});
        if (image.complete && image.width) {
            this.cache[src] = image;
            return image;
        }
        image.onload = (function(scope) {
            return function() {
                scope.cache[src] = image;
            };
        })(this);
        return image;
    },
    
    isCached: function(src) {
        return this.cache[src] ? this.cache[src].complete : false;
    },
    
    make: function(src) {
        var i = this.cache[src] || this.add(src);
        return this.clone(i);
    },
    
    load: function(src, callback) {
        callback = this.proxy( callback );
        this.elem.innerHTML = '';
        this.image = this.make( src );
        this.moveOut( this.image );
        this.elem.appendChild( this.image );
        this.wait(function() {
            return (this.image.complete && this.image.width);
        }, function() {
            this.orig = {
                h: this.image.height,
                w: this.image.width
            };
            callback( {target: this.image, scope: this} );
        }, function() {
            G.raise('image not loaded in 10 seconds: '+ src);
        }, 10000);
        return this;
    },
    
    scale: function(w, h, crop, max, margin, complete) {
        margin = margin || 0;
        complete = complete || function() {};
        if (!this.image) {
            return this;
        }
        this.wait(function() {
            width  = w || this.width(this.elem);
            height = h || this.height(this.elem);
            return width && height;
        }, function() {
            var ratio = Math[ (crop ? 'max' : 'min') ](width / this.orig.w, height / this.orig.h);
            if (max) {
                ratio = Math.min(max, ratio);
            }
            this.setStyle(this.elem, {
                width: width,
                height: height
            });
            this.image.width = Math.ceil(this.orig.w * ratio) - margin*2;
            this.image.height = Math.ceil(this.orig.h * ratio) - margin*2;
            this.setStyle(this.image, {
                position : 'relative',
                top :  Math.floor(this.image.height * -1 / 2 + (height / 2)) - margin,
                left : Math.floor(this.image.width * -1 / 2 + (width / 2)) - margin
            });
            complete.call(this);
        });
        return this;
    }
});

var tID; // the private timeout handler

var G = window.Galleria = Base.extend({
    
    __constructor : function(options) {
        if (typeof options.target === 'undefined' ) {
            G.raise('No target.');
        }
        this.playing = false;
        this.playtime = 3000;
        this.active = null;
        this.queue = {};
        this.data = {};
        this.dom = {};
        this.controls = {
            active : 0,
            swap : function() {
                this.active = this.active ? 0 : 1;
            },
            getActive : function() {
                return this[this.active];
            },
            getNext : function() {
                return this[Math.abs(this.active - 1)];
            }
        };
        this.thumbnails = {};
        this.options = this.mix({
            autoplay: false,
            carousel: true,
            carousel_follow: true,
            carousel_speed: 200,
            carousel_steps: 'auto',
            data_config : function( elem ) { return {}; },
            data_image_selector: 'img',
            data_source: options.target,
            data_type: 'auto',
            debug: false,
            extend: function(options) {},
            height: undefined,
            image_crop: false,
            image_margin: 0,
            keep_source: false,
            link_source_images: true,
            max_scale_ratio: undefined,
            popup_links: false,
            preload: 2,
            queue: true,
            show: 0,
            thumb_crop: true,
            thumb_margin: 0,
            thumb_quality: 'auto',
            thumbnails: true,
            transition: G.transitions.fade,
            transition_speed: 400
        }, options);
        
        this.target = this.dom.target = this.getElements(this.options.target)[0];
        if (!this.target) {
             G.raise('Target not found.');
        }
        
        this.stageWidth = 0;
        this.stageHeight = 0;
        
        var elems = 'container stage images image-nav image-nav-left image-nav-right ' + 
                    'info info-link info-text info-title info-description info-author info-close ' +
                    'thumbnails thumbnails-list thumbnails-container thumb-nav-left thumb-nav-right ' +
                    'loader counter';
        elems = elems.split(' ');
        
        this.loop(elems, function(blueprint) {
            this.dom[ blueprint ] = this.create('div', 'galleria-' + blueprint);
        });
    },
    
    bind : function(type, fn) {
        this.listen( this.get('container'), type, this.proxy(fn) );
        return this;
    },
    
    trigger : function( type ) {
        type = typeof type == 'object' ? 
            this.mix( type, { scope: this } ) : 
            { type: type, scope: this };
        this.dispatch( this.get('container'), type );
        return this;
    },
    run : function() {
        var o = this.options;
        if (!this.data.length) {
            G.raise('Data is empty.');
        }
        if (!o.keep_source && !Galleria.IE) {
            this.target.innerHTML = '';
        }
        this.loop(2, function() {
            var image = new Picture();
            this.setStyle( image.elem, {
                position: 'absolute',
                top: 0,
                left: 0
            });
            this.setStyle(this.get( 'images' ), {
                position: 'relative',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%'
            });
            this.get( 'images' ).appendChild( image.elem );
            this.push(image, this.controls);
        }, this);
        
        for( var i=0; this.data[i]; i++ ) {
            var thumb;
            if (o.thumbnails === true) {
                thumb = new Picture(i);
                var src = this.data[i].thumb || this.data[i].image;
                this.get( 'thumbnails' ).appendChild( thumb.elem );
                thumb.load(src, this.proxy(function(e) {
                    var orig = this.width(e.target);
                    e.scope.scale(null, null, o.thumb_crop, null, o.thumb_margin, this.proxy(function() {
                        // set high quality if downscale is moderate
                        this.toggleQuality(e.target, o.thumb_quality === true || ( o.thumb_quality == 'auto' && orig < e.target.width * 3 ));
                        this.trigger({
                            type: G.THUMBNAIL,
                            thumbTarget: e.target,
                            thumbOrder: e.scope.order
                        });
                    }));
                }));
                if (o.preload == 'all') {
                    thumb.add(this.data[i].image);
                }
            } else if (o.thumbnails == 'empty') {
                thumb = {
                    elem:  this.create('div','galleria-image'),
                    image: this.create('span','img')
                };
                thumb.elem.appendChild(thumb.image);
                this.get( 'thumbnails' ).appendChild( thumb.elem );
            } else {
                thumb = {
                    elem: false,
                    image: false
                }
            }
            var activate = this.proxy(function(e) {
                e.preventDefault();
                var ind = e.currentTarget.rel;
                if (this.active !== ind) {
                    this.show( ind );
                }
            });
            if (o.thumbnails !== false) {
                thumb.elem.rel = i;
                this.listen(thumb.elem, 'click', activate);
            }
            if (o.link_source_images && o.keep_source && this.data[i].elem) {
                this.data[i].elem.rel = i;
                this.listen(this.data[i].elem, 'click', activate);
            }
            this.push(thumb, this.thumbnails );
        }
        this.build();
        this.target.appendChild(this.get('container'));
        this.wait(function() {
            this.stageWidth = this.width(this.get( 'stage' ));
            this.stageHeight = this.height( this.get( 'stage' ));
            if (!this.stageHeight && this.stageWidth) { // no height in css, set reasonable ratio (16/9)
                this.setStyle( this.get( 'container' ),  { 
                    height: this.options.height || Math.round( this.stageWidth*9/16 ) 
                } );
                this.stageHeight = this.height( this.get( 'stage' ));
            }
            return this.stageHeight && this.stageWidth;
        }, function() {
            var thumbWidth = this.thumbnails[0] ? this.width(this.thumbnails[0].elem, true) : 0;
            
            var thumbsWidth = thumbWidth * this.thumbnails.length;
            if (thumbsWidth < this.stageWidth) {
                o.carousel = false;
            }

            if (o.carousel) {
                this.toggleClass(this.get('thumbnails-container'), 'galleria-carousel');
                this.carousel = {
                    right: this.get('thumb-nav-right'),
                    left: this.get('thumb-nav-left'),
                    overflow: 0,
                    setOverflow: this.proxy(function(newWidth) {
                        newWidth = newWidth || this.width(this.get('thumbnails-list'));
                        this.carousel.overflow = Math.ceil( ( (thumbsWidth - newWidth) / thumbWidth ) + 1 ) * -1;
                    }),
                    pos: 0,
                    setClasses: this.proxy(function() {
                        this.toggleClass( this.carousel.left, 'disabled', this.carousel.pos === 0);
                        this.toggleClass( this.carousel.right, 'disabled', this.carousel.pos == this.carousel.overflow + 1);
                    }),
                    animate: this.proxy(function() {
                        this.carousel.setClasses();
                        this.animate( this.get('thumbnails'), {
                            to: { left: thumbWidth * this.carousel.pos },
                            duration: o.carousel_speed
                        });
                    })
                };
                this.carousel.setOverflow();
            
                this.setStyle(this.get('thumbnails-list'), {
                    overflow:'hidden',
                    position: 'relative' // for IE Standards mode
                });
                this.setStyle(this.get('thumbnails'), {
                    width: thumbsWidth,
                    position: 'relative'
                });
                
                this.proxy(function(c, steps) {
                    steps = (typeof steps == 'string' && steps.toLowerCase() == 'auto') ? this.thumbnails.length + c.overflow : steps;
                    c.setClasses();
                    this.loop(['left','right'], this.proxy(function(dir) {
                        this.listen(c[dir], 'click', function(e) {
                            if (c.pos === ( dir == 'right' ? c.overflow : 0 ) ) {
                                return;
                            }
                            c.pos = dir == 'right' ? Math.max(c.overflow + 1, c.pos - steps) : Math.min(0, c.pos + steps);
                            c.animate();
                        });
                    }));
                })(this.carousel, o.carousel_steps);
            }
            this.listen(this.get('image-nav-right'), 'click', this.proxy(function() {
                this.next();
            }));
            this.listen(this.get('image-nav-left'), 'click', this.proxy(function() {
                this.prev();
            }));
            this.trigger( G.READY );
        }, function() {
            G.raise('Galleria could not load. Make sure stage has a height and width.');
        }, 5000);
    },
    addElement : function() {
        this.loop(arguments, function(b) {
            this.dom[b] = this.create('div', 'galleria-' + b );
        });
        return this;
    },
    getDimensions: function(i) {
        return {
            w: i.width,
            h: i.height,
            cw: this.stageWidth,
            ch: this.stageHeight,
            top: (this.stageHeight - i.height) / 2,
            left: (this.stageWidth - i.width) / 2
        };
    },
    attachKeyboard : function(map) {
        jQuery(document).bind('keydown', {map: map, scope: this}, this.keyNav);
        return this;
    },
    detachKeyboard : function() {
        jQuery(document).unbind('keydown', this.keyNav);
        return this;
    },
    keyNav : function(e) {
        var key = e.keyCode || e.which;
        var map = e.data.map;
        var scope = e.data.scope;
        var keymap = {
            UP: 38,
            DOWN: 40,
            LEFT: 37,
            RIGHT: 39,
            RETURN: 13,
            ESCAPE: 27,
            BACKSPACE: 8
        };
        for( var i in map ) {
            var k = i.toUpperCase();
            if ( keymap[k] ) {
                map[keymap[k]] = map[i];
            }
        }
        if (typeof map[key] == 'function') {
            map[key].call(scope, e);
        }
    },
    build : function() {
        this.append({
            'info-text' :
                ['info-title', 'info-description', 'info-author'],
            'info' : 
                ['info-link', 'info-text', 'info-close'],
            'image-nav' : 
                ['image-nav-right', 'image-nav-left'],
            'stage' : 
                ['images', 'loader', 'counter', 'image-nav'],
            'thumbnails-list' :
                ['thumbnails'],
            'thumbnails-container' : 
                ['thumb-nav-left', 'thumbnails-list', 'thumb-nav-right'],
            'container' : 
                ['stage', 'thumbnails-container', 'info']
        });
    },
    
    appendChild : function(parent, child) {
        try {
            this.get(parent).appendChild(this.get(child));
        } catch(e) {}
    },
    
    append : function(data) {
        for( var i in data) {
            if (data[i].constructor == Array) {
                for(var j=0; data[i][j]; j++) {
                    this.appendChild(i, data[i][j]);
                }
            } else {
                this.appendChild(i, data[i]);
            }
        }
        return this;
    },
    
    rescale : function(width, height) {
        
        var check = this.proxy(function() {
            this.stageWidth = width || this.width(this.get('stage'));
            this.stageHeight = height || this.height(this.get('stage'));
            return this.stageWidth && this.stageHeight;
        });
        if ( G.WEBKIT ) {
            this.wait(check);// wekit is too fast
        } else {
            check.call(this); 
        }
        this.controls.getActive().scale(this.stageWidth, this.stageHeight, this.options.image_crop, this.options.max_scale_ratio, this.options.image_margin);
        if (this.carousel) {
            this.carousel.setOverflow();
        }
        
    },
    
    show : function(index, rewind, history) {
        if (!this.options.queue && this.queue.stalled) {
            return;
        }
        rewind = typeof rewind != 'undefined' ? !!rewind : index < this.active;
        history = history || false;
        index = parseInt(index);
        if (!history && G.History) {
            G.History.value(index.toString());
            return;
        }
        this.active = index;
        this.push([index,rewind], this.queue);
        if (!this.queue.stalled) {
            this.showImage();
        }
        return this;
    },
    
    showImage : function() {
        var o = this.options;
        var args = this.queue[0];
        var index = args[0];
        var rewind = !!args[1];
        if (o.carousel && this.carousel && o.carousel_follow) {
            this.proxy(function(c) {
                if (index <= Math.abs(c.pos)) {
                    c.pos = Math.max(0, (index-1))*-1;
                    c.animate();
                } else if ( index >= this.thumbnails.length + c.overflow + Math.abs(c.pos)) {
                    c.pos = this.thumbnails.length + c.overflow - index - 1 + (index == this.thumbnails.length-1 ? 1 : 0);
                    c.animate();
                }
            })(this.carousel);
        }
        
        var src = this.getData(index).image;
        var active = this.controls.getActive();
        var next = this.controls.getNext();
        var cached = next.isCached(src);
        var complete = this.proxy(function() {
            this.queue.stalled = false;
            this.toggleQuality(next.image, o.image_quality);
            this.setStyle( active.elem, { zIndex : 0 } );
            this.setStyle( next.elem, { zIndex : 1 } );
            this.controls.swap();
            this.moveOut( active.image );
            if (this.getData( index ).link) {
                this.setStyle( next.image, { cursor: 'pointer' } );
                this.listen( next.image, 'click', this.proxy(function() {
                    if (o.popup_links) {
                        var win = window.open(this.getData( index ).link, '_blank');
                    } else {
                        window.location.href = this.getData( index ).link;
                    }
                }));
            }
            Array.prototype.shift.call( this.queue );
            if (this.queue.length) {
                this.showImage();
            }
            this.playCheck();
        });
        if (typeof o.preload == 'number' && o.preload > 0) {
            var p,n = this.getNext();
            try {
                for (var i = o.preload; i>0; i--) {
                    p = new Picture();
                    p.add(this.getData(n).image);
                    n = this.getNext(n);
                }
            } catch(e) {}
        }
        this.trigger( {
            type: G.LOADSTART,
            cached: cached,
            imageTarget: next.image,
            thumbTarget: this.thumbnails[index].image
        } );
        next.load( src, this.proxy(function(e) {
            next.scale(this.stageWidth, this.stageHeight, o.image_crop, o.max_scale_ratio, o.image_margin, this.proxy(function(e) {
                if (active.image) {
                    this.toggleQuality(active.image, false);
                }
                this.toggleQuality(next.image, false);
                this.trigger({
                    type: G.LOADFINISH,
                    cached: cached,
                    imageTarget: next.image,
                    thumbTarget: this.thumbnails[index].image
                });
                this.queue.stalled = true;
                var transition = G.transitions[o.transition] || o.transition;
                if (typeof transition == 'function') {
                    transition.call(this, {
                        prev: active.image,
                        next: next.image,
                        rewind: rewind,
                        speed: o.transition_speed || 400
                    }, complete );
                } else {
                    complete();
                }
            }));
            this.setInfo(index);
            this.get('counter').innerHTML = '<span class="current">' + (index+1) + 
                '</span> / <span class="total">' + this.thumbnails.length + '</span>';
        }));
    },
    
    getNext : function(base) {
        base = base || this.active;
        return base == this.data.length - 1 ? 0 : base + 1;
    },
    
    getPrev : function(base) {
        base = base || this.active;
        return base === 0 ? this.data.length - 1 : base - 1;
    },
    
    next : function() {
        if (this.data.length > 1) {
            this.show(this.getNext(), false);
        }
        return this;
    },
    
    prev : function() {
        if (this.data.length > 1) {
            this.show(this.getPrev(), true);
        }
        return this;
    },
    
    get : function( elem ) {
        return this.dom[ elem ] || false;
    },
    
    getData : function( index ) {
        return this.data[index] || this.data[this.active];
    },
    
    play : function(delay) {
        this.playing = true;
        this.playtime = delay || this.playtime;
        this.playCheck();
        return this;
    },
    
    pause : function() {
        this.playing = false;
        return this;
    },
    
    playCheck : function() {
        if (this.playing) {
            window.clearInterval(tID);
            tID = window.setTimeout(this.proxy(function() {
                if (this.playing) {
                    this.next();
                }
            }), this.playtime);
        }
    },
    
    setActive: function(val) {
        this.active = val;
        return this;
    },
    
    setInfo : function(index) {
        var data = this.getData(index);
        var set = this.proxy(function() {
            this.loop(arguments, function(type) {
                var elem = this.get('info-'+type);
                var fn = data[type] && data[type].length ? 'reveal' : 'hide';
                this[fn](elem);
                elem.innerHTML = data[type];
            });
        });
        set('title','description','author');
        return this;
    },
    
    hasInfo : function(index) {
        var d = this.getData(index);
        var check = 'title description author'.split(' ');
        for ( var i=0; check[i]; i++ ) {
            if ( d[ check[i] ] && d[ check[i] ].length ) {
                return true;
            }
        }
        return false;
    },
    
    getDataObject : function(o) {
        var obj = {
            image: '',
            thumb: '',
            title: '',
            description: '',
            author: '',
            link: ''
        };
        return o ? this.mix(obj,o) : obj;
    },
    
    jQuery : function( str ) {
        var ret = [];
        this.loop(str.split(','), this.proxy(function(elem) {
            elem = elem.replace(/^\s\s*/, "").replace(/\s\s*$/, "");
            if (this.get(elem)) {
                ret.push(elem);
            }
        }));
        var jQ = jQuery(this.get(ret.shift()));
        this.loop(ret, this.proxy(function(elem) {
            jQ = jQ.add(this.get(elem));
        }));
        return jQ;
    },
    
    $ : function( str ) {
        return this.jQuery( str );
    },
    
    toggleQuality : function(img, force) {
        if (!G.IE7 || typeof img == 'undefined' || !img) {
            return this;
        }
        if (typeof force === 'undefined') {
            force = img.style.msInterpolationMode == 'nearest-neighbor';
        }
        img.style.msInterpolationMode = force ? 'bicubic' : 'nearest-neighbor';

        return this;
    },
    
    load : function() {
        var loaded = 0;
        var o = this.options;
        if (
            (o.data_type == 'auto' && 
                typeof o.data_source == 'object' && 
                !(o.data_source instanceof jQuery) && 
                !o.data_source.tagName
            ) || o.data_type == 'json' || o.data_source.constructor == 'Array' ) {
            this.data = o.data_source;
            this.trigger( G.DATA );
            
        } else { // assume selector
            var images = jQuery(o.data_source).find(o.data_image_selector);
            var getData = this.proxy(function( elem ) {
                var i,j,anchor = elem.parentNode;
                if (anchor && anchor.nodeName == 'A') {
                    if (anchor.href.match(/\.(png|gif|jpg)/i)) {
                        i = anchor.href;
                    } else {
                        j = anchor.href;
                    }
                }
                var obj = this.getDataObject({
                    title: elem.title,
                    thumb: elem.src,
                    image: i || elem.src,
                    description: elem.alt,
                    link: j || elem.getAttribute('longdesc'),
                    elem: elem
                });
                return this.mix(obj, o.data_config( elem ) );
            });
            
            this.loop(images, function( elem ) {
                loaded++;
                this.push( getData( elem ), this.data );
                if (!o.keep_source && !Galleria.IE) {
                    elem.parentNode.removeChild(elem);
                }
                if ( loaded == images.length ) {
                    this.trigger( G.DATA );
                }
            });
        }
    }
});

G.log = function() {
    try { 
        console.log.apply( console, Array.prototype.slice.call(arguments) ); 
    } catch(e) {
        try {
            opera.postError.apply( opera, arguments ); 
        } catch(er) { 
              alert( Array.prototype.join.call( arguments, " " ) ); 
        } 
    }
};

G.DATA = 'data';
G.READY = 'ready';
G.THUMBNAIL = 'thumbnail';
G.LOADSTART = 'loadstart';
G.LOADFINISH = 'loadfinish';

var nav = navigator.userAgent.toLowerCase();

G.IE7 = (window.XMLHttpRequest && document.expando);
G.IE6 = (!window.XMLHttpRequest);
G.IE = !!(G.IE6 || G.IE7);
G.WEBKIT = /webkit/.test( nav );
G.SAFARI = /safari/.test( nav );
G.CHROME = /chrome/.test( nav );
G.QUIRK = (G.IE && document.compatMode && document.compatMode == "BackCompat");
G.MAC = /mac/.test(navigator.platform.toLowerCase());

var tempPath = ''; // we need to save this in a global private variable later
var tempName = ''; // the last loaded theme
var tempLoading = false; // we need to manually check if script has loaded
var tempFile = ''; // the theme file
var hash = window.location.hash.replace(/#\//,'');

G.themes = {
    create: function(obj) {
        var orig = ['name','author','version','defaults','init'];
        var proto = G.prototype;
        proto.loop(orig, function(val) {
            if (!obj[ val ]) {
                G.raise(val+' not specified in theme.');
            }
            if ( typeof G.themes[obj.name] == 'undefined') {
                G.themes[obj.name] = {};
            }
            if (val != 'name' && val != 'init') {
                G.themes[obj.name][val] = obj[val];
            }
        });
        if (obj.css) {
            if (!tempPath.length) { // try to find the script tag to determine tempPath
                var theme_src = proto.getElements('script');
                proto.loop(theme_src, function(el) {
                    var reg = new RegExp('galleria.'+obj.name+'.js');
                    if(reg.test(el.src)) {
                        tempPath = el.src.replace(/[^\/]*$/, "");
                    }
                });
            }
            obj.cssPath = tempPath + obj.css;
            tempPath = '';
        }
        tempName = obj.name;
        G.themes[obj.name].init = function(o) {
            if (obj.cssPath) {
                var link = proto.getElements('#galleria-styles');
                if (link.length) {
                    link = link[0];
                } else {
                    link = proto.create('link');
                    link.id = 'galleria-styles';
                    link.rel = 'stylesheet';
                    link.media = 'all';
                    var li = document.getElementsByTagName('link').length ?
                        document.getElementsByTagName('link') : document.getElementsByTagName('style');
                    if (li[0]) {
                        li[0].parentNode.insertBefore(link, li[0]);
                    } else {
                        document.getElementsByTagName('head')[0].appendChild(link);
                    }
                }
                link.href = obj.cssPath;
            }
            if (obj.cssText) {
                proto.cssText(obj.cssText);
            }
            o = proto.mix( G.themes[obj.name].defaults, o );
            var gallery = new G( o );
            o = gallery.options;
            gallery.bind(G.DATA, function() {
                gallery.run();
            });
            gallery.bind(G.READY, function() {
                if (G.History) {
                    G.History.change(function(e) {
                        var val = parseInt(e.value.replace(/\//,''));
                        if (isNaN(val)) {
                            window.history.go(-1);
                        } else {
                            gallery.show(val, undefined, true);
                        }
                    });
                }
                obj.init.call(gallery, o);
                o.extend.call(gallery, o);
                if (/^[0-9]{1,4}$/.test(hash) && G.History) {
                    gallery.show(hash, undefined, true);
                } else if (typeof o.show == 'number') {
                    gallery.show(o.show);
                }
                if (o.autoplay) {
                    if (typeof o.autoplay == 'number') {
                        gallery.play(o.autoplay);
                    } else {
                        gallery.play();
                    }
                }
            });
            gallery.load();
            return gallery;
        };
    }
};

G.raise = function(msg) {
    if ( G.debug ) {
        throw new Error( msg );
    }
},

G.loadTheme = function(src, callback) {
    tempLoading = true;
    tempPath = src.replace(/[^\/]*$/, "");
    tempFile = src;
    G.prototype.getScript(src, function() {
        tempLoading = false;
        if (typeof callback == 'function') {
            callback();
        }
    });
};

jQuery.easing.galleria = function (x, t, b, c, d) {
    if ((t/=d/2) < 1) { 
        return c/2*t*t*t*t + b;
    }
    return -c/2 * ((t-=2)*t*t*t - 2) + b;
};

G.transitions = {
    add: function(name, fn) {
        if (name != arguments.callee.name ) {
            this[name] = fn;
        }
    },
    fade: function(params, complete) {
        jQuery(params.next).show().css('opacity',0).animate({
            opacity: 1
        }, params.speed, complete);
        if (params.prev) {
            jQuery(params.prev).css('opacity',1).animate({
                opacity: 0
            }, params.speed);
        }
    },
    flash: function(params, complete) {
        jQuery(params.next).css('opacity',0);
        if (params.prev) {
            jQuery(params.prev).animate({
                opacity: 0
            }, (params.speed/2), function() {
                jQuery(params.next).animate({
                    opacity: 1
                }, params.speed, complete);
            });
        } else {
            jQuery(params.next).animate({
                opacity: 1
            }, params.speed, complete);
        }
    },
    slide: function(params, complete) {
        var image = jQuery(params.next).parent();
        var images =  this.$('images');
        var width = this.stageWidth;
        image.css({
            left: width * ( params.rewind ? -1 : 1 )
        });
        images.animate({
            left: width * ( params.rewind ? 1 : -1 )
        }, {
            duration: params.speed,
            queue: false,
            easing: 'galleria',
            complete: function() {
                images.css('left',0);
                image.css('left',0);
                complete();
            }
        });
    },
    fadeslide: function(params, complete) {
        if (params.prev) {
            jQuery(params.prev).css({
                opacity: 1,
                left: 0
            }).animate({
                opacity: 0,
                left: 50 * ( params.rewind ? 1 : -1 )
            },{
                duration: params.speed,
                queue: false,
                easing: 'swing'
            });
        }
        jQuery(params.next).css({
            left: 50 * ( params.rewind ? -1 : 1 ), 
            opacity: 0
        }).animate({
            opacity: 1,
            left:0
        }, {
            duration: params.speed,
            complete: complete,
            queue: false,
            easing: 'swing'
        });
    }
};

jQuery.fn.galleria = function() {
    var selector = this.selector;
    var a = arguments;
    var hasTheme = typeof a[0] == 'string';
    var options = hasTheme ? a[1] || {} : a[0] || {};

    if ( !options.keep_source ) {
        jQuery(this).find('*').hide();
    }

    G.prototype.wait(function() {
        return !tempLoading;
    }, function() {
        var theme = hasTheme ? a[0] : tempName;
        options = G.prototype.mix(options, { target: selector } );
        G.debug = !!options.debug; 
        if (typeof G.themes[theme] == 'undefined') {
            var err = theme ? 'Theme '+theme+' not found.' : 'No theme specified';
            G.raise(err);
            return null;
        } else {
            return G.themes[theme].init(options);
        }
    }, function() {
        G.raise('Theme file '+tempFile+' not found.');
    });
};

})();