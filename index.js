const THREE = await import('./modules/three.js');
const { MMDLoader } = await import('./modules/MMDLoader.js');
const { MMDAnimationHelper } = await import('./modules/MMDAnimationHelper.js');
const { OutlineEffect } = await import('./modules/OutlineEffect.js');
import { getContext } from "../../extensions.js";
import { generateQuietPrompt } from "../../../script.js";
import { eventSource, event_types } from "../../../script.js";
import { extension_settings } from "../../extensions.js";
import { saveSettingsDebounced } from "../../../script.js";
import expressionsList from '/assets/models/Barbara/expressions.js';

const settings = extension_settings.st3dw;

settings.enabled === undefined ?
	settings.enabled = false :
	settings.enabled = settings.enabled

let isExtEnabled = settings.enabled;

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
	'/assets/models/Barbara/model.pmx',
	'/assets/models/Barbara/defanim.vmd',
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

const changedBones = {};

function render() {
	if (!isExtEnabled) {
		renderer.domElement.style.display = 'none';
		return;
	}

	requestAnimationFrame(render);

	animHelper.update(clock.getDelta());

	if (mesh && !jQuery.isEmptyObject(changedBones)) {
		for (const key in changedBones) {
			const bone = mesh.skeleton.bones[key];
			const coords = changedBones[key];
			bone.rotation.set(coords.x, coords.y, coords.z);
		}
	}

	outlineEffect.render(scene, camera);
}

if (isExtEnabled) render();

const jsonTemplate = JSON.stringify(tranformExpsListToTemplate(expressionsList));

eventSource.on(event_types.MESSAGE_RECEIVED, async () => {
	if (!settings.enabled) return;

	const chat = getContext().chat;
	const lastMes = chat[chat.length - 1];
	
	if (lastMes.is_name) {
		const output = await generateQuietPrompt(`[Pause your roleplay. Now you will recognize {{char}}'s authentic facial expressions. Below is JSON template. Fill in all fields, taking into account current emotions of this character, analyze latest events in roleplay. Provide correct JSON only. Template:\n${jsonTemplate}\n]`)
		applyMorphs(JSON.parse(output));
	}
});

jQuery(() => {
    const html = `
    <div class="st3dw_settings">
        <div class="inline-drawer">
            <div class="inline-drawer-toggle inline-drawer-header">
				<b>ST3DW</b>
				<div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
            </div>
            <div class="inline-drawer-content">
				<label class="checkbox_label">
					<input type="checkbox" id="st3dw_enabled">
					Enabled
				</label>
            </div>
        </div>
    </div>`;

	saveSettingsDebounced();

    $('#extensions_settings').append(html);
	$('#st3dw_enabled').on('input', function () {
		let isEnabled = isExtEnabled = $(this).prop('checked');
		settings.enabled = !!isEnabled;
		saveSettingsDebounced();

		const rendererStyle = renderer.domElement.style;

		if (isEnabled) {
			rendererStyle.display = 'block';
			render();
		}
		else {
			rendererStyle.display = 'none';
		}
	});
	$('#st3dw_enabled').prop('checked', settings.enabled);
});

function tranformExpsListToTemplate(list) {
	let modelMorphsTemplate = {};

	for (const key in list) {
		modelMorphsTemplate[key] = [];
		
		for (const subkey in list[key]) {
			modelMorphsTemplate[key].push(subkey);
		}
	}

	return modelMorphsTemplate;
}

function applyMorphs(obj) {
	mesh.morphTargetInfluences.forEach((i, index) => {
		mesh.morphTargetInfluences[index] = 0;
	})
	
	for (let key in obj) {
		const
			morph = expressionsList[key][obj[key]],
			index = morph.i,
			value = morph.value,
			duration = 500;

		// console.log(morph);

		if (morph.isBone) {
			animate(duration, process => {
				changedBones[index] = {
					z: morph.z * process,
					x: morph.x * process,
					y: morph.y * process
				};
			});

			continue;
		}

		if (!Array.isArray(index)) {
			const indices = [index];
			indices.forEach(i => {
				animate(duration, process => {
					mesh.morphTargetInfluences[i] = process * value;
				});
			});
		}
	}
}

function animate(duration, fn) {
	let start = performance.now();

	requestAnimationFrame(function animate(time) {
		let timeFraction = (time - start) / duration;
		if (timeFraction > 1) timeFraction = 1;

		fn(Math.pow(timeFraction, 2));

		if (timeFraction < 1) requestAnimationFrame(animate);
	});
}

// call this function in the console for check
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

	document.querySelectorAll('.morphsList input')
		.forEach((elem, index) => elem.addEventListener('input', evt => {
		mesh.morphTargetInfluences[index] = +evt.target.value;
	}));

	const bonesList = document.createElement('ol');
	bonesList.classList.add('bonesList');
	bonesList.setAttribute('start', 0);

	mesh.skeleton.bones.forEach(() => {
		bonesList.insertAdjacentHTML('beforeend', elemHtml);
	});
	
	document.body.append(bonesList);

	document.querySelectorAll('.bonesList input')
		.forEach((elem, index) => elem.addEventListener('input', evt => {
		changedBones[index] = {
			x: +evt.target.value,
			y: 0,
			z: 0
		};
	}));

	applyMorphs({
		"head": "tilted left"
	})
}
