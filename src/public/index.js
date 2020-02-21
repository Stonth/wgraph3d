/*
    global
        THREE
        
        Viewer
        Solver
*/

const v = new Viewer(document.getElementById('view'));
const s = new Solver();

v.getCamera().position.set(0, 30, 0);
v.getCamera().lookAt(new THREE.Vector3(0, 0, 0));

s.setExpression('sqrt(abs(x) + abs(z))');

v.refreshGraphMesh(s);
v.render();