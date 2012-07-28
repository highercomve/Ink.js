# Ink.js TODOS
==============

- **Clear background per animation, per figure:**
    Clearing the background of a full resolution canvas
    gets harder as the resolution is wider; the solution
    is to carefully clear the box in which each object is drawn.

    _Possible issues:_

    -   Does this have to be made before drawing all the pieces? I think yes.
    -   Optional per piece or an option once Ink.js is initialized? (I think the second method is the wiser, but I could be wrong)

