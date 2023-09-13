const THREE = await import('./modules/three.js');
const { MMDLoader } = await import('./modules/MMDLoader.js');
const { MMDAnimationHelper } = await import('./modules/MMDAnimationHelper.js');
const { OutlineEffect } = await import('./modules/OutlineEffect.js');
import { getContext } from "../../extensions.js";
import { generateQuietPrompt } from "../../../script.js";
import { eventSource, event_types } from "../../../script.js";

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

const changedBones = {};

function render() {
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

const testExpressionsList = {
	"right eye": {
		"closed": {
			i: 24,
			value: 1
		},
		"closed smiling": {
			i: 22,
			value: 1
		},
		"half-closed": {
			i: 24,
			value: 0.25
		},
		"opened": {
			i: [24, 22],
			value: 0
		}
	},
	"left eye": {
		"closed": {
			i: 25,
			value: 1
		},
		"closed smiling": {
			i: 23,
			value: 1
		},
		"half-closed": {
			i: 25,
			value: 0.25
		},
		"opened": {
			i: [25, 23],
			value: 0
		}
	},
	"lip corners": {
		"down": {
			i: 6,
			value: 1
		},
		"upturned": {
			i: 10,
			value: 0.8
		},
		"pinched": {
			i: 18,
			value: 0.9
		},
		"neutral": {
			i: [6, 10, 18],
			value: 0
		}
	},
	"mouth": {
		"opened round": {
			i: 4,
			value: 1
		},
		"opened wide": {
			i: 0,
			value: 0.7
		},
		"fake smile": {
			i: 8,
			value: 0.4
		},
		"closed": {
			i: [4, 0, 8],
			value: 0
		}
	},
	"tongue": {
		"out": {
			i: 15,
			value: 1
		},
		"in": {
			i: 15,
			value: 0
		}
	},
	"blushed": {
		"yes": {
			i: 60,
			value: 1
		},
		"no": {
			i: 60,
			value: 0
		}
	},
	"right brow": {
		"sadly turned upward": {
			i: 46,
			value: 1
		},
		"upturned": {
			i: 48,
			value: 1
		},
		"angry furrowed": {
			i: 50,
			value: 1
		},
		"neutral": {
			i: [46, 48, 50],
			value: 0
		}
	},
	"left brow": {
		"sadly turned upward": {
			i: 47,
			value: 1
		},
		"upturned": {
			i: 49,
			value: 1
		},
		"angry furrowed": {
			i: 51,
			value: 1
		},
		"neutral": {
			i: [47, 49, 51],
			value: 0
		}
	},
	"head": {
		"tilted left": {
			isBone: true,
			i: 10,
			x: 0.1,
			y: 0,
			z: 0.25
		},
		"tilted right": {
			isBone: true,
			i: 10,
			x: 0.1,
			y: 0,
			z: -0.25
		},
		"not tilted": {
			isBone: true,
			i: 10,
			x: 0,
			y: 0,
			z: 0
		}
	}
}

eventSource.on(event_types.MESSAGE_RECEIVED, async () => {
	const chat = getContext().chat;
	const lastMes = chat[chat.length - 1];
	const jsonTemplate = JSON.stringify(tranformExpsListToTemplate(testExpressionsList));
	
	if (lastMes.is_name) {
		const output = await generateQuietPrompt(`[Pause your roleplay. Now you will recognize ${lastMes.name}'s authentic facial expressions. Below is JSON template. Fill in all fields, taking into account current emotions of this character, analyze latest events in roleplay. Provide correct JSON only. Template:\n${jsonTemplate}\n]`)
		applyMorphs(JSON.parse(output));
	}
});

render();

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
			morph = testExpressionsList[key][obj[key]],
			index = morph.i,
			value = morph.value,
			duration = 400;

		// console.log(morph);

		if (morph.isBone) {
			let start = performance.now();

			requestAnimationFrame(function animate(time) {
				let timeFraction = (time - start) / 500;
				if (timeFraction > 1) timeFraction = 1;

				changedBones[index] = {
					z: morph.z * timeFraction,
					x: morph.x * timeFraction,
					y: morph.y * timeFraction
				};
		
				if (timeFraction < 1) requestAnimationFrame(animate);
			});

			continue;
		}

		if (Array.isArray(index)) {
			index.forEach(i => {
				animate(duration, i, value);
			});
		} else {
			animate(duration, index, value);
		}
	}
}

function animate(duration, index, value) {
	let start = performance.now();

	requestAnimationFrame(function animate(time) {
		let timeFraction = (time - start) / duration;
		if (timeFraction > 1) timeFraction = 1;

		mesh.morphTargetInfluences[index] = Math.pow(timeFraction, 2) * value;

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

	// applyMorphs({
	// 	"head": "tilted left"
	// })
}
