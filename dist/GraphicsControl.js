/*
(The MIT License)

Copyright (c) 2017 Tahir Duran

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject
to the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

function GraphicsControl (canvasID){
	this.canvasID = canvasID;
	this.canvas = document.getElementById(canvasID);
	this.context = this.canvas.getContext("2d");

	this.allObjects = [];
	this.controlPoints = [];
	this.stroke = true;
	this.fill = false;
	this.bpath = 1;
	this.cpath = false;

	this.Draw = function (){
		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.allObjects.forEach(function(ob) {
			if(ob.properties.bpath === 1 || ob.properties.bpath === 2)
				this.context.beginPath();
			ob.Draw();
			if(ob.properties.cpath)
				this.context.closePath();
			if(ob.properties.stroke)
				this.context.stroke();
			if(ob.properties.fill){
				this.context.fill();
			}
		}.bind(this));
	};
	this.BeginStroke = function (){
		this.stroke = true;
	};
	this.EndStroke = function (){
		this.stroke = false;
	};
	this.BeginFill = function(fstyle){
		if(fstyle !== null)
			this.context.fillStyle = fstyle;
		this.fill = true;
	};
	this.EndFill = function(){
		this.fill = false;
	};
	this.BeginPath = function (){
		this.bpath = 2;
	};
	this.EndPath = function (){
		this.bpath = 1;
		this.allObjects[this.allObjects.length - 1].properties.cpath = true;
		this.Draw();
	};
	this.LayerRefresh = function (objects){
		if(!Array.isArray(objects))
			objects = [objects];
		for(var x = 0;x<objects.length;x++){
			for(var i = 0;i<this.allObjects.length;i++){
				if(this.allObjects[i] === objects[x]){
					this.allObjects.splice(i,1);
					this.allObjects.push(objects[x]);
				}
			}
		}
		this.Draw();
	};

	this.AddControlPoint = function (Px, Py){
		var c = new ControlPoint(this,Px,Py);
		c.visible = true;
		c.control = true;
		this.controlPoints.push(c);
		this.allObjects.push(c);
		this.Draw();
		return this.allObjects[this.allObjects.length - 1];
	};
	this.AddLine = function (P1, P2, P3, P4){
		var l;
		if(P1.type === "ControlPoint")
			l = new Line(this, [P1, P2]);
		else
			l = new Line(this, [new ControlPoint(this, P1, P2), new ControlPoint(this, P3, P4)]);
		this.allObjects.push(l);
		this.Draw();
		return this.allObjects[this.allObjects.length - 1];
	};
	this.AddBezier = function (P1, P2, P3, P4, P5, P6, P7, P8){
		var b;
		if(Array.isArray(P1))
			b = new Bezier(this, P1);
		else if(P1.type === "ControlPoint")
			b = new Bezier(this, [P1, P2, P3, P4]);
		else
			b = new Bezier(this, [new ControlPoint(this, P1, P2), new ControlPoint(this, P3, P4), new ControlPoint(this, P5, P6), new ControlPoint(this, P7, P8)]);
		this.allObjects.push(b);
		this.Draw();
		return this.allObjects[this.allObjects.length - 1];
	};
    this.AddQuadCurve = function (P1, P2, P3, P4, P5, P6){
        var b;
        if(Array.isArray(P1))
            b = new QuadCurve(this, P1);
        else if(P1.type === "ControlPoint")
            b = new QuadCurve(this, [P1, P2, P3]);
        else
            b = new QuadCurve(this, [new ControlPoint(this, P1, P2), new ControlPoint(this, P3, P4), new ControlPoint(this, P5, P6)]);
        this.allObjects.push(b);
        this.Draw();
        return this.allObjects[this.allObjects.length - 1];
    };
	this.AddRect = function (P1, P2, P3, P4){
		var b;
		if(P1.type === "ControlPoint")
			b = new Rect(this, [P1, P2]);
		else
			b = new Rect(this, [new ControlPoint(this, P1, P2), new ControlPoint(this, P3, P4)]);
		this.allObjects.push(b);
		this.Draw();
		return this.allObjects[this.allObjects.length - 1];
	};
	this.AddPolygon = function (Ps){
		var p;
		if(Ps[0].type === "ControlPoint")
			p = new Polygon(this, Ps);
		else{
			var ar = [];
			var s = 0;
			for(var i = 0;i < Ps.length;i+=2){
				ar[s] = new ControlPoint(this, Ps[i], Ps[i + 1]);
				s++;
			}
			p = new Polygon(this, ar);
		}
		this.allObjects.push(p);
		this.Draw();
		return this.allObjects[this.allObjects.length - 1];
	};
	this.AddArc = function (P1, P2, P3, P4, P5){
		var b;
		var cp;
		var cpr;
		if(P1.type === "ControlPoint"){
			cp = P1;
			P5 = P4; P4 = P3; P3 = P2;
		}else
			cp = new ControlPoint(this, P1, P2);

		if(P3.type === "ControlPoint")
			cpr = P3;
		else{
			var drcr = PointMath.Add([cp.x,cp.y], PointMath.Direction([0,0],[1, 0], P3));
			cpr = new ControlPoint(this, drcr[0], drcr[1]);
		}
		cpr.AddParent(cp);
			b = new Arc(this, [cp, cpr], P4, P5);
		this.allObjects.push(b);
		this.Draw();
		return this.allObjects[this.allObjects.length - 1];
	};
	this.AddText = function (P1, P2, P3){
		var t;
		if(P1.type === "ControlPoint")
			t = new Text(this, [P1], P2);
		else
			t = new Text(this, [new ControlPoint(this, P1, P2)],P3);
		this.allObjects.push(t);
		this.Draw();
		return this.allObjects[this.allObjects.length - 1];
	};

	//Objects
    /**@this {Object}*/
	function ControlPoint(cn, P1, P2){
		this.cn = cn;
		this.type = "ControlPoint";
		this.visible = false;
		this.control = false;
		this.directionLimit = [0,0];
		this.positionLimit = [null,null,null,null];
		this.directionLimitParent = true;
		this.positionLimitParent = true;
		this.x = P1;
		this.y = P2;
		this.scale = 5;
		this.connectedInputX = null;
		this.connectedInputY = null;
		this.parent = null;
		this.children = [];
		this.properties = new Properties(cn);
		this.canvasProperties = new CanvasProperties(cn);
		this.Draw = function() {
			if(this.visible){
				this.canvasProperties.SetProperties();
				cn.context.arc(this.x, this.y, this.scale, 0, 2 * Math.PI, false);
			}
		};
		this.ConnectInputX = function(input){
			if(input === null){
				this.connectedInputX.removeEventListener("change", this.connectedInputEvent.bind(this));
				this.connectedInputX.removeEventListener('keyup', this.connectedInputEvent.bind(this));
				this.connectedInputX.removeEventListener('input', this.connectedInputEvent.bind(this));
				this.connectedInputX = null;
			}else{
				this.connectedInputX = document.getElementById(input);
				this.connectedInputX.addEventListener('change', this.connectedInputEvent.bind(this), false);
				this.connectedInputX.addEventListener('keyup', this.connectedInputEvent.bind(this), false);
				this.connectedInputX.addEventListener('input', this.connectedInputEvent.bind(this), false);
				this.connectedInputX.value = this.x;
			}
		};
		this.ConnectInputY = function(input){
			if(input === null){
				this.connectedInputY.removeEventListener("change", this.connectedInputEvent.bind(this));
				this.connectedInputY.removeEventListener('keyup', this.connectedInputEvent.bind(this));
				this.connectedInputY.removeEventListener('input', this.connectedInputEvent.bind(this));
				this.connectedInputY = null;
			}else{
				this.connectedInputY = document.getElementById(input);
				this.connectedInputY.addEventListener('change', this.connectedInputEvent.bind(this), false);
				this.connectedInputY.addEventListener('keyup', this.connectedInputEvent.bind(this), false);
				this.connectedInputY.addEventListener('input', this.connectedInputEvent.bind(this), false);
				this.connectedInputY.value = this.y;
			}
		};
		this.connectedInputEvent = function(){
			if(this.control)
				this.Move(Number(this.connectedInputX.value), Number(this.connectedInputY.value));
		};
		this.Move = function(p1,p2,withoutDraw){
			var bpos = [this.x,this.y];
			if(this.directionLimit[0] === 0 && this.directionLimit[1] === 0){
				this.x = p1;
				this.y = p2;
			}else{
				var deg = PointMath.Angle([0,0], this.directionLimit);
				var deltadeg = PointMath.Rotate([0,0], [p1 - this.x, p2 - this.y], -deg);
				var delta = PointMath.Rotate([0,0], [deltadeg[0],0], deg);
				this.x += delta[0];
				this.y += delta[1];
			}
			if(this.positionLimit[0] !== null) this.x = Math.max(this.positionLimit[0], this.x);
			if(this.positionLimit[1] !== null) this.y = Math.max(this.positionLimit[1], this.y);
			if(this.positionLimit[2] !== null) this.x = Math.min(this.positionLimit[2], this.x);
			if(this.positionLimit[3] !== null) this.y = Math.min(this.positionLimit[3], this.y);

			var fdel = PointMath.Sub([this.x,this.y], bpos);
			for(var i = 0;i<this.children.length; i++){
				var bdrclimit = this.children[i].directionLimit;
				if(this.children[i].directionLimitParent)
					this.children[i].directionLimit = [0,0];

				if(this.children[i].positionLimitParent){
					var plm = this.children[i].positionLimit;
					if(plm[0] !== null) this.children[i].positionLimit[0] = plm[0] + fdel[0];
					if(plm[1] !== null) this.children[i].positionLimit[1] = plm[1] + fdel[1];
					if(plm[2] !== null) this.children[i].positionLimit[2] = plm[2] + fdel[0];
					if(plm[3] !== null) this.children[i].positionLimit[3] = plm[3] + fdel[1];
				}
				this.children[i].Move(this.children[i].x + fdel[0],this.children[i].y + fdel[1],true);

				this.children[i].directionLimit = bdrclimit;
			}
			for(i = 0;i<moveEventList.length; i++)
				moveEventList[i](this,fdel);

			if(this.connectedInputX!==null)
				this.connectedInputX.value = this.x;
			if(this.connectedInputY!==null)
				this.connectedInputY.value = this.y;
				if(withoutDraw === null)
					this.cn.Draw();
		};
		this.DirectionLimit = function(p1,p2){
			if(p1 === null)
				this.directionLimit = [0,0];
			else
				this.directionLimit = [p1,p2];
		};
		this.PositionLimit = function(p1,p2,p3,p4){
			if(p1 === null)
				this.positionLimit = [null,null,null,null];
			else
				this.positionLimit = [p1,p2,p3,p4];
		};
		this.DirectPositionLimit = function(p1,p2){
			if(p1 === null)
				this.positionLimit = [null,null,null,null];
			else{
				var deg = PointMath.Angle([0,0], this.directionLimit);
				var dlm1 = PointMath.Rotate([0,0], [p1,0], deg);
				var dlm2 = PointMath.Rotate([0,0], [p2,0], deg);
				this.positionLimit = [this.x + Math.min(dlm1[0], dlm2[0]), this.y + Math.min(dlm1[1], dlm2[1]), this.x + Math.max(dlm1[0], dlm2[0]), this.y + Math.max(dlm1[1], dlm2[1])];
			}
		};
		this.AddParent = function(CP){
			if(CP === null){
				if(this.parent !== null){
					for(var i=0;i<this.parent.children.length; i++)
						if(this.parent.children[i] === this)
							this.parent.children.splice(i, 1);
					this.parent = null;
				}
			}else{

				this.parent = CP;
				CP.children.push(this);
			}
		};
		var moveEventList = [];
		this.on = function(evnt, fnc){
			if(evnt === "move")
				moveEventList.push(fnc);
		};
		this.off = function(evnt, fnc){
			if(evnt === "move"){
				for(var i=0;i<moveEventList.length; i++)
					if(moveEventList[i] === fnc)
						moveEventList.splice(i,1);
			}
		}
	}
    /**@this {Object}*/
	function Line(cn, cPs){
		this.cn = cn;
		this.type = "Line";
		this.points = cPs;
		this.properties = new Properties(cn);
		this.canvasProperties = new CanvasProperties(cn);
		this.Draw = function() {
			this.canvasProperties.SetProperties();
			cn.context.lineTo(this.points[0].x, this.points[0].y);
			cn.context.lineTo(this.points[1].x, this.points[1].y);
		};
	}
    /**@this {Object}*/
	function Bezier(cn, cPs){
		this.cn = cn;
		this.type = "Bezier";
		this.points = cPs;
		this.properties = new Properties(cn);
		this.canvasProperties = new CanvasProperties(cn);
		this.Draw = function() {
			this.canvasProperties.SetProperties();
			cn.context.lineTo(this.points[0].x, this.points[0].y);
			for(var i = 1; i < this.points.length;i+=3)
				cn.context.bezierCurveTo(this.points[i].x, this.points[i].y, this.points[i+1].x, this.points[i+1].y, this.points[i+2].x, this.points[i+2].y);
		};
	}
    /**@this {Object}*/
    function QuadCurve(cn, cPs){
        this.cn = cn;
        this.type = "Bezier";
        this.points = cPs;
        this.properties = new Properties(cn);
        this.canvasProperties = new CanvasProperties(cn);
        this.Draw = function() {
            this.canvasProperties.SetProperties();
            cn.context.lineTo(this.points[0].x, this.points[0].y);
            for(var i = 1; i < this.points.length;i+=2)
                cn.context.quadraticCurveTo(this.points[i].x, this.points[i].y, this.points[i+1].x, this.points[i+1].y);
        };
    }
    /**@this {Object}*/
	function Rect(cn, cPs){
		this.cn = cn;
		this.type = "Rectangle";
		this.points = cPs;
		this.properties = new Properties(cn);
		this.canvasProperties = new CanvasProperties(cn);
		this.Draw = function() {
			this.canvasProperties.SetProperties();
			cn.context.rect(this.points[0].x, this.points[0].y, this.points[1].x - this.points[0].x, this.points[1].y - this.points[0].y);
		}
	}
    /**@this {Object}*/
	function Polygon(cn, cPs){
		this.cn = cn;
		this.type = "Polygon";
		this.points = cPs;
		this.properties = new Properties(cn);
		this.canvasProperties = new CanvasProperties(cn);
		this.Draw = function() {
			this.canvasProperties.SetProperties();
			for(var i = 0; i < this.points.length;i++)
				cn.context.lineTo(this.points[i].x,this.points[i].y);
			cn.context.closePath();
		}
	}
    /**@this {Object}*/
	function Arc(cn, cPs, sA, eA){
		this.cn = cn;
		this.type = "Arc";
		this.points = cPs;
		this.sAngle = sA;
		this.eAngle = eA;
		this.properties = new Properties(cn);
		this.canvasProperties = new CanvasProperties(cn);
		this.Draw = function() {
			this.canvasProperties.SetProperties();
			var ang = PointMath.ToRad(PointMath.Angle([this.points[0].x, this.points[0].y], [this.points[1].x, this.points[1].y]));
			var dis = PointMath.Distance([this.points[0].x, this.points[0].y], [this.points[1].x, this.points[1].y]);
			cn.context.arc(this.points[0].x, this.points[0].y, dis, this.sAngle * (2* Math.PI) + ang, this.eAngle * (2* Math.PI) + ang, false);
		}
	}
    /**@this {Object}*/
	function Text(cn, cPs, text){
		this.cn = cn;
		this.type = "Text";
		this.points = cPs;
		this.text = text;
		this.properties = new Properties(cn);
		this.canvasProperties = new CanvasProperties(cn);
		this.Draw = function() {
			this.canvasProperties.SetProperties();
			// if(this.properties.stroke)
			// 	cn.context.strokeText(this.text,this.points[0].x, this.points[0].y);
			if(this.properties.fill)
				cn.context.fillText(this.text,this.points[0].x, this.points[0].y);
		}
	}
    /**@this {Object}*/
	function Properties(cn){
		this.stroke = cn.stroke;
		this.fill = cn.fill;
		this.bpath = cn.bpath;
		this.cpath = cn.cpath;
		if(cn.bpath === 2)
			cn.bpath = 0;
	}
	function CanvasProperties(cn){
		this.fillStyle = cn.context.fillStyle;
		this.strokeStyle = cn.context.strokeStyle;
		this.shadowColor = cn.context.shadowColor;
		this.shadowBlur = cn.context.shadowBlur;
		this.shadowOffsetX = cn.context.shadowOffsetX;
		this.shadowOffsetY = cn.context.shadowOffsetY;
		this.lineCap = cn.context.lineCap;
		this.lineJoin = cn.context.lineJoin;
		this.lineWidth = cn.context.lineWidth;
		this.miterLimit = cn.context.miterLimit;
		this.font = cn.context.font;
		this.textAlign = cn.context.textAlign;
		this.textBaseline = cn.context.textBaseline;
		this.width = cn.context.width;
		this.height = cn.context.height;
		this.data = cn.context.data;
		this.globalAlpha = cn.context.globalAlpha;
		this.globalCompositeOperation = cn.context.globalCompositeOperation;
		this.currentTransform = cn.context.currentTransform;
		this.SetProperties = function() {
			cn.context.fillStyle = this.fillStyle;
			cn.context.strokeStyle = this.strokeStyle;
			cn.context.shadowColor = this.shadowColor;
			cn.context.shadowBlur = this.shadowBlur;
			cn.context.shadowOffsetX = this.shadowOffsetX;
			cn.context.shadowOffsetY = this.shadowOffsetY;
			cn.context.lineCap = this.lineCap;
			cn.context.lineJoin = this.lineJoin;
			cn.context.lineWidth = this.lineWidth;
			cn.context.miterLimit = this.miterLimit;
			cn.context.font = this.font;
			cn.context.textAlign = this.textAlign;
			cn.context.textBaseline = this.textBaseline;
			cn.context.width = this.width;
			cn.context.height = this.height;
			cn.context.data = this.data;
			cn.context.globalAlpha = this.globalAlpha;
			cn.context.globalCompositeOperation = this.globalCompositeOperation;
			cn.context.currentTransform = this.currentTransform;
		};
	}

	//Mouse
	var selectObject = null;
	var mouseDownPos = null;
	var mouseDownSelectPos = null;
	this.canvas.addEventListener('mousedown', MouseDownEvent.bind(this), false);
	document.addEventListener('mousemove', MouseMoveEvent.bind(this), false);
	document.addEventListener('mouseup', MouseUpEvent.bind(this), false);
	document.addEventListener('mouseup', MouseUpEvent.bind(this), false);
	this.canvas.addEventListener('mouseover', MouseOverEvent.bind(this), false);
	this.canvas.addEventListener('mouseout', MouseOutEvent.bind(this), false);
	CanvasOnResize( this.canvas, CanvasResizeEvent.bind(this) );

	this.MousePos = function (evt){
		var rect = this.canvas.getBoundingClientRect();
		return [evt.clientX - rect.left, evt.clientY - rect.top];
	};
    /**@this {Object}*/
	function MouseDownEvent(evt){
		var m = this.MousePos(evt);

		this.controlPoints.forEach(function(cp) {
			if (m[0] > cp.x - cp.scale && m[0] < cp.x + cp.scale &&
				 m[1] > cp.y - cp.scale && m[1] < cp.y + cp.scale &&
				 selectObject === null &&
				 cp.control) {
				selectObject = cp;
			}
		}.bind(this));

		if(mouseDownPos === null){
			mouseDownPos = m;
			if(selectObject !== null)
				mouseDownSelectPos = [selectObject.x, selectObject.y];
		}
	}
	function MouseUpEvent(){
		mouseDownPos = null;
		selectObject = null;
		mouseDownSelectPos = null;
		//document.onselectstart = function (){return true};
	}
    /**@this {Object}*/
	function MouseMoveEvent(evt){
		var m = this.MousePos(evt);
		if(mouseDownPos !== null){
			if(selectObject !== null){
				if(selectObject.control){
					selectObject.Move(mouseDownSelectPos[0] + m[0] - mouseDownPos[0], mouseDownSelectPos[1] + m[1] - mouseDownPos[1]);
					this.Draw();
				}
			}
		}
	}
	function MouseOverEvent(evt){
		//document.onselectstart = function (){return false};
	}
	function MouseOutEvent(evt){
		//if(mouseDownPos === null)
			//document.onselectstart = function (){return true};
	}
    /**@this {Object}*/
	function CanvasResizeEvent(){
	  this.Draw();
	}
	function CanvasOnResize(element, callback ){
		var elementHeight = element.height,
			elementWidth = element.width;
		setInterval(function(){
			if( element.height !== elementHeight || element.width !== elementWidth ){
				elementHeight = element.height;
				elementWidth = element.width;
				callback();
			}
		}, 300);
	}
}

//PointMath
function PointMath() {
}
PointMath.Direction = function (p1, p2, v){
	var dis = PointMath.Distance(p1, p2);
	var s = PointMath.Lerp([0,0], PointMath.Sub(p2,p1), v / dis);
	if (isNaN(s[0])) s[0] = 0;
	if (isNaN(s[1])) s[1] = 0;
	return s;
};
PointMath.Lerp = function (p1,p2,v){
	return PointMath.Add(p1 ,(PointMath.Mul(PointMath.Sub(p2, p1), v)));
};

/**
 * @return {number}
 */
PointMath.Distance = function (p1, p2){
	var xd = p1[0] - p2[0];
	var yd = p1[1] - p2[1];
	return Math.sqrt(xd * xd + yd * yd);
};
PointMath.Angle = function (p1, p2){
	var sc = PointMath.Direction(p1, p2, 1.0);
	var s;
	if (sc[1] < 0)
		s = 180.0 + (180.0 - Math.abs(PointMath.ToDeg(Math.acos(sc[0]))));
	else
		s = Math.abs(PointMath.ToDeg(Math.acos(sc[0])));
	if (isNaN(s)) s = 0;
	return s;
};


/**@return {number}*/
PointMath.AngleNormal = function (a){
	if (isNaN(a) || a === Infinity) a = 0;
	var ara = a / (Math.sign(a) * 360.0);
	ara = ara - parseInt(ara);
	var s;
	if (a > 0)
		s = 360.0 * ara;
	else
		s = 360.0 * (1.0-ara);
	if (s === 360 || isNaN(s))
		return 0;
	else
		return s;
};
/**@return {number}*/
PointMath.AngleNormal180 = function (a){
	var deg = PointMath.AngleNormal(a);
	if (deg > 180) deg = 180 - (deg - 180);
	return deg;
};
PointMath.Rotate = function (center, p, deg){
	var dis = PointMath.Distance(center, p);
	var fdeg = PointMath.Angle(center, p);
	var sc = [
		Math.sin(PointMath.ToRad(PointMath.AngleNormal(90 - fdeg - deg))),
		Math.cos(PointMath.ToRad(PointMath.AngleNormal(90 - fdeg - deg)))
	];
	return PointMath.Add(center ,PointMath.Direction([0,0], sc, dis));
};
PointMath.Add = function (p1,p2){
	return [p1[0] + p2[0], p1[1] + p2[1]];
};
PointMath.Sub = function (p1,p2){
	return [p1[0] - p2[0], p1[1] - p2[1]];
};
PointMath.Mul = function (p1,p2){
	if(Array.isArray(p2))
		return [p1[0] * p2[0], p1[1] * p2[1]];
	else
		return [p1[0] * p2, p1[1] * p2];
};
/**@return {number}*/
PointMath.ToDeg = function (angle){
	return angle * (180.0 / Math.PI);
};
/**@return {number}*/
PointMath.ToRad = function (angle){
	return Math.PI * angle / 180.0;
};
