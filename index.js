const THREE = await import('./modules/three.js');
const { MMDLoader } = await import('./modules/MMDLoader.js');
const { MMDAnimationHelper } = await import('./modules/MMDAnimationHelper.js');
const { OutlineEffect } = await import('./modules/OutlineEffect.js');

const clock = new THREE.Clock();

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

const outlineEffect = new OutlineEffect(renderer);
const animHelper = new MMDAnimationHelper();
const loader = new MMDLoader();

loader.loadWithAnimation(
	'scripts/extensions/st3dw/test_model/model.pmx',
	['scripts/extensions/st3dw/test_model/defanim.vmd'],
	mmd => {
		const mesh = mmd.mesh;
		scene.add(mesh);

		animHelper.add(mesh, {
			animation: mmd.animation,
			physics: true
		});
});

const light = new THREE.AmbientLight(0x404040);
light.intensity = 60;
scene.add(light);

function animate() {
	requestAnimationFrame(animate);
	animHelper.update(clock.getDelta());
	outlineEffect.render(scene, camera);
}

window.enableMorphsDebug = function() {
	const mesh = animHelper.meshes[0];

	const morphsList = document.createElement('ol');
	morphsList.classList.add('morphsList');
	morphsList.setAttribute('start', 0);

	mesh.morphTargetInfluences.forEach(() => {
		morphsList.insertAdjacentHTML('beforeend', `
			<li>
				<input type="range" value="0" max="0.99" min="0" step="0.01">
			</li>
		`);
	});
	
	document.body.append(morphsList);

	document.querySelectorAll('.morphsList input').forEach((elem, index) => elem.addEventListener('input', evt => {
		mesh.morphTargetInfluences[index] = +evt.target.value;
	}));
}

animate();
