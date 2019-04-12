const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const NUMOFROWS = 6; // how many numbers should be displayed on the left
const DATESPACE = 23; // the space left to display the dates
const help = {
    round: function (number){
        // PARENTS: Chart.drawLine() drawText()
        return Math.round(number * 10) / 10;
    },
    calcXPositionOnCanvas: function() {
        // TODO implement this; uses xFactor and shit in both text, line and nums
        
    },
    daysInMonth: function(month, year) {
        return new Date(year, month, 0).getDate();
}};

const NIGHT = {
    lead: "#1d2733"
};
const DAY = {
    lead: "rgb(255, 255, 255)"
};


const SETTINGS = {
    // TODO add the configuration params here
    minmapHeight: 75,
    mainContainerWidth: innerWidth / 2,
    
    minSliderWidth: 100
};

const myMath = {
    // findPrettyMax: function (chart, xStart, xEnd){
    //     if(chart.constructor.name == "Chart" || chart.constructor.name == "lineChart"){
    //         ceiling = myMath.findPrettyMaxForLineChart(chart.lines, xStart, xEnd);
    //     } else if(chart.constructor.name == "barChart") {
    //         ceiling = myMath.findPrettyMaxForBarChart(chart.y, xStart, xEnd);
    //     } else if(chart.constructor.name == "stackedBarChart") {
    //         // uses the sum of all arrays to find initial max
    //         ceiling = myMath.findPrettyMaxForBarChart(chart.getSummedArray(), xStart, xEnd);
    //     } else if(chart.constructor.name == "line2YChart") {
    //         ceiling = myMath.findPrettyMaxForLineChart(chart.lines, xStart, xEnd);
    //     }
        
    //     return ceiling;
    // },
    // findPrettyMaxForLineChart: function (){
    // },
    // findPrettyMaxForBarChart: function(array, xStart, xEnd){
    // },
    findPrettyRoundNum: function(max){
        max *= 1.1; // make it a bit higher so there's some space above
        let currentNumber = NUMOFROWS;
        let index = 0;
        let prettyNum = currentNumber;
        while (currentNumber < max / NUMOFROWS){
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
    },
    findMaxInArray: function(array){
        return Math.max(...array);
    },

};




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




class DrawingParameters{
    constructor(ctx, xArray, yArray, color, yStartPoint, yEndPoint, xStartPoint, xEndPoint,
                xStart, xEnd, ceiling, oldCeiling, xOffset, columnsOnCanvas){
        this.ctx = ctx;
        this.xArray = xArray;
        this.yArray = yArray;
        this.color = color;
        this.yStartPoint = yStartPoint;
        this.yEndPoint = yEndPoint;
        this.xStartPoint = xStartPoint;
        this.xEndPoint = xEndPoint;
        this.xStart = xStart;
        this.xEnd = xEnd;
        this.ceiling = ceiling;
        this.oldCeiling = oldCeiling;
        this.xOffset = xOffset;
        this.columnsOnCanvas = columnsOnCanvas;
        
    }
}

class Chart{
    constructor(data, title){
        // global vars
        this.currentColumnCursor = null; // used to track which part of the info canv to redraw
        this.numOfVisibleGraphColumns = null; // used to calculate number of columns on the screen
        this.sliderOffset = null; //tracks diff between slider pos and closest column
        this.previousTouchPosition = null; // for tracking finger movement

        this.sliderColumnStart = null; // from slider; in calculateCutout()
        this.sliderColumnEnd = null;

        // dummies TODO
        this.lines = [];

        this.destructureData(data);
        this.createLayout(title);
        this.initialConfiguration();

        this.drawGraphOnMovement();
        this.drawMinimap();
        this.drawNumbers(this.graphDrawingParameters);
        // this.drawHorizontalLine();
        
    }
    destructureData(data){
        // takes the passed data and converts into objects i can easily work with
        let yArrays = [];
        for (let l = 1; l < data["columns"].length; l++){
            data["columns"][l].splice(0, 1);
            yArrays.push(data["columns"][l]);
        }
        for (let y = 0; y < yArrays.length; y++){
            this.lines.push(
                {
                    name: data.names[y],
                    array: yArrays[y],
                    color: data.colors["y" + y],
                    isActive: true,
                    checkboxName: data.names["y" + y]
                }
            );
        }

        this.x = [];
        this.x = data["columns"][0];
        this.x.splice(0, 1);

    }

    
    createLayout(title){
        this.createMainElements(title);
        this.createSlider();
        this.createButtons();
        this.createTooltip();
    }
    findPrettyMax(xStart, xEnd){
        //TODO findPrettyMax should take an array and return a max number

        // recursively call it for all the active arrays


        //find max THEN turn it into a pretty num
        let currentMax = 0;
        let slicedArray;
        let listOfArrays = this.lines;
        for (let i=0; i < listOfArrays.length; i++){
            if (listOfArrays[i].isActive){
                slicedArray = listOfArrays[i]["array"].slice(xStart, xEnd+1);
                currentMax = Math.max(myMath.findMaxInArray(slicedArray), currentMax);
            }
        }
        // turn into pretty
        return myMath.findPrettyRoundNum(currentMax);

    }
    initialConfiguration(){

        // finds the maxmimum array value to scale the graph ceiling
        this.calculateCutout();
        // configuring the initial ceiling so that the drawing func can check against it
        // TODO optimize this

        // old ceilings are needed to track changes in graph heights
        // graphCeiling is needed to dynamically stop animations
        let initialGraphCeiling = this.findPrettyMax(0, this.x.length); //TODO change to cutout size
        let initialMinimapCeiling = this.findPrettyMax(0, this.x.length);

        // configuring parameters for drawing
        this.graphDrawingParameters =
            new DrawingParameters(this.gCtx, this.x, null, null, 0, this.graph.height - DATESPACE,
                                  0, this.graph.width, null, null, initialGraphCeiling, initialGraphCeiling, null,
                                  this.numOfVisibleGraphColumns);
        this.minimapDrawingParameters =
            new DrawingParameters(this.mCtx, this.x, null, null, 0, this.minimap.height,
                                  0, this.minimap.width, 0, this.x.length - 1, initialMinimapCeiling, initialMinimapCeiling,
                                  null, this.x.length);
        
        // TODO is it better that each function has own opacity or maybe create a wrapper instead of
        // it being gloabal
        // this.opacity = 1;
        this.drawHorizontalLineAboveText();

    }


    createMainElements(title){
        // main div

        this.div = document.createElement("div");
        document.body.appendChild(this.div);
        this.div.className = "main-container";

        // title
        let titleElem = document.createElement("h1");
        this.div.appendChild(titleElem);
        titleElem.textContent = title;
        // this.title = titleElem;

        // div for canvases
        this.canvases = document.createElement ("div");
        this.div.appendChild(this.canvases);
        this.canvases.className = "canvases-container";

        //graph
        this.graph = document.createElement("canvas");
        this.canvases.appendChild(this.graph);
        this.gCtx = this.graph.getContext("2d");
        this.graph.width = parseInt(this.div.clientWidth);
        // this.graph.width = parseInt(getComputedStyle(this.div).width);

        // this.graph.width = innerWidth - parseInt(getComputedStyle(this.div).marginRight);
        this.graph.height = 500;

        // canvas for LINES NUMBERS DATES
        this.info = document.createElement("canvas");
        this.canvases.appendChild(this.info);
        this.info.className = "info-canvas";

        this.iCtx = this.info.getContext("2d");
        this.info.width = this.graph.width;
        this.info.height = this.graph.height;

        // canvas for the POPUP
        this.popup = document.createElement("canvas");
        this.canvases.appendChild(this.popup);
        this.popup.className = "info-canvas";

        this.pCtx = this.popup.getContext("2d");
        this.popup.width = this.graph.width;
        this.popup.height = this.graph.height;

        this.popup.addEventListener("mousemove", this.drawPopup.bind(this));



        // container for the minimap and the slider
        this.miniDiv = document.createElement("div");
        this.div.appendChild(this.miniDiv);
        this.miniDiv.className = "minimap-div";

        this.minimap = document.createElement("canvas");
        this.miniDiv.appendChild(this.minimap);
        this.mCtx = this.minimap.getContext("2d");
        this.minimap.width = parseInt(getComputedStyle(this.miniDiv).width);

        // this.minimap.width = innerWidth - (
        //     parseInt(getComputedStyle(this.miniDiv).marginLeft) +
        //         parseInt(getComputedStyle(this.div).marginRight));
        this.minimap.height = parseInt(getComputedStyle(this.miniDiv).height);

    }
    createSlider(){
        this.lSpace = document.createElement("div");
        this.lSpace.id = "left-space";

        this.rSpace = document.createElement("div");
        this.rSpace.id = "right-space";

        this.slider = document.createElement("div");
        this.slider.id = "slider";

        // sizes
        this.lSpace.style.height = this.minimap.height + "px";
        this.slider.style.height = this.minimap.height - 6 + "px";
        this.rSpace.style.height = this.minimap.height + "px";

        this.lSpace.style.left = 0 + "px";
        this.lSpace.style.width = this.minimap.width * 0.7 + "px";

        this.slider.style.left = parseInt(this.lSpace.style.left) +
            parseInt(this.lSpace.style.width) + "px";
        this.slider.style.width = this.minimap.width * 0.3 - 11 + "px";


        this.rSpace.style.left =
            parseInt(this.slider.style.left) +
            parseInt(this.slider.style.width) + 12 + "px";

        this.rSpace.style.width = this.minimap.width -
            parseInt(this.rSpace.style.left) + "px";


        this.miniDiv.appendChild(this.lSpace);
        this.miniDiv.appendChild(this.slider);
        this.miniDiv.appendChild(this.rSpace);

        let moveSliderLeft = (event) => {
            this.moveSlider(event, "left");
        };
        let moveSliderRight = (event) => {
            this.moveSlider(event, "right");
        };
        let moveSliderMiddle = (event) => {
            this.moveSlider(event, "mid");
        };

        let mouseMovement = () => {
            
            let addMovementListener = (moveFunction) => {
                window.addEventListener("mousemove", moveFunction);

                window.addEventListener("mouseup", function (){
                    window.removeEventListener("mousemove", moveFunction);
                });
            };

            this.slider.addEventListener("mousedown", () =>{
                let sliderRect = this.slider.getBoundingClientRect();

                if (window.event.clientX < sliderRect.left + 20){
                    addMovementListener(moveSliderLeft);

                } else if (window.event.clientX > sliderRect.left +
                           parseInt(getComputedStyle(this.slider).width) - 20){
                    addMovementListener(moveSliderRight);
                } else {
                    addMovementListener(moveSliderMiddle);
                }

            }
                                        );
        };


        // mobile touch support
        let mobileTouch = () => {

            let addMovementListener = (moveFunction) => {
                window.addEventListener("touchmove", moveFunction);

                window.addEventListener("touchend", function (){
                    window.removeEventListener("touchmove", moveFunction);
                });
            };

            this.slider.addEventListener("touchstart", function(){
                this.previousTouchPosition = window.event.touches[0].clientX;
                let sliderRect = this.slider.getBoundingClientRect();

                if (window.event.touches[0].clientX < sliderRect.left + 20){
                    addMovementListener(moveSliderLeft);

                } else if (window.event.touches[0].clientX > sliderRect.left +
                           parseInt(getComputedStyle(this.slider).width) - 20){
                    addMovementListener(moveSliderRight);
                } else {
                    addMovementListener(moveSliderMiddle);
                }

            }
                                        );
        };
        mouseMovement();
        mobileTouch();

        let cursorListener = () => {
            this.configureSlider();
            this.slider.addEventListener("mousemove", (event) => {
                if (event.clientX - this.sliderRect.left < 20){
                    this.slider.style.cursor = "w-resize";
                } else if (event.clientX > this.sliderRect.left + this.sliderWidth){
                    this.slider.style.cursor = "e-resize";
                } else {
                    this.slider.style.cursor = "move";

                }
            }
                                        );
        };
        cursorListener();

    }
    createButtons(){
        
        let buttons = document.createElement("div");
        this.div.appendChild(buttons);
        for(let i = 0; i < this.lines.length; i++){
            let label = document.createElement("label");
            buttons.appendChild(label);
            label.className = "button-container";

            let input = document.createElement("input");
            input.type = "checkbox";
            label.appendChild(input);
            input.checked = true;
            input.addEventListener("click", () => {
                if (input.checked == false){
                    this.justBeenRemoved = this.lines[i]["array"];
                    this.lines[i].isActive = false;
                } else {
                    this.justBeenSelected = this.lines[i]["array"];
                    this.lines[i].isActive = true;
                }
                this.drawGraphOnCheck();
                this.drawMinimap();
            });
            this.lines[i]["checkbox"] = input;

            let checkmark = document.createElement("span");
            label.appendChild(checkmark);
            //put text inside
            let text = document.createElement("p");
            label.appendChild(text);
            text.appendChild(document.createTextNode(this.lines[i].checkboxName));


            checkmark.className = "checkmark";
            // assign the border as the color
            let color = this.lines[i]["color"];
            checkmark.style.border = "2px solid " + color;
            checkmark.style.backgroundColor = color;
            input.addEventListener("change", function () {
                if (this.checked){
                    checkmark.style.backgroundColor = color;
                } else {
                    checkmark.style.backgroundColor = document.body.style.backgroundColor;
                }
            });

        }
        
        let clrDiv = document.createElement("div");
        buttons.appendChild(clrDiv);
        clrDiv.style.clear = "both";
    }
    createTooltip(){
        this.tooltip = document.createElement("div");
        this.div.appendChild(this.tooltip);
        this.tooltip.className = "myTooltip";
        // this.tooltip.style.backgroundColor = DAY.lead;

    }


    calculateCutout () {
        // TODO gotta calc the columns and the offset
        // the offset is later used by drawgraph to calculate Translate
        let lPoint = parseInt(getComputedStyle(this.slider).left);
        let rPoint = lPoint + parseInt(getComputedStyle(this.slider).width);
        let mColumnWidth = this.minimap.width / this.x.length;
        this.numOfVisibleGraphColumns = (rPoint - lPoint) / mColumnWidth;
        
        this.sliderColumnStart = Math.floor(lPoint / mColumnWidth);
        this.sliderColumnEnd = Math.ceil(rPoint / mColumnWidth);

        // offset: difference between the position of slider coords and closest column coords
        // gotta convert that to the graph offset in drawGraph
        this.sliderOffset = lPoint - this.sliderColumnStart * mColumnWidth;


        // TODO round this float probably


    }
    configureGraphParams(){
        let xStart = this.sliderColumnStart;
        let xEnd = this.sliderColumnEnd;

        // TODO depending on the type - call appropriate func ceiling func
        let ceiling = this.findPrettyMax(xStart, xEnd);
        // the offset of graph should be much bigger
        // accounting for the fact that graph is partial and minimap if full
        // divide by number of cutout columns and multiply by total number
        let xOffset = this.sliderOffset / this.minimap.width * this.graph.width;
        let numOfCutColumns = this.sliderColumnEnd - this.sliderColumnStart;
        xOffset = xOffset / numOfCutColumns * this.x.length;

        // checking if i need the animation
        this.graphDrawingParameters.xStart = xStart;
        this.graphDrawingParameters.xEnd = xEnd;
        this.graphDrawingParameters.ceiling = ceiling;
        this.graphDrawingParameters.xOffset = xOffset;
        this.graphDrawingParameters.columnsOnCanvas = this.numOfVisibleGraphColumns;

    }


    moveSlider(event, movement){ // WRAPPER
        event.preventDefault();
        let movementX;

        if (event.type === "touchmove"){ // check if on mobile
            movementX = Math.round(event.touches[0].clientX - this.previousTouchPosition);
            this.previousTouchPosition = event.touches[0].clientX;
        } else {
            movementX = event.movementX;
        }

        // TODO THROTTLE WITH TIMESTAMPS FOR FAST MOVEMENT
        if (movementX != 0){
            this.actuallyMoveSlider(movementX, movement);
        }
        
    }
    actuallyMoveSlider(movementX, movement){
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

            if (parseInt(sliderStyle.width) < SETTINGS.minSliderWidth){

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

            if (parseInt(sliderStyle.width) < SETTINGS.minSliderWidth){

                this.slider.style.width = parseInt(sliderStyle.width) - movementX + "px";

                this.rSpace.style.left = parseInt(rSpaceStyle.left) - movementX +  "px";
                this.rSpace.style.width = parseInt(rSpaceStyle.width) + movementX +  "px";
            }
        };

        // checking mouse position on the button
        if (movement == "left"){
            moveLeft();
        } else if (movement == "right"){
            moveRight();
        } else {
            moveMiddle();
        }

        // apply all that shit
        this.drawGraphOnMovement();
        // TODO recalculate the position of the
        this.configureSlider();

    }
    configureSlider(){
        this.sliderRect = this.slider.getBoundingClientRect();
        this.sliderWidth = parseInt(getComputedStyle(this.slider).width);
    }



    drawGraphOnCheck(){
        this.configureGraphParams();
        this.drawGraph();
    }
    drawGraphOnMovement(){
        this.calculateCutout();
        this.configureGraphParams();
        this.drawDates(this.graphDrawingParameters);
        this.drawGraph();


    }
    
    drawGraph(){
        this.gCtx.clearRect(0, 0, this.graph.width, this.graph.height);
        // this.calculateCutout();
        if (this.graphDrawingParameters.oldCeiling != this.graphDrawingParameters.ceiling) { // TODO consider code optimization with drawMinimap
            this.animation(this.graphDrawingParameters);
            this.graphDrawingParameters.oldCeiling = this.graphDrawingParameters.ceiling;
        } else {
            this.drawWrapper(this.graphDrawingParameters);
        }
    }
    drawMinimap(){ // PARENTS: createButtons, launchChart, 
        // TODO optimize ceiling calculations so i don't do them twice with drawGraph
        this.mCtx.clearRect(0, 0, this.minimap.width, this.minimap.height);

        let ceiling = this.findPrettyMax(0, this.x.length); //recal ceiling
        this.minimapDrawingParameters.ceiling = ceiling;
        this.minimapDrawingParameters.xOffset = 0; // mini doesn't need an offset

        // checking if i need to do an animation
        if (this.minimapDrawingParameters.oldCeiling != ceiling) {

            this.animation(this.minimapDrawingParameters);
            this.minimapDrawingParameters.oldCeiling  = ceiling;
        } else {
            this.drawWrapper(this.minimapDrawingParameters);
        }

    }


    drawWrapper(parameters){
        //takes parameters from drawGraph or drawMinimap and paints all the active lines and stuff
        for (let i=0; i < this.lines.length; i++){
            if (this.lines[i].isActive) {

                parameters.color = this.lines[i]["color"];
                parameters.yArray = this.lines[i]["array"];
                this.drawLine(parameters);
            }
        }
    }
    drawLine({ctx, xArray, yArray, color, yStartPoint, yEndPoint, xStartPoint, xEndPoint,
              xStart, xEnd, ceiling, oldCeiling, xOffset, columnsOnCanvas}) {
        let areaHeight = yEndPoint - yStartPoint;
        let areaWidth = xEndPoint - xStartPoint;

        // let cutoutWidth = this.cutoutWidth / this.minimap.width * this.graph.width;

        // width for canvas and the columns which are drawn off the canvas
        // let visibleColumnWidth = areaWidth / columnsOnCanvas; 

        let columnWidth = areaWidth  / columnsOnCanvas; //used to calculate the number of columns on the screen
        let numsPerPixel = areaHeight / ceiling;

        let currentX = xStartPoint - xOffset;
        let currentY = help.round(yArray[xStart] * numsPerPixel) - yStartPoint;

        
        ctx.beginPath();
        // ctx.moveTo(currentX, currentY);
        for (let i = xStart; i < xEnd + 1; i++) {
            currentX = help.round((i - xStart) * columnWidth) - xOffset;
            currentY = yEndPoint - help.round( yArray[i] * numsPerPixel ) - yStartPoint;

            ctx.lineTo(currentX, currentY);
        }
        ctx.lineJoin = "round";
        ctx.lineWidth = 3;
        ctx.strokeStyle = color;

        ctx.stroke();

    }
    animation(parameters){
        // draws lines with given parameters and each time adjusts the ceiling
        // old ceiling
        // RM extra code
        let numOfFrames = 30; //TODO TEMP
        let ceilRelationship = (1 / parameters.ceiling) * parameters.oldCeiling;
        let difference = parameters.ceiling - parameters.oldCeiling;
        let distributedDifference = difference / numOfFrames;

        
        let currentCeiling = parameters.oldCeiling + distributedDifference;

        let counter = 0;
        let drawAnimation = () => {
            if (counter < numOfFrames) {
                requestAnimationFrame(drawAnimation);
                parameters.ctx.clearRect(0, 0, parameters.xEndPoint, parameters.yEndPoint);
                parameters.ceiling = currentCeiling;
                currentCeiling += distributedDifference;
                this.drawWrapper(parameters);
                this.drawNumbers(parameters);
                counter += 1;
            }
        };
        requestAnimationFrame(drawAnimation);
    }





    drawHorizontalLines({ctx}, rowHeight,){
        // TODO i prolly don't need the parameters object here
	      let drawLines = () =>{
            let x = 0;
            let xEnd = this.graph.width;
	          let y = DATESPACE - 21;
	          for (let i = 0; i < NUMOFROWS; i++){
		            this.iCtx.moveTo(x, y);
		            this.iCtx.lineTo(xEnd, y);
		            y += rowHeight;
	          }
	      };
	      this.iCtx.beginPath();
	      drawLines();

	      this.iCtx.globalAlpha = 0.4;
	      this.iCtx.lineWidth = "2";
	      this.iCtx.strokeStyle = "grey";
        this.iCtx.stroke();
	      this.iCtx.globalAlpha = 1;
    }
    drawHorizontalLineAboveText(){ // above dates
	      this.iCtx.beginPath();
	      this.iCtx.strokeStyle = "grey";
	      this.iCtx.moveTo(0, this.graph.height - DATESPACE + 2);
	      this.iCtx.lineTo(this.graph.width, this.graph.height - DATESPACE + 2);
	      this.iCtx.stroke();
    }
    drawDates({xStart, xEnd, xOffset, xEndPoint, xStartPoint}) {
        // fired on every redraw (for optimization - only fire when slider is moved)
        this.iCtx.clearRect(0, this.graph.height - DATESPACE, this.graph.width, DATESPACE);
        // takes the range start, end
        // better to draw this with each line draw OR use the same formulas
        // TODO make new consts for repetitive formulas, like calc position with offset
        let columnWidth = (xEndPoint - xStartPoint) / (xEnd - xStart);
        
	      let dateSkipCounter = 0;
	      let skipFactor;
	      skipFactor = Math.floor(80 / columnWidth);


        let y = this.graph.height - 5;
        let currentX = 0; 

	      this.iCtx.font = "14px Helvetica"; //font for the numbers
	      this.iCtx.fillStyle = "grey";
        for (let i = xStart; i < xEnd + 1; i++) {
            if (dateSkipCounter == 0) {
                // TODO finish rounding floats
                currentX = help.round((i - xStart) * columnWidth - xOffset);
                let date = new Date(this.x[i]);
                date = MONTHS[date.getMonth()] + ' ' + date.getDate();
                this.iCtx.fillText(date, currentX, y);

                // skipping some of them
                dateSkipCounter = skipFactor;
            } else {
                dateSkipCounter -= 1;
            }
        } 
    }
    drawNumbers(parameters) {
	      // drawing the numbers on the left side
	      let y = this.graph.height - DATESPACE;
        this.iCtx.clearRect(0, 0, this.graph.width, y);
	      let curNum = 0;
        let rowStep = parameters.ceiling / NUMOFROWS;
        let rowHeight = (this.graph.height - DATESPACE) / NUMOFROWS;
        // TODO round floats

	      this.iCtx.font = "14px Helvetica"; //font for the numbers
	      this.iCtx.fillStyle = "grey";
	      for (let i=0; i < NUMOFROWS; i++){
		        this.iCtx.fillText(curNum, 20, y - 10);
		        curNum += rowStep;
		        y -= rowHeight;
	      }
        this.drawHorizontalLines(parameters, rowHeight);

    }


    drawPopup({clientX}){
        // gets the current mouse position and prints the appropriate array values
        let cutoutSize = this.sliderColumnEnd - this.sliderColumnStart;
        let columnWidth = this.graph.width / this.numOfVisibleGraphColumns;
        let currentGraphColumn = Math.round((clientX - this.graph.getBoundingClientRect().left)  / columnWidth);


        let currentArrayColumn = this.sliderColumnStart + currentGraphColumn;

        let conversionQuotient = (this.graph.height - DATESPACE) / this.graphDrawingParameters.oldCeiling;
        let convertedVal;
        let date;

        // TODO optimize this code for offset
        let xOffset = this.sliderOffset / this.minimap.width * this.graph.width;
        let numOfCutColumns = this.sliderColumnEnd - this.sliderColumnStart;
        xOffset = xOffset / numOfCutColumns * this.x.length;

        let currentXPos = currentGraphColumn * columnWidth - xOffset;
        let displayTooltip = () => {
            // displaying the tooltip

            //change the contents of the tooltip

            date = new Date(this.x[currentArrayColumn]);
            date = DOW[date.getDay()] + ", " + MONTHS[date.getMonth()] + ' ' + date.getDate();
            let color;
            if (getComputedStyle(document.body).backgroundColor == DAY.lead){
                color = NIGHT.lead;
                this.tooltip.style.backgroundColor = DAY.lead;
            } else {
                color = DAY.lead;
                this.tooltip.style.backgroundColor = NIGHT.lead;

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
                if (this.lines[i].isActive){
                    convertedVal =
                        this.graph.height - this.lines[i]["array"][currentArrayColumn] *
                        conversionQuotient - DATESPACE;



                    this.pCtx.beginPath();
                    this.pCtx.arc(currentXPos, convertedVal,
                                  10, 0, Math.PI * 2);
                    this.pCtx.fillStyle = getComputedStyle(document.body).backgroundColor;
                    this.pCtx.strokeStyle = this.lines[i]["color"];
                    this.pCtx.fill();
                    this.pCtx.stroke();
                    this.pCtx.fillStyle = "black";

                    // get the date
                    number = this.lines[i]["array"][currentArrayColumn];
                    name = this.lines[i]["checkboxName"];
                    style = `float:left; margin: 10px; color: ${this.lines[i]["color"]}`;
                    this.tooltip.innerHTML +=
                        `<div style="${style}"><p>${number}</p><p>${name}</></div>`;

                }
            }

        };
        let drawVerticalLine = () => {

            this.pCtx.beginPath();
            this.pCtx.moveTo(currentXPos, 0);
            this.pCtx.lineTo(currentXPos, this.graph.height - DATESPACE);

            this.pCtx.lineWidth = "2";
            this.pCtx.strokeStyle = "#777";
            this.pCtx.stroke();
        };

        //check if i have shifted columns to know if i should redraw
        let start = 0;
        let end = 0;
        // partial redraw
        /*if (this.currentColumnCursor != currentGraphColumn && this.isAnyArrayActive()){
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
            // TODO partial redraw for tooltip and circles
            this.iCtx.clearRect(0, 0, this.info.width, this.info.height);
            displayTooltip();
            drawHorizontalLine();
            drawCircles();
        } */

        this.currentColumnCursor = currentGraphColumn;
        // TODO clear only what's necessary
        this.pCtx.clearRect(0, 0, this.popup.width, this.popup.height);
        displayTooltip();
        drawVerticalLine();
        drawCircles();
        // drawNumbers

    }
    isAnyArrayActive(){
        for (let i in this.lines){
            if (this.lines[i].isActive){
                return true;
            };
        }
        return false;
    };
}



function switchTheme(){
    let color;
    if (getComputedStyle(document.body).backgroundColor == DAY.lead){
        color = NIGHT.lead;
    } else {
        color = DAY.lead;
    }

    document.body.style.backgroundColor = color;
    let chart;
    for (let i = 0; i < arrayOfCharts.length; i++){
        chart = arrayOfCharts[i];
        chart.graph.style.backgroundColor = color;
        chart.minimap.style.backgroundColor = color;
        // TODO change title color
        // tooltip color and
        // buttoncolor when unchecked
        // redraw everything upon click
        if (color == DAY.lead){
            chart.div.style.color = NIGHT.lead;
            //chart.tooltip(window.event); // redraw the tooltip

            themeButton.innerHTML = "Switch to Night Mode";
        } else {
            chart.div.style.color = DAY.lead;
            // chart.tooltip(window.event); // redraw the tooltip
            themeButton.innerHTML = "Switch to Day Mode";
        }
        // chart.redraw(); // why did i put it here


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

let throttled;
function onResize(){
    // reset canvases (reconfigure their sizes) and redraw
    // add drawMinimap to redraw in this case
    if (!throttled) {
        let chart;
        for (let i = 0; i < arrayOfCharts.length; i++){
            chart = arrayOfCharts[i];
            let oldChange = () => {
                chart.graph.width = innerWidth - parseInt(getComputedStyle(chart.div).marginRight);
                chart.graph.height = innerHeight / 2;
                chart.minimap.width = innerWidth - (
                    parseInt(getComputedStyle(chart.miniDiv).marginLeft) +
                        parseInt(getComputedStyle(chart.div).marginRight));
                // chart.minimap.height = 75;


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

                // chart.drawMinimap();
                // TODO resize the info canvas also
            };
            // adjust and redraw canvases
            // adjust slider
            // chart.graph.style.width = innerWidth / 2 + "px";//- parseInt(getComputedStyle(chart.div).marginRight);
        }
        throttled = true;
        setTimeout(function() {
            throttled = false;
        }, 250);

    } 

}

window.addEventListener("resize", onResize);




// STAGE 2


class lineChart extends Chart{
    constructor(data){
        let title = "LINE + LINE ZOOM";
        super(data, title);
        // importDays(1);
    }
}

class line2YChart extends Chart{
    constructor(data){
        let title = "LINE 2Y + 2Y";
        super(data, title);
    }
}


class barChart extends Chart{
    constructor(data, title){
        super(data, title);
    }

    drawBars({ctx, yArray, xStart, xEnd, color, yEndPoint, yStartPoint, barOffset=0}){
        // let ceiling = Math.max(...yArray.slice(xStart, xEnd)); // TODO TEMP reuse old code and find pretty nums
        // TODO ceiling here is probably redundant, because i can use the one from params
        let ceiling = this.findPrettyMax(xStart, xEnd);
        // let areaHeight = //this.graph.height - DATESPACE;
        let areaHeight = yEndPoint - yStartPoint;
        let areaWidth = this.graph.width;

        let numOfColumns = xEnd - xStart;
        let columnWidth = this.graph.width / numOfColumns;

        let numsPerPixel = areaHeight / ceiling; // TODO won't work with stacked bars

        let currentX = 0;
        let currentY = areaHeight - yArray[0] * numsPerPixel - barOffset;

        // TODO that's the problem, it should return for EVERY column, now it sends only the last one
        // switch to calculating offset in the wrapper (sum of all previous bars)
        let fillDistance = this.graph.height - DATESPACE - currentY; // on the Y axis
        let fillWidth = this.graph.width / numOfColumns - 1; // on the X axis

        ctx.fillStyle = color;
        for (let x = xStart; x < xEnd; x++) {
            fillDistance = this.graph.height - DATESPACE - currentY; // on the Y axis
            ctx.fillRect(currentX, currentY, fillWidth, fillDistance);

            currentY = areaHeight - yArray[x] * numsPerPixel;
            currentX += columnWidth;
            // TODO insert spaces between columns

        }
        // return the calculated stuff for
        // previous bar height (fill distance)
        return fillDistance; // for stacked bars to find the starting point of next bar

    }
}

class stackedBarChart extends barChart{
    constructor(data){
        let title = "STACKED + STACKED";
        super(data, title);
    }
    destructureData(data){
        super.destructureData(data);
        this.bars = this.lines;
    }

    getSummedArray(xStart=0, xEnd=this.bars[0].length){
        // sums all array into a single array to find the ceiling
        // TODO change for all the active arrays
        let summedArray = [...this.bars[0].array.slice(xStart, xEnd+1)];
        let currentArray;
        for (let i= 1; i < this.bars.length; i++){
            currentArray = this.bars[i].array.slice(xStart, xEnd+1);
            for (let j = 0; j < currentArray.length; j++){
                summedArray[j] += currentArray[j];
            }
        }
        // send the array to find ceil
        // let ceiling = this.findPrettyMax(summedArray, 0, summedArray.length);
        return summedArray;
    }
    findPrettyMax(xStart, xEnd){
        let array = this.getSummedArray(xStart, xEnd);
        // let slicedArray = array.slice(xStart, xEnd);
        return myMath.findPrettyRoundNum(Math.max(...array));
    }
    drawWrapper(parameters){ // PARENTS: drawMinimap, drawGraph
        // iterate through each bar and draw one by one
        // use the parameters
        // set teh y array in params and the color
        // TODO STARTING X POS IN THIS FUNC
        let color;
        let previousBarHeight;
        let currentBarOffset = 0;
        for (let b = 0; b < this.bars.length; b++){
            parameters.color = this.bars[b].color;
            parameters.yArray = this.bars[b].array;
            parameters.color = this.bars[b].color;
            parameters.yArray = this.bars[b].array;
            // HOW TO CALC X EACH ITER
            // subtract each step the calced bar height
            // currentY = this.graph.height - DATESPACE - currentBarHeight;
            // parameters.xStart = this.y;
            
            previousBarHeight = this.drawBars(parameters);
            // currentY = currentY - previousBarHeight;
            parameters.barOffset += previousBarHeight;
            // send the bar offset instead of Y, which will be the combined previous Widths
            // this.drawBars(parameters);
        }
    }
    drawGraph(){
        // TODO clearing the canvas should prolly be done in the wrapper using the param ctx
        this.gCtx.clearRect(0, 0, this.graph.width, this.graph.height); 
        this.drawWrapper(this.graphDrawingParameters);
    }
}

class singleBarChart extends barChart{
    constructor(data){
        // let title = data["names"]["y0"];
        let title = "BARS + LINES";
        super(data, title);

        // TODO days
        this.days = [];
        importDays(4, this.days);

    }
    destructureData(data){

        this.x = data["columns"][0];
        this.y = data["columns"][1];
        this.x.splice(0, 1);
        this.y.splice(0, 1);
        this.color = data["colors"]["y0"];
    }
    findPrettyMax(xStart, xEnd){
        let array = this.y; // TODO make for cutout
        let slicedArray = array.slice(xStart, xEnd + 1);
        return myMath.findPrettyRoundNum(Math.max(...slicedArray));
    }

    // drawGraphOnMovement(){
    //     this.calculateCutout();
    //     this.configureGraphParams();
    //     this.drawDates(this.graphDrawingParameters);
    //     this.drawGraph();
    // }
    drawGraph(){
        // this.drawBars(this.y, 300, this.x.length, this.color);
        this.gCtx.clearRect(0, 0, this.graph.width, this.graph.height);
        this.drawWrapper(this.graphDrawingParameters);
    }

    drawWrapper(parameters){ // gets called from drawMinimap and drawGraph
        //TODO prolly a dummy func here for compatibility with other charts
        // clean this up later

        // TODO i can probably move these to initial parameter config with a wrapper or something
        parameters.yArray = this.y;
        parameters.color = this.color;
        this.drawBars(parameters);
    }

}



class areaChart extends Chart{
    constructor(data){
        let title = "AREA + AVERAGE PIE";
        super(data, title);
    }
    drawGraph(){
        this.gCtx.clearRect(0, 0, this.graph.width, this.graph.height);
        this.drawWrapper(this.graphDrawingParameters);
    }
    drawWrapper(parameters){
        // polyline is an array of tuples
        // the x position is the same throughout 

        let floorX = [0, this.graph.width];
        let floorY = this.graph.height - DATESPACE;
        let floorArray = [floorY, floorY];
        let currentLevel;

        parameters.floorArray = this.lines[0];// floorArray;
        parameters.roofArray = this.lines[0];
        parameters.color = this.lines[0].color;
        parameters.xStart = 0;
        parameters.xEnd = 20;
        // this.drawArea(parameters);
        // this.drawPie(parameters);

        // loop through all the arrays and for each X - find
        // sum them up and then divide the sum into each array and add that to the corresponding % array
        let percentLines = []; //array of arrays TODO really huge floats
        let arrayOfOffsets = [];

        let sumArray = [...this.lines[0].array]; // the first Y TODO consider ACTIVE arrays
        for(let x = 0; x < this.x.length; x++){
            // sum all Y's
            for (let y = 1; y < this.lines.length; y++) {
                sumArray[x] += this.lines[y].array[x];
            }
            // creating array of offsets for drawArea
            arrayOfOffsets.push(1);
        }
        // for each Y - divide the sum by that and add to corresponding sumarray
        for (let y = 0; y < this.lines.length; y++) {
            percentLines.push([]);
            for (let x = 0; x < this.x.length; x++){
                percentLines[y].push(1 / sumArray[x] * this.lines[y].array[x]);
            }
        }


        // for every Y - send that Y+corresponding Offset, then add to that offset
        for (let y = 0; y < percentLines.length; y++){
            
            // this.drawArea(arrayOfOffsets, percentLines[y], this.colors[y]);
        }

        // sum up each array and find a relatinship and convert that to a percentarr
        let sum;
        let arrayOfSums = [];
        for (let y = 0; y < this.lines.length; y++){
            sum = 0;
            for (let x = 0; x < this.x.length; x++) {
                sum += this.lines[y].array[x];
            }

            arrayOfSums.push(sum);
            
        }

        let sumOfSums = 0; 
        for (let y = 0; y < arrayOfSums.length; y++){
            sumOfSums += arrayOfSums[y];
        }

        let percentPie = []; // each piece as a %
        for (let y = 0; y < arrayOfSums.length; y++){
            percentPie.push(1 / sumOfSums * arrayOfSums[y]);
        }


        let currentPieOffset = 0;
        for (let y = 0; y < percentPie.length; y++){
            
            this.drawPie(percentPie[y], currentPieOffset, this.lines[y].color);
            currentPieOffset += percentPie[y];
            
        }

    }
    drawArea(arrayOfOffsets, yArray, color){
        // takes an array of percentages of graph width 
        // use the given percentage and multiply areaHeight by it
        let yEndPoint = this.graph.height - DATESPACE;
        let yStartPoint = 0;
        let areaHeight = yEndPoint - yStartPoint;
        let ctx = this.gCtx;

        let xStart = 0;
        let xEnd = this.x.length;
        
        let numOfColumns = xEnd - xStart;
        let columnWidth = this.graph.width / numOfColumns;


        let currentY;
        let currentX = 0;

        ctx.beginPath();

        ctx.lineTo(0, areaHeight);
        for (let x = xStart; x < xEnd + 1; x++) {
            // draw a line and add the corresponding offset, then add that line's height to it
            currentY = areaHeight - (arrayOfOffsets[x] + yArray[x]) * areaHeight;
            ctx.lineTo(currentX, currentY);

            currentX += columnWidth;



            arrayOfOffsets[x] -= yArray[x];
        }
        ctx.lineTo(this.graph.width, areaHeight);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();

        // in every X iteration add to the array of offsets
        // currentOffset - the areaHeight * percentage of all the previous lines
    }

    drawPie(pieceOfPie, pieOffset, color){
        // takes
        
        // takes a percentage value and starting radian
        // draws an arc based on that
        let ctx = this.gCtx;
        let xPos = this.graph.width / 2;
        let yPos = this.graph.height / 2;
        
        let radius = 150;
        let startAngle = pieOffset * Math.PI * 2;
        let endAngle = startAngle + Math.PI * 2 * pieceOfPie;

        ctx.beginPath();
        ctx.arc(xPos, yPos, radius, startAngle, endAngle);

        // now draw path to center and close path
        ctx.lineTo(xPos, yPos);

        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        // ctx.strokeStyle = color;
        // ctx.stroke();

    }
}







//create an xhtml request, load overview
function downloadDays(filename, whereToAppend){
    let xmlhttp = new XMLHttpRequest();
    xmlhttp.responseType = 'json';
    xmlhttp.open('GET', filename, true);
    xmlhttp.onload  = function() {
        if (xmlhttp.response){
            whereToAppend.push(xmlhttp.response);

        }
    };
    xmlhttp.send(null);
}

let arrayOfNewCharts = [];
let chartClasses = {
    1: lineChart,
    2: line2YChart,
    3: stackedBarChart,
    4: singleBarChart,
    5: areaChart
};

function initiateNewCharts(chartNumber){
    let importMainData = () => { // 1
        let xmlhttp = new XMLHttpRequest();
        let url = `data/${chartNumber}/overview.json`;
        xmlhttp.responseType = 'json';
        xmlhttp.open('GET', url, true);
        xmlhttp.onload  = function() {
            createNewCharts(xmlhttp.response);
        };
        xmlhttp.send(null);
    };
    let createNewCharts = (data) => { // 2
        arrayOfNewCharts.push(new chartClasses[chartNumber](data));
    };

    importMainData();
}

let year1 = [[4, 7], [12, 31], 2018]; //start and end months and days
let year2 = [[1, 1], [4, 6], 2019];
let years = [year1, year2];


let filename;
let startMonthOfYear;
let startDayOfYear;
let endMonthOfYear;
let endDayOfYear;
let counter = 0;
function importDays(chartNumber, whereToAppend){
    for (let y = 0; y < years.length; y++){
        startMonthOfYear = years[y][0][0];
        endMonthOfYear = years[y][1][0];
        startDayOfYear = years[y][0][1];
        endDayOfYear = years[y][1][1];
        for (let m = startMonthOfYear; m <= endMonthOfYear; m++){
            let month = m;
            if (month < 10) {month = '0' + month;}
            let folder = `${years[y][2]}-${month}`;


            // if it's the last month of year - apply end day, else max days
            let endDay;
            let startDay;
            if (m == endMonthOfYear){
                endDay = endDayOfYear;
            } else {
                endDay = help.daysInMonth(month, y);
            }
            if (m == startMonthOfYear){
                startDay = startDayOfYear;
            } else {
                startDay = 1;
            }
            // if start month - starts at the start dat, else at 1
            for (let d = startDay; d <= endDay; d++){
                // import each object and append to the array of days which is a
                // if it exists there
                // TODO what if there's no response (no file)
                let day = d;
                if (day < 10) {day = '0' + day;}

                let filename = `data/${chartNumber}/${folder}/${day}.json`;
                // TODO print the imported objects
                downloadDays(filename, whereToAppend);

                // TODO append to the corresponding object and then print all this shit


            }
        }
    }
}
// OLD CHARTS
// initiateCharts();

// initiate each chart; also appends each to arrayOfNewCharts
for (let c = 1; c <= 5; c++) {
    initiateNewCharts(c);
}


