// Ink.js
// By Daniel R. (sadasant.com)
// License: http://opensource.org/licenses/mit-license.php
// Homepage: https://github.com/sadasant/Ink.js

(function () {

  // Environment settings
  var win  = this // window
    , doc  = document
    , M    = Math

  // Private Variables
  var draw_stack = {}   // Stack of shapes
    , ids        = 0    // Current last id of shapes
    , removed    = []   // Shapes' graveyard
    , can               // Canvas holder
    , con               // Context holder

  // Math variables
  var PI180 = M.PI/180
    , PI2   = M.PI*2
    , COS   = M.cos
    , SIN   = M.sin
    , ABS   = M.abs

  // Getting the window size
  function getWindowSize() {
    return {
      w : win.innerWidth  || (doc.documentElement && doc.documentElement.offsetWidth ) || (doc.body && doc.body.offsetWidth ) || 630
    , h : win.innerHeight || (doc.documentElement && doc.documentElement.offsetHeight) || (doc.body && doc.body.offsetHeight) || 460
    }
  }

  // Looping through the stack of shapes
  function drawStack() {
    for (var k in draw_stack) {
      if (draw_stack[k]) {
        con.save()
        draw_stack[k].draw()
        con.restore()
      }
    }
  }

  // Insert in the stack of shapes
  function draw(obj) {
    draw_stack[obj.id] = obj
  }

  // Move the shape to the graveyard
  function remove(obj) {
    if (obj) {
      removed[removed.length] = obj.id
      delete draw_stack[obj.id]
    }
  }

  /* Sort of inheritance
  */
  function fork(from, to) {
    for (var k in from) {
      if (from.hasOwnProperty(k)) {
        to[k] = from[k]
      }
    }
  }

  // Prototypes' holder
  var proto = {
      // Geometric shapes' prototype
      geometrics : {
        // Always inside the canvas
        foreverInScope: function() {
          if (this.x > can.width -10)  this.x -= can.width
          if (this.x < -10          )  this.x += can.width -10
          if (this.y > can.height   )  this.y -= can.height
          if (this.y < -10          )  this.y += can.height
        }
        // degrees 2 rad
      , rotateTo: function (deg) {
          this.rotation = deg * PI180
        }
        // move forward this much with this maxSpeed
      , accel: function(much, maxSpeed) {
          if (maxSpeed) {
            this.maxSpeed.x = maxSpeed
            this.maxSpeed.y = maxSpeed
          }
          if (this.rotateInEdge) {
            var a = this.rotation
              , x = - much * SIN(a)
              , y =   much * COS(a)
            this.speed.x += x
            this.speed.y += y
          } else {
            this.speed.x += much
            this.speed.y += much
          }
          var abs = {
                x: ABS(this.speed.x)
              , y: ABS(this.speed.y)
            }
          if (abs.x > this.maxSpeed.x) {
            this.speed.x = (abs.x/this.speed.x)*this.maxSpeed.x
          }
          if (abs.y > this.maxSpeed.y) {
            this.speed.y = (abs.y/this.speed.y)*this.maxSpeed.y
          }
        }
      , stop: function() {
          this.speed.x = 0
          this.speed.y = 0
        }
      , repos: function() {
          if (this.rotateInEdge) {
            this.x -= this.speed.x
            this.y -= this.speed.y
          } else {
            var a = this.rotation
            this.x += this.speed.x * SIN(a)
            this.y -= this.speed.y * COS(a)
          }
        }
        // lame collider
      , addCollider: function(obj) {
          this.colliders[this.colliders.length] = obj
        }
        // onCollide by default just turns red the shape
      , onCollide: function() {
          this.fill   = "rgba(255, 0, 0, 0.3)"
          this.stroke = "rgba(255, 0, 0, 1)"
        }
      , collideArea: 15
      , collide: function() {
          var col = this.colliders
            , coli
          for (var i = 0, l = col.length; i < l; i++) {
            if (coli = col[i]) {
              var diffx = ABS(coli.x - this.x)
                , diffy = ABS(coli.y - this.y)
              if (diffx < this.collideArea && diffy < this.collideArea) {
                if (~removed.indexOf(coli.id)) { // lame solution
                  delete this.colliders[i]
                } else {
                  this.onCollide(coli)
                }
              }
            }
          }
        }
      }
    // Gradients' prototype
    , grad : {
        // arguments = [ float1, color1 ], [ float2, color2 ], ...
        colors : function(colors) {
          for (var i = 0, l = colors.length; i < l; i++) {
            var c = colors[i]
            this.addColorStop(c[0], c[1])
          }
          return this
        }
      }
  }

  // Rectangle
  function Rect(x, y, width, height, fill, stroke) {
    fork(proto.geometrics,this) // FORKING
    this.id = (++ids).toString()
    this.x = x
    this.y = y
    this.width = width
    this.height = height
    this.fill   = fill   || "rgba(0, 0, 0, 0.2)"
    this.stroke = stroke || "rgba(0, 0, 0, 0.2)"
    this.rotation = 0
    this.speed    = { x:  0, y:  0 }
    this.maxSpeed = { x: 10, y: 10 }
    this.infiniteScope = null
    this.colliders = []
    this.afterDraw = undefined
    // draw method
    this.draw = function(){
      if (this.infiniteScope) this.foreverInScope()  // if out of space
      if (this.speed.x || this.speed.y) this.repos() // add speed
      con.translate(this.x, this.y)
      if (this.rotation) con.rotate(this.rotation)   // rotate
      if (this.colliders.length) this.collide()      // collide
      // draw
      con.fillStyle = this.fill
      con.strokeStyle = this.stroke
      con.fillRect(this.x, this.y, this.width, this.height)
      if (this.afterDraw) this.afterDraw()
    }
  }

  // Circle
  function Circ(x, y, r, fill, stroke) {
    fork(proto.geometrics, this) // FORKING
    this.id = (++ids).toString()
    this.x = x || 0
    this.y = y || 0
    this.r = r || 0
    this.fill   = fill || "rgba(255, 255, 255, 0.3)"
    this.stroke = stroke || "rgba(255, 255, 255, 1)"
    this.rotation = 0
    this.speed    = { x:  0, y:  0 }
    this.maxSpeed = { x: 10, y: 10 }
    this.infiniteScope = null
    this.colliders = []
    // draw method
    this.draw = function(){
      if (this.infiniteScope) this.foreverInScope()  // if out of space
      if (this.speed.x || this.speed.y) this.repos() // add speed
      con.translate(this.x, this.y)
      if (this.rotation) con.rotate(this.rotation)   // rotate
      if (this.colliders.length) this.collide()      // collide
      // draw
      con.fillStyle   = this.fill
      con.strokeStyle = this.stroke
      con.beginPath()
      con.arc(0, 0, this.r, 0, PI2)
      con.closePath()
      con.stroke()
      con.fill()
    }
  }

  // Path
  function Path(x, y, v, fill, stroke) {
    fork(proto.geometrics, this) // FORKING
    this.id = (++ids).toString()
    this.x = x
    this.y = y
    this.v = v || []
    this.fill   = fill || "rgba(255, 255, 255, 0.3)"
    this.stroke = stroke || "rgba(255, 255, 255, 1)"
    this.rotation = 0
    this.speed    = { x:  0, y:  0 }
    this.maxSpeed = { x: 10, y: 10 }
    this.infiniteScope = null
    this.colliders = []
    // draw method
    this.draw = function(){
      if (this.infiniteScope) this.foreverInScope()  // if out of space
      if (this.speed.x || this.speed.y) this.repos() // add speed
      con.translate(this.x,this.y)
      if (this.rotation) con.rotate(this.rotation)   // rotate
      if (this.colliders.length) this.collide()      // collide
      // draw
      con.fillStyle   = this.fill
      con.strokeStyle = this.stroke
      con.beginPath()
      for (var i = 0, l = this.v.length; i < l; i++){
        if (i) con.lineTo(this.v[i][0], this.v[i][1])
        else   con.moveTo(this.v[i][0], this.v[i][1])
      }
      con.closePath()
      con.stroke()
      con.fill()
    }
  }

  // grad
  function grad(type, x1, y1, r1, x2, y2, r2) {
    var grad
    if (type == 'LINEAR') {
      grad = con.createLinealGradient(x1, y1, r1, x2)
    } else
    if (type == 'RADIAL') {
      grad = con.createRadialGradient(x1, y1, r1, x2, y2, r2)
    }
    grad.colors = proto.grad.colors
    return grad
  }


  // Initialization
  function init(id, width, height, clear) {
    draw_stack  = {}
    ids         = 0
    removed     = []
    this.can    = can = this.can || doc.getElementById(id || "canvas")
    this.con    = con = this.con || can.getContext("2d")
    var w       = getWindowSize()
    can.width   = width  || w.w
    can.height  = height || w.h
    // If there's no width or height, the user wants the canvas to take all the window,
    // for which the body must hide the overflow.
    if (!(width && height)) {
      doc.body.style.overflow = 'hidden'
      can.style.margin = "-8px -8px"
    }
    this.center = { x: w.w/2, y: w.h/2 }
    clear = clear !== undefined ? clear : "rgba(0, 0, 0, 1)"
    if (clear) Ink.draw(new Ink.Rect(0, 0, can.width, can.height, clear), 1)
    if (this.interval) clearInterval(this.interval)
    this.interval = setInterval(drawStack,this.frame)
  }

  // API
  var Ink = win.Ink = {
    VERSION : '0.3.13'
  , can     : null
  , con     : null
  , init    : init
  , draw    : draw
  , remove  : remove
  , fork    : fork
  , Path    : Path
  , Rect    : Rect
  , Circ    : Circ
  , grad    : grad
  , frame   : 31
  }

})()
