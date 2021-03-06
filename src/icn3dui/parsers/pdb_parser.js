/**
 * @author Jiyao Wang <wangjiy@ncbi.nlm.nih.gov> / https://github.com/ncbi/icn3d
 */

iCn3DUI.prototype.downloadPdb = function (pdbid) { var me = this; //"use strict";
   var url, dataType;

   url = "https://files.rcsb.org/view/" + pdbid + ".pdb";

   dataType = "text";

   me.icn3d.bCid = undefined;

   $.ajax({
      url: url,
      dataType: dataType,
      cache: true,
      tryCount : 0,
      retryLimit : 1,
      beforeSend: function() {
          me.showLoading();
      },
      complete: function() {
          me.hideLoading();
      },
      success: function(data) {
          //me.loadPdbData(data, pdbid);
          me.deferredOpm = $.Deferred(function() {
              me.loadPdbOpmData(data, pdbid);
          });

          return me.deferredOpm.promise();
      },
      error : function(xhr, textStatus, errorThrown ) {
        this.tryCount++;
        if (this.tryCount <= this.retryLimit) {
            //try again
            $.ajax(this);
            return;
        }
        return;
      }
   });
};

iCn3DUI.prototype.downloadOpm = function (opmid) { var me = this; //"use strict";
   var url, dataType;

   url = "https://opm-assets.storage.googleapis.com/pdb/" + opmid.toLowerCase()+ ".pdb";

   dataType = "text";

   me.icn3d.bCid = undefined;

   // no rotation
   me.icn3d.bStopRotate = true;

   $.ajax({
      url: url,
      dataType: dataType,
      cache: true,
      tryCount : 0,
      retryLimit : 1,
      beforeSend: function() {
          me.showLoading();
      },
      complete: function() {
          me.hideLoading();
      },
      success: function(data) {
          me.icn3d.bOpm = true;
          me.loadPdbData(data, opmid, me.icn3d.bOpm);

          $("#" + me.pre + "selectplane_z1").val(me.icn3d.halfBilayerSize);
          $("#" + me.pre + "selectplane_z2").val(-me.icn3d.halfBilayerSize);

          $("#" + me.pre + "extra_mem_z").val(me.icn3d.halfBilayerSize);
          $("#" + me.pre + "intra_mem_z").val(-me.icn3d.halfBilayerSize);
      },
      error : function(xhr, textStatus, errorThrown ) {
        this.tryCount++;
        if (this.tryCount <= this.retryLimit) {
            //try again
            $.ajax(this);
            return;
        }
        alert("This is probably not a transmembrane protein. It has no data in Orientations of Proteins in Membranes (OPM) database.");
        return;
      }
   });
};

iCn3DUI.prototype.downloadUrl = function (url, type) { var me = this; //"use strict";
   var dataType = "text";

   me.icn3d.bCid = undefined;

   //var url = '//www.ncbi.nlm.nih.gov/Structure/mmcifparser/mmcifparser.cgi?dataurl=' + encodeURIComponent(url);

   $.ajax({
      url: url,
      dataType: dataType,
      cache: true,
      tryCount : 0,
      retryLimit : 1,
      beforeSend: function() {
          if($("#" + me.pre + "wait")) $("#" + me.pre + "wait").show();
          if($("#" + me.pre + "canvas")) $("#" + me.pre + "canvas").hide();
          if($("#" + me.pre + "cmdlog")) $("#" + me.pre + "cmdlog").hide();
      },
      complete: function() {
          if($("#" + me.pre + "wait")) $("#" + me.pre + "wait").hide();
          if($("#" + me.pre + "canvas")) $("#" + me.pre + "canvas").show();
          if($("#" + me.pre + "cmdlog")) $("#" + me.pre + "cmdlog").show();
      },
      success: function(data) {
        me.InputfileData = data;
        me.InputfileType = type;

        if(type === 'pdb') {
            me.loadPdbData(data);
        }
        else if(type === 'mol2') {
            me.loadMol2Data(data);
        }
        else if(type === 'sdf') {
            me.loadSdfData(data);
        }
        else if(type === 'xyz') {
            me.loadXyzData(data);
        }
        else if(type === 'mmcif') {
            me.loadMmcifData(data);
        }
      },
      error : function(xhr, textStatus, errorThrown ) {
        this.tryCount++;
        if (this.tryCount <= this.retryLimit) {
            //try again
            $.ajax(this);
            return;
        }
        return;
      }
   });
};

iCn3DUI.prototype.addOneDumAtom = function(pdbid, atomName, x, y, z, lastSerial) { var me = this; //"use strict";
      var resn = 'DUM';
      var chain = 'MEM';
      var resi = 1;
      var coord = new THREE.Vector3(x, y, z);

      var atomDetails = {
          het: true, // optional, used to determine chemicals, water, ions, etc
          serial: ++lastSerial,         // required, unique atom id
          name: atomName,             // required, atom name
          alt: undefined,               // optional, some alternative coordinates
          resn: resn,             // optional, used to determine protein or nucleotide
          structure: pdbid,   // optional, used to identify structure
          chain: chain,           // optional, used to identify chain
          resi: resi,             // optional, used to identify residue ID
          coord: coord,           // required, used to draw 3D shape
          b: undefined, // optional, used to draw B-factor tube
          elem: atomName,             // optional, used to determine hydrogen bond
          bonds: [],              // required, used to connect atoms
          ss: '',             // optional, used to show secondary structures
          ssbegin: false,         // optional, used to show the beginning of secondary structures
          ssend: false,            // optional, used to show the end of secondary structures
          color: me.icn3d.atomColors[atomName]
      };
      me.icn3d.atoms[lastSerial] = atomDetails;

      me.icn3d.chains[pdbid + '_MEM'][lastSerial] = 1;
      me.icn3d.residues[pdbid + '_MEM_1'][lastSerial] = 1;

      me.icn3d.chemicals[lastSerial] = 1;

      me.icn3d.dAtoms[lastSerial] = 1;
      me.icn3d.hAtoms[lastSerial] = 1;

      return lastSerial;
};

iCn3DUI.prototype.addMemAtoms = function(dmem, pdbid, dxymax) { var me = this; //"use strict";
      var npoint=40; // points in radius
      var step = 2;
      var maxpnt=2*npoint+1; // points in diameter
      var fn=step*npoint; // center point

      //var dxymax = npoint / 2.0 * step;

      pdbid = pdbid.toUpperCase();

      me.icn3d.structures[pdbid].push(pdbid + '_MEM');
      me.icn3d.chains[pdbid + '_MEM'] = {};
      me.icn3d.residues[pdbid + '_MEM_1'] = {};

      me.icn3d.chainsSeq[pdbid + '_MEM'] = [{'name':'DUM', 'resi': 1}];

      var m=0;
      var lastSerial = Object.keys(me.icn3d.atoms).length;
      for(var i = 0; i < 1000; ++i) {
          if(!me.icn3d.atoms.hasOwnProperty(lastSerial + i)) {
              lastSerial = lastSerial + i - 1;
              break;
          }
      }

      for(var i=0; i < maxpnt; ++i) {
         for(var j=0; j < maxpnt; ++j) {
            ++m;
            var a=step*i-fn;
            var b=step*j-fn;
            var dxy=Math.sqrt(a*a+b*b);
            if(dxy < dxymax) {
                  var c=-dmem-0.4;
                  // Resn: DUM, name: N, a,b,c
                  lastSerial = me.addOneDumAtom(pdbid, 'N', a, b, c, lastSerial);

                  c=dmem+0.4;
                  // Resn: DUM, name: O, a,b,c
                  lastSerial = me.addOneDumAtom(pdbid, 'O', a, b, c, lastSerial);
            }
         }
      }
};

iCn3DUI.prototype.transformToOpmOri = function(pdbid, chainresiCalphaHash2, bResi_ori) { var me = this; //"use strict";
  if(chainresiCalphaHash2 !== undefined) {
      var chainresiCalphaHash1 = me.icn3d.getChainCalpha(me.icn3d.chains, me.icn3d.atoms, bResi_ori);

      var coordsFrom = [], coordsTo = [];
      for(var chainresi in chainresiCalphaHash1.chainresiCalphaHash) {
          if(chainresiCalphaHash2.chainresiCalphaHash.hasOwnProperty(chainresi)) {
              var coord1 = chainresiCalphaHash1.chainresiCalphaHash[chainresi];
              var coord2 = chainresiCalphaHash2.chainresiCalphaHash[chainresi];

              coordsFrom.push(coord1);
              coordsTo.push(coord2);

              if(coordsFrom.length > 500) break; // no need to use all c-alpha
          }
      }

      var n = coordsFrom.length;

      if(n > 2) {
          me.icn3d.rmsd_supr = me.rmsd_supr(coordsFrom, coordsTo, n);

          // apply matrix for each atom
          if(me.icn3d.rmsd_supr.rot !== undefined) {
              var rot = me.icn3d.rmsd_supr.rot;
              var centerFrom = me.icn3d.rmsd_supr.trans1;
              var centerTo = me.icn3d.rmsd_supr.trans2;
              //var rsmd = me.icn3d.rmsd_supr.rsmd;

              var dxymaxsq = 0;
              for(var i in me.icn3d.atoms) {
                var atom = me.icn3d.atoms[i];

                atom.coord = me.icn3d.transformMemPro(atom.coord, rot, centerFrom, centerTo);
                var xysq = atom.coord.x * atom.coord.x + atom.coord.y * atom.coord.y;
                if(Math.abs(atom.coord.z) <= 25 && xysq > dxymaxsq) {
                    dxymaxsq = xysq;
                }
              }

              me.icn3d.center = chainresiCalphaHash2.center;
              me.icn3d.oriCenter = me.icn3d.center.clone();

              // add membranes
              me.addMemAtoms(me.icn3d.halfBilayerSize, pdbid, Math.sqrt(dxymaxsq));

              // no rotation
              me.icn3d.bStopRotate = true;

              me.icn3d.bOpm = true;

              // show transmembrane features
              $("#" + me.pre + "togglememli").show();
              $("#" + me.pre + "adjustmemli").show();
              $("#" + me.pre + "selectplaneli").show();
              $("#" + me.pre + "anno_transmemli").show();
          }
          else {
              me.icn3d.bOpm = false;
          }
      }
      else {
          me.icn3d.bOpm = false;
      }
  }
};

iCn3DUI.prototype.loadPdbData = function(data, pdbid, bOpm, chainresiCalphaHash2) { var me = this; //"use strict";
      me.icn3d.loadPDB(data, pdbid, bOpm); // defined in the core library

      me.transformToOpmOri(pdbid, chainresiCalphaHash2);

      if(me.icn3d.biomtMatrices !== undefined && me.icn3d.biomtMatrices.length > 1) {
        $("#" + me.pre + "assemblyWrapper").show();

        me.icn3d.asuCnt = me.icn3d.biomtMatrices.length;
      }
      else {
        $("#" + me.pre + "assemblyWrapper").hide();
      }

      if(me.icn3d.emd !== undefined) {
          $("#" + me.pre + "mapWrapper1").hide();
          $("#" + me.pre + "mapWrapper2").hide();
          $("#" + me.pre + "mapWrapper3").hide();
      }
      else {
          $("#" + me.pre + "emmapWrapper1").hide();
          $("#" + me.pre + "emmapWrapper2").hide();
          $("#" + me.pre + "emmapWrapper3").hide();
      }

    // calculate secondary structures if not available
    // DSSP only works for structures with all atoms. The Calpha only strucutres didn't work
    //if(!me.icn3d.bSecondaryStructure && !bCalphaOnly) {
    if(!me.icn3d.bSecondaryStructure) {
      me.deferredSecondary = $.Deferred(function() {
          var bCalphaOnly = me.icn3d.isCalphaPhosOnly(me.icn3d.hash2Atoms(me.icn3d.proteins));//, 'CA');
          var calphaonly = (bCalphaOnly) ? '1' : '0';

          me.loadPdbDataBase(data, calphaonly, bOpm);
      }); // end of me.deferred = $.Deferred(function() {

      return me.deferredSecondary.promise();
    }
    else {
        me.loadPdbDataRender();
    }
};

iCn3DUI.prototype.loadPdbDataBase = function(data, calphaonly, bOpm) { var me = this; //"use strict";
   var url = "https://www.ncbi.nlm.nih.gov/Structure/mmcifparser/mmcifparser.cgi";

   var dataModified = '';
   if(bOpm !== undefined && bOpm) {
        var lines = data.split('\n');
        for (var i in lines) {
            var line = lines[i];
            var resn = line.substr(17, 3);

            if (resn === 'DUM') {
                break;
            }

            dataModified += line + '\n';
       }
   }
   else {
       dataModified = data;
   }

   $.ajax({
      url: url,
      type: 'POST',
      data: {'dssp':'t', 'calphaonly': calphaonly, 'pdbfile': dataModified},
      dataType: 'jsonp',
      cache: true,
      tryCount : 0,
      retryLimit : 1,
      success: function(ssdata) {
        var ssHash = ssdata;

        if(JSON.stringify(ssdata).indexOf('Oops there was a problem') === -1) {
          for(var chainNum in me.icn3d.chainsSeq) {
              var pos = chainNum.indexOf('_');
              var chain = chainNum.substr(pos + 1);

              var residueObjectArray = me.icn3d.chainsSeq[chainNum];
              var prevSS = 'coil';

              for(var i = 0, il = residueObjectArray.length; i < il; ++i) {
                var resi = residueObjectArray[i].resi;
                var chain_resi = chain + '_' + resi;

                var ssOneLetter = 'c';
                if(ssHash.hasOwnProperty(chain_resi)) {
                    ssOneLetter = ssHash[chain_resi];
                }

                var ss;
                if(ssOneLetter === 'H') {
                    ss = 'helix';
                }
                else if(ssOneLetter === 'E') {
                    ss = 'sheet';
                }
                else {
                    ss = 'coil';
                }

                // update ss in sequence window
                //me.icn3d.chainsAn[chainNum][1][i] = ssOneLetter;

                // assign atom ss, ssbegin, and ssend
                var resid = chainNum + '_' + resi;

                me.icn3d.secondaries[resid] = ssOneLetter;

                // no residue can be both ssbegin and ssend in DSSP calculated secondary structures
                var bSetPrevResidue = 0; // 0: no need to reset, 1: reset previous residue to "ssbegin = true", 2: reset previous residue to "ssend = true"

                var ssbegin, ssend;
                if(ss !== prevSS) {
                    if(prevSS === 'coil') {
                        ssbegin = true;
                        ssend = false;
                    }
                    else if(ss === 'coil') {
                        bSetPrevResidue = 2;
                        ssbegin = false;
                        ssend = false;
                    }
                    else if( (prevSS === 'sheet' && ss === 'helix') || (prevSS === 'helix' && ss === 'sheet')) {
                        bSetPrevResidue = 1;
                        ssbegin = true;
                        ssend = false;
                    }
                }
                else {
                        ssbegin = false;
                        ssend = false;
                }

                if(bSetPrevResidue == 1) { //1: reset previous residue to "ssbegin = true"
                    var prevResid = chainNum + '_' + (resi - 1).toString();
                    for(var j in me.icn3d.residues[prevResid]) {
                        me.icn3d.atoms[j].ssbegin = true;
                        me.icn3d.atoms[j].ssend = false;
                    }
                }
                else if(bSetPrevResidue == 2) { //2: reset previous residue to "ssend = true"
                    var prevResid = chainNum + '_' + (resi - 1).toString();
                    for(var j in me.icn3d.residues[prevResid]) {
                        me.icn3d.atoms[j].ssbegin = false;
                        me.icn3d.atoms[j].ssend = true;
                    }
                }

                // set the current residue
                for(var j in me.icn3d.residues[resid]) {
                    me.icn3d.atoms[j].ss = ss;
                    me.icn3d.atoms[j].ssbegin = ssbegin;
                    me.icn3d.atoms[j].ssend = ssend;
                }

                prevSS = ss;
              } // for each residue
          } // for each chain
        } // if no error
        else {
            console.log("DSSP calculation had a problem with this structure...");
        }

        me.loadPdbDataRender();

        if(me.deferredSecondary !== undefined) me.deferredSecondary.resolve();
      },
      error : function(xhr, textStatus, errorThrown ) {
        this.tryCount++;
        if (this.tryCount <= this.retryLimit) {
            //try again
            $.ajax(this);
            return;
        }

        me.loadPdbDataRender();
        if(me.deferredSecondary !== undefined) me.deferredSecondary.resolve();
        return;
      }
    });
};

iCn3DUI.prototype.loadPdbOpmData = function(data, pdbid) { var me = this; //"use strict";
    var url, dataType;

    url = "https://opm-assets.storage.googleapis.com/pdb/" + pdbid.toLowerCase()+ ".pdb";

    dataType = "text";

    $.ajax({
      url: url,
      dataType: dataType,
      cache: true,
      tryCount : 0,
      retryLimit : 1,
      success: function(opmdata) {
          me.icn3d.bOpm = true;
          var bVector = true;
          var chainresiCalphaHash = me.icn3d.loadPDB(opmdata, pdbid, me.icn3d.bOpm, bVector); // defined in the core library

          $("#" + me.pre + "selectplane_z1").val(me.icn3d.halfBilayerSize);
          $("#" + me.pre + "selectplane_z2").val(-me.icn3d.halfBilayerSize);

          $("#" + me.pre + "extra_mem_z").val(me.icn3d.halfBilayerSize);
          $("#" + me.pre + "intra_mem_z").val(-me.icn3d.halfBilayerSize);

          me.icn3d.init(); // remove all previously loaded data
          me.loadPdbData(data, pdbid, undefined, chainresiCalphaHash);

          if(me.deferredOpm !== undefined) me.deferredOpm.resolve();
      },
      error : function(xhr, textStatus, errorThrown ) {
        this.tryCount++;
        if (this.tryCount <= this.retryLimit) {
            //try again
            $.ajax(this);
            return;
        }

        me.loadPdbData(data, pdbid);
        if(me.deferredOpm !== undefined) me.deferredOpm.resolve();
        return;
      }
    });
};

iCn3DUI.prototype.loadMmtfOpmData = function(data, pdbid, bFull) { var me = this; //"use strict";
    var url, dataType;

    url = "https://opm-assets.storage.googleapis.com/pdb/" + pdbid.toLowerCase()+ ".pdb";

    dataType = "text";

    $.ajax({
      url: url,
      dataType: dataType,
      cache: true,
      tryCount : 0,
      retryLimit : 1,
      success: function(opmdata) {
          me.icn3d.bOpm = true;
          var bVector = true;
          var chainresiCalphaHash = me.icn3d.loadPDB(opmdata, pdbid, me.icn3d.bOpm, bVector); // defined in the core library

          $("#" + me.pre + "selectplane_z1").val(me.icn3d.halfBilayerSize);
          $("#" + me.pre + "selectplane_z2").val(-me.icn3d.halfBilayerSize);

          $("#" + me.pre + "extra_mem_z").val(me.icn3d.halfBilayerSize);
          $("#" + me.pre + "intra_mem_z").val(-me.icn3d.halfBilayerSize);

          me.icn3d.init(); // remove all previously loaded data
          me.parseMmtfData(data, pdbid, bFull, chainresiCalphaHash);

          if(me.deferredOpm !== undefined) me.deferredOpm.resolve();
      },
      error : function(xhr, textStatus, errorThrown ) {
        this.tryCount++;
        if (this.tryCount <= this.retryLimit) {
            //try again
            $.ajax(this);
            return;
        }

        me.parseMmtfData(data, pdbid, bFull);
        if(me.deferredOpm !== undefined) me.deferredOpm.resolve();
        return;
      }
    });
};

iCn3DUI.prototype.loadMmcifOpmDataPart2 = function(data, pdbid) { var me = this; //"use strict";
    if(Object.keys(me.icn3d.structures).length == 1) {
        $("#" + me.pre + "alternateWrapper").hide();
    }

    // load assembly info
    var assembly = (data.assembly !== undefined) ? data.assembly : [];
    for(var i = 0, il = assembly.length; i < il; ++i) {
      if (me.icn3d.biomtMatrices[i] == undefined) me.icn3d.biomtMatrices[i] = new THREE.Matrix4().identity();

      for(var j = 0, jl = assembly[i].length; j < jl; ++j) {
        me.icn3d.biomtMatrices[i].elements[j] = assembly[i][j];
      }
    }

    if(me.icn3d.biomtMatrices !== undefined && me.icn3d.biomtMatrices.length > 1) {
        $("#" + me.pre + "assemblyWrapper").show();

        me.icn3d.asuCnt = me.icn3d.biomtMatrices.length;
    }
    else {
        $("#" + me.pre + "assemblyWrapper").hide();
    }

    me.icn3d.setAtomStyleByOptions(me.opts);
    me.icn3d.setColorByOptions(me.opts, me.icn3d.atoms);

    me.renderStructure();

    if(me.cfg.rotate !== undefined) me.rotStruc(me.cfg.rotate, true);

    //if(me.cfg.showseq !== undefined && me.cfg.showseq) me.openDialog(me.pre + 'dl_selectresidues', 'Select residues in sequences');

    if(me.deferred !== undefined) me.deferred.resolve(); if(me.deferred2 !== undefined) me.deferred2.resolve();
};

iCn3DUI.prototype.loadMmcifOpmData = function(data, pdbid) { var me = this; //"use strict";
    var url, dataType;

    url = "https://opm-assets.storage.googleapis.com/pdb/" + pdbid.toLowerCase()+ ".pdb";

    dataType = "text";

    $.ajax({
      url: url,
      dataType: dataType,
      cache: true,
      tryCount : 0,
      retryLimit : 1,
      success: function(opmdata) {
          me.icn3d.bOpm = true;
          var bVector = true;
          var chainresiCalphaHash = me.icn3d.loadPDB(opmdata, pdbid, me.icn3d.bOpm, bVector); // defined in the core library

          $("#" + me.pre + "selectplane_z1").val(me.icn3d.halfBilayerSize);
          $("#" + me.pre + "selectplane_z2").val(-me.icn3d.halfBilayerSize);

          $("#" + me.pre + "extra_mem_z").val(me.icn3d.halfBilayerSize);
          $("#" + me.pre + "intra_mem_z").val(-me.icn3d.halfBilayerSize);

          me.icn3d.init(); // remove all previously loaded data
          //me.loadPdbData(data, pdbid, undefined, chainresiCalphaHash);

          me.loadAtomDataIn(data, data.mmcif, 'mmcifid', undefined, undefined, chainresiCalphaHash);
          me.loadMmcifOpmDataPart2(data, pdbid);

          if(me.deferredOpm !== undefined) me.deferredOpm.resolve();
      },
      error : function(xhr, textStatus, errorThrown ) {
        this.tryCount++;
        if (this.tryCount <= this.retryLimit) {
            //try again
            $.ajax(this);
            return;
        }

        me.loadAtomDataIn(data, data.mmcif, 'mmcifid', undefined, undefined);
        me.loadMmcifOpmDataPart2(data, pdbid);

        if(me.deferredOpm !== undefined) me.deferredOpm.resolve();
        return;
      }
    });
};

iCn3DUI.prototype.loadMmdbOpmDataPart2 = function(data, pdbid, type) { var me = this; //"use strict";
    // set 3d domains
    var structure = data.pdbId;

    for(var molid in data.domains) {
        var chain = data.domains[molid].chain;
        var domainArray = data.domains[molid].domains;

        for(var index = 0, indexl = domainArray.length; index < indexl; ++index) {
            var domainName = structure + '_' + chain + '_3d_domain_' + (index+1).toString();
            me.icn3d.tddomains[domainName] = {};

            var subdomainArray = domainArray[index].intervals;

            // remove duplicate, e.g., at https://www.ncbi.nlm.nih.gov/Structure/mmdb/mmdb_strview.cgi?v=2&program=icn3d&domain&molinfor&uid=1itw
            var domainFromHash = {}, domainToHash = {};

            //var fromArray = [], toArray = [];
            //var resCnt = 0
            for(var i = 0, il = subdomainArray.length; i < il; ++i) {
                var domainFrom = Math.round(subdomainArray[i][0]) - 1; // 1-based
                var domainTo = Math.round(subdomainArray[i][1]) - 1;

                if(domainFromHash.hasOwnProperty(domainFrom) || domainToHash.hasOwnProperty(domainTo)) {
                    continue; // do nothing for duplicated "from" or "to", e.g, PDBID 1ITW, 5FWI
                }
                else {
                    domainFromHash[domainFrom] = 1;
                    domainToHash[domainTo] = 1;
                }

                //fromArray.push(domainFrom + me.baseResi[chnid]);
                //toArray.push(domainTo + me.baseResi[chnid]);
                //resCnt += domainTo - domainFrom + 1;

                for(var j = domainFrom; j <= domainTo; ++j) {
                    var resid = structure + '_' + chain + '_' + (j+1).toString();
                    me.icn3d.tddomains[domainName][resid] = 1;
                }
            }
        } // for each domainArray
    } // for each molid

    // "asuAtomCount" is defined when: 1) atom count is over the threshold 2) buidx=1 3) asu atom count is smaller than biological unit atom count
    me.bAssemblyUseAsu = (data.asuAtomCount !== undefined) ? true : false;
    if(type !== undefined) {
        me.bAssemblyUseAsu = false;
    }

    $.when(me.downloadMmcifSymmetry(pdbid)).then(function() {
        me.downloadMmdbPart2(type);
    });
};

iCn3DUI.prototype.loadMmdbOpmData = function(data, pdbid, type) { var me = this; //"use strict";
    var url, dataType;

    url = "https://opm-assets.storage.googleapis.com/pdb/" + pdbid.toLowerCase()+ ".pdb";

    dataType = "text";

    $.ajax({
      url: url,
      dataType: dataType,
      cache: true,
      tryCount : 0,
      retryLimit : 1,
      success: function(opmdata) {
          me.icn3d.bOpm = true;
          var bVector = true;
          var chainresiCalphaHash = me.icn3d.loadPDB(opmdata, pdbid, me.icn3d.bOpm, bVector); // defined in the core library

          $("#" + me.pre + "selectplane_z1").val(me.icn3d.halfBilayerSize);
          $("#" + me.pre + "selectplane_z2").val(-me.icn3d.halfBilayerSize);

          $("#" + me.pre + "extra_mem_z").val(me.icn3d.halfBilayerSize);
          $("#" + me.pre + "intra_mem_z").val(-me.icn3d.halfBilayerSize);

          me.icn3d.init(); // remove all previously loaded data
          me.loadAtomDataIn(data, pdbid, 'mmdbid', undefined, type, chainresiCalphaHash);

          me.loadMmdbOpmDataPart2(data, pdbid, type);

          if(me.deferredOpm !== undefined) me.deferredOpm.resolve();
      },
      error : function(xhr, textStatus, errorThrown ) {
        this.tryCount++;
        if (this.tryCount <= this.retryLimit) {
            //try again
            $.ajax(this);
            return;
        }

        me.loadAtomDataIn(data, pdbid, 'mmdbid', undefined, type);
        me.loadMmdbOpmDataPart2(data, pdbid, type);

        if(me.deferredOpm !== undefined) me.deferredOpm.resolve();
        return;
      }
    });
};

iCn3DUI.prototype.loadPdbDataRender = function() {
    var me = this; //"use strict";

    me.pmid = me.icn3d.pmid;

    if(me.cfg.align === undefined && Object.keys(me.icn3d.structures).length == 1) {
        $("#" + me.pre + "alternateWrapper").hide();
    }

    me.icn3d.setAtomStyleByOptions(me.opts);
    me.icn3d.setColorByOptions(me.opts, me.icn3d.atoms);

    me.renderStructure();

    me.showTitle();

    if(me.cfg.rotate !== undefined) me.rotStruc(me.cfg.rotate, true);

    if(me.deferred !== undefined) me.deferred.resolve(); if(me.deferred2 !== undefined) me.deferred2.resolve();
};
