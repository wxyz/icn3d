/**
 * @author Jiyao Wang <wangjiy@ncbi.nlm.nih.gov> / https://github.com/ncbi/icn3d
 */

/*! The following are shared by full_ui.js and simple_ui.js */

if (typeof jQuery === 'undefined') { throw new Error('iCn3DUI requires jQuery') }
if (typeof iCn3D === 'undefined') { throw new Error('iCn3DUI requires iCn3D') }

/*
iCn3DUI.prototype.clickHighlight_3d_dgm = function() { var me = this; //"use strict";
    $("#" + me.pre + "highlight_3d_dgm").click(function (e) {
       //e.preventDefault();
       me.icn3d.removeHlObjects();

       var ckbxes = document.getElementsByName(me.pre + "filter_ckbx");

       var mols = "";

       var molid2ssTmp = {}, molid2colorTmp = {};

       me.icn3d.hAtoms = {};
       for(var i = 0, il = ckbxes.length; i < il; ++i) { // skip the first "all" checkbox
         if(ckbxes[i].checked && ckbxes[i].value != 'chemicals') {
           var value = ckbxes[i].value;
           var chain = ckbxes[i].getAttribute('chain');

           if(me.icn3d.molid2ss.hasOwnProperty(value)) { // condensed view
               molid2ssTmp[value] = me.icn3d.molid2ss[value];
               molid2colorTmp[value] = me.icn3d.molid2color[value];
           }
           else { // all atom view
               me.icn3d.hAtoms = me.icn3d.unionHash(me.icn3d.hAtoms, me.icn3d.chains[chain]);
           }
         }
       }

       me.icn3d.drawHelixBrick(molid2ssTmp, molid2colorTmp, me.icn3d.bHighlight); // condensed view
       me.icn3d.addHlObjects(undefined, false); // all atom view

       me.icn3d.render();
    });
};
*/

iCn3DUI.prototype.rotStruc = function (direction, bInitial) { var me = this; //"use strict";
    if(me.icn3d.bStopRotate) return false;
    if(me.icn3d.rotateCount > me.icn3d.rotateCountMax) {
        // back to the original orientation
        me.icn3d.resetOrientation();

        return false;
    }
    ++me.icn3d.rotateCount;

    if(bInitial !== undefined && bInitial) {
        if(direction === 'left') {
          me.ROT_DIR = 'left';
        }
        else if(direction === 'right') {
          me.ROT_DIR = 'right';
        }
        else if(direction === 'up') {
          me.ROT_DIR = 'up';
        }
        else if(direction === 'down') {
          me.ROT_DIR = 'down';
        }
        else {
          return false;
        }
    }

    if(direction === 'left' && me.ROT_DIR === 'left') {
      me.icn3d.rotateLeft(1);
    }
    else if(direction === 'right' && me.ROT_DIR === 'right') {
      me.icn3d.rotateRight(1);
    }
    else if(direction === 'up' && me.ROT_DIR === 'up') {
      me.icn3d.rotateUp(1);
    }
    else if(direction === 'down' && me.ROT_DIR === 'down') {
      me.icn3d.rotateDown(1);
    }
    else {
      return false;
    }

    setTimeout(function(){ me.rotStruc(direction); }, 100);
};

iCn3DUI.prototype.showTitle = function() { var me = this; //"use strict";
    if(me.icn3d.molTitle !== undefined && me.icn3d.molTitle !== '') {
        var title = me.icn3d.molTitle;

        var titlelinkColor = (me.opts['background'] == 'white' || me.opts['background'] == 'grey') ? 'black' : me.GREYD;

        if(me.inputid === undefined) {
            if(me.icn3d.molTitle.length > 40) title = me.icn3d.molTitle.substr(0, 40) + "...";

            $("#" + me.pre + "title").html(title);
        }
        else if(me.cfg.cid !== undefined) {
            var url = me.getLinkToStructureSummary();

            $("#" + me.pre + "title").html("PubChem CID <a id='" + me.pre + "titlelink' href='" + url + "' style='color:" + titlelinkColor + "' target='_blank'>" + me.inputid.toUpperCase() + "</a>: " + title);
        }
        else if(me.cfg.align !== undefined) {
            $("#" + me.pre + "title").html(title);
        }
        else if(me.cfg.chainalign !== undefined) {
            var chainidArray = me.cfg.chainalign.split(',');
            title = 'Dynamic Structure Alignment of Chain ' + chainidArray[0] + ' to Chain ' + chainidArray[1];

            $("#" + me.pre + "title").html(title);
        }
        else {
            var url = me.getLinkToStructureSummary();

            if(me.icn3d.molTitle.length > 40) title = me.icn3d.molTitle.substr(0, 40) + "...";

            //var asymmetricStr = (me.bAssemblyUseAsu) ? " (Asymmetric Unit)" : "";
            var asymmetricStr = "";

            $("#" + me.pre + "title").html("PDB ID <a id='" + me.pre + "titlelink' href='" + url + "' style='color:" + titlelinkColor + "' target='_blank'>" + me.inputid.toUpperCase() + "</a>" + asymmetricStr + ": " + title);
        }
    }
    else {
        $("#" + me.pre + "title").html("");
    }
};

iCn3DUI.prototype.getLinkToStructureSummary = function(bLog) { var me = this; //"use strict";

       var url = "https://www.ncbi.nlm.nih.gov/structure/?term=";

       if(me.cfg.cid !== undefined) {
           url = "https://www.ncbi.nlm.nih.gov/pccompound/?term=";
       }
       else {
           if(me.inputid.indexOf(",") !== -1) {
               url = "https://www.ncbi.nlm.nih.gov/structure/?term=";
           }
           else {
               //url = "https://www.ncbi.nlm.nih.gov/Structure/mmdb/mmdbsrv.cgi?uid=";
               url = "https://www.ncbi.nlm.nih.gov/Structure/pdb/";
           }
       }

       if(me.inputid === undefined) {
           url = "https://www.ncbi.nlm.nih.gov/pccompound/?term=" + me.molTitle;
       }
       else {
           var idArray = me.inputid.split('_');

           if(idArray.length === 1) {
               url += me.inputid;
               if(bLog !== undefined && bLog) me.setLogCmd("link to Structure Summary " + me.inputid + ": " + url, false);
           }
           else if(idArray.length === 2) {
               url += idArray[0] + " OR " + idArray[1];
               if(bLog !== undefined && bLog) me.setLogCmd("link to structures " + idArray[0] + " and " + idArray[1] + ": " + url, false);
           }
       }

       return url;
},

iCn3DUI.prototype.isIE = function() { var me = this; //"use strict";
    //http://stackoverflow.com/questions/19999388/check-if-user-is-using-ie-with-jquery
    var ua = window.navigator.userAgent;
    var msie = ua.indexOf("MSIE ");

    if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./))      // If Internet Explorer
        return true;
    else                 // If another browser, return 0
        return false;
};

iCn3DUI.prototype.passFloat32 = function( array, output ){ var me = this; //"use strict";
    var n = array.length;
    if( !output ) output = new Uint8Array( 4 * n );
    var dv = me.getDataView( output );
    for( var i = 0; i < n; ++i ){
        dv.setFloat32( 4 * i, array[ i ], true); // litteEndian = true
    };
    return me.getUint8View( output );
};

iCn3DUI.prototype.passInt8 = function( array, output ){ var me = this; //"use strict";
    var n = array.length;
    if( !output ) output = new Uint8Array( 1 * n );
    var dv = me.getDataView( output );
    for( var i = 0; i < n; ++i ){
        dv.setInt8( 1 * i, array[ i ], true); // litteEndian = true
    };
    return me.getUint8View( output );
};

iCn3DUI.prototype.passInt16 = function( array, output ){ var me = this; //"use strict";
    var n = array.length;
    if( !output ) output = new Uint8Array( 2 * n );
    var dv = me.getDataView( output );
    for( var i = 0; i < n; ++i ){
        dv.setInt16( 2 * i, array[ i ], true); // litteEndian = true
    };
    return me.getUint8View( output );
};

iCn3DUI.prototype.passInt32 = function( array, output ){ var me = this; //"use strict";
    var n = array.length;
    if( !output ) output = new Uint8Array( 4 * n );
    var dv = me.getDataView( output );
    for( var i = 0; i < n; ++i ){
        dv.setInt32( 4 * i, array[ i ], true); // litteEndian = true
    };
    return me.getUint8View( output );
};

// ------------

iCn3DUI.prototype.getUint8View = function( typedArray ){ var me = this; //"use strict";
    return me.getView( Uint8Array, typedArray );
};

iCn3DUI.prototype.getDataView = function( typedArray ){ var me = this; //"use strict";
    return me.getView( DataView, typedArray );
};

iCn3DUI.prototype.getView = function( ctor, typedArray, elemSize ){ var me = this; //"use strict";
    return typedArray ? new ctor(
        typedArray.buffer,
        typedArray.byteOffset,
        typedArray.byteLength / ( elemSize || 1 )
    ) : undefined;
};

iCn3DUI.prototype.getBlobFromBufferAndText = function(arrayBuffer, text) { var me = this; //"use strict";
    //var start = "data:image/png;base64,";

    //var strArray0 = new Uint8Array(start.length);
    //for(var i = 0; i < start.length; ++i) {
    //   strArray0[i] = me.passInt8([start.charCodeAt(i)])[0];
    //}

    var strArray = new Uint8Array(arrayBuffer);

    var strArray2 = new Uint8Array(text.length);
    for(var i = 0; i < text.length; ++i) {
       strArray2[i] = me.passInt8([text.charCodeAt(i)])[0];
    }

    var blobArray = []; // hold blobs

    //blobArray.push(new Blob([strArray0],{ type: "application/octet-stream"}));
    blobArray.push(new Blob([strArray],{ type: "application/octet-stream"}));
    blobArray.push(new Blob([strArray2],{ type: "application/octet-stream"}));

    //var blob = new Blob(blobArray,{ type: "application/octet-stream"});
    var blob = new Blob(blobArray,{ type: "image/png"});

    return blob;
};

iCn3DUI.prototype.getTransformationStr = function(transformation) { var me = this; //"use strict";
    var transformation2 = {"factor": 1.0, "mouseChange": {"x": 0, "y": 0}, "quaternion": {"_x": 0, "_y": 0, "_z": 0, "_w": 1} };
    transformation2.factor = parseFloat(transformation.factor).toPrecision(5);
    transformation2.mouseChange.x = parseFloat(transformation.mouseChange.x).toPrecision(5);
    transformation2.mouseChange.y = parseFloat(transformation.mouseChange.y).toPrecision(5);
    transformation2.quaternion._x = parseFloat(transformation.quaternion._x).toPrecision(5);
    transformation2.quaternion._y = parseFloat(transformation.quaternion._y).toPrecision(5);
    transformation2.quaternion._z = parseFloat(transformation.quaternion._z).toPrecision(5);
    transformation2.quaternion._w = parseFloat(transformation.quaternion._w).toPrecision(5);

    if(transformation2.factor == '1.0000') transformation2.factor = 1;
    if(transformation2.mouseChange.x == '0.0000') transformation2.mouseChange.x = 0;
    if(transformation2.mouseChange.y == '0.0000') transformation2.mouseChange.y = 0;

    if(transformation2.quaternion._x == '0.0000') transformation2.quaternion._x = 0;
    if(transformation2.quaternion._y == '0.0000') transformation2.quaternion._y = 0;
    if(transformation2.quaternion._z == '0.0000') transformation2.quaternion._z = 0;
    if(transformation2.quaternion._w == '1.0000') transformation2.quaternion._w = 1;

    return JSON.stringify(transformation2);
};

/*
iCn3DUI.prototype.createLinkForBlob = function(blob, filename) { var me = this; //"use strict";
    var link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
*/

iCn3DUI.prototype.getPngText = function() { var me = this; //"use strict";
    var url; // output state file if me.bInputfile is true or the URL is mor than 4000 chars
    var bAllCommands = true;

    var text = "";
    if(me.bInputfile) {
        url = me.shareLinkUrl(bAllCommands); // output state file if me.bInputfile is true or the URL is mor than 4000 chars

        text += "\nStart of type file======\n";
        text += me.InputfileType + "\n";
        text += "End of type file======\n";

        text += "Start of data file======\n";
        text += me.InputfileData;
        text += "End of data file======\n";

        text += "Start of state file======\n";
        text += url;
        text += "End of state file======\n";
    }
    else {
        url = me.shareLinkUrl();
        if(url.length > 4000) {
            url = me.shareLinkUrl(bAllCommands); // output state file if me.bInputfile is true or the URL is mor than 4000 chars

            text += "\nStart of state file======\n";

            text += url;
            text += "End of state file======\n";
        }
        else {
            text += "\nShare Link: " + url;
        }
    }

    return text;
};

iCn3DUI.prototype.saveFile = function(filename, type, text) { var me = this; //"use strict";
    //Save file
    var blob;

    if(type === 'command') {
        var dataStr = '';
        for(var i = 0, il = me.icn3d.commands.length; i < il; ++i) {
            var command = me.icn3d.commands[i].trim();
            if(i == il - 1) {
               var command_tf = command.split('|||');

               var transformation = {};
               transformation.factor = me.icn3d._zoomFactor;
               transformation.mouseChange = me.icn3d.mouseChange;
               transformation.quaternion = me.icn3d.quaternion;

               command = command_tf[0] + '|||' + me.getTransformationStr(transformation);
            }

            dataStr += command + '\n';
        }
        var data = decodeURIComponent(dataStr);

        blob = new Blob([data],{ type: "text;charset=utf-8;"});
    }
    else if(type === 'png') {
        me.icn3d.render();

        var bAddURL = true;
        if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
            bAddURL = false;
        }

        if(me.isIE()) {
            blob = me.icn3d.renderer.domElement.msToBlob();

            if(bAddURL) {
                var reader = new FileReader();
                reader.onload = function (e) {
                    var arrayBuffer = e.target.result; // or = reader.result;

                    var text = me.getPngText();

                    blob = me.getBlobFromBufferAndText(arrayBuffer, text);

                    //if(window.navigator.msSaveBlob) navigator.msSaveBlob(blob, filename);
                    saveAs(blob, filename);

                    return;
                };

                reader.readAsArrayBuffer(blob);
            }
        }
        else {
            me.icn3d.renderer.domElement.toBlob(function(data) {
                if(bAddURL) {
                    var reader = new FileReader();
                    reader.onload = function (e) {
                        var arrayBuffer = e.target.result; // or = reader.result;

                        var text = me.getPngText();

                        blob = me.getBlobFromBufferAndText(arrayBuffer, text);

                        //me.createLinkForBlob(blob, filename);
                        saveAs(blob, filename);

                        return;
                    };

                    reader.readAsArrayBuffer(data);
                }
                else {
                    blob = data;

                    //me.createLinkForBlob(blob, filename);
                    saveAs(blob, filename);

                    return;
                }
            });
        }
    }
    else if(type === 'html') {
        var dataStr = text;
        var data = decodeURIComponent(dataStr);

        blob = new Blob([data],{ type: "text/html;charset=utf-8;"});
    }
    else if(type === 'text') {
        //var dataStr = text;
        //var data = decodeURIComponent(dataStr);

        //blob = new Blob([data],{ type: "text;charset=utf-8;"});

        var data = text; // here text is an array of text

        blob = new Blob(data,{ type: "text;charset=utf-8;"});
    }
    else if(type === 'binary') {
        var data = text; // here text is an array of blobs

        //blob = new Blob([data],{ type: "application/octet-stream"});
        blob = new Blob(data,{ type: "application/octet-stream"});
    }

/*
    //https://github.com/mholt/PapaParse/issues/175
    //IE11 & Edge
    if(me.isIE() && window.navigator.msSaveBlob){
        navigator.msSaveBlob(blob, filename);
    } else {
        //In FF link must be added to DOM to be clicked
        var link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
*/

    if(type !== 'png') {
        //https://github.com/eligrey/FileSaver.js/
        saveAs(blob, filename);
    }
};


iCn3DUI.prototype.isMobile = function() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

iCn3DUI.prototype.isMac = function() {
    return /Mac/i.test(navigator.userAgent);
};

iCn3DUI.prototype.isSessionStorageSupported = function() {
  var testKey = 'test';
  try {
    sessionStorage.setItem(testKey, '1');
    sessionStorage.removeItem(testKey);
    return true;
  } catch (error) {
    return false;
  }
};

iCn3DUI.prototype.resizeCanvas = function (width, height, bForceResize, bDraw) { var me = this; //"use strict";
  if( (bForceResize !== undefined && bForceResize) || (me.cfg.resize !== undefined && me.cfg.resize) ) {
    //var heightTmp = parseInt(height) - me.EXTRAHEIGHT;
    var heightTmp = height;
    $("#" + me.pre + "canvas").width(width).height(heightTmp);

    $("#" + me.pre + "viewer").width(width).height(height);

    me.icn3d.setWidthHeight(width, heightTmp);

    if(bDraw === undefined || bDraw) {
        me.icn3d.draw();
    }
  }
};

iCn3DUI.prototype.handleContextLost = function() { var me = this; //"use strict";
    //https://www.khronos.org/webgl/wiki/HandlingContextLost
    // 1 add a lost context handler and tell it to prevent the default behavior

    var canvas = $("#" + me.pre + "canvas")[0];
    canvas.addEventListener("webglcontextlost", function(event) {
        event.preventDefault();
    }, false);

    // 2 re-setup all your WebGL state and re-create all your WebGL resources when the context is restored.
    canvas.addEventListener("webglcontextrestored", function(event) {
        // IE11 error: WebGL content is taking too long to render on your GPU. Temporarily switching to software rendering.
        console.log("WebGL context was lost. Reset WebGLRenderer and launch iCn3D again.");

        me.icn3d.renderer = new THREE.WebGLRenderer({
            canvas: me.icn3d.container.get(0),
            antialias: true,
            preserveDrawingBuffer: true,
            alpha: true
        });

        me.icn3d.draw();

    }, false);
};

iCn3DUI.prototype.windowResize = function() { var me = this; //"use strict";
    if(me.cfg.resize !== undefined && me.cfg.resize && !me.isMobile() ) {
        $(window).resize(function() {
            //me.WIDTH = $( window ).width();
            //me.HEIGHT = $( window ).height();
            me.setViewerWidthHeight();

            var width = me.WIDTH; // - me.LESSWIDTH_RESIZE;
            var height = me.HEIGHT; // - me.LESSHEIGHT - me.EXTRAHEIGHT;

            if(me.icn3d !== undefined && !me.icn3d.bFullscreen) me.resizeCanvas(width, height);
        });
    }
};

iCn3DUI.prototype.setViewerWidthHeight = function() { var me = this; //"use strict";
    me.WIDTH = $( window ).width() - me.LESSWIDTH;
    me.HEIGHT = $( window ).height() - me.EXTRAHEIGHT - me.LESSHEIGHT;

    // width from css
    var viewer_width, viewer_height;

    if(me.oriWidth !== undefined && me.cfg.width.toString().indexOf('%') === -1) {
        viewer_width = me.oriWidth;
        viewer_height = me.oriHeight;
    }
    else {
        // css width and height
        viewer_width = $( "#" + me.pre + "viewer" ).css('width');
        viewer_height = $( "#" + me.pre + "viewer" ).css('height'); // + me.MENU_HEIGHT;

        if(viewer_width === undefined) viewer_width = me.WIDTH;
        if(viewer_height === undefined) viewer_height = me.HEIGHT;

        // width and height from input parameter
        if(me.cfg.width.toString().indexOf('%') !== -1) {
          viewer_width = $( window ).width() * me.cfg.width.substr(0, me.cfg.width.toString().indexOf('%')) / 100.0 - me.LESSWIDTH;
        }
        else {
          viewer_width = parseInt(me.cfg.width);
        }

        if(me.cfg.height.toString().indexOf('%') !== -1) {
          viewer_height = $( window ).height() * me.cfg.height.substr(0, me.cfg.height.toString().indexOf('%')) / 100.0 - me.EXTRAHEIGHT - me.LESSHEIGHT;
        }
        else {
          viewer_height = parseInt(me.cfg.height);
        }
    }

    if(viewer_width && me.WIDTH > viewer_width) me.WIDTH = viewer_width;
    if(viewer_height && me.HEIGHT > viewer_height) me.HEIGHT = viewer_height;
};

iCn3DUI.prototype.shareLinkUrl = function(bAllCommands) { var me = this; //"use strict";
       var url = "https://www.ncbi.nlm.nih.gov/Structure/icn3d/full.html?";

       for(var key in me.cfg) {
           var value = me.cfg[key];
           if(key === 'inpara' || me.key === 'command' || value === undefined) continue;

            // check the default values as defined at the beginning of full_ui.js
            //if(key === 'command' && value === '') continue;

            if(key === 'width' && value === '100%') continue;
            if(key === 'height' && value === '100%') continue;

            if(key === 'resize' && value === true) continue;
            if(key === 'showmenu' && value === true) continue;
            if(key === 'showtitle' && value === true) continue;
            if(key === 'showcommand' && value === true) continue;

            if(key === 'simplemenu' && value === false) continue;
            if(key === 'mobilemenu' && value === false) continue;
            if(key === 'closepopup' && value === false) continue;
            if(key === 'showanno' && value === false) continue;
            if(key === 'showseq' && value === false) continue;
            if(key === 'showalignseq' && value === false) continue;
            if(key === 'show2d' && value === false) continue;
            if(key === 'showsets' && value === false) continue;

            if(key === 'rotate' && value === 'right') continue;

            // commands will be added in the for loop below: for(var il = me.icn3d.commands...
            if(key === 'command') continue;

           if(key === 'options') {
               if(Object.keys(value).length > 0) url += key + '=' + JSON.stringify(value) + '&';
           }
           else if(value === true) {
               url += key + '=1&';
           }
           else if(value === false) {
               url += key + '=0&';
           }
           else if(value !== '') {
               url += key + '=' + value + '&';
           }
       }

       var pos = -1;
       if(me.cfg.inpara !== undefined) pos = me.cfg.inpara.indexOf('&command=');
       var inparaWithoutCommand = (pos !== -1 ) ? me.cfg.inpara.substr(0, pos) : me.cfg.inpara;

       var start = 0;
       if(inparaWithoutCommand !== undefined) {
         url += inparaWithoutCommand.substr(1) + '&command=';
         //url += 'command=';
         start = 1;
       }
       else {
         url += 'command=';
         start = 0;
       }

       if(bAllCommands !== undefined && bAllCommands) start = 0;

       var transformation = {};
       transformation.factor = me.icn3d._zoomFactor;
       transformation.mouseChange = me.icn3d.mouseChange;
       transformation.quaternion = me.icn3d.quaternion;

       var bCommands = false;
       var statefile = "";
       var prevCommandStr = undefined;

       var toggleStr = 'toggle highlight';
       var cntToggle = 0;

       if(me.icn3d.commands.length > start) {
           var command_tf = me.icn3d.commands[start].split('|||');
           prevCommandStr = command_tf[0].trim();

           //statefile += me.icn3d.commands[start] + "\n";

           if(prevCommandStr.indexOf(toggleStr) !== -1) ++cntToggle;
       }

       var i = start + 1;
       for(var il = me.icn3d.commands.length; i < il; ++i) {
           bCommands = true;

           var command_tf = me.icn3d.commands[i].split('|||');
           var commandStr = command_tf[0].trim();

           //statefile += me.icn3d.commands[i] + "\n";

           // only output the most recent 'select saved atoms...' without " | name ..."
           if( (prevCommandStr.indexOf('select saved atoms') !== -1 && commandStr.indexOf('select saved atoms') !== -1
             && prevCommandStr.indexOf(' name ') === -1 && commandStr.indexOf(' name ') === -1)
             || (prevCommandStr.indexOf('select chain') !== -1 && commandStr.indexOf('select chain') !== -1)
             || (prevCommandStr.indexOf('pickatom') !== -1 && commandStr.indexOf('pickatom') !== -1)
             ) {
               // do nothing
           }
           // remove all "show selection" except the last one
           else if(prevCommandStr == 'show selection' && me.icn3d.commands.slice(i).toString().indexOf('show selection') != -1) {
               // do nothing
           }
           else if(prevCommandStr.indexOf(toggleStr) !== -1) {
               ++cntToggle;
           }
           else if(i === start + 1) {
               url += prevCommandStr;
               statefile += prevCommandStr + "\n";
           }
           else {
               url += '; ' + prevCommandStr;
               statefile += prevCommandStr + "\n";
           }

           prevCommandStr = commandStr;
       }

       // last command
       if(prevCommandStr !== undefined) {
           if(bCommands) url += '; ';
           if(cntToggle > 0 && cntToggle %2 == 0 && prevCommandStr !== toggleStr) url += toggleStr + '; ';

           url += prevCommandStr + '|||' + me.getTransformationStr(transformation);
           statefile += prevCommandStr + '|||' + me.getTransformationStr(transformation) + '\n';
       }

       // remove "&command="
//       if(!bCommands) {
//           url = url.substr(0, url.length - 9);
//       }

       if(me.bInputfile || url.length > 4000) url = statefile;

       return url;
};

iCn3DUI.prototype.addLabel = function (text, x, y, z, size, color, background, type) { var me = this; //"use strict";
    var label = {}; // Each label contains 'position', 'text', 'color', 'background'

    if(size === '0' || size === '' || size === 'undefined') size = undefined;
    if(color === '0' || color === '' || color === 'undefined') color = undefined;
    if(background === '0' || background === '' || background === 'undefined') background = undefined;

    var position = new THREE.Vector3();
    position.x = x;
    position.y = y;
    position.z = z;

    label.position = position;

    label.text = text;
    label.size = size;
    label.color = color;
    label.background = background;

    if(me.icn3d.labels[type] === undefined) me.icn3d.labels[type] = [];

    if(type !== undefined) {
        me.icn3d.labels[type].push(label);
    }
    else {
        me.icn3d.labels['custom'].push(label);
    }

    me.icn3d.removeHlObjects();

    //me.icn3d.draw();
};
