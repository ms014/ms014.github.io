(function () {

    /**
     * @param {string} msg 
     */
    var log = function (msg) {
        if (window.console && window.console.log) {
            window.console.log(msg);
        }
    };

    /**
     * @param {string} msg 
     */
    var error = function (msg) {
        if (window.console) {
            if (window.console.error) {
                window.console.error(msg);
            }
            else if (window.console.log) {
                window.console.log(msg);
            }
        }
    };


    var loggingOff = function () {
        log = function () { };
        error = function () { };
    };

    /**
     * @return {boolean} 
     */
    var isInIFrame = function () {
        return window != window.top;
    };

    /**
     * @param {!WebGLContext} gl 
     * @param {number} value 
     * @return {string}
     */
    var glEnumToString = function (gl, value) {
        for (var p in gl) {
            if (gl[p] == value) {
                return p;
            }
        }
        return "0x" + value.toString(16);
    };

    /**
     * @param {string} canvasContainerId    
     * @return {string}
     */
    var makeFailHTML = function (msg) {
        return '' +
            '<table style="background-color: #8CE; width: 100%; height: 100%;"><tr>' +
            '<td align="center">' +
            '<div style="display: table-cell; vertical-align: middle;">' +
            '<div style="">' + msg + '</div>' +
            '</div>' +
            '</td></tr></table>';
    };

    /**
     * 
     * @type {string}
     */
    var GET_A_WEBGL_BROWSER = '' +
        'Această pagină necesită un browser ce suportă WebGL.<br/>' +
        '<a href="http://get.webgl.org">Click aici pentur a actualiza browser-ul.</a>';

    /**
     * 
     * @type {string}
     */
    var OTHER_PROBLEM = '' +
        "Se pare că platforma ta nu suportă WebGL.<br/>" +
        '<a href="http://get.webgl.org/troubleshooting/">Click aici pentru mai multă informație.</a>';

    /**
     * @param {Element} canvas.
     * @param {WebGLContextCreationAttirbutes} opt_attribs
     * @return {WebGLRenderingContext}
     */
    var setupWebGL = function (canvas, opt_attribs) {
        function showLink(str) {
            var container = canvas.parentNode;
            if (container) {
                container.innerHTML = makeFailHTML(str);
            }
        };

        if (!window.WebGLRenderingContext) {
            showLink(GET_A_WEBGL_BROWSER);
            return null;
        }

        var context = create3DContext(canvas, opt_attribs);
        if (!context) {
            showLink(OTHER_PROBLEM);
        }
        return context;
    };

    /**
     * @param {!Canvas} canvas
     * @return {!WebGLContext}
     */
    var create3DContext = function (canvas, opt_attribs) {
        var names = ["webgl", "experimental-webgl"];
        var context = null;
        for (var ii = 0; ii < names.length; ++ii) {
            try {
                context = canvas.getContext(names[ii], opt_attribs);
            } catch (e) { }
            if (context) {
                break;
            }
        }
        return context;
    }

    var updateCSSIfInIFrame = function () {
        if (isInIFrame()) {
            document.body.className = "iframe";
        }
    };

    var getWebGLContext = function (canvas) {
            updateCSSIfInIFrame();

            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;
        

        var gl = setupWebGL(canvas);
        return gl;
    };

    /**
     * @param {!WebGLContext} gl 
     * @param {string} shaderSource 
     * @param {number} shaderType 
     * @param {function(string): void}
     * @return {!WebGLShader} 
     */
    var loadShader = function (gl, shaderSource, shaderType, opt_errorCallback) {
        var errFn = opt_errorCallback || error;
        var shader = gl.createShader(shaderType);

        gl.shaderSource(shader, shaderSource);

        gl.compileShader(shader);

        var compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (!compiled) {
            lastError = gl.getShaderInfoLog(shader);
            errFn("*** Eroare la compilarea shader-ului '" + shader + "':" + lastError);
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    /**
     * @param {!Array.<!WebGLShader>} shaders
     * @param {!Array.<string>} opt_attribs 
     * @param {!Array.<number>} opt_locations 
     */
    var loadProgram = function (gl, shaders, opt_attribs, opt_locations) {
        var program = gl.createProgram();
        for (var ii = 0; ii < shaders.length; ++ii) {
            gl.attachShader(program, shaders[ii]);
        }
        if (opt_attribs) {
            for (var ii = 0; ii < opt_attribs.length; ++ii) {
                gl.bindAttribLocation(
                    program,
                    opt_locations ? opt_locations[ii] : ii,
                    opt_attribs[ii]);
            }
        }
        gl.linkProgram(program);

        var linked = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (!linked) {
            lastError = gl.getProgramInfoLog(program);
            error("Eroare la linkarea programului:" + lastError);

            gl.deleteProgram(program);
            return null;
        }
        return program;
    };

    /**
     * @param {!WebGLContext} gl
     * @param {string} scriptId
     * @param {number} opt_shaderType
     * @param {function(string): void}
     * @return {!WebGLShader}
     */
    var createShaderFromScript = function (
        gl, scriptId, opt_shaderType, opt_errorCallback) {
        var shaderSource = "";
        var shaderType;
        var shaderScript = document.getElementById(scriptId);
        if (!shaderScript) {
            throw ("*** Eroare:script necunoscut" + scriptId);
        }
        shaderSource = shaderScript.text;

        if (!opt_shaderType) {
            if (shaderScript.type == "x-shader/x-vertex") {
                shaderType = gl.VERTEX_SHADER;
            } else if (shaderScript.type == "x-shader/x-fragment") {
                shaderType = gl.FRAGMENT_SHADER;
            } else if (shaderType != gl.VERTEX_SHADER && shaderType != gl.FRAGMENT_SHADER) {
                throw ("*** Eroare: tipul shader-ului este necunoscut");
                return null;
            }
        }

        return loadShader(
            gl, shaderSource, opt_shaderType ? opt_shaderType : shaderType,
            opt_errorCallback);
    };

    this.createProgram = loadProgram;
    this.createShaderFromScriptElement = createShaderFromScript;
    this.getWebGLContext = getWebGLContext;
    this.updateCSSIfInIFrame = updateCSSIfInIFrame;

    window.requestAnimFrame = (function () {
        return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function (callback, element) {
                return window.setTimeout(callback, 1000 / 60);
            };
    })();

    window.cancelRequestAnimFrame = (function () {
        return window.cancelCancelRequestAnimationFrame ||
            window.webkitCancelRequestAnimationFrame ||
            window.mozCancelRequestAnimationFrame ||
            window.oCancelRequestAnimationFrame ||
            window.msCancelRequestAnimationFrame ||
            window.clearTimeout;
    })();

}());

