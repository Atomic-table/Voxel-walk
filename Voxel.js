<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Infinite Voxel World with Custom Texture</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/nipplejs/0.8.3/nipplejs.min.js"></script>
  <style>
    body, html { margin: 0; overflow: hidden; height: 100%; }
    #gameCanvas { width: 100%; height: 100%; }
    .joystick { position: absolute; bottom: 20px; left: 20px; width: 100px; height: 100px; }
  </style>
</head>
<body>
  <div id="gameCanvas"></div>
  <div class="joystick" id="joystickZone"></div>
</body>
<script>
  let scene, camera, renderer;
  let chunkSize = 34;
  let blocks = new Map();
  let walkOffset = 0;
  let isTouching = false;
  let lastTouchX = 0, lastTouchY = 0;
  let cameraRotationSpeed = 0.002;
  let isJoystickActive = false; // Flag to track joystick interaction

  function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);
    camera.rotation.order = 'YXZ';

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('gameCanvas').appendChild(renderer.domElement);

    const light = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(light);

    const loader = new THREE.TextureLoader();
    const groundTexture = loader.load('content://media/external/downloads/1000004690');
    groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(1, 1);

    generateTerrain(camera.position.x, camera.position.z, groundTexture);

    let moveDirection = { x: 0, z: 0 };
    const moveSpeed = 0.09;

    const joystick = nipplejs.create({
      zone: document.getElementById('joystickZone'),
      mode: 'static',
      position: { left: '50%', bottom: '50%' },
      color: 'white',
    });

    joystick.on('move', (event, data) => {
      const angle = data.angle.degree * (Math.PI / 180);
      moveDirection.x = -Math.cos(angle) * data.distance / 50; // Negated for left/right movement
      moveDirection.z = Math.sin(angle) * data.distance / 50;
      isJoystickActive = true; // Set joystick active flag
      console.log("Joystick move:", moveDirection);  // Debugging log
    });

    joystick.on('end', () => {
      moveDirection.x = 0;
      moveDirection.z = 0;
      isJoystickActive = false; // Reset joystick active flag
      console.log("Joystick end");  // Debugging log
    });

    document.addEventListener('touchstart', (event) => {
      isTouching = true;
      lastTouchX = event.touches[0].clientX;
      lastTouchY = event.touches[0].clientY;
    });

    document.addEventListener('touchmove', (event) => {
      if (isTouching && !isJoystickActive) { // Only rotate if joystick is not active
        const touchX = event.touches[0].clientX;
        const touchY = event.touches[0].clientY;
        const deltaX = touchX - lastTouchX;
        const deltaY = touchY - lastTouchY;

        camera.rotation.y -= deltaX * cameraRotationSpeed;
        camera.rotation.x -= deltaY * cameraRotationSpeed;

        camera.rotation.x = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, camera.rotation.x));
        const maxHorizontalAngle = Math.PI / 2;
        camera.rotation.y = Math.max(-maxHorizontalAngle, Math.min(maxHorizontalAngle, camera.rotation.y));

        lastTouchX = touchX;
        lastTouchY = touchY;
      }
    });

    document.addEventListener('touchend', () => {
      isTouching = false;
    });

    function animate() {
      requestAnimationFrame(animate);

      // Get forward and right directions relative to the camera's rotation
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.y = 0; // Prevent vertical movement
      forward.normalize();

      const right = new THREE.Vector3();
      right.crossVectors(camera.up, forward).normalize();

      // Apply movement based on forward and right vectors
      camera.position.addScaledVector(forward, moveDirection.z * moveSpeed);
      camera.position.addScaledVector(right, moveDirection.x * moveSpeed);

      if (moveDirection.x !== 0 || moveDirection.z !== 0) {
        walkOffset += 0.3;
        camera.position.y = 5 + Math.sin(walkOffset) * 0.08;  // Add walking effect
      } else {
        camera.position.y = 5;
      }

      generateTerrain(camera.position.x, camera.position.z, groundTexture);
      renderer.render(scene, camera);
    }
    animate();
  }

  function generateTerrain(playerX, playerZ, groundTexture) {
    const chunkX = Math.floor(playerX / chunkSize);
    const chunkZ = Math.floor(playerZ / chunkSize);

    for (let x = chunkX - 1; x <= chunkX + 1; x++) {
      for (let z = chunkZ - 1; z <= chunkZ + 1; z++) {
        const chunkId = `${x},${z}`;
        if (!blocks.has(chunkId)) {
          const chunk = createChunk(x * chunkSize, z * chunkSize, groundTexture);
          blocks.set(chunkId, chunk);
          scene.add(chunk);
        }
      }
    }
  }

  function createChunk(offsetX, offsetZ, texture) {
    const chunk = new THREE.Group();
    const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
    const boxMaterial = new THREE.MeshBasicMaterial({ map: texture });

    for (let x = 0; x < chunkSize; x++) {
      for (let z = 0; z < chunkSize; z++) {
        const box = new THREE.Mesh(boxGeometry, boxMaterial);
        box.position.set(offsetX + x, 0, offsetZ + z);
        chunk.add(box);
      }
    }
    return chunk;
  }

  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });

  init();
</script>
</html>
