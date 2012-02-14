// Ink.js
// By Daniel R. (sadasant.com)
// License: http://opensource.org/licenses/mit-license.php
// Homepage: https://github.com/sadasant/Ink.js

(function () {

  // Environment settings
  //·--------------------

  var win  = this // window
    , doc  = document
    , M    = Math

  // Private Variables
  //·-----------------

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

  // Private Methods
  //·---------------

  // Getting the window size
  function getWindowSize() {
    return {
      w : win.innerWidth  || (doc.documentElement && doc.documentElement.offsetWidth ) || (doc.body && doc.body.offsetWidth ) || 630
    , h : win.innerHeight || (doc.documentElement && doc.documentElement.offsetHeight) || (doc.body && doc.body.offsetHeight) || 460
    }
  }

  // Looping through the stack of shapes
  function drawStack() {
    if (can && con) {
      for (var k in draw_stack) {
        if (draw_stack[k]) {
          con.save()
          draw_stack[k].draw()
          con.restore()
        }
      }
    }
  }

  // Public Methods
  //·---------------

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

  // Sort of inheritance
  function fork(from,to) {
    for (var k in from) {
      if (from.hasOwnProperty(k)) {
        to[k] = from[k]
      }
    }
  }

  // Main Shape Prototype
  function S() {}
  S.prototype = {
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
    , run: function(much, maxSpeed) {
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
    , onCollide: function() {
        this.fill   = "rgba(255, 0, 0, 0.3)"
        this.stroke = "rgba(255, 0, 0, 1)"
      }
    , collideArea: 15
    , collide: function() {
        var col = this.colliders
        for (var i = 0; i < col.length; i++) {
          if (col[i]) {
            var diffx = ABS(col[i].x - this.x)
              , diffy = ABS(col[i].y - this.y)
            if (diffx < this.collideArea && diffy < this.collideArea) {
              if (~removed.indexOf(col[i].id)) { // lame solution
                delete this.colliders[i]
              } else {
                this.onCollide(col[i])
              }
            }
          }
        }
      }
    //
  }

  // Rectangle
  function Rect(x, y, width, height, fill) {
    this.id = (++ids).toString()
    this.x        = x
    this.y        = y
    this.width    = width
    this.height   = height
    this.fill     = fill || "rgba(0, 0, 0, 0.2)"
    this.maxSpeed = { x: 10, y: 10 }
    this.draw = function(){
      con.fillStyle = this.fill
      con.fillRect(this.x, this.y, this.width, this.height)
    }
  }

  // Circle
  function Circle(x, y, r, fill, stroke) {
    fork(S.prototype,this) // FORKING
    this.id = (++ids).toString()
    this.x = x
    this.y = y
    this.r = r
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
    fork(S.prototype, this) // FORKING
    this.id = (++ids).toString()
    this.x = x
    this.y = y
    this.v = v || []
    this.fill   = fill   || "rgba(255, 255, 255, 0.3)"
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
      for (var i = 0; i < this.v.length; i++){
        if (i) con.lineTo(this.v[i][0], this.v[i][1])
        else   con.moveTo(this.v[i][0], this.v[i][1])
      }
      con.closePath()
      con.stroke()
      con.fill()
    }
  }

  // Triangle Path
  function Triangle(x, y, v, fill, stroke) {
    x = x
    y = y
    v = v || [[0,-10],[-10,0],[10,0]]
    fill   = fill   || "rgba(255, 255, 255, 0.3)"
    stroke = stroke || "rgba(255, 255, 255, 1)"
    return new Path(x,y,v,fill,stroke)
  }

  // start
  function start (s) {
    draw_stack  = {}
    ids         = 0
    removed     = []
    this.can    = can = this.can || doc.getElementById(s.id || "canvas")
    this.con    = con = this.con || can.getContext(s.d || "2d")
    var w       = getWindowSize()
    can.width   = s.width  || w.w
    can.height  = s.height || w.h
    this.center = { x: w.w/2, y: w.h/2 }
    var clear  = s.clear !== undefined ? s.clear : "rgba(0, 0, 0, 1)"
    if (clear) {
      Ink.draw(new Ink.Rect(0, 0, can.width, can.height, clear), 1)
    }
    if (this.interval) clearInterval(this.interval)
    this.interval = setInterval(drawStack,this.frame)
  }

  // API
  //·---

  var Ink = win.Ink = {
    VERSION  : '0.0.5'
  , canvas   : null
  , context  : null
  , start    : start
  , draw     : draw
  , remove   : remove
  , fork     : fork
  , Path     : Path
  , Rect     : Rect
  , Triangle : Triangle
  , Circle   : Circle
  , frame    : 31
  }

})()
