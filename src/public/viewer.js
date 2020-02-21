/*
    global
        THREE
*/

/*
    Viewer class representing the graph itself.
*/
var Viewer = function(canvas) {

    // Create the scene.
    this.scene = new THREE.Scene();

    // Set the canvas to the size of the window.
    Object.assign(canvas, {
        width: window.innerWidth,
        height: window.innerHeight
    });

    // Create the renderer on the canvas.
    this.renderer = new THREE.WebGLRenderer({
        canvas: canvas
    });
    this.renderer.setClearColor(new THREE.Color('rgb(230, 230, 230)'));
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    // Create the camera.
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);

    // The graph mesh. This represents the acutal formed-plane.
    this.graphMesh = null;
};

/*
    Render.
*/
Viewer.prototype.render = function() {
    this.renderer.render(this.scene, this.camera);
};

/*
    Get the x and z positions to add vertices at. Center is the X and Z position
    of the camera. Dist is the distance from the camera to the graph position
    at center.
*/
Viewer.prototype.getHorizontalVertexPositions = function(center, dist) {
    const vertices = [];

    // TODO: Have this adjustable in settings.
    const radiusSegments = 100;
    const thetaSegments = 32;

    const cache = { sin: [], cos: [], r: [] };

    // Cache trig values.
    for (let i = 0; i <= thetaSegments; i++) {
        cache.sin[i] = Math.sin(Math.PI * 2 * i / thetaSegments);
        cache.cos[i] = Math.cos(Math.PI * 2 * i / thetaSegments);
    }

    // Cache r values.
    for (let i = 0; i <= radiusSegments; i++) {
        cache.r[i] = 10000 * Math.pow(i / radiusSegments, 100 / dist /* TODO: Adjust this number */ );
    }

    // Inner triangles.
    for (let i = 0; i < thetaSegments; i++) {
        vertices.push([
            center.x + cache.cos[i] * cache.r[1],
            center.z + cache.sin[i] * cache.r[1],
        ]);
        vertices.push([
            center.x,
            center.z,
        ]);
        vertices.push([
            center.x + cache.cos[i + 1] * cache.r[1],
            center.z + cache.sin[i + 1] * cache.r[1],
        ]);
    }

    // Outer segments.
    for (let i = 1; i < radiusSegments; i++) {
        for (let j = 0; j < thetaSegments; j++) {
            vertices.push([
                center.x + cache.cos[j] * cache.r[i + 1],
                center.z + cache.sin[j] * cache.r[i + 1],
            ]);
            vertices.push([
                center.x + cache.cos[j] * cache.r[i],
                center.z + cache.sin[j] * cache.r[i],
            ]);
            vertices.push([
                center.x + cache.cos[j + 1] * cache.r[i + 1],
                center.z + cache.sin[j + 1] * cache.r[i + 1],
            ]);

            vertices.push([
                center.x + cache.cos[j] * cache.r[i],
                center.z + cache.sin[j] * cache.r[i],
            ]);
            vertices.push([
                center.x + cache.cos[j + 1] * cache.r[i],
                center.z + cache.sin[j + 1] * cache.r[i],
            ]);
            vertices.push([
                center.x + cache.cos[j + 1] * cache.r[i + 1],
                center.z + cache.sin[j + 1] * cache.r[i + 1],
            ]);
        }
    }

    return vertices;
};

/*
    Get the camera.
*/
Viewer.prototype.getCamera = function() {
    return this.camera;
};

/*
    Refresh the graph mesh.
*/
Viewer.prototype.refreshGraphMesh = function(solver) {
    if (this.graphMesh) {
        this.scene.remove(this.graphMesh);
    }

    // The geometry of the graph.
    const geometry = new THREE.BufferGeometry();

    // The y of the graph at the camera's x and z.
    const camY = solver.getYAt(this.camera.position.x, this.camera.position.z);

    // Get the vertices positions on the horizontal plane.
    const dist = Math.abs(camY - this.camera.position.y);
    const solveFor = this.getHorizontalVertexPositions(this.camera.position, dist);

    // Add vertices.
    const vertices = [];
    const yAverages = [];
    let maxY = camY,
        minY = camY;
    for (let i = 0; i < solveFor.length; i += 3) {
        // Solve for the ys at x, z.
        const y1 = solver.getYAt(solveFor[i][0], solveFor[i][1]);
        const y2 = solver.getYAt(solveFor[i + 1][0], solveFor[i + 1][1]);
        const y3 = solver.getYAt(solveFor[i + 2][0], solveFor[i + 2][1]);

        // Add the vertices.
        vertices.push(solveFor[i][0]);
        vertices.push(y1);
        vertices.push(solveFor[i][1]);
        vertices.push(solveFor[i + 1][0]);
        vertices.push(y2);
        vertices.push(solveFor[i + 1][1]);
        vertices.push(solveFor[i + 2][0]);
        vertices.push(y3);
        vertices.push(solveFor[i + 2][1]);

        // Adjust min and max.
        if (y1 > maxY) {
            maxY = y1;
        }
        if (y1 < minY) {
            minY = y1;
        }
        if (y2 > maxY) {
            maxY = y2;
        }
        if (y2 < minY) {
            minY = y2;
        }
        if (y3 > maxY) {
            maxY = y3;
        }
        if (y3 < minY) {
            minY = y3;
        }

        // Add the average y.
        yAverages.push((y1 + y2 + y3) / 3);
    }

    // Add colors.
    const colors = [];
    for (let i = 0; i < yAverages.length; i++) {
        const c = this.getColorFromY(yAverages[i], minY, maxY);
        colors.push(c[0]);
        colors.push(c[1]);
        colors.push(c[2]);
        colors.push(c[0]);
        colors.push(c[1]);
        colors.push(c[2]);
        colors.push(c[0]);
        colors.push(c[1]);
        colors.push(c[2]);
    }

    // itemSize = 3 because there are 3 values (components) per vertex
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3));
    geometry.computeVertexNormals();

    // Create the mesh.
    this.graphMesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
        vertexColors: THREE.VertexColors,
        side: THREE.DoubleSide
    }));

    // Add it to the scene.
    this.scene.add(this.graphMesh);
};

/*
    Set a color based on a y, minY and maxY. Returns [r, g, b].
*/
Viewer.prototype.getColorFromY = function(y, minY, maxY) {
    // TODO: Have this adjustable via preferences.

    // R =  255,   0,   0
    // Y =  255, 255,   0
    // G =    0, 255,   0
    let r, g, b;

    const diffY = (maxY - minY);
    const midY = diffY / 2 + minY;

    // r -> y -> g
    b = 0;
    if (y < midY) {
        r = 1;
        g = 1 - (midY - y) / diffY / 2;
    }
    else {
        r = 1 - (y - midY) / diffY / 2;
        g = 1;
    }

    return [r, g, b];
};
