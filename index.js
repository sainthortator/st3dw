const THREE = await import('./three.js');

const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setClearColor(0xffffff, 1);
renderer.setSize(500, 500);

const container = $('#expression-holder');
container.css('display', '');
container.append(renderer.domElement);

$('#expression-image').css('display', 'none');

const camera = new THREE.PerspectiveCamera(70, 1);
camera.position.z = 0;
camera.position.y = 0;

const scene = new THREE.Scene();
scene.add(camera);

function animate() {
	requestAnimationFrame(animate);
	renderer.render(scene, camera);
}

animate();
