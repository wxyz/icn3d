/**
 * @author Jiyao Wang <wangjiy@ncbi.nlm.nih.gov> / https://github.com/ncbi/icn3d
 */

iCn3D.prototype.applyPrevColor = function () {
    for (var i in this.atoms) {
        var atom = this.atoms[i];
        atom.color = this.atomPrevColors[i];
    }
};

iCn3D.prototype.applyChemicalbindingOptions = function (options) {
    if(options === undefined) options = this.opts;

    // display mode
    if (options.chemicalbinding === 'show') {
        var startAtoms;
        if(this.chemicals !== undefined && Object.keys(this.chemicals).length > 0) { // show chemical-protein interaction
            startAtoms = this.hash2Atoms(this.chemicals);
        }

        // find atoms in chainid1, which interact with chainid2
        var radius = 4;

        if(startAtoms !== undefined) {
            var targetAtoms = this.getAtomsWithinAtom(this.atoms, startAtoms, radius);

            // show hydrogens
            var threshold = 3.5;
            this.opts["hbonds"] = "yes";

            if(Object.keys(targetAtoms).length > 0) {
                this.calculateChemicalHbonds(startAtoms, targetAtoms, parseFloat(threshold) );
            }

            // zoom in on the atoms
            if(!this.bSetFog) this.zoominSelection( this.unionHash(startAtoms, targetAtoms) );
        }
    }
    else if (options.chemicalbinding === 'hide') {
        // truen off hdonds
        this.hideHbonds();

        // center on the atoms
        if(!this.bSetFog) this.zoominSelection(this.atoms);
    }
};

iCn3D.prototype.hideHbonds = function () {
        this.opts["hbonds"] = "no";
        if(this.lines === undefined) this.lines = {};
        this.lines['hbond'] = [];
        this.hbondpnts = [];

        for(var i in this.atoms) {
            this.atoms[i].style2 = 'nothing';
        }

        for(var i in this.sidec) {
            if(this.hAtoms.hasOwnProperty(i)) {
                this.atoms[i].style2 = this.opts["sidec"];
            }
        }

        for(var i in this.water) {
            if(this.hAtoms.hasOwnProperty(i)) {
                this.atoms[i].style = this.opts["water"];
            }
        }
};

iCn3D.prototype.hideSaltbridge = function () {
        this.opts["saltbridge"] = "no";
        if(this.lines === undefined) this.lines = {};
        this.lines['saltbridge'] = [];
        this.saltbridgepnts = [];

        for(var i in this.atoms) {
            this.atoms[i].style2 = 'nothing';
        }

        for(var i in this.sidec) {
            if(this.hAtoms.hasOwnProperty(i)) {
                this.atoms[i].style2 = this.opts["sidec"];
            }
        }

        for(var i in this.water) {
            if(this.hAtoms.hasOwnProperty(i)) {
                this.atoms[i].style = this.opts["water"];
            }
        }
};

iCn3D.prototype.hideContact = function () {
        this.opts["contact"] = "no";
        if(this.lines === undefined) this.lines = {};
        this.lines['contact'] = [];
        this.contactpnts = [];

        for(var i in this.atoms) {
            this.atoms[i].style2 = 'nothing';
        }

        for(var i in this.sidec) {
            if(this.hAtoms.hasOwnProperty(i)) {
                this.atoms[i].style2 = this.opts["sidec"];
            }
        }

        for(var i in this.water) {
            if(this.hAtoms.hasOwnProperty(i)) {
                this.atoms[i].style = this.opts["water"];
            }
        }
};

iCn3D.prototype.applySsbondsOptions = function (options) {
    if(options === undefined) options = this.opts;

    if (options.ssbonds.toLowerCase() === 'yes' && this.ssbondpnts !== undefined) {
      var color = '#FFFF00';
      var colorObj = new THREE.Color(0xFFFF00);

      var structureArray = Object.keys(this.structures);
      var start, end;

      if(this.bAlternate) {
          start = this.ALTERNATE_STRUCTURE;
          end = this.ALTERNATE_STRUCTURE + 1;
      }
      else {
          start = 0;
          end = structureArray.length;
      }

      this.lines['ssbond'] = [];

      for(var s = start, sl = end; s < sl; ++s) {
          var structure = structureArray[s];

          if(this.ssbondpnts[structure] === undefined) continue;

          //for(var i = 0, lim = Math.floor(this.ssbondpnts[structure].length / 2); i < lim; i++) {
          for(var i = Math.floor(this.ssbondpnts[structure].length / 2) - 1; i >= 0; i--) {
            var res1 = this.ssbondpnts[structure][2 * i], res2 = this.ssbondpnts[structure][2 * i + 1];
            var serial1, serial2;

            var line = {};
            line.color = color;
            line.dashed = true;

            // each Cys has two S atoms
            var serial1Array = [], serial2Array = [];
            var position1Array = [], position2Array = [];

            var bFound = false, bCalpha = false;
            for(var j in this.residues[res1]) {
                if(this.atoms[j].name === 'SG') {
                    position1Array.push(this.atoms[j].coord);
                    serial1Array.push(this.atoms[j].serial);
                    bFound = true;
                }
            }

            if(!bFound) {
                for(var j in this.residues[res1]) {
                    if(this.atoms[j].name === 'CA') {
                        position1Array.push(this.atoms[j].coord);
                        serial1Array.push(this.atoms[j].serial);
                        bFound = true;
                        bCalpha = true;
                        break;
                    }
                }
            }

            bFound = false;
            for(var j in this.residues[res2]) {
                if(this.atoms[j].name === 'SG') {
                    position2Array.push(this.atoms[j].coord);
                    serial2Array.push(this.atoms[j].serial);
                    bFound = true;
                }
            }

            if(!bFound) {
                for(var j in this.residues[res2]) {
                    if(this.atoms[j].name === 'CA') {
                        position2Array.push(this.atoms[j].coord);
                        serial2Array.push(this.atoms[j].serial);
                        bFound = true;
                        bCalpha = true;
                        break;
                    }
                }
            }

            // determine whether it's true disulfide bonds
            // disulfide bond is about 2.05 angstrom
            var distMax = (bCalpha) ? 7.0 : 3.0;

            var bSsbond = false;
            for(var m = 0, ml = position1Array.length; m < ml; ++m) {
                for(var n = 0, nl = position2Array.length; n < nl; ++n) {
                    if(position1Array[m].distanceTo(position2Array[n]) < distMax) {
                        bSsbond = true;

                        line.serial1 = serial1Array[m];
                        line.position1 = position1Array[m];

                        line.serial2 = serial2Array[n];
                        line.position2 = position2Array[n];

                        break;
                    }
                }
            }

            // only draw bonds connected with currently displayed atoms
            if(line.serial1 !== undefined && line.serial2 !== undefined && !this.dAtoms.hasOwnProperty(line.serial1) && !this.dAtoms.hasOwnProperty(line.serial2)) continue;

            //if(line.position1 === undefined || line.position2 === undefined || line.position1.distanceTo(line.position2) > distMax) {
            if(!bSsbond) {
                this.ssbondpnts[structure].splice(2 * i, 2);
                continue;
            }

            //if(this.atoms[serial1].ids !== undefined) { // mmdb id as input
                // remove the original disulfide bonds
                var pos = this.atoms[line.serial1].bonds.indexOf(line.serial2);
                var array1, array2;
                if(pos != -1) {
                    array1 = this.atoms[line.serial1].bonds.slice(0, pos);
                    array2 = this.atoms[line.serial1].bonds.slice(pos + 1);

                    this.atoms[line.serial1].bonds = array1.concat(array2);
                }

                pos = this.atoms[line.serial2].bonds.indexOf(line.serial1);
                if(pos != -1) {
                    array1 = this.atoms[line.serial2].bonds.slice(0, pos);
                    array2 = this.atoms[line.serial2].bonds.slice(pos + 1);

                    this.atoms[line.serial2].bonds = array1.concat(array2);
                }
            //}

            //if(this.lines['ssbond'] === undefined) this.lines['ssbond'] = [];
            this.lines['ssbond'].push(line);

            // create bonds for disulfide bonds
            //this.createCylinder(line.position1, line.position2, this.cylinderRadius * 0.5, colorObj);
            this.createCylinder(line.position1, line.position2, this.cylinderRadius, colorObj);

            // show ball and stick for these two residues
            var residueAtoms = this.unionHash(this.residues[res1], this.residues[res2]);

            // show side chains for the selected atoms
            var atoms = this.intHash(residueAtoms, this.sidec);
            var calpha_atoms = this.intHash(residueAtoms, this.calphas);
            // include calphas
            atoms = this.unionHash(atoms, calpha_atoms);

            // draw sidec separatedly
            for(var j in atoms) {
              this.atoms[j].style2 = 'stick';
            }
          } // for(var i = 0,
      } // for(var s = 0,
    } // if (options.ssbonds.toLowerCase() === 'yes'
};

iCn3D.prototype.applyMapOptions = function (options) {
    if(options === undefined) options = this.opts;

    switch (options.mapwireframe) {
        case 'yes':
            options.mapwireframe = true;
            break;
        case 'no':
            options.mapwireframe = false;
            break;
    }

    var atoms, currAtoms;

    // only show the surface for atoms which are displaying
    atoms = this.intHash(this.dAtoms, this.hAtoms);

    currAtoms = this.hash2Atoms(atoms);

    switch (options.map.toLowerCase()) {
        case '2fofc':
            this.createSurfaceRepresentation(currAtoms, 11, options.mapwireframe);
            break;
        case 'fofc':
            this.createSurfaceRepresentation(currAtoms, 12, options.mapwireframe);
            break;
        case 'nothing':
            // remove surfaces
            this.removeMaps();
            break;
    }
};

iCn3D.prototype.applyEmmapOptions = function (options) {
    if(options === undefined) options = this.opts;

    switch (options.emmapwireframe) {
        case 'yes':
            options.emmapwireframe = true;
            break;
        case 'no':
            options.emmapwireframe = false;
            break;
    }

    var atoms, currAtoms;

    // only show the surface for atoms which are displaying
    atoms = this.intHash(this.dAtoms, this.hAtoms);

    currAtoms = this.hash2Atoms(atoms);

    switch (options.emmap.toLowerCase()) {
        case 'em':
            this.createSurfaceRepresentation(currAtoms, 13, options.emmapwireframe);
            break;
        case 'nothing':
            // remove surfaces
            this.removeEmmaps();
            break;
    }
};

iCn3D.prototype.setFog = function(bZoomin) { var me = this;
    var background = this.backgroundColors[this.opts.background.toLowerCase()];

    if(bZoomin) {
        var centerAtomsResults = this.centerAtoms(this.hAtoms);
        this.maxD = centerAtomsResults.maxD;
        if (this.maxD < 5) this.maxD = 5;
    }

    var bInstance = (this.biomtMatrices !== undefined && this.biomtMatrices.length * this.cnt > this.maxatomcnt) ? true : false;

    // apply fog
    if(this.opts['fog'] === 'yes') {
        if(this.opts['camera'] === 'perspective') {        //perspective, orthographic
            //this.scene.fog = new THREE.Fog(background, this.cam_z, this.cam_z + 0.5 * this.maxD);
            //this.scene.fog = new THREE.Fog(background, 2 * this.maxD, 2.5 * this.maxD);
            //this.scene.fog = new THREE.Fog(background, 1.5 * this.maxD, 3 * this.maxD);

            if(bInstance) {
                this.scene.fog = undefined;
                this.bSetFog = false;
            }
            else {
                this.scene.fog = new THREE.Fog(background, 2.5*this.maxD, 4*this.maxD);
                this.bSetFog = true;
                this.camMaxDFactorFog = 3;
            }
        }
        else if(this.opts['camera'] === 'orthographic') {
            //this.scene.fog = new THREE.FogExp2(background, 2);
            //this.scene.fog.near = 1.5 * this.maxD;
            //this.scene.fog.far = 3 * this.maxD;

            this.scene.fog = undefined;
            this.bSetFog = false;
        }
    }
    else {
        this.scene.fog = undefined;
        this.bSetFog = false;
    }

    if(bZoomin && !bInstance) {
        this.zoominSelection();
    }
};

// change the display atom when alternating
iCn3D.prototype.alternateStructures = function () {
    var hAtomsCount = Object.keys(this.hAtoms).length;
    var allAtomsCount = Object.keys(this.atoms).length;

    this.dAtoms = {};

    var moleculeArray = Object.keys(this.structures);
    for(var i = 0, il = moleculeArray.length; i < il; ++i) {
        var structure = moleculeArray[i];
        if(i > this.ALTERNATE_STRUCTURE || (this.ALTERNATE_STRUCTURE === il - 1 && i === 0) ) {
            for(var k in this.structures[structure]) {
                var chain = this.structures[structure][k];
                this.dAtoms = this.unionHash(this.dAtoms, this.chains[chain]);
            }

            this.ALTERNATE_STRUCTURE = i;
            break;
        }
    }

    if(hAtomsCount < allAtomsCount) {
        this.dAtoms = this.intHash(this.dAtoms, this.hAtoms);

        this.bShowHighlight = false;
        this.opts['rotationcenter'] = 'highlight center';
    }

    // also alternating the surfaces
    this.removeSurfaces();
    this.applySurfaceOptions();

    this.removeMaps();
    this.applyMapOptions();

    this.removeEmmaps();
    this.applyEmmapOptions();

    this.draw();

    this.bShowHighlight = true;
    this.opts['rotationcenter'] = 'molecule center';
};

iCn3D.prototype.updateStabilizer = function () {
    this.stabilizerpnts = [];

    if(this.pairArray !== undefined) {
        for(var i = 0, il = this.pairArray.length; i < il; i += 2) {
            var coordI = this.getResidueRepPos(this.pairArray[i]);
            var coordJ = this.getResidueRepPos(this.pairArray[i + 1]);

            this.stabilizerpnts.push(coordI);
            this.stabilizerpnts.push(coordJ);
        }
    }
};

iCn3D.prototype.getResidueRepPos = function (serial) { var me = this;
    var atomIn = this.atoms[serial];
    var residueid = atomIn.structure + "_" + atomIn.chain + "_" + atomIn.resi;

    var pos;
    if(!this.proteins.hasOwnProperty(serial) && !this.nucleotides.hasOwnProperty(serial)) { // chemicals or ions
        pos = atomIn.coord;
    }
    else {
        for(var i in this.residues[residueid]) {
            var atom = this.atoms[i];
            if(atom.name === 'N3') { // nucleotide: N3
                pos = this.atoms[i].coord;
                break;
            }
            else if(atom.name === 'CA' && atom.ss == 'coil') { // protein coil: CA
                pos = this.atoms[i].coord;
                break;
            }
            else if(atom.name === 'CA' && (atom.ss == 'helix' || atom.ss == 'sheet')) { // protein secondary: CA
                pos = (this.atoms[i].coord2 !== undefined) ? this.atoms[i].coord2 : this.atoms[i].coord;
                break;
            }
        }
    }

    if(pos === undefined) pos = atomIn.coord;

    return pos;
};

iCn3D.prototype.applySurfaceOptions = function (options) {
    if(options === undefined) options = this.opts;

    //switch (options.wireframe.toLowerCase()) {
    switch (options.wireframe) {
        case 'yes':
            options.wireframe = true;
            break;
        case 'no':
            options.wireframe = false;
            break;
    }

    options.opacity = parseFloat(options.opacity);

    var atoms, currAtoms;

    // only show the surface for atoms which are displaying
    atoms = this.intHash(this.dAtoms, this.hAtoms);
    // exclude water molecules
    if(options['water'] === 'nothing') atoms = this.exclHash(atoms, this.water);

    currAtoms = this.hash2Atoms(atoms);

    switch (options.surface.toLowerCase()) {
        case 'van der waals surface':
            this.createSurfaceRepresentation(currAtoms, 1, options.wireframe, options.opacity);
            break;
//            case 'solvent excluded surface':
//                this.createSurfaceRepresentation(currAtoms, 2, options.wireframe, options.opacity);
//                break;
        case 'solvent accessible surface':
            this.createSurfaceRepresentation(currAtoms, 3, options.wireframe, options.opacity);
            break;
        case 'molecular surface':
            this.createSurfaceRepresentation(currAtoms, 2, options.wireframe, options.opacity);
            break;
        case 'van der waals surface with context':
            this.createSurfaceRepresentation(currAtoms, 1, options.wireframe, options.opacity);
            break;
        case 'solvent accessible surface with context':
            this.createSurfaceRepresentation(currAtoms, 3, options.wireframe, options.opacity);
            break;
        case 'molecular surface with context':
            this.createSurfaceRepresentation(currAtoms, 2, options.wireframe, options.opacity);
            break;
        case 'nothing':
            // remove surfaces
            this.removeSurfaces();
            break;
    }
};

iCn3D.prototype.setHbondsContacts = function (options, type) {
    var hbond_contact = type;
    var hbonds_contact = (type == 'hbond') ? 'hbonds' : type;

    this.lines[hbond_contact] = [];

    if (options[hbonds_contact].toLowerCase() === 'yes') {
        var color = (type == 'contact') ? "#888888" : '#00FF00';
        var pnts;
        if(type == 'hbond') {
            pnts = this.hbondpnts;
        }
        else if(type == 'saltbridge') {
            pnts = this.saltbridgepnts;
        }
        else if(type == 'contact') {
            pnts = this.contactpnts;
        }

         for (var i = 0, lim = Math.floor(pnts.length / 2); i < lim; i++) {
            var line = {};
            line.position1 = pnts[2 * i].coord;
            line.serial1 = pnts[2 * i].serial;
            line.position2 = pnts[2 * i + 1].coord;
            line.serial2 = pnts[2 * i + 1].serial;
            line.color = color;
            line.dashed = true;

            // only draw bonds connected with currently displayed atoms
            if(line.serial1 !== undefined && line.serial2 !== undefined && !this.dAtoms.hasOwnProperty(line.serial1) && !this.dAtoms.hasOwnProperty(line.serial2)) continue;

            //if(this.lines[hbond_contact] === undefined) this.lines[hbond_contact] = [];
            this.lines[hbond_contact].push(line);
         }
    }
};

iCn3D.prototype.applyOtherOptions = function (options) {
    if(options === undefined) options = this.opts;

    if(this.lines !== undefined) {
        //this.lines['hbond'] = [];
        //this.lines['saltbridge'] = [];

        //common part options

        // hbond lines
        this.setHbondsContacts(options, 'hbond');
        // salt bridge lines
        this.setHbondsContacts(options, 'saltbridge');
        // contact lines
        this.setHbondsContacts(options, 'contact');

        if (this.pairArray !== undefined && this.pairArray.length > 0) {
            this.updateStabilizer(); // to update this.stabilizerpnts

            var color = '#FFFFFF';
            var pnts = this.stabilizerpnts;
            this.lines['stabilizer'] = []; // reset
            for (var i = 0, lim = Math.floor(pnts.length / 2); i < lim; i++) {
                var line = {};
                line.position1 = pnts[2 * i];
                line.position2 = pnts[2 * i + 1];
                line.color = color;
                line.dashed = false; // if true, there will be too many cylinders in the dashed lines

                this.lines['stabilizer'].push(line);
            }
        }

        this.createLines(this.lines);
    }

    // maps
    if(this.prevMaps !== undefined) {
        for(var i = 0, il = this.prevMaps.length; i < il; ++i) {
            this.mdl.add(this.prevMaps[i]);
        }
    }

    // EM map
    if(this.prevEmmaps !== undefined) {
        for(var i = 0, il = this.prevEmmaps.length; i < il; ++i) {
            this.mdl.add(this.prevEmmaps[i]);
        }
    }

    // surfaces
    if(this.prevSurfaces !== undefined) {
        for(var i = 0, il = this.prevSurfaces.length; i < il; ++i) {
            this.mdl.add(this.prevSurfaces[i]);
        }
    }

    this.applyCenterOptions(options);

    switch (options.axis.toLowerCase()) {
        case 'yes':
            this.axis = true;

            this.buildAxes(this.maxD/2);

            break;
        case 'no':
            this.axis = false;
            break;
    }
    switch (options.pk.toLowerCase()) {
        case 'atom':
            this.pk = 1;
            break;
        case 'no':
            this.pk = 0;
            break;
        case 'residue':
            this.pk = 2;
            break;
        case 'strand':
            this.pk = 3;
            break;
    }
};

iCn3D.prototype.rebuildScene = function (options) { var me = this;
    if(options === undefined) options = this.opts;

    this.rebuildSceneBase(options);

    this.setFog();

    this.setCamera();

    if(this.bSkipChemicalbinding === undefined || !this.bSkipChemicalbinding) this.applyChemicalbindingOptions();
    this.bSkipChemicalbinding = true;

    if (options.chemicalbinding === 'show') {
        this.opts["hbonds"] = "yes";
    }

    // show disulfide bonds, set side chains
    this.applySsbondsOptions();

    this.applyDisplayOptions(this.opts, this.dAtoms);

    this.applyOtherOptions();

    //this.setFog();

    //this.setCamera();

    //https://stackoverflow.com/questions/15726560/three-js-raycaster-intersection-empty-when-objects-not-part-of-scene
    me.scene_ghost.updateMatrixWorld(true);
};

iCn3D.prototype.draw = function () { var me = this;
    this.rebuildScene();

    // Impostor display using the saved arrays
    if(this.bImpo) {
        this.drawImpostorShader(); // target
    }

    this.applyPrevColor();

//    if(Object.keys(me.mapData).length > 0) me.applyMapOptions();

    //if(this.bSSOnly) this.drawHelixBrick(this.molid2ss, this.molid2color);

    if(this.biomtMatrices !== undefined && this.biomtMatrices.length > 1) {
        if(this.bAssembly) {
            this.drawSymmetryMates();
        }
        else {
            this.centerSelection();
        }
    }

    // show the hAtoms
    var hAtomsLen = (this.hAtoms !== undefined) ? Object.keys(this.hAtoms).length : 0;

    //if(hAtomsLen > 0 && hAtomsLen < Object.keys(this.atoms).length) {
    if(hAtomsLen > 0 && hAtomsLen < Object.keys(this.dAtoms).length) {
        this.removeHlObjects();
        if(this.bShowHighlight === undefined || this.bShowHighlight) this.addHlObjects();
    }

    if(this.bRender === true) {
      this.applyTransformation(this._zoomFactor, this.mouseChange, this.quaternion);
      this.render();

      // reset to hide the side chain
      //this.opts['sidec'] = 'nothing';
    }

    this.clearImpostors();
};
