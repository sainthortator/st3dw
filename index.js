const THREE = await import('./three.js');
const { MMDLoader } = await import('./MMDLoader.js');

const renderer = new THREE.WebGLRenderer({
	antialias: true,
	alpha: true
});

renderer.setClearColor(0x000000, 0);
renderer.setSize(620, 620);

const container = $('#expression-holder');
container.css('display', '');
container.append(renderer.domElement);

$('#expression-image').css('display', 'none');

const camera = new THREE.PerspectiveCamera(50, 1);
camera.position.z = 7;
camera.position.y = 17;

const scene = new THREE.Scene();
scene.add(camera);

const loader = new MMDLoader();

loader.load('scripts/extensions/st3dw/test_model/model.pmx', mesh => {
    scene.add(mesh);
});

const light = new THREE.AmbientLight(0x404040);
light.intensity = 60;
scene.add(light);

function animate() {
	requestAnimationFrame(animate);
	renderer.render(scene, camera);
}

animate();
