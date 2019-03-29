'use strict';

let scene3d = document.getElementById("scene3d");
var CANVAS_WIDTH = 300;
var CANVAS_HEIGHT = 250;
var RADII = 6;
var SOLAR_DISTANCE = 6.5;

// labels
var polarLable = document.getElementById('theta-value');
var azimuthalLable = document.getElementById('phi-value');

// camer control
var cameraSlider = document.getElementById('slider-camera');
var cameraControlLabel = document.getElementById('camera-angle-value');

// three.js scene stuff
var scene = new THREE.Scene();
scene.background = new THREE.Color( 0xffffff ); // set background to white
var camera = new THREE.PerspectiveCamera(60, CANVAS_WIDTH / CANVAS_HEIGHT, 0.1, 1000);
var renderer = new THREE.WebGLRenderer({ canvas: scene3d, antialias: true});

renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.BasicShadowMap;

// add horisontal circle
var geometryCircle = new THREE.CircleGeometry( RADII, 64 );
var materialCircle = new THREE.MeshPhongMaterial( { color: 0x837260 } );
materialCircle.side = THREE.doubleSided;
var circle = new THREE.Mesh( geometryCircle, materialCircle );
circle.receiveShadow = true;
circle.castShadow = false;
circle.geometry.computeFaceNormals();

// add top half sphere
var topHalfSphere = new THREE.SphereGeometry(RADII, 50, 50, 0, Math.PI, 0, Math.PI );
var materialTopHalfSphere = new THREE.MeshBasicMaterial({color: 0x054158, transparent: true, opacity: 0.05});
materialTopHalfSphere.side = THREE.DoubleSide;
var halfSphere = new THREE.Mesh(topHalfSphere, materialTopHalfSphere);

//add cube
var cube = new THREE.Mesh( new THREE.CubeGeometry( 1, 1, 2 ), new THREE.MeshPhongMaterial( { color: 0xe0e0e0 } ) );
cube.position.set(0, 0, 1);
cube.castShadow = true;
cube.receiveShadow = false;
scene.add(cube);

// add solar sphere
var sunSphere = new THREE.SphereGeometry(0.5, 50, 50, 0, 2*Math.PI, 0, Math.PI );
var sunMaterial = new THREE.MeshBasicMaterial({color: 0xFA7800});
var sun = new THREE.Mesh(sunSphere, sunMaterial);
sun.position.set(0, 0, SOLAR_DISTANCE);

// add light source
var ambedientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambedientLight);

var light = new THREE.PointLight( 0xffffff, 1, 100 );
light.position.set(0, 0, 6.5);
light.lookAt(new THREE.Vector3(0, 0, 0));
light.castShadow = true;

var helper = new THREE.CameraHelper( light.shadow.camera );
//scene.add( helper );
scene.add( light );

//var controlsSun = new THREE.OrbitControls(sun, renderer.domElement);
var controls = new THREE.OrbitControls(camera, renderer.domElement);

scene.add(halfSphere);
scene.add(circle);
scene.add(sun);

setCameraPosition(20, 0, 0);
//setCameraPositionBasic();

var render = function() {
    requestAnimationFrame(render);
    renderer.render(scene, camera);
};

render();

/**
 * Set camera in spherical coordinate system.
 * @param r - spherical radial coordinate
 * @param p - polar angle (reference axes: z)
 * @param a - azimuthal angle (reference axes: x)
 */
function setCameraPosition(r, p, a) {
    camera.position.x = r * Math.sin(p) * Math.cos(a);
    camera.position.y = r * Math.sin(p) * Math.sin(a);
    camera.position.z = r * Math.cos(p);
    camera.lookAt(new THREE.Vector3(0,0,0))
}

//cameraSlider.addEventListener("input", onChangeCameraAngle);

function onChangeCameraAngle(cameraAngle){
    cameraAngle = cameraAngle * Math.PI / 180;
    // spherical coordinates of camera
    let r = getSphericalCoordinates(camera.position.x, camera.position.y, camera.position.z).radii;
    let p = getSphericalCoordinates(camera.position.x, camera.position.y, camera.position.z).polar;
    let a = getSphericalCoordinates(camera.position.x, camera.position.y, camera.position.z).azimuth;
    console.log(`camera position on 3d scene: r ${r}, p ${p}, a ${a}`);

    setCameraPosition(r, -cameraAngle, Math.PI / 2);
}

function setModelSunPosition(p, a){
    //geometry shape of sun on the 3d model
    sun.position.x = SOLAR_DISTANCE * Math.sin(p * Math.PI / 180) * Math.cos(a * Math.PI / 180);
    sun.position.y = SOLAR_DISTANCE * Math.sin(p * Math.PI / 180) * Math.sin(a * Math.PI / 180);
    sun.position.z = SOLAR_DISTANCE * Math.cos(p * Math.PI / 180);

    // light source on 3d model
    light.position.x = SOLAR_DISTANCE * Math.sin(p * Math.PI / 180) * Math.cos(a * Math.PI / 180);
    light.position.y = SOLAR_DISTANCE * Math.sin(p * Math.PI / 180) * Math.sin(a * Math.PI / 180);
    light.position.z = SOLAR_DISTANCE * Math.cos(p * Math.PI / 180);
}

function getSphericalCoordinates(x, y, z) {
    let r = Math.sqrt(x * x + y * y + z * z);
    let p = Math.acos(z / r) * 180 / Math.PI;
    let a = Math.atan(y / x) * 180 / Math.PI;
    return {radii: r, polar: p, azimuth: a}
}

function changeAnglesLabels(p, a){
    polarLable.innerText = p;
    azimuthalLable.innerText = a;
}

function changeSlidersValue(p, a) {
    document.getElementById("slider-p").value = p;
    document.getElementById('slider-f').value = a;
}

/**
 * Function calculates spherical coordinates of sun for particular date.
 * Area of return values: zenith [0, PI]; azimuth [-PI, PI].
 * Cite Roberto Grena, "Five new algorithms for the computation of sun position from 2010 to 2110",
 * Solar Energy, 2012.
 *
 * https://www.sciencedirect.com/science/article/pii/S0038092X12000400?via%3Dihub
 *
 * @param y - year
 * @param m - month
 * @param d - day
 * @param h - hour (at Greenwich meridian UT1)
 * @returns {{zenith: number , azimuth: number}}
 */
function calculateSunPosition(y, m, d, h) {
    // latitude and longitude of Kyiv
    let LAT = 50.45466;
    let LON = 30.5238;

    // fundamental frequency
    let omega = 0.017202786;

    // check date
    if (m <= 2) {
        m += 12;
        y -= 1;
    }

    // calculate time
    let t = Math.trunc(365.25 * (y - 2000)) + Math.trunc(30.6001 * (m + 1)) - Math.trunc(0.01 * y) + d + h/24 - 21958;
    // Difference between Terrestrial Time, TT and Universal Time, UT
    let dt = 96.4 + 0.00158 * t;
    let te = t + 1.1574e-5 * dt;

    // right accession
    let alpha = -1.38880 + 1.72027920e-2 * te + 3.199e-2 * Math.sin(omega * te) + 2.65e-3 * Math.cos(omega * te) +
        4.050e-2 * Math.sin(2 * omega * te) + 1.525e-2 * Math.cos(2 * omega * te);
    alpha = toProperRange(alpha);

    // declination
    let delta = 6.57e-3 + 7.347e-2 * Math.sin(omega * te) - 3.9919e-1 * Math.cos(omega * te) +
        7.3e-4 * Math.sin(2* omega * te) - 6.60e-3 * Math.cos(2 * omega * te);


    // hour angle
    let H = 1.75283  + 6.3003881 * t + LON - alpha;

    // convert H to conventional range
    H = (H + Math.PI) % (2 * Math.PI) - Math.PI;

    // elevation angle of the zenith
    let e0 = Math.asin(Math.sin(LAT) * Math.sin(delta) + Math.cos(LAT) * Math.cos(delta) * Math.cos(H));
    // paralax correction
    let dep = -4.26e-5 * Math.cos(e0);
    // corrected elevation
    let ep = e0 + dep;

    // zenith angle
    let z = Math.PI / 2 - ep;
    // azimuth
    let a =  Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(LAT) - Math.tan(delta) * Math.cos(LAT));
    //a = toProperRange(a);

    return {
                zenith: z,
                azimuth: a
            }
}

function toProperRange(x) {
    let fx = Math.abs(Math.floor(x / (2 * Math.PI)) - x / (2 * Math.PI)); // decimal part
    x = (x > 0) ? (2 * Math.PI) * fx : (2 * Math.PI) - (2 * Math.PI) * fx;
    return x;
}

//console.log(`sun coordinates 2019/03/15 12:00 PM: zenith: ${calculateSunPosition(2019, 3, 15, 12).zenith * 180 / Math.PI}, azimuth: ${calculateSunPosition(2019, 3, 15, 12).azimuth * 180/ Math.PI}`);

$(function () {
    $('#datetimepicker1').datetimepicker();
});

$('#datetimepicker1').datetimepicker().on('dp.change', function(){
    let dateTimeArr = String($('#datetimepicker1').data('date')).split(" ");
    let date = dateTimeArr[0].split("/");
    let time = dateTimeArr[1];
    let partOfDay = dateTimeArr[2]; // AM or PM

    // date
    let year = +date[2];
    let day = +date[1];
    let month = +date[0];

    // time
    var hours = +String(time).split(':')[0];
    if ((partOfDay === "PM" && hours !== 12)|| (partOfDay === "AM" && hours === 12)){
        hours = hours + 12;
    }

    // compute position of the sun
    let sunPos = calculateSunPosition(year, month, day, hours);
    let az = sunPos.azimuth * 180 / Math.PI;
    let zen = sunPos.zenith * 180 / Math.PI;

    // set light source at the map
    setMapSunPosition(1, az, zen);
    // set light source at 3d model with controls
    setModelSunPosition(zen, az);
    //set switch and control labels
    changeControls(az, zen);

    //console.log(`year: ${year}, month: ${+month}, day: ${+day}, hour: ${hours}; azimuth: ${az}, zenith: ${zen}`);
});

/*
for (var i = 0; i <=24; i++){
    console.log(`sun coordinates 2019/03/15 ${i}:00 UT: zenith: ${calculateSunPosition(2019, 3, 15, i).zenith * 180 / Math.PI}, azimuth: ${calculateSunPosition(2019, 3, 15, i).azimuth * 180/ Math.PI}`);
}*/