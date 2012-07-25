// Ink.js
// By Daniel R. (sadasant.com)
// License: http://opensource.org/licenses/mit-license.php
// Homepage: https://github.com/sadasant/Ink.js

~function (W, D, M, U) {

  // Private Variables
  var draw_stack = {}   // Stack of shapes
    , ids        = 0    // Current last id of shapes
    , removed    = {}   // Shapes' graveyard
    , can               // Inner Canvas holder
    , con               // Inner Context holder
    , dcan              // Document's Canvas holder
    , dcon              // Document's Context holder
    , reqAF             // Request Animation Frame
    , windowSize        // Window size object
    , started           // Started Flag
    , busy              // Busy Flag

  // Math variables
  var PI180 = M.PI/180
    , PI2   = M.PI*2
    , COS   = M.cos
    , SIN   = M.sin
    , ABS   = M.abs


  // Request Animation Frame
  // Based on code by Paul Irish
  reqAF = function() {
    return W.requestAnimationFrame
        || W.webkitRequestAnimationFrame
        || W.mozRequestAnimationFrame
        || W.oRequestAnimationFrame
        || W.msRequestAnimationFrame
        || function(f) { W.setTimeout(f, 1000 / 60) }
  }().bind(W)


  // Getting the window size
  windowSize = function() {
    return {
      w : W.innerWidth  || (D.documentElement && D.documentElement.offsetWidth ) || (D.body && D.body.offsetWidth ) || 630
    , h : W.innerHeight || (D.documentElement && D.documentElement.offsetHeight) || (D.body && D.body.offsetHeight) || 460
    }
  }()


  // Looping through the stack of shapes
  function drawStack() {
    if (busy) return reqAF(drawStack)
    reqAF(drawStack)
    var k
    for (k in draw_stack) {
      if (draw_stack[k]) {
        con.save()
        draw_stack[k].draw()
        con.restore()
      }
    }
    dcon.drawImage(can, 0, 0)
  }


  // Insert in the stack of shapes
  function draw(obj) {
    draw_stack[obj.id] = obj
  }


  // Move the shape to the graveyard
  function remove(obj) {
    if (obj) {
      removed[obj.id] = true
      delete draw_stack[obj.id]
    }
  }


  // Prototypes' holder
  var Main = {
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
          , i = 0
          , l = col.length
          , diffx
          , diffy
        for (; i !== l; i+=1) {
          if (coli = col[i]) {
            diffx = ABS(coli.x - this.x)
            diffy = ABS(coli.y - this.y)
            if (diffx < this.collideArea && diffy < this.collideArea) {
              if (removed[coli.id]) {
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
        var i = 0
          , l = colors.length
        for (; i !== l; i+=1) {
          var c = colors[i]
          this.addColorStop(c[0], c[1])
        }
        return this
      }
    }
  }


  // Rectangle
  function Rect(x, y, width, height, fill, stroke) {
    var s = Object.create(Main.geometrics)
    s.id = (ids+=1).toString()
    s.x = x
    s.y = y
    s.width = width
    s.height = height
    s.fill   = fill   || "rgba(0, 0, 0, 0.2)"
    s.stroke = stroke || "rgba(0, 0, 0, 0.2)"
    s.rotation = 0
    s.speed    = { x:  0, y:  0 }
    s.maxSpeed = { x: 10, y: 10 }
    s.infiniteScope = null
    s.colliders = []
    s.afterDraw = undefined
    // draw method
    s.draw = Rect_draw
    return s // this
  }
  function Rect_draw() {
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


  // Circle
  function Circ(x, y, r, fill, stroke) {
    var s = Object.create(Main.geometrics)
    s.id = (ids+=1).toString()
    s.x = x || 0
    s.y = y || 0
    s.r = r || 0
    s.fill   = fill || "rgba(255, 255, 255, 0.3)"
    s.stroke = stroke || "rgba(255, 255, 255, 1)"
    s.rotation = 0
    s.speed    = { x:  0, y:  0 }
    s.maxSpeed = { x: 10, y: 10 }
    s.infiniteScope = null
    s.colliders = []
    // draw method
    s.draw = Circ_draw
    return s // this
  }
  function Circ_draw() {
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


  // Path
  function Path(x, y, v, fill, stroke) {
    var s = Object.create(Main.geometrics)
    s.id = (ids+=1).toString()
    s.x = x
    s.y = y
    s.v = v || []
    s.fill   = fill || "rgba(255, 255, 255, 0.3)"
    s.stroke = stroke || "rgba(255, 255, 255, 1)"
    // TODO: lineWidth
    s.rotation = 0
    s.speed    = { x:  0, y:  0 }
    s.maxSpeed = { x: 10, y: 10 }
    s.infiniteScope = null
    s.colliders = []
    // draw method
    s.draw = Path_draw
    return s // this
  }
  function Path_draw() {
    if (this.infiniteScope) this.foreverInScope()  // if out of space
    if (this.speed.x || this.speed.y) this.repos() // add speed
    con.translate(this.x,this.y)
    if (this.rotation) con.rotate(this.rotation)   // rotate
    if (this.colliders.length) this.collide()      // collide
    // draw
    con.fillStyle   = this.fill
    con.strokeStyle = this.stroke
    con.beginPath()
    var i = 0
      , l = this.v.length
      , vi
    for (; i !== l; i+=1){
      vi = this.v[i]
      if (i) con.lineTo(vi[0], vi[1])
      else   con.moveTo(vi[0], vi[1])
      if (vi.length === 6) {
        con.quadraticCurveTo(vi[2], vi[3], vi[4], vi[5])
      }
    }
    con.closePath()
    con.stroke()
    con.fill()
  }

  // grad
  function grad(type, x1, y1, r1, x2, y2, r2) {
    var grad
    if (type === 'LINEAR') {
      grad = con.createLinearGradient(x1, y1, r1, x2)
    } else
    if (type === 'RADIAL') {
      grad = con.createRadialGradient(x1, y1, r1, x2, y2, r2)
    }
    grad.colors = Main.grad.colors
    return grad
  }

  function doneInit() {
    busy = false
    if (!started) {
      started = true
      drawStack()
    }
  }

  // Initialization
  function init(id, width, height, clear) {
    busy        = true
    draw_stack  = {}
    ids         = 0
    removed     = {}
    this.dcan   = dcan = this.dcan || D.getElementById(id || 'canvas')
    this.dcon   = dcon = this.dcon || dcan.getContext('2d')
    this.can    = can  = this.can  || D.createElement('canvas')
    this.con    = con  = this.con  || can.getContext('2d')
    can.height  = dcan.height = height || windowSize.h
    can.width   = dcan.width  = width  || windowSize.w
    // If there's no width or height, the user wants the canvas to take all the window,
    // for which the body must hide the overflow.
    if (!(width && height)) {
      D.body.style.overflow = 'hidden'
      dcan.style.margin = '-8px -8px'
    }
    this.center = { x: windowSize.w/2, y: windowSize.h/2 }
    clear       = clear !== undefined ? clear : 'rgba(0, 0, 0, 1)'
    if (clear) Ink.draw(new Ink.Rect(0, 0, can.width, can.height, clear), 1)
    return setTimeout(doneInit, this.frame << 2)
  }

  // API
  var Ink = W.Ink = {
    VERSION : '0.3.13'
  , can     : null
  , con     : null
  , init    : init
  , draw    : draw
  , remove  : remove
  , Path    : Path
  , Rect    : Rect
  , Circ    : Circ
  , grad    : grad
  , frame   : 31
  , reqAF   : reqAF
  }

}(window, document, Math)
