// document.head.insertAdjacentHTML('beforeend', `
//     <script src="https://unpkg.com/es-module-shims@1.8.0/dist/es-module-shims.js"></script>
// `);

// const importmap = document.createElement('script');
// importmap.setAttribute('type', 'importmap');
// importmap.insertAdjacentText('beforeend', `
//     {
//         "imports": {
//         "three": "https://unpkg.com/three@0.156.1/build/three.module.js",
//         "three/addons/": "https://unpkg.com/three@0.156.1/examples/jsm/"
//         }
//     }
// `)

// document.querySelector('[type="module"]').insertAdjacentElement('beforebegin', importmap);

// importmap.onload = () => {
//     const script = document.createElement('script');
//     script.setAttribute('src', '/scripts/extensions/st3dw/st3dw.js');
//     script.setAttribute('type', 'module');
// };

const THREE = await import('./three.js');

const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setClearColor(0xffffff, 1);
renderer.setSize(1000, 1000);
$('#expression-holder').append(renderer.domElement);