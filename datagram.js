const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

let arrayOfCharts = [];
let titleCount = 1;
function initiateCharts(){
    let importData = () => {
	let xmlhttp = new XMLHttpRequest();
	let url = "chart_data.json";
	xmlhttp.responseType = 'json';
	xmlhttp.open('GET', url, true);
	xmlhttp.onload  = function() {
	    createCharts(xmlhttp.response);
	    putThemeButton();
	};
	xmlhttp.send(null);
    };
    let createCharts = (data) => {
	let title = 1;
	for (let i = 0; i < data.length; i++){
	    arrayOfCharts.push(new Chart(data[i], "Graph "+title));
	    title++;
	}
    };

    importData();
    
}
class Chart{
    // takes data upon creation
    constructor(data, title){
	this.data = data;
	this.title = title;

	this.convertData();
	this.createLayout();
	this.initialConfigure();
	this.drawNumbers();
	this.drawHorizontalLine();
	
	this.redraw("full");
	this.drawMinimap();

		
    }
    convertData(){
	// takes the passed data and converts into objects i can work with
	this.lines = [];
	let findArrayByName = (name) => {
	    // finds the corresponding array given the name and removes the first elem
	    for (let i in this.data.columns){
		if (this.data.columns[i][0] === name){
		    this.data.columns[i].splice(0, 1);
		    return this.data.columns[i];
		}
	    }
	};
	
	for (let key in this.data.names){
	    this.lines.push(
		{
		    name: key,
		    array: findArrayByName(key),
		    color: this.data.colors[key],
		    active: true,
		    checkboxName: this.data.names[key]
		}
	    );
	}
	
	// go through the data and find X
	this.x = [];
	for (let i in this.data.columns){
	    if (this.data.columns[i][0] === 'x'){
		this.x = this.data.columns[i];
	    }
	}
	this.x.splice(0, 1);

    }
    createLayout(){
	let createMainElements = () => {
	    // main div
	    this.div = document.createElement("div");
	    document.body.appendChild(this.div);
	    this.div.className = "main-container";
	    
	    // title
	    let title = document.createElement("h1");
	    this.div.appendChild(title);
	    title.innerHTML = this.title;
	    this.title = title;

	    //graph
	    this.graph = document.createElement("canvas");
	    this.div.appendChild(this.graph);
	    this.gCtx = this.graph.getContext("2d");
	    this.graph.width = innerWidth - parseInt(getComputedStyle(this.div).marginRight);
	    this.graph.height = innerHeight / 2;
	    this.graph.style.backgroundColor = "white";
	    this.graph.addEventListener("mousemove", this.tooltip.bind(this));
	    this.div.style.position = "relative";

	    // container for the minimap and the slider
	    this.miniDiv = document.createElement("div");
	    this.div.appendChild(this.miniDiv);
	    this.miniDiv.className = "minimap-div";
	    
	    this.minimap = document.createElement("canvas");
	    this.miniDiv.appendChild(this.minimap);
	    this.mCtx = this.minimap.getContext("2d");
	    this.minimap.width = innerWidth - (
		parseInt(getComputedStyle(this.miniDiv).marginLeft) +
		    parseInt(getComputedStyle(this.div).marginRight));
	    this.minimap.height = 75;
	    this.minimap.style.backgroundColor = this.graph.style.backgroundColor;
	    this.minimap.id = "minimap";

	};
	let createSlider = () => {
	    
	    this.lSpace = document.createElement("div");
	    this.lSpace.id = "left-space";

	    this.rSpace = document.createElement("div");
	    this.rSpace.id = "right-space";

	    this.slider = document.createElement("div");
	    this.slider.id = "slider";
	    
	    this.lSpace.style.height = this.minimap.height + "px";
	    this.slider.style.height = this.minimap.height - 6 + "px";
	    this.rSpace.style.height = this.minimap.height + "px";

	    this.lSpace.style.left = 0 + "px";
	    this.lSpace.style.width = innerWidth / 3 + "px";
	    
	    this.slider.style.left = parseInt(this.lSpace.style.left) +
	    	parseInt(this.lSpace.style.width) + "px";
	    this.slider.style.width = 200 + "px";

	    
	    this.rSpace.style.left = 
		parseInt(this.slider.style.left) +
	    	parseInt(this.slider.style.width) + 12 + "px";
	    
	    this.rSpace.style.width = this.minimap.width -
	    	parseInt(this.rSpace.style.left) + "px";
	    

	    this.miniDiv.appendChild(this.lSpace);
	    this.miniDiv.appendChild(this.slider);
	    this.miniDiv.appendChild(this.rSpace);
	    
	    let clrDiv = document.createElement("div");
	    this.miniDiv.appendChild(clrDiv);
	    clrDiv.style.clear = "both";


	    let boundMoveSlider = this.moveSlider.bind(this);
	    this.slider.addEventListener("mousedown", function(){
		let sliderRect = this.slider.getBoundingClientRect();
		
		if (window.event.clientX < sliderRect.left + 20){
		    this.movement = "left";
		} else if (window.event.clientX > sliderRect.left +
			   parseInt(getComputedStyle(this.slider).width) - 20){
		    this.movement = "right";
		} else {
		    this.movement = "mid";
		}
		
		window.addEventListener("mousemove", boundMoveSlider);
	    }.bind(this)
					     );
	    window.addEventListener("mouseup", function (){
		window.removeEventListener("mousemove", boundMoveSlider);
	    }.bind(this)
				   );
	    
	    // mobile touch options
	    this.slider.addEventListener("touchstart", function(){
		this.previousPosition = window.event.touches[0].clientX;
		let sliderRect = this.slider.getBoundingClientRect();
		
		if (window.event.touches[0].clientX < sliderRect.left + 20){
		    this.movement = "left";
		} else if (window.event.touches[0].clientX > sliderRect.left +
			   parseInt(getComputedStyle(this.slider).width) - 20){
		    this.movement = "right";
		} else {
		    this.movement = "mid";
		}
		
		window.addEventListener("touchmove", boundMoveSlider);
	    }.bind(this)
					     );
	    window.addEventListener("touchend", function (){
		window.removeEventListener("touchmove", boundMoveSlider);
	    }.bind(this)
				   );
	    
	    let cursorListener = () => {
		this.configureSlider();
		this.slider.addEventListener("mousemove", function (event){
		    if (event.clientX - this.sliderRect.left < 20){
			this.slider.style.cursor = "w-resize";
		    } else if (event.clientX > this.sliderRect.left + this.sliderWidth){
			this.slider.style.cursor = "e-resize";
		    } else {
			this.slider.style.cursor = "move";

		    }
		}.bind(this)
					    );
	    };

	    cursorListener(); 
	};
	let createButtons = () => {
	    for(let i = 0; i < this.lines.length; i++){
		let label = document.createElement("label");
		this.miniDiv.appendChild(label);
		label.className = "button-container";
		label.innerHTML = this.lines[i].checkboxName;
		
		let checkbox = document.createElement("input");
		checkbox.type = "checkbox";
		label.appendChild(checkbox);
		checkbox.checked = true;
		checkbox.addEventListener("click", function (){
		    if (checkbox.checked == false){
			this.justBeenRemoved = this.lines[i]["array"];
		    } else {
			this.justBeenSelected = this.lines[i]["array"];
		    }
			this.redraw("smooth");
			this.drawMinimap();
		}.bind(this));
		this.lines[i]["checkbox"] = checkbox;
		
		let span = document.createElement("span");
		label.appendChild(span);
		span.className = "checkmark";
		// assign the border as the color
		let color = this.lines[i]["color"];
		span.style.border = "2px solid " + color;
		span.style.backgroundColor = color;
		checkbox.addEventListener("change", function () {
		    if (this.checked){
			span.style.backgroundColor = color;
		    } else {
			span.style.backgroundColor = document.body.style.backgroundColor;
		    }
		});
		
	    }
	};
	let createTooltip = () => {
	    this.tooltip = document.createElement("div");
	    this.div.appendChild(this.tooltip);
	    this.tooltip.className = "myTooltip";
	    this.tooltip.style.backgroundColor = this.graph.style.backgroundColor;
	    
	};

	createMainElements();
	createSlider();
	createButtons();
	createTooltip();

	
    }
    // configuring the graph
    calculateCutout (){
	// converts current minimap coordinates into indeces of x array to be displayed
	let lPoint = parseInt(getComputedStyle(this.slider).left);
	let rPoint = lPoint + parseInt(getComputedStyle(this.slider).width);
	let mColumnWidth = this.minimap.width / this.x.length;
	this.beginning = Math.round(lPoint / mColumnWidth);
	this.end = Math.round(rPoint / mColumnWidth);
	
	this.columnWidth =
	    (this.graph.width / (this.end - this.beginning) * 10) / 10;
	    
	};
    initialConfigure(){
	this.numOfRows = 6; // how many numbers should be displayed on the left
	this.dateSpace = 23; // the space left to display the dates

	this.rowHeight = (this.graph.height - this.dateSpace) / this.numOfRows;
	
	// finds the maxmimum array value to scale the graph ceiling
	this.calculateCutout();
	this.configureCeiling();
	this.ySmoothJump = 0;
	this.smoothCounter = 0;
	this.numOfSmoothFrames = 20;
	this.opacity = 1;
	this.currentColumnCursor = undefined;

	

    }
    configureCeiling(){
	// finds the height of the grid considering the highest value in active arrays
	// based on beginning-end
	if (!this.isAnyArrayActive()){
	    this.ceiling = this.ceiling * 2;
	} else {
	    this.ceiling = this.findCeiling(this.lines.filter(
		(x) => {
		    return x["checkbox"].checked;
		}
	    ), "graph");
	}	
	this.rowStep = this.ceiling / this.numOfRows;
    }
    
    findCeiling(lines, canvas){
	// find the optimal ceiling for the graph (tries to find a round pretty number)
	let prettyNum = (max) =>{
	    // takes the biggest number from the set and defines the ceiling of the graph based on it
	    max *= 1.1; // make it a bit higher so there's some space above
	    let currentNumber = this.numOfRows;
	    let index = 0;
	    let prettyNum = currentNumber;
	    while (currentNumber < max / this.numOfRows){
		prettyNum = currentNumber;
		if (currentNumber.toString()[0] == ('5')) {
		    currentNumber *= 2;
		}else {
		    currentNumber *= 5;
		}
	    }
	    // rounding to the pretty number: divide by it, floor, *
	    let rounded = Math.ceil(max / prettyNum) * prettyNum;

	    return rounded;
	};
	
	// finds the biggest number among the passed array(s)
	// if it's the minimap - go throught all of the arrays

	//otherwise - from beginning to end
	let maxNum = 0;
	let beginning;
	let end;
	if (canvas == "minimap"){
	    beginning = 0;
	    end = this.x.length;
	} else {
	    beginning = this.beginning;
	    end = this.end;
	}
	
	for (let key in lines){
	    for (let i = beginning; i < end; i++){
		if (lines[key]["array"][i] > maxNum){
		    maxNum = lines[key]["array"][i];
		}
	    }
	}
	return prettyNum(maxNum);
    }
    drawGraph(mode){
	// if the coords have been changed:
	// based on the coordinates from the minimap slider - update X and reconfigure
	
	// iterate over all the active arrays and send them to drawLine
	let iteration = 0;
	for (let i in this.lines){
	    if (mode == "smooth" && this.lines[i]["array"] == this.justBeenRemoved){
		this.drawLine(this.lines[i]["array"], this.lines[i]["color"],
			      this.gCtx, "graph", i, mode);

	    }
	    if (this.lines[i]["checkbox"].checked == true){
		this.drawLine(this.lines[i]["array"], this.lines[i]["color"],
			      this.gCtx, "graph", iteration, mode);
		iteration += 1;

	    }
	    
	}

	let timeoutFunc = () => {

	    this.redraw("smooth");
	};
	if (mode == "smooth") {
	    this.smoothCounter -= 1;
	    this.ySmoothJump += this.ySmoothShift;
	    this.opacity -= (1 / this.numOfSmoothFrames);
	}
	if (mode == "smooth" && this.smoothCounter > 0) {
	    setTimeout(timeoutFunc.bind(this), 20); // animation
	} else if (mode == "smooth" && this.smoothCounter == 0) {
	    this.redraw("full");

	    this.justBeenRemoved = undefined;
	    this.justBeenSelected = undefined;
	    this.opacity = 1;
	    if (!this.isAnyArrayActive()){
	    }

	}

    }
    drawMinimap(){
	this.mCtx.clearRect(0, 0, this.minimap.width, this.minimap.height)
	this.minimap_ceiling = this.findCeiling(this.lines.filter(
	    (x) => {
		return x["checkbox"].checked;
	    }
	), "minimap");

	for (let i in this.lines){
		if(this.lines[i]["checkbox"].checked){
			this.drawLine(
				this.lines[i]["array"], this.lines[i]["color"],
				this.mCtx, "minimap");
		}

	}
    }
    
    drawLine(array, color, ctx, canvas, iteration=-1, mode="full"){
	// draws the line based on the passed arrays
	let x;
	let beginning;
	let end;
	let columnWidth;
	let xEnd = this.graph.width;
	if (mode == "full" || mode == "smooth"){
	    x = 0;
	    
	    // set start and end indeces for the graph and the minimap
	    if (canvas =="graph"){
		columnWidth = this.columnWidth;
		beginning = this.beginning;
		end = this.end;
	    } else {
		columnWidth = this.minimap.width / this.x.length;
		beginning = 0;
		end = this.x.length;
	    }
	} else if (mode == "partial"){
	    
	    columnWidth = this.columnWidth;
	    x = this.partialStartPx;
	    beginning = this.beginning + this.partialStartCol;
	    end = this.beginning + this.partialEndCol;
	    xEnd = this.partialEndPx;


	} 
	
	let drawLines = () =>{
	    let y = this.dateSpace - 21;
	    for (let i = 0; i < this.numOfRows; i++){
		ctx.moveTo(x, y);
		ctx.lineTo(xEnd, y);
		y += this.rowHeight;
	    }
	    ctx.globalAlpha = 0.5;
	    ctx.strokeStyle = "grey";
	    ctx.lineWidth = "1";
	    

	    ctx.stroke();
	    ctx.beginPath();
	    ctx.globalAlpha = 1;
	};
	ctx.beginPath();
	if (iteration == 0 && this.isAnyArrayActive()){
	    drawLines();
	    
	}
	ctx.strokeStyle = color;
	if (canvas == "graph"){
	    ctx.lineWidth = "4";
	} else {
	    ctx.lineWidth = "2";

	}


	

	// finds how many dates should be skipped to fit them all in a pretty way
	let dateSkipCounter = 0;
	let skipFactor;
	skipFactor = Math.floor(80 / columnWidth);

	let conversionQuotient;
	let convertedVal;
	ctx.fillStyle = "grey";
	ctx.font = "15px Helvetica";
	// drawing the lines
	for(let i = beginning; i <= end; i++){
	    if (canvas == "graph") {
		// finding the current position from current canvas parameters
		if (mode == "smooth"){
		    conversionQuotient = ((this.graph.height - this.dateSpace) /
					  this.oldCeiling * this.ySmoothJump);
		} else {
		    conversionQuotient = (this.graph.height - this.dateSpace) / this.ceiling;
		}
		if (mode == "smooth" && array === this.justBeenRemoved){
		    //conversionQuotient = ((this.graph.height - this.dateSpace) /
		//			  this.oldCeiling * this.ySmoothJump * this.numOfSmoothFrames);
		    
		    conversionQuotient *= this.flyTheHellAway;
		    this.flyTheHellAway += 3 / (this.rowHeight * this.numOfSmoothFrames);
		} else if (mode == "smooth" && array === this.justBeenSelected){
		    conversionQuotient = ((this.graph.height - this.dateSpace) /
					  this.oldCeiling  * this.flyJump);


		}
		
		convertedVal =
		    this.graph.height - array[i] * conversionQuotient
		    - this.dateSpace;
		// drawing dates
		if (iteration == 0 && dateSkipCounter == 0 && mode != "partial" &&
		    this.isAnyArrayActive()){
		    let date = new Date(this.x[i]);
		    date = MONTHS[date.getMonth()] + ' ' + date.getDate();
		    ctx.fillText(date, x, this.graph.height - 5);

		    // skipping some of them
		    dateSkipCounter = skipFactor;
		} else {
		    dateSkipCounter -= 1;
		}
 	    } else {
		conversionQuotient = this.minimap.height / this.minimap_ceiling;
		convertedVal = this.minimap.height - array[i] * conversionQuotient;		
	    }
	    
	    ctx.lineTo(x, convertedVal);
	    x += columnWidth;
	}
	if (mode == "smooth" && array === this.justBeenRemoved){
	    ctx.globalAlpha = this.opacity;
	} else if (mode == "smooth" && array === this.justBeenSelected){
	    this.flyJump += this.flyShift;
	    ctx.globalAlpha = 1 - this.opacity;

	}
	ctx.stroke();
	ctx.globalAlpha = 1;
	
    }

    redraw(mode="full"){
	if (typeof(mode) !== "string"){ // setting the mode checkbutton triggers
	    mode = "smooth";
	}
	if (mode != "smooth"){
	    
	    this.configureCeiling();
	    this.calculateCutout();

	} else if (this.smoothCounter == 0) {
	    this.oldCeiling = this.ceiling;
	    this.configureCeiling();
	    this.calculateCutout();

	    this.ceilRelationship = (1 / this.ceiling) * this.oldCeiling; //do i need this?
	    
	    this.smoothCounter = this.numOfSmoothFrames; //number of frames
	    
	    this.ySmoothJump = 1;
	    let difference =  this.ceilRelationship - this.ySmoothJump;
	    let distributedDifference = difference / this.numOfSmoothFrames;
	    
	    this.ySmoothShift = distributedDifference;
	    
	    // counter for removed arrays
	    this.flyTheHellAway = 1;
	    // fly-in animation
	    this.flyJump = 2; // should gradually approach the new ceiling
	    let flyRelationship = (1 / this.celing) * (this.oldceiling * 2); 
	    difference = this.ceilRelationship - this.flyJump;
	    distributedDifference = difference / this.numOfSmoothFrames;
	    this.flyShift = distributedDifference;
	    
	} 
	let numberSpace = 200; // the space for numbers on the left
	let numOfColumnsInSpace = Math.round(numberSpace / this.columnWidth);
	
	if (mode == "full"){
	    this.gCtx.clearRect(0, 0, this.graph.width, this.graph.height);
	    this.drawNumbers();
	    this.drawHorizontalLine();
	} else if (mode == "partial"){

	    // decide if i need to redraw numbers to avoid excessive redraw
	    if (this.currentColumnCursor < numOfColumnsInSpace+2){ 
		this.partialStartPx = 0;
		this.partialStartCol = 0;
		
	    }
	    this.gCtx.clearRect(this.partialStartPx, 0,
				this.partialEndPx - this.partialStartPx,
				this.graph.height -this.dateSpace);
	    if (this.currentColumnCursor < numOfColumnsInSpace+2){
		this.drawNumbers();
		
	    }
	} else if (mode == "smooth") {

	    this.gCtx.clearRect(0, 0, this.graph.width, this.graph.height);
	    this.drawNumbers();
	    this.drawHorizontalLine();
	    
	}
	
	this.drawGraph(mode);
	this.tooltip.style.opacity = "0";

	if (this.currentColumnCursor < numOfColumnsInSpace+2){
	    this.partialStartPx = this.partialStartPxPrevious;
	    //this.partialEndPx = this.partialEndPxPrevious;
	    this.partialStartCol = this.partialStartColPrevious;
	}
	
    }
    drawNumbers(){
	let drawNumbers = () =>{
	    // drawing the numbers on the left side
	    let y = this.graph.height - this.dateSpace;
	    let curNum = 0;

	    
	    this.gCtx.fillStyle = "grey";
	    this.gCtx.font = "14px Helvetica"; //font for the numbers
	    for (let i=0; i < this.numOfRows; i++){
		this.gCtx.fillText(curNum, this.minimap.getBoundingClientRect().left, y - 10);
		
		curNum += this.rowStep;
		y -= this.rowHeight;
	    }

	};
	if (this.isAnyArrayActive()){ //in case no array is selected
	    drawNumbers();
	    
	} else {
	    this.gCtx.globalAlpha = 1 - this.opacity;
	    this.gCtx.font = `80px sans-serif`;
	    this.gCtx.fillText("N/A", this.graph.width / 2 - 40, this.graph.height / 2);
	}
    }
    drawHorizontalLine(){ // above dates
	this.gCtx.beginPath();
	this.gCtx.strokeStyle = "grey";
	this.gCtx.moveTo(0, this.graph.height - this.dateSpace + 2);
	this.gCtx.lineTo(this.graph.width, this.graph.height - this.dateSpace + 2);
	this.gCtx.stroke();
    }
    moveSlider(event){
	event.preventDefault();
	
	let movementX;
	if (event.type === "touchmove"){ // check if on mobile
	    movementX = Math.round(event.touches[0].clientX - this.previousPosition);
	    this.previousPosition = event.touches[0].clientX;
	} else {
	    movementX = event.movementX;
	}
	
	let sliderStyle = getComputedStyle(this.slider);
	let lSpaceStyle = getComputedStyle(this.lSpace);
	let rSpaceStyle = getComputedStyle(this.rSpace);
	let border = parseInt(sliderStyle.borderRightWidth) * 2;


	let moveMiddle = () => {

	    this.lSpace.style.width = parseInt(lSpaceStyle.width) + movementX + "px";
	    
	    this.rSpace.style.left = parseInt(rSpaceStyle.left) + movementX + "px";
	    this.rSpace.style.width = parseInt(rSpaceStyle.width) - movementX + "px";
	    
	    this.slider.style.left = parseInt(sliderStyle.left) + movementX + "px";

		
	    if (parseInt(sliderStyle.left) < 0){
		
		this.lSpace.style.width = parseInt(sliderStyle.left) - border / 2 + "px";
		
		this.slider.style.left = parseInt(sliderStyle.left) - movementX + "px";
		this.rSpace.style.left = parseInt(rSpaceStyle.left) - movementX + "px";
		this.rSpace.style.width = parseInt(rSpaceStyle.width) + movementX + "px";

		
	    }
	    if ((parseInt(sliderStyle.left) + parseInt(sliderStyle.width)) >
		this.minimap.width - border){
		
		this.slider.style.left = parseInt(sliderStyle.left) - movementX + "px";

		this.lSpace.style.width = parseInt(lSpaceStyle.width) - movementX + "px";

		
		this.rSpace.style.left = parseInt(sliderStyle.left) +
		    parseInt(sliderStyle.width) + border  + "px";
		this.rSpace.style.width = this.minimap.width -
		    parseInt(this.rSpace.style.left) + "px";
		
		
	    }
	    
	};
	
	let moveLeft = () => {

	    this.lSpace.style.width = parseInt(lSpaceStyle.width) + movementX + "px";
	    
	    this.slider.style.left = parseInt(sliderStyle.left) + movementX + "px";
	    this.slider.style.width = parseInt(sliderStyle.width) - movementX + "px";


	    if (parseInt(sliderStyle.left) < 0){ // side of screen
		
		this.lSpace.style.width = parseInt(sliderStyle.left) - border / 2 + "px";
		
		this.slider.style.left = parseInt(sliderStyle.left) - movementX + "px";
		this.slider.style.width = parseInt(sliderStyle.width) + movementX + "px";
	    }
	    
	    if (parseInt(sliderStyle.width) < 150){
		
		this.lSpace.style.width = parseInt(lSpaceStyle.width) - movementX + "px";
		
		this.slider.style.left = parseInt(sliderStyle.left) - movementX + "px";
		this.slider.style.width = parseInt(sliderStyle.width) + movementX + "px";
	    }
	    
	};

	let moveRight = () => {
	    this.slider.style.width = parseInt(sliderStyle.width) + movementX + "px";
	    
	    this.rSpace.style.left = parseInt(rSpaceStyle.left) + movementX + "px";
	    this.rSpace.style.width = parseInt(rSpaceStyle.width) - movementX + "px";


	    if ((parseInt(sliderStyle.left) + parseInt(sliderStyle.width)) >
		this.minimap.width - border){
		
		this.slider.style.width = parseInt(sliderStyle.width) - movementX + "px";
		
		this.rSpace.style.left = parseInt(sliderStyle.left) +
		    parseInt(sliderStyle.width) + border + "px";
		this.rSpace.style.width = this.minimap.width -
		    parseInt(this.rSpace.style.left) + "px";
		
	    }

	    if (parseInt(sliderStyle.width) < 150){

		this.slider.style.width = parseInt(sliderStyle.width) - movementX + "px";
		
		this.rSpace.style.left = parseInt(rSpaceStyle.left) - movementX +  "px";
		this.rSpace.style.width = parseInt(rSpaceStyle.width) + movementX +  "px";
	    }
	};

	// checking mouse position on the button
	if (this.movement == "left"){
	    moveLeft();
	} else if (this.movement == "right"){
	    moveRight();
	} else {
	    moveMiddle();
	}
	    
	// apply all that shit
	this.redraw();
	// TODO recalculate the position of the
	this.configureSlider();
    }
    configureSlider(){
	this.sliderRect = this.slider.getBoundingClientRect();
	this.sliderWidth = parseInt(getComputedStyle(this.slider).width);
    }
    tooltip(event){
	// gets the current mouse position and prints the appropriate array values
	let cutoutSize = this.end - this.beginning;
	let columnWidth = this.graph.width / cutoutSize;
	let currentGraphColumn = Math.round(event.clientX / columnWidth);
	let currentXPos = currentGraphColumn * this.columnWidth;

	let currentArrayColumn = this.beginning + currentGraphColumn;

	let conversionQuotient = (this.graph.height - this.dateSpace) / this.ceiling;
	let convertedVal;
	let date;
	
	let displayTooltip = () => {
	    // displaying the tooltip

	    //change the contents of the tooltip

	    date = new Date(this.x[currentArrayColumn]);
	    date = DOW[date.getDay()] + ", " + MONTHS[date.getMonth()] + ' ' + date.getDate();
	    let color;
	    if (this.graph.style.backgroundColor == "white"){
		color = "black";
		this.tooltip.style.backgroundColor = "white";
	    } else {
		color = "white";
		this.tooltip.style.backgroundColor = "#1d2733";
		
	    }
	    this.tooltip.innerHTML = `<p style="color:${color};">${date}</p>`;

	    // show the tooltip at needed location

	    // on the right side, if no space - on the left side
	    this.tooltip.style.opacity = "1";
	    this.tooltip.style.left = currentXPos + 40 + "px";
	    this.tooltip.style.top = 70 + "px";
	    // if the width of the div is smaller than canvas-divleft
	    
	    let width = this.tooltip.clientWidth;

	    let left = this.tooltip.offsetLeft;
	    if (left > this.graph.width - width) {
		this.tooltip.style.left = currentXPos - (width + 75) + "px";
	    }

	};


	let drawCircles = () => {
	    // drawing the circles for each line based on its configuration
	    let number;
	    let name;
	    let style;
	    for (let i in this.lines){
		if (this.lines[i]["checkbox"].checked){
		    convertedVal =
			this.graph.height - this.lines[i]["array"][currentArrayColumn] *
			conversionQuotient - this.dateSpace;

		    
		    
		    this.gCtx.beginPath();
		    this.gCtx.arc(currentXPos, convertedVal,
				  10, 0, Math.PI * 2);
		    this.gCtx.fillStyle = this.graph.style.backgroundColor;
		    this.gCtx.strokeStyle = this.lines[i]["color"];
		    this.gCtx.fill();
		    this.gCtx.stroke();
		    this.gCtx.fillStyle = "black";

		    // get the date
		    number = this.lines[i]["array"][currentArrayColumn];
		    name = this.lines[i]["checkboxName"];
		    style = `float:left; margin: 10px; color: ${this.lines[i]["color"]}`;
		    this.tooltip.innerHTML +=
			`<div style="${style}"><p>${number}</p><p>${name}</></div>`;

		}
	    }

	};
	let drawHorizontalLine = () => {

	    this.gCtx.beginPath();
	    this.gCtx.moveTo(currentXPos, 0);
	    this.gCtx.lineTo(currentXPos, this.graph.height - this.dateSpace);

	    this.gCtx.lineWidth = "2";
	    this.gCtx.strokeStyle = "#777";
	    this.gCtx.stroke();
	};
	
	//check if i have shifted columns to know if i should redraw
	let start = 0;
	let end = 0;
	if (this.currentColumnCursor != currentGraphColumn && this.isAnyArrayActive()){
	    // change is negate or positive; +1
	    let clearFactor; // proportional to the size of the columns
	    // the bigger the columnsize - the smaller the number
	    clearFactor = Math.round(6 / ((this.columnWidth/80)*10));
	    if (clearFactor < 1){
		clearFactor = 1;
	    }

	    if (currentGraphColumn > this.currentColumnCursor){// RIGHT
		start = (this.currentColumnCursor - clearFactor) * columnWidth;
		end = (currentGraphColumn + clearFactor) * columnWidth;


		this.partialStartCol = this.currentColumnCursor - clearFactor;
		this.partialStartColPrevious = this.partialStartCol;
		this.partialEndCol = currentGraphColumn + clearFactor;
		this.partialStartPx = start;
		this.partialStartPxPrevious = this.partialStartPx;
		this.partialEndPx = end;
		
	    } else { // LEFT
		end = (this.currentColumnCursor + clearFactor) * this.columnWidth;
		start = (currentGraphColumn - clearFactor) * this.columnWidth;

		this.partialEndCol = this.currentColumnCursor + clearFactor;
		this.partialStartCol = currentGraphColumn - clearFactor;
		this.partialStartPx = start;
		this.partialEndPx = end;
		
	    }
	    
	    this.currentColumnCursor = currentGraphColumn;
	    
	    this.redraw("partial");
	    
	    displayTooltip();
	    drawHorizontalLine();
	    drawCircles();
	}
	
	
    }
	isAnyArrayActive(){
	    for (let i in this.lines){
		if (this.lines[i]["checkbox"].checked){
		    return true;
		};
	    }
	    return false;
	};
    
    
}



function switchTheme(){
    let color;
    if (getComputedStyle(document.body).backgroundColor == "rgb(255, 255, 255)"){
	color = "#1d2733";
    } else {
	color = "white";
    }

    document.body.style.backgroundColor = color;
    let chart;
    for (let i = 0; i < arrayOfCharts.length; i++){
    	chart = arrayOfCharts[i];
	chart.graph.style.backgroundColor = color;
	chart.minimap.style.backgroundColor = color;
	// change title color
	// tooltip color and 
	// buttoncolor when unchecked
	// redraw everything upon click
	if (color == "white"){
	    chart.div.style.color = "black";
	    themeButton.innerHTML = "Switch to Night Mode";
	} else {
	    chart.div.style.color = "white";
	    themeButton.innerHTML = "Switch to Day Mode";
	}
	chart.redraw();
	
	
    }
}
let themeButton;
function putThemeButton(){
    let buttonContainer = document.createElement("div");
    document.body.appendChild(buttonContainer);
    buttonContainer.id = "switch-container";
    
    themeButton = document.createElement("span");
    buttonContainer.appendChild(themeButton);
    // themeButton.type = "a";
    themeButton.id = "switch-button";
    themeButton.innerHTML = "Switch to Night Mode";
    themeButton.addEventListener("click", switchTheme);
}

function onResize(){
    // reset canvases (reconfigure their sizes) and redraw
    // add drawMinimap to redraw in this case
    let chart;
    for (let i = 0; i < arrayOfCharts.length; i++){
	chart = arrayOfCharts[i];
	
	chart.graph.width = innerWidth - parseInt(getComputedStyle(chart.div).marginRight);
	chart.graph.height = innerHeight / 2;
	chart.minimap.width = innerWidth - (
	    parseInt(getComputedStyle(chart.miniDiv).marginLeft) +
		parseInt(getComputedStyle(chart.div).marginRight));
	chart.minimap.height = 75;


	chart.lSpace.style.left = 0 + "px";
	chart.lSpace.style.width = 200 + "px";
	
	chart.slider.style.left = parseInt(chart.lSpace.style.left) +
	    parseInt(chart.lSpace.style.width) + "px";
	chart.slider.style.width = innerWidth / 3 + "px";
	
	chart.rSpace.style.left = 
	    parseInt(chart.slider.style.left) +
	    parseInt(chart.slider.style.width) + 12 + "px";
	
	chart.rSpace.style.width = chart.minimap.width -
	    parseInt(chart.rSpace.style.left) + "px";
	
	chart.drawMinimap();
	chart.redraw("full");

    }

}

initiateCharts();
window.addEventListener("resize", onResize);
