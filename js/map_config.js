"use strict";

mapboxgl.accessToken = 'pk.eyJ1IjoiZGVuaXNrb25vbmVua28iLCJhIjoiY2pnY2QwanM4MDJuYjJxdGN6cWN4d2dkcSJ9.uih5MR-tgpbVwBsooCFhgw';
const SUN_ON_MAP_RADII = 1;
// parameters to ensure the model is georeferenced correctly on the map
const modelOrigin = [30.4705, 50.3901];
const modelAltitude = 0;
const modelRotate = [Math.PI / 2, 0, 0];
const modelScale = 7.41843220338983e-8;
// transformation parameters to position, rotate and scale the 3D model onto the map
const modelTransform = {
    translateX: mapboxgl.MercatorCoordinate.fromLngLat(modelOrigin, modelAltitude).x,
    translateY: mapboxgl.MercatorCoordinate.fromLngLat(modelOrigin, modelAltitude).y,
    translateZ: mapboxgl.MercatorCoordinate.fromLngLat(modelOrigin, modelAltitude).z,
    rotateX: modelRotate[0],
    rotateY: modelRotate[1],
    rotateZ: modelRotate[2],
    scale: modelScale
};

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/deniskononenko/cjs31liib003u1fqj23vp010b',
    center: [30.4704022, 50.3901884],
    zoom: 16,
    pitch: 0,
    hash: true
});

const THREE = window.THREE;

const draw = new MapboxDraw({
    displayControlsDefault: false,
    controls: {
        polygon: false,
        trash: false
    },
    style: [
        // polygon fill
        {
            "id": "gl-draw-polygon-fill",
            "type": "fill",
            "filter": ["all", ["==", "$type", "Polygon"], ["==", "mode", "static"]],
            "paint": {
                "fill-color": "#D20C0C",
                "fill-outline-color": "#D20C0C",
                "fill-opacity": 0.1
            }
        }]
});
map.addControl(draw);

// configuration of the custom layer for a 3D model per the CustomLayerInterface
const customLayer = {
    'id': '3d-model',
    'type': 'custom',
    'renderingMode': '3d',
    'onAdd': function(map, gl) {
        this.camera = new THREE.Camera();
        this.scene = new THREE.Scene();

        // use the three.js GLTF loader to add the 3D model to the three.js scene
        var loader = new THREE.GLTFLoader();
        loader.load('3dmodels/build_det.gltf', (function (gltf) {
            this.scene.add(gltf.scene);
        }).bind(this));

        configureLightAndEnvironment(this.scene);

        this.map = map;

        // use the Mapbox GL JS map canvas for three.js
        this.renderer = new THREE.WebGLRenderer({
            canvas: map.getCanvas(),
            context: gl
        });
    },
    render: function(gl, matrix) {
        var rotationX = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), modelTransform.rotateX);
        var rotationY = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 1, 0), modelTransform.rotateY);
        var rotationZ = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 0, 1), modelTransform.rotateZ);

        var m = new THREE.Matrix4().fromArray(matrix);
        var l = new THREE.Matrix4().makeTranslation(modelTransform.translateX, modelTransform.translateY, modelTransform.translateZ)
            .scale(new THREE.Vector3(modelTransform.scale, -modelTransform.scale, modelTransform.scale))
            .multiply(rotationX)
            .multiply(rotationY)
            .multiply(rotationZ);

        requestAnimationFrame(render);
        this.camera.projectionMatrix.elements = matrix;
        this.camera.projectionMatrix = m.multiply(l);
        this.renderer.state.reset();
        this.renderer.render(this.scene, this.camera);
        this.map.triggerRepaint();
    }
};

function BuildingModel(lat, long)  {
    this.lat = lat;
    this.long = long;
    this.dropShadow = (height, sunAzimuth, sunZenith) => {
        return 1
    }
}

var testPolygon = { type: 'Polygon',
                    coordinates: [[[30.4704022, 50.3901884],
                                   [30.4703920, 50.3899913],
                                   [30.4706245, 50.3899864],
                                   [30.4706346, 50.3901835],
                                   [30.4704022, 50.3901884]]] };

var shadow = {
    'id': 'shadow',
    'type': 'fill',
    'source': {
        'type': 'geojson',
        'data': {
            'type': 'Feature',
            'geometry': {
                'type': 'Polygon',
                'coordinates': [[[30.4704022, 50.3901884],
                    [ 30.4703920, 50.3899913],
                    [30.4706245, 50.3899864],
                    [30.4702, 50.3900],
                    [30.4704022, 50.3901884]]]
            }
        }
    },
    'layout': {}
};

document.addEventListener('keyup', function (event) {
        changeShadow(event);
    draw.set({
        'type': 'FeatureCollection',
        'features': [{
            'type': 'Feature',
            'properties': {},
            'id': 'example-id',
            'geometry': testPolygon
        }]
    });
});

// degrees the map rotates when the left or right arrow is clicked
const deltaDegrees = 90;

// buttons
const leftButton = document.getElementById("pure-material-button-contained-left");
const rightButton = document.getElementById("pure-material-button-contained-right");

//test inputs
const thetaInput = document.getElementById("slider-p");
const phiInput = document.getElementById('slider-f');
// test labels
const polLabel = document.getElementById("theta-value");
const azLabel = document.getElementById('phi-value');


map.on('load', function () {
    addRotationButtons();
    addLayersOnMap();
    addSunControls();
    //shadowDrawerOnTheMap();
    map.addLayer(customLayer);
    //draw.add(testPolygon)
});

function changeShadow(event){
    var key = event.key || event.keyCode;
    if (key === 'Enter' || key === 'Enter' || key === 13) {
        console.log(testPolygon.coordinates[0][0]);
        console.log("test");
        testPolygon.coordinates[0][1][0] += 0.0001;
        testPolygon.coordinates[0][1][1] += 0.0001;
    }
};

function updateArea(e) {
    var data = draw.getAll();
}

function shadowDrawerOnTheMap(){
    map.addLayer(shadow);
}

function configureLightAndEnvironment(scene){
    // add light sources
    var ambedientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambedientLight);

    var light = new THREE.SpotLight( 0xffffff, 1, 350 );
    light.position.set(0, 50, 50);
    light.lookAt(new THREE.Vector3(0, 0, 0));
    light.castShadow = true;

    var helper = new THREE.CameraHelper( light.shadow.camera );

    //scene.add( helper );
    scene.add(light);

    // add models
    var materialPlane = new THREE.MeshPhongMaterial( { color: 0x837260 } );
    materialPlane.side = THREE.doubleSided;

    var plane = new THREE.Mesh( new THREE.PlaneGeometry(30, 30), materialPlane);
    plane.receiveShadow = true;
    plane.castShadow = false;
    plane.geometry.computeFaceNormals();
    plane.rotation.x = - Math.PI / 2;
    //scene.add(plane);

    var cube = new THREE.Mesh( new THREE.CubeGeometry( 5, 10, 5 ), new THREE.MeshPhongMaterial( { color: 0xe0e0e0 } ) );
    cube.position.set(0, 0, 1);
    cube.castShadow = true;
    cube.receiveShadow = false;
    //scene.add(cube);
}

function onChangeSunParams(){
    let polar = thetaInput.value * 180 / Math.PI;
    let azimuthal = phiInput.value * 180 / Math.PI;

    polLabel.innerText = polar.toFixed(2);
    azLabel.innerText = azimuthal.toFixed(2);

    setMapSunPosition(SUN_ON_MAP_RADII, azimuthal, polar);
    setModelSunPosition(polar, azimuthal);

    //console.log(`Polar angle ${polar} degree`)
}

function changeControls(a, p) {
    // switch controls
    thetaInput.value = p;
    phiInput.value = a;
    // labels
    polLabel.innerText = p.toFixed(2);
    azLabel.innerText = a.toFixed(2);

}

/**
 *  Changes of map light source position.
 * @param r - radial coordinate,
 * @param a - azimuthal angle,
 * @param p - polar angle,
 * @param i - intensity.
 */
function setMapSunPosition(r, a, p) {
    map.setLight({anchor: "map", position: [r, a, p]});
}

function addSunControls() {
    thetaInput.addEventListener('input', onChangeSunParams);
    phiInput.addEventListener('input', onChangeSunParams);
}

function addRotationButtons(){
    leftButton.addEventListener("click", turnMapRight);
    rightButton.addEventListener("click", turnMapLeft);
}

/**
 Function of camera pitch changes with zoom.
 * @param: z - zoom level
 * @returns: value of corresponding pitch value
 */
function zoomPitchDependency(z) {
    return 30*Math.tanh((z - 15.7)) + 30
}

/**
 * Function of easing determination.
 * @param t - time
 * @returns {number}
 */
function easing(t) {
    return t * (2 - t);
}

function turnMapLeft(){
    map.easeTo({
        bearing: map.getBearing() - deltaDegrees,
        easing: easing
    });
}

function turnMapRight(){
    map.easeTo({
        bearing: map.getBearing() + deltaDegrees,
        easing: easing
    });
}

/**
 *  Add extruded layers of apartments, schools, kindergartens, universities, hospitals
 */
function addLayersOnMap(){

    var layers = map.getStyle().layers;
    // Find the index of the first symbol layer in the map style
    var firstSymbolId;
    for (var i = 0; i < layers.length; i++) {
        if (layers[i].type === 'symbol') {
            firstSymbolId = layers[i].id;
            console.log(firstSymbolId);
            break;
        }
    }

    // 3d extruded buildings
    // apartments from json
    map.addLayer({
        'id': 'extrusion',
        'type': 'fill-extrusion',
        "source": {
            "type": "geojson",
            "data": "https://denyskononenko.github.io/maprebuild/buildigs_appartments.geojson"
        },
        'paint': {
            'fill-extrusion-color': '#696969',
            'fill-extrusion-height': [
                "interpolate", ["linear"], ["zoom"],
                15, 13,
                15.05, ["get", "height"]
            ],
            'fill-extrusion-base': [
                "interpolate", ["linear"], ["zoom"],
                15, 13,
                15.05, ["get", "min_height"]
            ],
            'fill-extrusion-opacity': 1.0
        }
    }, firstSymbolId);

    // all buildings excepts hospitals and apartments
    map.addLayer({
        'id': '3d-buildings',
        'source': 'composite',
        'source-layer': 'building',
        'filter': ['all', ['==', 'extrude', 'true'], ['!=', 'type', 'hospital'], ['!=', 'type' ,'apartments']],
        'type': 'fill-extrusion',
        'minzoom': 15,
        'paint': {
            'fill-extrusion-color': '#dedede',
            'fill-extrusion-height': [
                "interpolate", ["linear"], ["zoom"],
                15, 0,
                15.05, ["get", "height"]
            ],
            'fill-extrusion-base': [
                "interpolate", ["linear"], ["zoom"],
                15, 0,
                15.05, ["get", "min_height"]
            ],
            'fill-extrusion-opacity': .4
        }
    }, firstSymbolId);

    // hospitals
    map.addLayer({
        'id': '3d-buildings-hospitals',
        'source': 'composite',
        'source-layer': 'building',
        'filter': ['all', ['==', 'extrude', 'true'], ['==', 'type', 'hospital']],
        'type': 'fill-extrusion',
        'minzoom': 15,
        'paint': {
            'fill-extrusion-color': '#A52A2A',
            'fill-extrusion-height': [
                "interpolate", ["linear"], ["zoom"],
                15, 0,
                15.05, ["get", "height"]
            ],
            'fill-extrusion-base': [
                "interpolate", ["linear"], ["zoom"],
                15, 0,
                15.05, ["get", "min_height"]
            ],
            'fill-extrusion-opacity': .2
        }
    }, firstSymbolId);

    // universities
    map.addLayer({
        'id': '3d-buildings-university',
        'source': 'composite',
        'source-layer': 'building',
        'filter': ['all', ['==', 'extrude', 'true'], ['==', 'type', 'university']],
        'type': 'fill-extrusion',
        'minzoom': 15,
        'paint': {
            'fill-extrusion-color': '#e6dabc',
            'fill-extrusion-height': [
                "interpolate", ["linear"], ["zoom"],
                15, 0,
                15.05, ["get", "height"]
            ],
            'fill-extrusion-base': [
                "interpolate", ["linear"], ["zoom"],
                15, 0,
                15.05, ["get", "min_height"]
            ],
            'fill-extrusion-opacity': .3
        }
    }, firstSymbolId);

    // schools
    map.addLayer({
        'id': '3d-buildings-school',
        'source': 'composite',
        'source-layer': 'building',
        'filter': ['all', ['==', 'extrude', 'true'], ['==', 'type', 'school']],
        'type': 'fill-extrusion',
        'minzoom': 15,
        'paint': {
            'fill-extrusion-color': '#e6dabc',
            'fill-extrusion-height': [
                "interpolate", ["linear"], ["zoom"],
                15, 0,
                15.05, ["get", "height"]
            ],
            'fill-extrusion-base': [
                "interpolate", ["linear"], ["zoom"],
                15, 0,
                15.05, ["get", "min_height"]
            ],
            'fill-extrusion-opacity': .3
        }
    }, firstSymbolId);

    // kindergarten
    map.addLayer({
        'id': '3d-buildings-kindergarten',
        'source': 'composite',
        'source-layer': 'building',
        'filter': ['all', ['==', 'extrude', 'true'], ['==', 'type', 'kindergarten']],
        'type': 'fill-extrusion',
        'minzoom': 15,
        'paint': {
            'fill-extrusion-color': '#e6dabc',
            // use an 'interpolate' expression to add a smooth transition effect to the
            // buildings as the user zooms in
            'fill-extrusion-height': [
                "interpolate", ["linear"], ["zoom"],
                15, 0,
                15.05, ["get", "height"]
            ],
            'fill-extrusion-base': [
                "interpolate", ["linear"], ["zoom"],
                15, 0,
                15.05, ["get", "min_height"]
            ],
            'fill-extrusion-opacity': .3
        }
    }, firstSymbolId);

}

map.on('zoom', function () {
    //console.log("zoomed");
    map.setPitch(zoomPitchDependency(map.getZoom()))
});

/*
[[[30.4704022, 50.3901884],
  [ 30.4703920, 50.3899913],
  [30.4706245, 50.3899864],
  [30.4706346, 50.3901835],
  [30.4704022, 50.3901884]]]
*/




