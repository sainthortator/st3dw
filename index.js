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

let mesh;

loader.loadWithAnimation(
	'scripts/extensions/st3dw/test_model/model.pmx',
	'scripts/extensions/st3dw/test_model/defanim.vmd',
	mmd => {
		mesh = mmd.mesh;
		scene.add(mesh);

		animHelper.add(mesh, {
			animation: mmd.animation,
			physics: true
		});
});

const light = new THREE.AmbientLight(0x404040);
light.intensity = 60;
scene.add(light);

let boneIndex = 0;
let boneRotationValue = 0;

function animate() {
	requestAnimationFrame(animate);
	animHelper.update(clock.getDelta());

	if (mesh) {
		mesh.skeleton.bones[boneIndex].rotation.set(+boneRotationValue, 0, 0);
	}

	outlineEffect.render(scene, camera);
}

window.enableMorphsDebug = function() {
	// window.mmd = mesh;

	const morphsList = document.createElement('ol');
	morphsList.classList.add('morphsList');
	morphsList.setAttribute('start', 0);

	const elemHtml = `
		<li>
			<input type="range" value="0" max="0.99" min="0" step="0.01">
		</li>
	`;

	mesh.morphTargetInfluences.forEach(() => {
		morphsList.insertAdjacentHTML('beforeend', elemHtml);
	});
	
	document.body.append(morphsList);

	document.querySelectorAll('.morphsList input').forEach((elem, index) => elem.addEventListener('input', evt => {
		mesh.morphTargetInfluences[index] = +evt.target.value;
	}));

	const bonesList = document.createElement('ol');
	bonesList.classList.add('bonesList');
	bonesList.setAttribute('start', 0);

	mesh.skeleton.bones.forEach(() => {
		bonesList.insertAdjacentHTML('beforeend', elemHtml);
	});
	
	document.body.append(bonesList);

	document.querySelectorAll('.bonesList input').forEach((elem, index) => elem.addEventListener('input', evt => {
		boneRotationValue = +evt.target.value;
		boneIndex = index;
	}));
}

animate();
