//I am kmh0228 , QQ:1150123276

//插件说明

//             |************|
//             |*U1**U2**U3*|
//             |************|
//             |*U4**U5**U6*|
//             |************|
//             |*U7**U8**U9*|
//             |************|
// ************|************|************|************
// *L1**L2**L3*|*F1**F2**F3*|*R1**R2**R3*|*B1**B2**B3*
// ************|************|************|************
// *L4**L5**L6*|*F4**F5**F6*|*R4**R5**R6*|*B4**B5**B6*
// ************|************|************|************
// *L7**L8**L9*|*F7**F8**F9*|*R7**R8**R9*|*B7**B8**B9*
// ************|************|************|************
//             |************|
//             |*D1**D2**D3*|
//             |************|
//             |*D4**D5**D6*|
//             |************|
//             |*D7**D8**D9*|
//             |************|
/*
该插件使用的是面向对象，纯原生插件，使用时需要new出来一个对象
例如 var cube=new Cube(id,opts);
//opts参数：
opts:{
	borderLength:num 魔方边长, 默认240px
	vColor:color，魔方材料颜色 ,默认#999
	colors:[[][][][][][]]，魔方各个面的颜色，默认正常魔方的颜色
	order:num 魔方阶乘 ,默认3阶
	mouseSen 拖拽时鼠标灵敏度 , 默认0.5
	oneTime 转动一下时需要的毫秒时间，默认500
	oneTimeBatch 批量扭动时转动一下所需要的时间 默认200
}

此对象的方法： （如上建立魔方后，也是静态的魔方，想要扭动他必须调用方法）
常用：
turn(coor,num,dir,comebackfn);//基础的扭动方法,参数coor：扭动那个轴方向的魔方，num：扭动这个轴的第几层的魔方，dir：方向,正方向turn 反方向false，combackfn:扭动完成后的回掉函数
turn3(t);//仅限于3阶魔方的扭动，t可为 u,u',b,b'……(三阶魔方的指令，'是反方向的意思);
turn3s(ts);//仅限于3阶魔方,ts是三阶魔方指令的组合。例如 var ts='uu\'bb\'lr\'f';注意字符串中的'要转义
initColor();//初始化魔方最开始的样子。步数同步清零
initL();//初始化魔方旋转的角度
getFoots();//返回当前已经扭的步数
random(n);//随机打乱魔方，n为随机打乱的步数。默认30步

不常用：
delColor();//干掉颜色。只剩材料颜色
setColor(colors);//自己设定颜色,colors为2维数组
setMouseSen(n);//设置鼠标拖拽魔方的灵敏度
setOneTime(time);//设置魔方扭动速度- 毫秒时间。
*/


//参数  id为魔方容器的id，opts为魔方的属性设置
//opts  > borderLength:num 魔方边长, vColor:color魔方材料颜色 , colors:[[][][][][][]]魔方各个面的颜色  order:num 魔方阶乘 , mouseSen 拖拽时鼠标灵敏度 , oneTime 转动一下时需要的时间
var colorType = ['yellow', 'orange', 'green', 'white', 'red', 'blue'];
var colorTypePos = ['U', 'R', 'F', 'D', 'L', 'B'];
var cubePos = '';

function Cube(id, opts) {
    //储存Cube信息
    this.container = document.getElementById(id);//容器
    this.opts = opts || {};//所有信息
    this.order = this.opts.order || 3;//设定魔方阶乘，默认是三阶
    this.borderLength = this.opts.borderLength || 240;//容器边长，默认240
    this.boxBorderLength = parseInt(this.borderLength / this.order / 2) * 2;//计算出每个块的边长
    this.borderLength = this.boxBorderLength * this.order;//重计算容器边长，避免小数点误差
    this.vColor = this.opts.vColor || '#999';//设定魔方材料颜色，默认是白色
    this.mouseSen = this.opts.mouseSen || 0.5;//默认鼠标灵敏度是1
    this.oneTime = this.opts.oneTime || 500;//转动一次的时间 毫秒
    this.oneTimeBatch = this.opts.oneTimeBatch || 200;//批量扭动时扭动一次的时长
    //置空容器
    this.container.innerHTML = '';

    //建立DOM结构
    this.boxsData = [];//存放魔方的每个小块 格式[{dom:dom,x:0,y:0,z:0,coorX:'x',coorY:'y',coorZ:'z',faces:[dom,dom..]},,]

    this.boxsDataLength = Math.pow(this.order, 3);
    for (var i = 0; i < this.boxsDataLength; i++) {
        var boxs = {};
        boxs.dom = document.createElement('div');//建立小块
        this.container.appendChild(boxs.dom);//将小块添加进去
        boxs.faces = [];//存放每个小块的6个面
        for (var j = 0; j < 6; j++) {
            var aDiv = document.createElement('div');//建立面
            boxs.dom.appendChild(aDiv);//将面添加进去
            boxs.faces.push(aDiv);//存储面
        }
        boxs.x = boxs.intx = i % this.order;
        boxs.y = boxs.inty = (parseInt(i / this.order)) % this.order;
        boxs.z = boxs.intz = (parseInt(i / Math.pow(this.order, 2))) % this.order;
        this.boxsData.push(boxs);//存储小块
//boxs.dom.innerHTML='('+i+')'+''+boxs.x+' '+boxs.y+' '+boxs.z;
    }

    //初始化容器大小和小块位置
    this.initStyle();
    //初始化各面颜色
    var colors = [];
    for (var k = 0; k < colorType.length; k++) {
        var color = [];
        color.push(colorType[k]);
        colors.push(color);
    }
    var temp = colors[3];
    colors[3] = colors[1];
    colors[1] = temp;
    temp = colors[4];
    colors[4] = colors[2];
    colors[2] = temp;
    this.initColors = this.opts.colors || colors;
    //this.initColors=this.opts.colors||[['none'],['none'],['none'],['none'],['none'],['none']];
    this.initColor();

    //给容器加旋转事件
    this.containerMouseMove();
    this.state = "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB";

}

//设置初始样式
Cube.prototype.initStyle = function () {
    //设置容器样式  宽高 相对定位 开启3D效果
    this.container.style.width = this.container.style.height = this.borderLength + 'px';
    this.container.style.positon = 'relative';
    this.container.style.WebkitTransformStyle = 'preserve-3d';
    this.container.style.WebkitTransform = 'perspective(800px) rotateZ(0deg) rotateY(0deg) rotateX(0deg)';
    //设置每个盒子的样式 宽高 固定定位到中间 边线  平移量
    for (var i = 0; i < this.boxsDataLength; i++) {
        this.boxsData[i].dom.style.position = 'absolute';
        this.boxsData[i].dom.style.width = this.boxsData[i].dom.style.height = this.boxsData[i].dom.style.left = this.boxsData[i].dom.style.top = this.boxBorderLength + 'px';
        //设置没个盒子偏移量
        var x = this.boxsData[i].translateX = (this.boxsData[i].x + 0.5 - (this.order / 2)) * this.boxBorderLength;
        var y = this.boxsData[i].translateY = (this.boxsData[i].y + 0.5 - (this.order / 2)) * this.boxBorderLength;
        var z = this.boxsData[i].translateZ = (this.boxsData[i].z + 0.5 - (this.order / 2)) * this.boxBorderLength;
        var rx = this.boxsData[i].rotateX = 0;
        var ry = this.boxsData[i].rotateY = 0;
        var rz = this.boxsData[i].rotateZ = 0;
        this.boxsData[i].dom.style.WebkitTransformStyle = 'preserve-3d';
        this.boxsData[i].dom.style.WebkitTransform = 'rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) rotateZ(' + rz + 'deg) translateZ(' + z + 'px) translate(' + x + 'px,' + y + 'px)';
        for (var j = 0; j < 6; j++) {
            //设置每个面的属性
            this.boxsData[i].faces[j].style.position = 'absolute';
            this.boxsData[i].faces[j].style.top = this.boxsData[i].faces[j].style.left = 0;
            this.boxsData[i].faces[j].style.width = this.boxsData[i].faces[j].style.height = '100%';
            this.boxsData[i].faces[j].style.border = '2px solid ' + this.vColor;//设置边线 默认2px
            this.boxsData[i].faces[j].style.boxSizing = 'border-box';//设置边线 属性
            this.boxsData[i].faces[j].style.background = this.vColor; //设置面的原始颜色 同材料颜色
            this.boxsData[i].faces[j].style.borderRadius = parseInt(this.boxBorderLength / 10) + 'px'; //设置面的圆角，默认每小块的1/10
            this.boxsData[i].faces[j].classList.add("selecteColor");
			this.boxsData[i].faces[j].id = i*6+j;
            //设置每个面的偏移量
            var tx = 0, ty = 0, tz = 0, rx = 0, ry = 0, rz = 0;
            switch (j) {
                case 0:
                    ty = -this.boxBorderLength / 2;
                    rx = 90;
                    break;
                case 1:
                    ty = this.boxBorderLength / 2;
                    rx = 90;
                    break;
                case 2:
                    tx = -this.boxBorderLength / 2;
                    ry = 90;
                    break;
                case 3:
                    tx = this.boxBorderLength / 2;
                    ry = 90;
                    break;
                case 4:
                    tz = this.boxBorderLength / 2;
                    break;
                case 5:
                    tz = -this.boxBorderLength / 2;
                    break;
            }
            var transformstyle = '';
            transformstyle += tx ? 'translateX(' + tx + 'px) ' : '';
            transformstyle += ty ? 'translateY(' + ty + 'px) ' : '';
            transformstyle += tz ? 'translateZ(' + tz + 'px) ' : '';
            transformstyle += rx ? 'rotateX(' + rx + 'deg) ' : '';
            transformstyle += ry ? 'rotateY(' + ry + 'deg) ' : '';
            transformstyle += rz ? 'rotateZ(' + rz + 'deg) ' : '';
            this.boxsData[i].faces[j].style.WebkitTransform = transformstyle;
        }

    }
};
//干掉魔方上所有颜色的方法，，只剩下材料颜色
Cube.prototype.delColor = function () {
    for (var i = 0; i < this.boxsDataLength; i++) {
        var doms = this.boxsData[i].faces;
        for (var j = 0; j < 6; j++) {
            doms[j].style.backgroundColor = this.vColor;
        }
    }
}
//设定魔方颜色设定 格式[[color,color,上面的9个点],[下],[]..]
Cube.prototype.setColor = function (colorarr) {
    var _this = this;
    this.delColor();
    this.colors = colorarr || (function () {
        var arr = [];
        for (var i = 0; i < _this.initColors.length; i++) {
            var subarr = _this.initColors[i].slice(0);
            arr.push(subarr);
        }
        return arr;
    })();
    //容错this.colors,如果每一个面只给一个颜色或少给颜色，按前一个颜色算;
    for (i = 0; i < +6; i++) {
        if (!this.colors[i]) {
            this.colors[i] = this.colors[i - 1];
        }
        for (var j = 0; j < Math.pow(this.order, 2); j++) {
            if (!this.colors[i][j]) {
                this.colors[i][j] = this.colors[i][j - 1]
            }
        }
    }
    var b = this.order - 1;
    var filter = [{y: 0}, {y: b}, {x: 0}, {x: b}, {z: b}, {z: 0}];
    //添加颜色
    // for (var i = 0; i < 6; i++) {
    //     var dom = this.getDomByPos(filter[i]);
    //     for (var j = 0; j < dom.length; j++) {
    //         dom[j].faces[i].style.background = this.colors[i][j];
    //     }
    // }
    for (var i = 0; i < 6; i++) {
        var dom = this.getDomByPos(filter[i]);
        for (var j = 0; j < dom.length; j++) {
            dom[j].faces[i].style.background = this.colors[i][j];
            dom[j].faces[i].setAttribute('pos', i + ',' + j);
            // dom[j].faces[i].onclick = function () {
            //     //console.log(this.getAttribute("pos"));
            //     cubePos = this.getAttribute("pos");
            //     $('#color-picker').css({
            //         'left': movex,
            //         'top': movey,
            //         'display': 'block'
            //     });
            // }
        }
    }
};


/**
 * 由于魔方绘制后的顺序和算法设定的颜色序列不一致，需要进行颜色序列的调整
 * 算法颜色转为魔方颜色 输入时调用
 * @param color
 * @returns {*}
 */
Cube.prototype.translateColor = function (color) {
    var right = color.substr(9, 9);
    var coorright = right[2] + right[5] + right[8] + right[1] + right[4] + right[7] + right[0] + right[3] + right[6];
    var temp = color.substr(0, 9) + coorright + color.substr(18, 36);
    color = temp;

    var bottom = color.substr(27, 9);
    var coorbottom = bottom[6] + bottom[7] + bottom[8] + bottom[3] + bottom[4] + bottom[5] + bottom[0] + bottom[1] + bottom[2];
    temp = color.substr(0, 27) + coorbottom + color.substr(36, 18);
    color = temp;

    var left = color.substr(36, 9);
    var coorleft = left[0] + left[3] + left[6] + left[1] + left[4] + left[7] + left[2] + left[5] + left[8];
    temp = color.substr(0, 36) + coorleft + color.substr(45, 9);
    color = temp;

    var back = color.substr(45, 9);
    var coorback = back[2] + back[1] + back[0] + back[5] + back[4] + back[3] + back[8] + back[7] + back[6];
    temp = color.substr(0, 45) + coorback;
    color = temp;

    temp = color.substr(0, 9) + color.substr(27, 18) + color.substr(9, 18) + color.substr(45, 9);
    color = temp;
    return color;
};

/**
 * 由于魔方绘制后的顺序和算法设定的颜色序列不一致，需要进行颜色序列的调整
 * 将魔方颜色转为算法颜色 输出时调用
 * @param color
 * @returns {*}
 */
Cube.prototype.translateCubeColor = function (color) {
    temp = color.substr(0, 9) + color.substr(27, 18) + color.substr(9, 18) + color.substr(45, 9);
    color = temp;

    var right = color.substr(9, 9);
    var coorright = right[6] + right[3] + right[0] + right[7] + right[4] + right[1] + right[8] + right[5] + right[2];
    var temp = color.substr(0, 9) + coorright + color.substr(18, 36);
    color = temp;

    var bottom = color.substr(27, 9);
    var coorbottom = bottom[6] + bottom[7] + bottom[8] + bottom[3] + bottom[4] + bottom[5] + bottom[0] + bottom[1] + bottom[2];
    temp = color.substr(0, 27) + coorbottom + color.substr(36, 18);
    color = temp;

    var left = color.substr(36, 9);
    var coorleft = left[0] + left[3] + left[6] + left[1] + left[4] + left[7] + left[2] + left[5] + left[8];
    temp = color.substr(0, 36) + coorleft + color.substr(45, 9);
    color = temp;

    var back = color.substr(45, 9);
    var coorback = back[2] + back[1] + back[0] + back[5] + back[4] + back[3] + back[8] + back[7] + back[6];
    temp = color.substr(0, 45) + coorback;
    color = temp;
    return color;
};

//设定魔方颜色设定 格式DRLUUBFBRBLURRLRUBLRDDFDLFUFUFFDBRDUBRUFLLFDDBFLUBLRBD
Cube.prototype.setColorChar = function (color) {
    this.state = color;
    var arr = [];
    color = this.translateColor(color);
    for (var i = 0; i < 6; i++) {
        var sub = color.substr(i * 9, 9);
        var subArr = [];
        for (var j = 0; j < 9; j++) {
            subArr.push(colorType[colorTypePos.indexOf(sub[j])]);
        }
        arr.push(subArr);
    }
    this.setColor(arr)
};


//初始化颜色
Cube.prototype.initColor = function () {
    this.foots = 0;
    this.setColor();
}
//通过坐标筛选boxsData; json格式 {x:num,y:num,z:num}  可省略条件
Cube.prototype.getDomByPos = function (filterJson) {
    var arr = [];
    var filterJson = filterJson || {};
    var x = /[\d+]/.test(filterJson.x) ? filterJson.x : 'all';
    var y = /[\d+]/.test(filterJson.y) ? filterJson.y : 'all';
    var z = /[\d+]/.test(filterJson.z) ? filterJson.z : 'all';
    for (var i = 0; i < this.boxsDataLength; i++) {
        if ((this.boxsData[i].x == x || x == 'all') && (this.boxsData[i].y == y || y == 'all') && (this.boxsData[i].z == z || z == 'all')) {
            arr.push(this.boxsData[i]);
        }
    }
    return arr;
};
//自己写的一个拖拽事件
Cube.prototype.drag = function (obj, fndown, fnmove, fnup) {
    if (!obj) return;
    if (arguments.length == 2) {
        var fnmove = fndown;
        fndown = null;
    }
    var mousedown = function (ev) {
        var oEvent = ev || event;
        var oldX = oEvent.clientX;
        var oldY = oEvent.clientY;
        fndown && fndown();
        var mousemove = function (ev) {
            var oEvent = ev || event;
            var newX = oEvent.clientX;
            var newY = oEvent.clientY;
            fnmove && fnmove(newX - oldX, newY - oldY);
            oldX = newX;
            oldY = newY;
        };
        document.addEventListener('mousemove', mousemove);

        var mouseup = function () {
            document.removeEventListener('mousemove', mousemove);
            document.removeEventListener('mousemove', mousemove);
            fnup && fnup();
            obj.releaseCapture && obj.releaseCapture();
        };
        document.addEventListener('mouseup', mouseup);
        obj.setCapture && obj.setCapture();
        ev.preventDefault();
    };
    obj.addEventListener('mousedown', mousedown);
};
//给容器加拖拽事件
Cube.prototype.containerMouseMove = function () {
    var _this = this;
    //默认状态为X,Y旋转0deg
    this.oldRotateX = this.rotateX = this.rotateX || 0;
    this.oldRotateY = this.rotateY = this.rotateX || 0;
    this.oldRotateZ = this.rotateZ = this.rotateZ || 0;

    var scale, scale2;

    this.drag(_this.container, function () {
    }, function (dx, dy) {
//		_this.oldRotateX=_this.rotateX;
//		_this.oldRotateY=_this.rotateY;
//		_this.oldRotateZ=_this.rotateZ;
        var dydeg = _this.rotateY % 360;
        if (dydeg < 0) {
            dydeg += 360;
        }
        if (dydeg > 180) {
            dydeg = 360 - dydeg;
        }
        scale = (90 - (dydeg)) / 90;
        var dydeg2 = _this.rotateY % 360;
        if (dydeg2 < 0) {
            dydeg2 += 360;
        }
        if (dydeg2 > 270) {
            dydeg2 = 540 - dydeg2;
        } else if (dydeg2 < 90) {
            dydeg2 = 180 - dydeg2;
        }
        scale2 = (180 - dydeg2) / 90;

        _this.rotateY += (dx * _this.mouseSen);
        _this.rotateX -= (dy * _this.mouseSen * scale);
        if (_this.rotateX > 45) {
            _this.rotateX = 45;
        } else if (_this.rotateX < -45) {
            _this.rotateX = -45;
        }
        _this.rotateZ -= (dy * _this.mouseSen * scale2);
        if (_this.rotateZ > 45) {
            _this.rotateZ = 45;
        } else if (_this.rotateZ < -45) {
            _this.rotateZ = -45;
        }
        _this.container.style.WebkitTransform = 'perspective(800px) rotateY(' + _this.rotateY + 'deg) rotateX(' + _this.rotateX + 'deg) rotateZ(' + _this.rotateZ + 'deg)';
    });
};
//初始化魔方位子
Cube.prototype.initL = function () {
    this.rotateX = 0;
    this.rotateY = 0;
    this.rotateZ = 0;
    this.container.style.WebkitTransform = 'perspective(800px) rotateY(' + this.rotateY + 'deg) rotateX(' + this.rotateX + 'deg) rotateZ(' + this.rotateZ + 'deg)';
};
//设置容器拖拽时候的鼠标灵敏度
Cube.prototype.setMouseSen = function (n) {
    this.mouseSen = n;
};

//某一面假定躺着的方向旋转90度后重新配色  for reSetColorByTurnEnd方法
Cube.prototype.trunRightColorChange = function (arr, n) {
    if (!arr) return;
    var n = n || 1;
    var cacheArr = [];
    var order = this.order;
    var length = arr.length;
    var cacheArr2 = arr.slice(0);
    for (var i = 0; i < n; i++) {
        cacheArr = cacheArr2.slice(0);
        for (var j = 0; j < length; j++) {
            var dj = (j % order) * order + order - 1 - parseInt(j / order);
            cacheArr2[j] = cacheArr[dj];
        }
    }
    return cacheArr2;
};

//某一面假定向上下反转 for reSetColorByTurnEnd方法
Cube.prototype.turnTabX = function (arr) {
    if (!arr) return;
    var cacheArr = arr.slice(0);
    var order = this.order;
    var length = arr.length;
    var cacheArr2 = [];
    for (var i = 0; i < length; i++) {
        var dj = (order - 1 - parseInt(i / order)) * order + (i % order);
        cacheArr2[i] = cacheArr[dj];
    }
    return cacheArr2;
};

Cube.prototype.turnTabY = function (arr) {
    if (!arr) return;
    var cacheArr = arr.slice(0);
    var order = this.order;
    var length = arr.length;
    var cacheArr2 = [];
    for (var i = 0; i < length; i++) {
        var dj = parseInt(i / order) * order + (order - 1 - i % order);
        cacheArr2[i] = cacheArr[dj];
    }
    return cacheArr2;
};

//拧后重新设定颜色，，for trun方法
Cube.prototype.reSetColorByTurnEnd = function (coor, num, dir) {
    var nums = [];
    var order = this.order;
    var Morder = order * order;
    var name = ['上', '下', '左', '右', '前', '后'];
    for (var i = 0; i < order; i++) {
        nums.push(i);
    }
    var color0 = this.colors[0].slice(0);
    var color1 = this.colors[1].slice(0);
    var color2 = this.colors[2].slice(0);
    var color3 = this.colors[3].slice(0);
    var color4 = this.colors[4].slice(0);
    var color5 = this.colors[5].slice(0);
    switch (coor) {
        case 'x':
            if (dir) {
                for (var i = 0; i < this.order; i++) {
                    var n = Number(num) + order * i;
                    this.colors[0][n] = color4[n];
                    this.colors[4][n] = this.turnTabX(color1)[n];
                    this.colors[1][n] = color5[n];
                    this.colors[5][n] = this.turnTabX(color0)[n];
                }
                //左转动
                if (num == 0) {
                    this.colors[2] = this.trunRightColorChange(this.colors[2], 3);
                }
                if (num == order - 1) {
                    this.colors[3] = this.trunRightColorChange(this.colors[3], 3);
                }
            } else {
                for (var i = 0; i < this.order; i++) {
                    var n = Number(num) + order * i;
                    this.colors[4][n] = color0[n];
                    this.colors[1][n] = this.turnTabX(color4)[n];
                    this.colors[5][n] = color1[n];
                    this.colors[0][n] = this.turnTabX(color5)[n];
                }
                //左转动
                if (num == 0) {
                    this.colors[2] = this.trunRightColorChange(this.colors[2], 1);
                }
                if (num == order - 1) {
                    this.colors[3] = this.trunRightColorChange(this.colors[3], 1);
                }
            }
            break;
        case 'y':
            if (dir) {
                for (var i = 0; i < this.order; i++) {
                    var m = Number(num) + order * i;
                    var n = Number(num) * order + i;
                    this.colors[4][n] = this.turnTabY(this.trunRightColorChange(color2, 3))[n];
                    this.colors[3][m] = this.trunRightColorChange(color4, 1)[m];
                    this.colors[5][n] = this.trunRightColorChange(this.turnTabY(color3), 1)[n];
                    this.colors[2][m] = this.trunRightColorChange(color5, 1)[m];
                }
                //上转动
                if (num == 0) {
                    this.colors[0] = this.trunRightColorChange(this.colors[0], 1);
                }
                //下转动
                if (num == order - 1) {
                    this.colors[1] = this.trunRightColorChange(this.colors[1], 1);
                }
            } else {
                for (var i = 0; i < this.order; i++) {
                    var n = Number(num) + order * i;
                    var m = Number(num) * order + i;
                    this.colors[2][n] = this.turnTabY(this.trunRightColorChange(color4, 3))[n];
                    this.colors[4][m] = this.trunRightColorChange(color3, 3)[m];
                    this.colors[3][n] = this.trunRightColorChange(this.turnTabY(color5), 1)[n];
                    this.colors[5][m] = this.trunRightColorChange(color2, 3)[m];
                }
                //上转动
                if (num == 0) {
                    this.colors[0] = this.trunRightColorChange(this.colors[0], 3);
                }
                //下转动
                if (num == order - 1) {
                    this.colors[1] = this.trunRightColorChange(this.colors[1], 3);
                }
            }
            break;
        case 'z':
            if (dir) {
                for (var i = 0; i < this.order; i++) {
                    var m = Number(num) * order + i;
                    ;
                    this.colors[0][m] = this.turnTabY(color2)[m];
                    this.colors[2][m] = color1[m];
                    this.colors[1][m] = this.turnTabY(color3)[m];
                    this.colors[3][m] = color0[m];
                }
                //后转动
                if (num == 0) {
                    this.colors[5] = this.trunRightColorChange(this.colors[5], 3);
                }
                //前转动
                if (num == order - 1) {
                    this.colors[4] = this.trunRightColorChange(this.colors[4], 3);
                }
            } else {
                for (var i = 0; i < this.order; i++) {
                    var m = Number(num) * order + i;
                    ;
                    this.colors[2][m] = this.turnTabY(color0)[m];
                    this.colors[1][m] = color2[m];
                    this.colors[3][m] = this.turnTabY(color1)[m];
                    this.colors[0][m] = color3[m];
                }
                //后转动
                if (num == 0) {
                    this.colors[5] = this.trunRightColorChange(this.colors[5], 1);
                }
                //前转动
                if (num == order - 1) {
                    this.colors[4] = this.trunRightColorChange(this.colors[4], 1);
                }
            }
            break;
    }
    this.setColor(this.colors);
};
//设置魔法拧动一次的时长 毫秒
Cube.prototype.setOneTime = function (n) {
    this.oneTime = n;
};
//设置魔方批量拧动时的一次时长 毫秒
Cube.prototype.setOneTimeBatch = function (n) {
    this.oneTimeBatch = n;
};


//设置魔方操作  参数 轴XYZ 第几排 顺/逆时针 旋转完成后
Cube.prototype.turn = function (coor, num, dir, fnComplete) {
    //阻止多次点击
    this.runing = this.runing || false;
    if (this.runing) return;
    var num = num || 0;
    if (num > this.order - 1) return;
    this.runing = true;
    if (dir == false) {
        var dir = false
    } else {
        var dir = true
    }
    //true代表正向
    //累计步数
    this.foots++;
    //找到操作的元素
    var filter = {};
    filter[coor] = num;
    var dom = this.seletDoms = this.getDomByPos(filter);
    //添加动作
    var n = 0;//记录转动完成的数
    var domLength = dom.length;
    var _this = this;

    function transend() {
        this.removeEventListener('transitionend', transend, false);
        this.style.transition = 'none';
        n++;
        if (n == domLength) {
            //全部旋转完成后
            //调整颜色
            _this.reSetColorByTurnEnd(coor, num, dir);
            //位置回归
            for (var i = 0; i < domLength; i++) {
                dom[i].dom.style.WebkitTransform = 'rotateZ(0deg) rotateY(0deg) rotateX(0deg)  translateZ(' + dom[i].translateZ + 'px) translate(' + dom[i].translateX + 'px,' + dom[i].translateY + 'px)';
            }
            _this.runing = false;
            fnComplete && fnComplete();
        }
    }

    for (var i = 0; i < domLength; i++) {
        dom[i].dom.style.transition = this.oneTime / 1000 + 's all ease';
        //改变ROTATE
        var drx = 0, dry = 0, drz = 0;//默认全部旋转的0度
        var dirNumber = dir ? 1 : -1;
        switch (coor) {
            case 'x':
                drx = 90 * dirNumber;
                break;
            case 'y':
                dry = 90 * dirNumber;
                break;
            case 'z':
                drz = 90 * dirNumber;
                break;
        }
        dom[i].dom.addEventListener('transitionend', transend, false);
        dom[i].dom.style.WebkitTransform = 'rotateZ(' + drz + 'deg) rotateY(' + dry + 'deg) rotateX(' + drx + 'deg)  translateZ(' + dom[i].translateZ + 'px) translate(' + dom[i].translateX + 'px,' + dom[i].translateY + 'px)';
    }
    this.changeState(this.getTurnType(coor, num, dir));
};

//设置3阶魔方的简易操作 type  为 u,d,l,r,f,b,u',d',l',r',f',b'
Cube.prototype.turn3 = function (type, fnComplete) {
    if (this.order != 3) return;
    var fnComplete = fnComplete || function () {
    };
    var json = {
        u: {'coor': 'y', num: 0, dir: false},
        u_: {'coor': 'y', num: 0, dir: true},
        d: {'coor': 'y', num: 2, dir: true},
        d_: {'coor': 'y', num: 2, dir: false},
        l: {'coor': 'x', num: 0, dir: false},
        l_: {'coor': 'x', num: 0, dir: true},
        r: {'coor': 'x', num: 2, dir: true},
        r_: {'coor': 'x', num: 2, dir: false},
        f: {'coor': 'z', num: 2, dir: true},
        f_: {'coor': 'z', num: 2, dir: false},
        b: {'coor': 'z', num: 0, dir: false},
        b_: {'coor': 'z', num: 0, dir: true}
    };

    var obj = json[type.replace('\'', '_')];
    obj && this.turn(obj.coor, obj.num, obj.dir, fnComplete);
};

//设置三阶魔方的批量操作 type 例如 uu'rr'bb'
Cube.prototype.turn3s = function (type, fnComplete) {
    var type = type.replace(' ', '');
    var arr = type.match(/\w\'?/g);
    var length = arr.length;
    var now = 0;
    var _this = this;
    var time = this.oneTime;
    this.oneTime = this.oneTimeBatch;

    function dg() {
        _this.turn3(arr[now], function () {
            now++;
            if (now < length) {
                var timeout = setTimeout(function () {
                    clearTimeout(timeout);
                    dg();
                }, 0);
            } else {
                _this.oneTime = time;
                fnComplete && fnComplete();
            }
        });
    }

    if (length > 0) {
        dg();
    }
};

Cube.prototype.recoveryTurn = function (move) {
    var steps = move.toString().split(" ");
    var turns = "";
    for (var i = 0; i < steps.length; i++) {
        var step = steps[i];
        if (step[1] == "2") {
            turns += (step[0] + step[0])
        } else {
            turns += step
        }
    }
    turns = turns.toLowerCase();
    this.turn3s(turns);
};

Cube.prototype.getFoots = function () {
    return this.foots;
};

//获取两个整数数之间的随机整数数 包含a，不包含b  for random方法
Cube.prototype.getRandom = function (a, b) {
    return parseInt(a + Math.random() * (b - a));
};

//随机打乱的方法，参数为随机打乱的步数。默认30
Cube.prototype.random = function (n) {
    this.initColor();
    this.state = "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB";
    var _this = this;
    var n = n || 30;
    var i = 0;
    var speed = this.oneTime;
    var order = this.order;
    var coors = ['x', 'y', 'z'];
    var level = [0, 2];
    var linshi = parseInt(1000 / n);
    this.oneTime = 200;

    function turn_random() {
        i++;
        if (i > n) {
            _this.oneTime = speed;
        } else {
            var coor = coors[_this.getRandom(0, 3)];
            var num = level[_this.getRandom(0, 2)];
            var dir = _this.getRandom(0, 2);
            console.log(i);
            var type = _this.getTurnType(coor, num, dir);
            _this.turn(coor, num, dir, function () {
                var timeout = setTimeout(function () {
                    clearTimeout(timeout);
                    turn_random();
                }, 0);
            })
        }
    }

    turn_random();
};

/**
 * 判断魔方当前旋转方式
 * @param coor
 * @param num
 * @param dir
 * @returns {string}
 */
Cube.prototype.getTurnType = function (coor, num, dir) {
    switch (coor) {
        case "y":
            if (num == 0) {
                return dir ? "u_" : "u";
            } else if (num == 2) {
                return dir ? "d" : "d_";
            }
            break;
        case "x":
            if (num == 0) {
                return dir ? "l_" : "l";
            } else if (num == 2) {
                return dir ? "r" : "r_";
            }
            break;
        case "z":
            if (num == 2) {
                return dir ? "f" : "f_";
            } else if (num == 0) {
                return dir ? "b_" : "b";
            }
            break;
    }
};


/**
 * 根据旋转状态，改变当前魔方状态
 * @param turnType
 */
Cube.prototype.changeState = function (turnType) {
    var temp = this.state;
    var U = temp.substr(0, 9);
    var R = temp.substr(9, 9);
    var F = temp.substr(18, 9);
    var D = temp.substr(27, 9);
    var L = temp.substr(36, 9);
    var B = temp.substr(45, 9);
    switch (turnType) {
        case "u":
            var u = U[6] + U[3] + U[0] + U[7] + U[4] + U[1] + U[8] + U[5] + U[2];
            var r = B.substr(0, 3) + R.substr(3, 6);
            var f = R.substr(0, 3) + F.substr(3, 6);
            var l = F.substr(0, 3) + L.substr(3, 6);
            var b = L.substr(0, 3) + B.substr(3, 6);
            this.state = u + r + f + D + l + b;
            break;
        case "u_":
            var u = U[2] + U[5] + U[8] + U[1] + U[4] + U[7] + U[0] + U[3] + U[6];
            var r = F.substr(0, 3) + R.substr(3, 6);
            var f = L.substr(0, 3) + F.substr(3, 6);
            var l = B.substr(0, 3) + L.substr(3, 6);
            var b = R.substr(0, 3) + B.substr(3, 6);
            this.state = u + r + f + D + l + b;
            break;
        case "d":
            var d = D[6] + D[3] + D[0] + D[7] + D[4] + D[1] + D[8] + D[5] + D[2];
            var r = R.substr(0, 6) + F.substr(6, 3);
            var f = F.substr(0, 6) + L.substr(6, 3);
            var l = L.substr(0, 6) + B.substr(6, 3);
            var b = B.substr(0, 6) + R.substr(6, 3);
            this.state = U + r + f + d + l + b;
            break;
        case "d_":
            var d = D[2] + D[5] + D[8] + D[1] + D[4] + D[7] + D[0] + D[3] + D[6];
            var r = R.substr(0, 6) + B.substr(6, 3);
            var f = F.substr(0, 6) + R.substr(6, 3);
            var l = L.substr(0, 6) + F.substr(6, 3);
            var b = B.substr(0, 6) + L.substr(6, 3);
            this.state = U + r + f + d + l + b;
            break;
        case "l":
            var l = L[6] + L[3] + L[0] + L[7] + L[4] + L[1] + L[8] + L[5] + L[2];
            var b = B[0] + B[1] + D[6] + B[3] + B[4] + D[3] + B[6] + B[7] + D[0];
            var u = B[8] + U[1] + U[2] + B[5] + U[4] + U[5] + B[2] + U[7] + U[8];
            var f = U[0] + F[1] + F[2] + U[3] + F[4] + F[5] + U[6] + F[7] + F[8];
            var d = F[0] + D[1] + D[2] + F[3] + D[4] + D[5] + F[6] + D[7] + D[8];
            this.state = u + R + f + d + l + b;
            break;
        case "l_":
            var l = L[2] + L[5] + L[8] + L[1] + L[4] + L[7] + L[0] + L[3] + L[6];
            var b = B[0] + B[1] + U[6] + B[3] + B[4] + U[3] + B[6] + B[7] + U[0];
            var u = F[0] + U[1] + U[2] + F[3] + U[4] + U[5] + F[6] + U[7] + U[8];
            var f = D[0] + F[1] + F[2] + D[3] + F[4] + F[5] + D[6] + F[7] + F[8];
            var d = B[8] + D[1] + D[2] + B[5] + D[4] + D[5] + B[2] + D[7] + D[8];
            this.state = u + R + f + d + l + b;
            break;
        case "r":
            var r = R[6] + R[3] + R[0] + R[7] + R[4] + R[1] + R[8] + R[5] + R[2];
            var b = U[8] + B[1] + B[2] + U[5] + B[4] + B[5] + U[2] + B[7] + B[8];
            var u = U[0] + U[1] + F[2] + U[3] + U[4] + F[5] + U[6] + U[7] + F[8];
            var f = F[0] + F[1] + D[2] + F[3] + F[4] + D[5] + F[6] + F[7] + D[8];
            var d = D[0] + D[1] + B[6] + D[3] + D[4] + B[3] + D[6] + D[7] + B[0];
            this.state = u + r + f + d + L + b;
            break;
        case "r_":
            var r = R[2] + R[5] + R[8] + R[1] + R[4] + R[7] + R[0] + R[3] + R[6];
            var b = D[8] + B[1] + B[2] + D[5] + B[4] + B[5] + D[2] + B[7] + B[8];
            var u = U[0] + U[1] + B[6] + U[3] + U[4] + B[3] + U[6] + U[7] + B[0];
            var f = F[0] + F[1] + U[2] + F[3] + F[4] + U[5] + F[6] + F[7] + U[8];
            var d = D[0] + D[1] + F[2] + D[3] + D[4] + F[5] + D[6] + D[7] + F[8];
            this.state = u + r + f + d + L + b;
            break;
        case "f":
            var f = F[6] + F[3] + F[0] + F[7] + F[4] + F[1] + F[8] + F[5] + F[2];
            var u = U.substr(0, 6) + L[8] + L[5] + L[2];
            var r = U[6] + R[1] + R[2] + U[7] + R[4] + R[5] + U[8] + R[7] + R[8];
            var d = R[6] + R[3] + R[0] + D.substr(3, 6);
            var l = L[0] + L[1] + D[0] + L[3] + L[4] + D[1] + L[6] + L[7] + D[2];
            this.state = u + r + f + d + l + B;
            break;
        case "f_":
            var f = F[2] + F[5] + F[8] + F[1] + F[4] + F[7] + F[0] + F[3] + F[6];
            var u = U.substr(0, 6) + R[0] + R[3] + R[6];
            var r = D[2] + R[1] + R[2] + D[1] + R[4] + R[5] + D[0] + R[7] + R[8];
            var d = L[2] + L[5] + L[8] + D.substr(3, 6);
            var l = L[0] + L[1] + U[8] + L[3] + L[4] + U[7] + L[6] + L[7] + U[6];
            this.state = u + r + f + d + l + B;
            break;
        case "b":
            var b = B[6] + B[3] + B[0] + B[7] + B[4] + B[1] + B[8] + B[5] + B[2];
            var u = R[2] + R[5] + R[8] + U.substr(3, 6);
            var r = R[0] + R[1] + D[8] + R[3] + R[4] + D[7] + R[6] + R[7] + D[6];
            var d = D.substr(0, 6) + L[0] + L[3] + L[6];
            var l = U[2] + L[1] + L[2] + U[1] + L[4] + L[5] + U[0] + L[7] + L[8];
            this.state = u + r + F + d + l + b;
            break;
        case "b_":
            var b = B[2] + B[5] + B[8] + B[1] + B[4] + B[7] + B[0] + B[3] + B[6];
            var u = L[6] + L[3] + L[0] + U.substr(3, 6);
            var r = R[0] + R[1] + U[0] + R[3] + R[4] + U[1] + R[6] + R[7] + U[2];
            var d = D.substr(0, 6) + R[8] + R[5] + R[2];
            var l = D[6] + L[1] + L[2] + D[7] + L[4] + L[5] + D[8] + L[7] + L[8];
            this.state = u + r + F + d + l + b;
            break;
    }
};


/**
 * 识别魔方当前状态，更新state
 * @returns {Array}
 */
Cube.prototype.getAndRefreshColor = function () {
    var cubeStatus = "";
    for (var i = 0; i < 6; i++) {
        var surface = "";
        for (var j = 0; j < 9; j++) {
            var pos = "[pos='" + i + ',' + j + "']";
            var color = $(pos)[0].style['background'];
            surface = surface + (colorTypePos[colorType.indexOf(color)]);
        }
        cubeStatus = cubeStatus + surface;
    }
    var color = this.translateCubeColor(cubeStatus);
    this.state = color;
    this.setColorChar(color);
    return color;
};

