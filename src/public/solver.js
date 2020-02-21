/*
    global
        math
*/

var Solver = function () {
    this.expression = null;
};

Solver.prototype.setExpression = function (expression) {
    // TODO: Handle errors.
    this.expression = math.parse(expression).compile();
};

Solver.prototype.getYAt = function (x, z) {
    // TODO: Handle imaginary values.
    return this.expression.evaluate({x: x, z: z});
};