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
        
    }
};

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
    findPrettyMax: function (listOfArrays, xStart, xEnd) {
        // find the optimal ceiling for the graph (tries to find a round pretty number)

        // takes the biggest number from the set and defines the ceiling of the graph based on it
        let max = myMath.findActiveMax(listOfArrays, xStart, xEnd);

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
    findActiveMax: function (listOfArrays, xStart, xEnd) {
        // iterate through active arrays, find the biggest num
        let findMaxInArray = (array) => {
            return Math.max(...array.slice(xStart, xEnd+1));
        };

        let currentMax = 0;
        for (let i=0; i < listOfArrays.length; i++){
            // TODO if active
            if (listOfArrays[i]["checkbox"].checked){
                currentMax = Math.max(findMaxInArray(listOfArrays[i]["array"]), currentMax);

            }
        }
        return currentMax;

    }
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

function createLayout(chart, title){
    let createMainElements = () => {
        // main div

        chart.div = document.createElement("div");
        document.body.appendChild(chart.div);
        chart.div.className = "main-container";

        // title
        let titleElem = document.createElement("h1");
        chart.div.appendChild(titleElem);
        titleElem.textContent = title;
        // chart.title = titleElem;

        // div for canvases
        chart.canvases = document.createElement ("div");
        chart.div.appendChild(chart.canvases);
        chart.canvases.className = "canvases-container";

        //graph
        chart.graph = document.createElement("canvas");
        chart.canvases.appendChild(chart.graph);
        chart.gCtx = chart.graph.getContext("2d");
        chart.graph.width = parseInt(chart.div.clientWidth);
        // chart.graph.width = parseInt(getComputedStyle(chart.div).width);

        // chart.graph.width = innerWidth - parseInt(getComputedStyle(chart.div).marginRight);
        chart.graph.height = 500;

        // canvas for LINES NUMBERS DATES
        chart.info = document.createElement("canvas");
        chart.canvases.appendChild(chart.info);
        chart.info.className = "info-canvas";

        chart.iCtx = chart.info.getContext("2d");
        chart.info.width = chart.graph.width;
        chart.info.height = chart.graph.height;

        // canvas for the POPUP
        chart.popup = document.createElement("canvas");
        chart.canvases.appendChild(chart.popup);
        chart.popup.className = "info-canvas";

        chart.pCtx = chart.popup.getContext("2d");
        chart.popup.width = chart.graph.width;
        chart.popup.height = chart.graph.height;

        chart.popup.addEventListener("mousemove", chart.drawPopup.bind(chart));



        // container for the minimap and the slider
        chart.miniDiv = document.createElement("div");
        chart.div.appendChild(chart.miniDiv);
        chart.miniDiv.className = "minimap-div";

        chart.minimap = document.createElement("canvas");
        chart.miniDiv.appendChild(chart.minimap);
        chart.mCtx = chart.minimap.getContext("2d");
        chart.minimap.width = parseInt(getComputedStyle(chart.miniDiv).width);

        // chart.minimap.width = innerWidth - (
        //     parseInt(getComputedStyle(chart.miniDiv).marginLeft) +
        //         parseInt(getComputedStyle(chart.div).marginRight));
        chart.minimap.height = parseInt(getComputedStyle(chart.miniDiv).height);

    };
    let createSlider = () => {

        chart.lSpace = document.createElement("div");
        chart.lSpace.id = "left-space";

        chart.rSpace = document.createElement("div");
        chart.rSpace.id = "right-space";

        chart.slider = document.createElement("div");
        chart.slider.id = "slider";

        // sizes
        chart.lSpace.style.height = chart.minimap.height + "px";
        chart.slider.style.height = chart.minimap.height - 6 + "px";
        chart.rSpace.style.height = chart.minimap.height + "px";

        chart.lSpace.style.left = 0 + "px";
        chart.lSpace.style.width = chart.minimap.width * 0.7 + "px";

        chart.slider.style.left = parseInt(chart.lSpace.style.left) +
            parseInt(chart.lSpace.style.width) + "px";
        chart.slider.style.width = chart.minimap.width * 0.3 - 11 + "px";


        chart.rSpace.style.left =
            parseInt(chart.slider.style.left) +
            parseInt(chart.slider.style.width) + 12 + "px";

        chart.rSpace.style.width = chart.minimap.width -
            parseInt(chart.rSpace.style.left) + "px";


        chart.miniDiv.appendChild(chart.lSpace);
        chart.miniDiv.appendChild(chart.slider);
        chart.miniDiv.appendChild(chart.rSpace);

        let moveSliderLeft = (event) => {
            moveSlider(event, chart, "left");
        };
        let moveSliderRight = (event) => {
            moveSlider(event, chart, "right");
        };
        let moveSliderMiddle = (event) => {
            moveSlider(event, chart, "mid");
        };

        let mouseMovement = () => {
            
            let addMovementListener = (moveFunction) => {
                window.addEventListener("mousemove", moveFunction);

                window.addEventListener("mouseup", function (){
                    window.removeEventListener("mousemove", moveFunction);
                });
            };

            // let boundMoveSlider = moveSlider.bind(chart);
            chart.slider.addEventListener("mousedown", function(){
                let sliderRect = chart.slider.getBoundingClientRect();

                if (window.event.clientX < sliderRect.left + 20){
                    addMovementListener(moveSliderLeft);

                } else if (window.event.clientX > sliderRect.left +
                           parseInt(getComputedStyle(chart.slider).width) - 20){
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

            chart.slider.addEventListener("touchstart", function(){
                chart.previousTouchPosition = window.event.touches[0].clientX;
                let sliderRect = chart.slider.getBoundingClientRect();

                if (window.event.touches[0].clientX < sliderRect.left + 20){
                    addMovementListener(moveSliderLeft);

                } else if (window.event.touches[0].clientX > sliderRect.left +
                           parseInt(getComputedStyle(chart.slider).width) - 20){
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
            configureSlider(chart);
            chart.slider.addEventListener("mousemove", function (event){
                if (event.clientX - chart.sliderRect.left < 20){
                    chart.slider.style.cursor = "w-resize";
                } else if (event.clientX > chart.sliderRect.left + chart.sliderWidth){
                    chart.slider.style.cursor = "e-resize";
                } else {
                    chart.slider.style.cursor = "move";

                }
            }.bind(chart)
                                        );
        };
        cursorListener();

    };
    let createButtons = () => {
        let buttons = document.createElement("div");
        chart.div.appendChild(buttons);
        for(let i = 0; i < chart.lines.length; i++){
            let label = document.createElement("label");
            buttons.appendChild(label);
            label.className = "button-container";

            let input = document.createElement("input");
            input.type = "checkbox";
            label.appendChild(input);
            input.checked = true;
            input.addEventListener("click", function (){
                if (input.checked == false){
                    chart.justBeenRemoved = chart.lines[i]["array"];
                } else {
                    chart.justBeenSelected = chart.lines[i]["array"];
                }
                chart.drawGraphOnCheck();
                chart.drawMinimap();
            }.bind(chart));
            chart.lines[i]["checkbox"] = input;

            let checkmark = document.createElement("span");
            label.appendChild(checkmark);
            //put text inside
            let text = document.createElement("p");
            label.appendChild(text);
            text.appendChild(document.createTextNode(chart.lines[i].checkboxName));


            checkmark.className = "checkmark";
            // assign the border as the color
            let color = chart.lines[i]["color"];
            checkmark.style.border = "2px solid " + color;
            checkmark.style.backgroundColor = color;
            input.addEventListener("change", function () {
                if (chart.checked){
                    checkmark.style.backgroundColor = color;
                } else {
                    checkmark.style.backgroundColor = document.body.style.backgroundColor;
                }
            });

        }
        
        let clrDiv = document.createElement("div");
        buttons.appendChild(clrDiv);
        clrDiv.style.clear = "both";
    };
    let createTooltip = () => {
        chart.tooltip = document.createElement("div");
        chart.div.appendChild(chart.tooltip);
        chart.tooltip.className = "myTooltip";
        // chart.tooltip.style.backgroundColor = DAY.lead;

    };

    createMainElements();
    createSlider();
    createButtons();
    createTooltip();


}
function moveSlider(event, chart, movement){
    let movementX = event.movementX;
    event.preventDefault();

    if (event.type === "touchmove"){ // check if on mobile
        movementX = Math.round(event.touches[0].clientX - chart.previousTouchPosition);
        chart.previousTouchPosition = event.touches[0].clientX;
    }

    let sliderStyle = getComputedStyle(chart.slider);
    let lSpaceStyle = getComputedStyle(chart.lSpace);
    let rSpaceStyle = getComputedStyle(chart.rSpace);
    let border = parseInt(sliderStyle.borderRightWidth) * 2;


    let moveMiddle = () => {

        chart.lSpace.style.width = parseInt(lSpaceStyle.width) + movementX + "px";

        chart.rSpace.style.left = parseInt(rSpaceStyle.left) + movementX + "px";
        chart.rSpace.style.width = parseInt(rSpaceStyle.width) - movementX + "px";

        chart.slider.style.left = parseInt(sliderStyle.left) + movementX + "px";


        if (parseInt(sliderStyle.left) < 0){

            chart.lSpace.style.width = parseInt(sliderStyle.left) - border / 2 + "px";

            chart.slider.style.left = parseInt(sliderStyle.left) - movementX + "px";
            chart.rSpace.style.left = parseInt(rSpaceStyle.left) - movementX + "px";
            chart.rSpace.style.width = parseInt(rSpaceStyle.width) + movementX + "px";


        }
        if ((parseInt(sliderStyle.left) + parseInt(sliderStyle.width)) >
            chart.minimap.width - border){

            chart.slider.style.left = parseInt(sliderStyle.left) - movementX + "px";

            chart.lSpace.style.width = parseInt(lSpaceStyle.width) - movementX + "px";


            chart.rSpace.style.left = parseInt(sliderStyle.left) +
                parseInt(sliderStyle.width) + border  + "px";
            chart.rSpace.style.width = chart.minimap.width -
                parseInt(chart.rSpace.style.left) + "px";


        }

    };

    let moveLeft = () => {

        chart.lSpace.style.width = parseInt(lSpaceStyle.width) + movementX + "px";

        chart.slider.style.left = parseInt(sliderStyle.left) + movementX + "px";
        chart.slider.style.width = parseInt(sliderStyle.width) - movementX + "px";


        if (parseInt(sliderStyle.left) < 0){ // side of screen

            chart.lSpace.style.width = parseInt(sliderStyle.left) - border / 2 + "px";

            chart.slider.style.left = parseInt(sliderStyle.left) - movementX + "px";
            chart.slider.style.width = parseInt(sliderStyle.width) + movementX + "px";
        }

        if (parseInt(sliderStyle.width) < SETTINGS.minSliderWidth){

            chart.lSpace.style.width = parseInt(lSpaceStyle.width) - movementX + "px";

            chart.slider.style.left = parseInt(sliderStyle.left) - movementX + "px";
            chart.slider.style.width = parseInt(sliderStyle.width) + movementX + "px";
        }

    };

    let moveRight = () => {
        chart.slider.style.width = parseInt(sliderStyle.width) + movementX + "px";

        chart.rSpace.style.left = parseInt(rSpaceStyle.left) + movementX + "px";
        chart.rSpace.style.width = parseInt(rSpaceStyle.width) - movementX + "px";


        if ((parseInt(sliderStyle.left) + parseInt(sliderStyle.width)) >
            chart.minimap.width - border){

            chart.slider.style.width = parseInt(sliderStyle.width) - movementX + "px";

            chart.rSpace.style.left = parseInt(sliderStyle.left) +
                parseInt(sliderStyle.width) + border + "px";
            chart.rSpace.style.width = chart.minimap.width -
                parseInt(chart.rSpace.style.left) + "px";

        }

        if (parseInt(sliderStyle.width) < SETTINGS.minSliderWidth){

            chart.slider.style.width = parseInt(sliderStyle.width) - movementX + "px";

            chart.rSpace.style.left = parseInt(rSpaceStyle.left) - movementX +  "px";
            chart.rSpace.style.width = parseInt(rSpaceStyle.width) + movementX +  "px";
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
    chart.drawGraphOnMovement();
    // TODO recalculate the position of the
    configureSlider(chart);

}
function configureSlider(chart){
    chart.sliderRect = chart.slider.getBoundingClientRect();
    chart.sliderWidth = parseInt(getComputedStyle(chart.slider).width);
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
    // takes data upon creation
    constructor(data, title){
        // global vars
        this.currentColumnCursor = null; // used to track which part of the info canv to redraw
        this.numOfVisibleGraphColumns = null; // used to calculate number of columns on the screen
        this.sliderOffset = null; //tracks diff between slider pos and closest column
        this.previousTouchPosition = null; // for tracking finger movement

        this.convertData(data);
        createLayout(this, title);
        this.initialConfiguration();

        this.drawGraphOnMovement();
        this.drawMinimap();
        // this.drawHorizontalLine();

    }
    convertData(data){

        // takes the passed data and converts into objects i can easily work with
        this.lines = [];
        let findArrayByName = (name) => {
            // finds the corresponding array given the name and removes the first elem
            for (let i in data.columns){
                if (data.columns[i][0] === name){
                    data.columns[i].splice(0, 1);
                    return data.columns[i];
                }
            }
        };

        for (let key in data.names){
            this.lines.push(
                {
                    name: key,
                    array: findArrayByName(key),
                    color: data.colors[key],
                    active: true,
                    checkboxName: data.names[key]
                }
            );
        }

        // go through the data and find X
        this.x = [];
        for (let i in data.columns){
            if (data.columns[i][0] === 'x'){
                this.x = data.columns[i];
            }
        }
        this.x.splice(0, 1);

    }

    // configuring the graph
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
    initialConfiguration(){

        //  this.rowHeight = (this.graph.height - DATESPACE) / NUMOFROWS;

        // finds the maxmimum array value to scale the graph ceiling
        this.calculateCutout();
        // configuring the initial ceiling so that the drawing func can check against it
        // TODO optimize this

        // old ceilings are needed to track changes in graph heights
        // graphCeiling is needed to dynamically stop animations
        this.oldGraphCeiling = myMath.findPrettyMax(this.lines, 0, this.x.length);
        this.graphCeiling = myMath.findPrettyMax(this.lines, 0, this.x.length);
        this.oldMinimapCeiling = myMath.findPrettyMax(this.lines, 0, this.x.length);

        // configuring parameters for drawing
        this.graphDrawingParameters =
            new DrawingParameters(this.gCtx, this.x, null, null, 0, this.graph.height - DATESPACE,
                                  0, this.graph.width, null, null, null, this.oldGraphCeiling, null,
                                  this.numOfVisibleGraphColumns);
        this.minimapDrawingParameters = // TODO change to mini values
            new DrawingParameters(this.mCtx, this.x, null, null, 0, this.minimap.height,
                                  0, this.minimap.width, 0, this.x.length - 1, null, this.oldMinimapCeiling,
                                  null, this.x.length);

        // TODO is it better that each function has own opacity or maybe create a wrapper instead of
        // it being gloabal
        this.opacity = 1;


        this.drawHorizontalLineAboveText();

    }

    drawGraphOnCheck(){
        this.configureGraphParams();
        this.drawGraph();
    }

    drawGraphOnMovement(){
        this.calculateCutout();
        this.configureGraphParams();
        this.drawText(this.graphDrawingParameters);
        this.drawNumbers(this.graphDrawingParameters.ceiling);
        this.drawGraph();

    }
    configureGraphParams(){
        let xStart = this.sliderColumnStart;
        let xEnd = this.sliderColumnEnd;

        let ceiling = myMath.findPrettyMax(this.lines, xStart, xEnd);

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
    drawGraph(){
        this.gCtx.clearRect(0, 0, this.graph.width, this.graph.height);
        // this.calculateCutout();
        if (this.oldGraphCeiling != this.graphDrawingParameters.ceiling) { // TODO consider code optimization with drawMinimap
            this.animation(this.graphDrawingParameters);
            this.oldGraphCeiling = this.graphDrawingParameters.ceiling;
        } else {
            this.drawWrapper(this.graphDrawingParameters);
        }
    }

    drawLine({ctx, xArray, yArray, color, yStartPoint, yEndPoint, xStartPoint, xEndPoint,
              xStart, xEnd, ceiling, oldCeiling, xOffset, columnsOnCanvas}) {
        let xLength = xEnd - xStart;
        let areaHeight = yEndPoint - yStartPoint;
        let areaWidth = xEndPoint - xStartPoint;

        // let cutoutWidth = this.cutoutWidth / this.minimap.width * this.graph.width;

        // width for canvas and the columns which are drawn off the canvas
        // let visibleColumnWidth = areaWidth / columnsOnCanvas; 

        let columnWidth = areaWidth  / columnsOnCanvas; //used to calculate the number of columns on the screen
        let yFactor = areaHeight / ceiling;

        let currentX = xStartPoint - xOffset;
        let currentY = help.round(yArray[xStart] * yFactor) - yStartPoint;

        
        ctx.beginPath();
        // ctx.moveTo(currentX, currentY);
        for (let i = xStart; i < xEnd + 1; i++) {
            currentX = help.round((i - xStart) * columnWidth) - xOffset;
            currentY = yEndPoint - help.round( yArray[i] * yFactor ) - yStartPoint;

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
        let ceiling = parameters.ceiling;
        let oldCeiling = parameters.oldCeiling;

        let numOfFrames = 30; //TODO TEMP
        let ceilRelationship = (1 / ceiling) * this.oldGraphCeiling;
        let difference = ceiling - this.oldGraphCeiling;
        let distributedDifference = difference / numOfFrames;
        
        let currentCeiling = this.oldGraphCeiling + distributedDifference;

        let counter = 0;
        let drawAnimation = () => {
            if (counter < numOfFrames) {
                requestAnimationFrame(drawAnimation);
                parameters.ctx.clearRect(0, 0, parameters.xEndPoint, parameters.yEndPoint);
                parameters.ceiling = currentCeiling;
                currentCeiling += distributedDifference;
                this.drawWrapper(parameters);
                this.drawNumbers(parameters.ceiling);
                counter += 1;
            }
        };
        requestAnimationFrame(drawAnimation);
    }

    drawMinimap(){
        // TODO optimize ceiling calculations so i don't do them twice with drawGraph
        this.mCtx.clearRect(0, 0, this.minimap.width, this.minimap.height);

        let ceiling = myMath.findPrettyMax(this.lines, 0, this.x.length);
        this.minimapDrawingParameters.ceiling = ceiling;
        this.minimapDrawingParameters.xOffset = 0;

        // checking if i need to do an animation
        if (this.oldMinimapCeiling != ceiling) {
            this.animation(this.minimapDrawingParameters);
            this.oldMinimapCeiling = ceiling;
        } else {
            this.drawWrapper(this.minimapDrawingParameters);
        }

    }

    drawWrapper(parameters){
        //takes parameters from drawGraph or drawMinimap and paints all the active lines and stuff
        for (let i=0; i < this.lines.length; i++){
            if (this.lines[i]["checkbox"].checked) {

                parameters.color = this.lines[i]["color"];
                parameters.yArray = this.lines[i]["array"];
                this.drawLine(parameters);
            }
        }
    }


    drawHorizontalLines(){
        
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
    }
    drawText({xStart, xEnd, xOffset, xEndPoint, xStartPoint}) {
        // fired on every redraw (for optimization - only fire when slider is moved)
        this.iCtx.clearRect(0, this.graph.height - DATESPACE, this.graph.width, DATESPACE);
        // takes the range start, end
        // better to draw this with each line draw OR use the same formulas
        // TODO make new consts for repetitive formulas, like calc position with offset
        let columnWidth = (xEndPoint - xStartPoint) / (xEnd - xStart);
        
	      let dateSkipCounter = 0;
	      let skipFactor;
	      skipFactor = Math.floor(80 / columnWidth);


        let y =this.graph.height - 5;
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

		    // if (iteration == 0 && dateSkipCounter == 0 && mode != "partial" &&
		    //     this.isAnyArrayActive()){
		    //     let date = new Date(this.x[i]);
		    //     date = MONTHS[date.getMonth()] + ' ' + date.getDate();
		    //     ctx.fillText(date, x, this.graph.height - 5);

		    //     // skipping some of them
		    //     dateSkipCounter = skipFactor;
		    // } else {
		    //     dateSkipCounter -= 1;
		    // }
    }
    drawHorizontalLineAboveText(){ // above dates
	      this.iCtx.beginPath();
	      this.iCtx.strokeStyle = "grey";
	      this.iCtx.moveTo(0, this.graph.height - DATESPACE + 2);
	      this.iCtx.lineTo(this.graph.width, this.graph.height - DATESPACE + 2);
	      this.iCtx.stroke();
    }
    drawNumbers(ceiling) {
	      // drawing the numbers on the left side
	      let y = this.graph.height - DATESPACE;
        this.iCtx.clearRect(0, 0, 300, y);
	      let curNum = 0;
        let rowStep = ceiling / NUMOFROWS;
        let rowHeight = (this.graph.height - DATESPACE) / NUMOFROWS;
        // TODO round floats

	      this.iCtx.font = "14px Helvetica"; //font for the numbers
	      this.iCtx.fillStyle = "grey";
	      for (let i=0; i < NUMOFROWS; i++){
		        this.iCtx.fillText(curNum, 20, y - 10);
		        curNum += rowStep;
		        y -= rowHeight;
	      }
	      // if (this.isAnyArrayActive()){ //in case no array is selected
	      //     drawNumbers();
	      // } else {
	      //     this.iCtx.globalAlpha = 1 - this.opacity;
	      //     this.iCtx.font = `80px sans-serif`;
	      //     this.iCtx.fillText("N/A", this.graph.width / 2 - 40, this.graph.height / 2);
	      // }

    }
    drawPopup({clientX}){
        // gets the current mouse position and prints the appropriate array values
        let cutoutSize = this.sliderColumnEnd - this.sliderColumnStart;
        let columnWidth = this.graph.width / this.numOfVisibleGraphColumns;
        let currentGraphColumn = Math.round((clientX - this.graph.getBoundingClientRect().left)  / columnWidth);


        let currentArrayColumn = this.sliderColumnStart + currentGraphColumn;

        let conversionQuotient = (this.graph.height - DATESPACE) / this.oldGraphCeiling;
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
                if (this.lines[i]["checkbox"].checked){
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
        this.pCtx.clearRect(0, 0, this.popup.width, this.popup.height);
        displayTooltip();
        drawVerticalLine();
        drawCircles();
        // drawNumbers

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

initiateCharts();
window.addEventListener("resize", onResize);




// STAGE 2


class lineChart{
    constructor(){
        // importDays(1);
    }
}

class line2XChart{
    constructor(){
        
    }
}

class stackedBarChart{
    constructor(){
        
    }
}

class barChart{
    constructor(data){
        this.days = [];
        importDays(4, this.days);
        // dummies
        this.lines = [];
        
        createLayout(this, data["names"]["y0"]);


        this.destructureData(data);
        // this.drawRectangle(data["colors"]["y0"]);
        this.drawGraph();

    }
    destructureData(data){
        this.x = data["columns"][0];
        this.y = data["columns"][1];
        this.x.splice(0, 1);
        this.y.splice(0, 1);
        this.color = data["colors"]["y0"];
    }

    drawGraph(){
        this.drawBars(this.y, 300, this.x.length, this.color);
    }

    drawBars(array, xStart, xEnd, color){
        // TODO parameters object for this
        let ceiling = Math.max(...array.slice(xStart, xEnd)); // TODO reuse old code and find pretty nums
        let areaHeight = this.graph.height - DATESPACE;
        let areaWidth = this.graph.width;

        let numOfColumns = xEnd - xStart;
        let columnWidth = this.graph.width / numOfColumns;

        let yFactor = areaHeight / ceiling;
        let currentX = 0;
        let currentY = areaHeight - array[0] * yFactor;

        let fillDistance = this.graph.height - DATESPACE - currentY; // on the Y axis
        let fillWidth = this.graph.width / numOfColumns - 1; // on the X axis

        this.gCtx.fillStyle = color;
        for (let x = xStart; x < xEnd; x++) {
            this.gCtx.fillRect(currentX, currentY, fillWidth, fillDistance);

            currentY = areaHeight - array[x] * yFactor;
            currentX += columnWidth;
            // TODO insert spaces between columns

        }

    }

    // temporary dummies
    drawPopup(){
        
    }
    redraw() {
        
    }
}


class areaChart{
    constructor(data){


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
    2: line2XChart,
    3: stackedBarChart,
    4: barChart,
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

let year1 = [4, 12, 2018]; //start and end months
let year2 = [1, 4, 2019];
let years = [year1, year2];


let filename;
function importDays(chartNumber, whereToAppend){
    for (let y = 0; y < years.length; y++){
        for (let m = years[y][0]; m < years[y][1] + 1; m++){
            let month = m;
            if (month < 10) {month = '0' + month;}
            let folder = `${years[y][2]}-${month}`;

            for (let d = 1; d < 31; d++){
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

// initiate each chart; also appends each to arrayOfNewCharts
for (let c = 1; c < 6; c++) {
    initiateNewCharts(c);
}


function heya(){
}
