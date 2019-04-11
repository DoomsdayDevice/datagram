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
    findPrettyMax: function (chart, xStart, xEnd){
        if(chart.constructor.name == "Chart"){
            ceiling = myMath.findPrettyMaxForLineChart(chart.lines, xStart, xEnd);
        } else if(chart.constructor.name == "barChart") {
            ceiling = myMath.findPrettyMaxForBarChart(chart.y, xStart, xEnd);
        } else if(chart.constructor.name == "stackedBarChart") {
            console.log("we're doing stacked inside prettyMax");
            console.log("the summedArray here:", chart.getSummedArray());
            // uses the sum of all arrays to find initial max
            ceiling = myMath.findPrettyMaxForBarChart(chart.getSummedArray(), xStart, xEnd);
        } else if(chart.constructor.name == "line2XChart") {
            ceiling = myMath.findPrettyMaxForLineChart(chart.lines, xStart, xEnd);
        }
        
        return ceiling;
    },
    findPrettyMaxForLineChart: function (listOfArrays, xStart, xEnd){
        //TODO findPrettyMax should take an array and return a max number

        // recursively call it for all the active arrays


        //find max THEN turn it into a pretty num
        let currentMax = 0;
        let slicedArray;
        for (let i=0; i < listOfArrays.length; i++){
            if (listOfArrays[i]["checkbox"].checked){
                slicedArray = listOfArrays[i]["array"].slice(xStart, xEnd+1);
                currentMax = Math.max(myMath.findMaxInArray(slicedArray), currentMax);
            }
        }
        // turn into pretty
        return myMath.findPrettyRoundNum(currentMax);

    },
    findPrettyMaxForBarChart: function(array, xStart, xEnd){
        let slicedArray = array.slice(xStart, xEnd+1);
        return myMath.findPrettyRoundNum(Math.max(...slicedArray));
    },
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
                drawGraphOnCheck(chart);
                drawMinimap(chart);
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
function initialConfiguration(chart){

    // finds the maxmimum array value to scale the graph ceiling
    calculateCutout(chart);
    // configuring the initial ceiling so that the drawing func can check against it
    // TODO optimize this

    // old ceilings are needed to track changes in graph heights
    // graphCeiling is needed to dynamically stop animations
    let initialGraphCeiling = myMath.findPrettyMax(chart, 0, chart.x.length); //TODO change to cutout size
    let initialMinimapCeiling = myMath.findPrettyMax(chart, 0, chart.x.length);
    console.log("we've configured the miniceil:", initialMinimapCeiling);

    // configuring parameters for drawing
    chart.graphDrawingParameters =
        new DrawingParameters(chart.gCtx, chart.x, null, null, 0, chart.graph.height - DATESPACE,
                              0, chart.graph.width, null, null, initialGraphCeiling, initialGraphCeiling, null,
                              chart.numOfVisibleGraphColumns);
    chart.minimapDrawingParameters =
        new DrawingParameters(chart.mCtx, chart.x, null, null, 0, chart.minimap.height,
                              0, chart.minimap.width, 0, chart.x.length - 1, initialMinimapCeiling, initialMinimapCeiling,
                              null, chart.x.length);
    
    // TODO is it better that each function has own opacity or maybe create a wrapper instead of
    // it being gloabal
    // chart.opacity = 1;
    drawHorizontalLineAboveText(chart);

}



function moveSlider(event, chart, movement){ // WRAPPER
    let movementX;

    if (event.type === "touchmove"){ // check if on mobile
        movementX = Math.round(event.touches[0].clientX - chart.previousTouchPosition);
        chart.previousTouchPosition = event.touches[0].clientX;
    } else {
        movementX = event.movementX;
    }

    // TODO THROTTLE WITH TIMESTAMPS FOR FAST MOVEMENT
    if (movementX != 0){
        actuallyMoveSlider(movementX, chart, movement);
    }
    
}
function actuallyMoveSlider(movementX, chart, movement){
    event.preventDefault();


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
    drawGraphOnMovement(chart);
    // TODO recalculate the position of the
    configureSlider(chart);

}
function configureSlider(chart){
    chart.sliderRect = chart.slider.getBoundingClientRect();
    chart.sliderWidth = parseInt(getComputedStyle(chart.slider).width);
}


function calculateCutout (chart) {
    // TODO gotta calc the columns and the offset
    // the offset is later used by drawgraph to calculate Translate
    let lPoint = parseInt(getComputedStyle(chart.slider).left);
    let rPoint = lPoint + parseInt(getComputedStyle(chart.slider).width);
    let mColumnWidth = chart.minimap.width / chart.x.length;
    chart.numOfVisibleGraphColumns = (rPoint - lPoint) / mColumnWidth;
    
    chart.sliderColumnStart = Math.floor(lPoint / mColumnWidth);
    chart.sliderColumnEnd = Math.ceil(rPoint / mColumnWidth);

    // offset: difference between the position of slider coords and closest column coords
    // gotta convert that to the graph offset in drawGraph
    chart.sliderOffset = lPoint - chart.sliderColumnStart * mColumnWidth;


    // TODO round this float probably


}
function configureGraphParams(chart){
    let xStart = chart.sliderColumnStart;
    let xEnd = chart.sliderColumnEnd;

    // TODO depending on the type - call appropriate func ceiling func
    let ceiling = myMath.findPrettyMax(chart, xStart, xEnd);
    // the offset of graph should be much bigger
    // accounting for the fact that graph is partial and minimap if full
    // divide by number of cutout columns and multiply by total number
    let xOffset = chart.sliderOffset / chart.minimap.width * chart.graph.width;
    let numOfCutColumns = chart.sliderColumnEnd - chart.sliderColumnStart;
    xOffset = xOffset / numOfCutColumns * chart.x.length;

    // checking if i need the animation
    chart.graphDrawingParameters.xStart = xStart;
    chart.graphDrawingParameters.xEnd = xEnd;
    chart.graphDrawingParameters.ceiling = ceiling;
    chart.graphDrawingParameters.xOffset = xOffset;
    chart.graphDrawingParameters.columnsOnCanvas = chart.numOfVisibleGraphColumns;

}

function drawHorizontalLineAboveText(chart){ // above dates
	  chart.iCtx.beginPath();
	  chart.iCtx.strokeStyle = "grey";
	  chart.iCtx.moveTo(0, chart.graph.height - DATESPACE + 2);
	  chart.iCtx.lineTo(chart.graph.width, chart.graph.height - DATESPACE + 2);
	  chart.iCtx.stroke();
}
function drawDates(chart, {xStart, xEnd, xOffset, xEndPoint, xStartPoint}) {
    // fired on every redraw (for optimization - only fire when slider is moved)
    chart.iCtx.clearRect(0, chart.graph.height - DATESPACE, chart.graph.width, DATESPACE);
    // takes the range start, end
    // better to draw chart with each line draw OR use the same formulas
    // TODO make new consts for repetitive formulas, like calc position with offset
    let columnWidth = (xEndPoint - xStartPoint) / (xEnd - xStart);
    
	  let dateSkipCounter = 0;
	  let skipFactor;
	  skipFactor = Math.floor(80 / columnWidth);


    let y = chart.graph.height - 5;
    let currentX = 0; 

	  chart.iCtx.font = "14px Helvetica"; //font for the numbers
	  chart.iCtx.fillStyle = "grey";
    for (let i = xStart; i < xEnd + 1; i++) {
        if (dateSkipCounter == 0) {
            // TODO finish rounding floats
            currentX = help.round((i - xStart) * columnWidth - xOffset);
            let date = new Date(chart.x[i]);
            date = MONTHS[date.getMonth()] + ' ' + date.getDate();
            chart.iCtx.fillText(date, currentX, y);

            // skipping some of them
            dateSkipCounter = skipFactor;
        } else {
            dateSkipCounter -= 1;
        }
    } 

		// if (iteration == 0 && dateSkipCounter == 0 && mode != "partial" &&
		//     chart.isAnyArrayActive()){
		//     let date = new Date(chart.x[i]);
		//     date = MONTHS[date.getMonth()] + ' ' + date.getDate();
		//     ctx.fillText(date, x, chart.graph.height - 5);

		//     // skipping some of them
		//     dateSkipCounter = skipFactor;
		// } else {
		//     dateSkipCounter -= 1;
		// }
}
function drawNumbers(chart, parameters) {
	  // drawing the numbers on the left side
	  let y = chart.graph.height - DATESPACE;
    chart.iCtx.clearRect(0, 0, chart.graph.width, y);
	  let curNum = 0;
    let rowStep = parameters.ceiling / NUMOFROWS;
    let rowHeight = (chart.graph.height - DATESPACE) / NUMOFROWS;
    // TODO round floats

	  chart.iCtx.font = "14px Helvetica"; //font for the numbers
	  chart.iCtx.fillStyle = "grey";
	  for (let i=0; i < NUMOFROWS; i++){
		    chart.iCtx.fillText(curNum, 20, y - 10);
		    curNum += rowStep;
		    y -= rowHeight;
	  }
    drawHorizontalLines(chart, parameters, rowHeight);

	  // if (chart.isAnyArrayActive()){ //in case no array is selected
	  //     drawNumbers();
	  // } else {
	  //     chart.iCtx.globalAlpha = 1 - chart.opacity;
	  //     chart.iCtx.font = `80px sans-serif`;
	  //     chart.iCtx.fillText("N/A", chart.graph.width / 2 - 40, chart.graph.height / 2);
	  // }

}

function drawMinimap(chart){ // PARENTS: createButtons, launchChart, 
    // TODO optimize ceiling calculations so i don't do them twice with drawGraph
    chart.mCtx.clearRect(0, 0, chart.minimap.width, chart.minimap.height);

    let ceiling = myMath.findPrettyMax(chart, 0, chart.x.length); //recal ceiling
    chart.minimapDrawingParameters.ceiling = ceiling;
    chart.minimapDrawingParameters.xOffset = 0; // mini doesn't need an offset
    console.log("drawing mini");

    // checking if i need to do an animation
    console.log("we're in the drawMinimap");
    if (chart.minimapDrawingParameters.oldCeiling != ceiling) {
        console.log("different ceilings");
        console.log("old:", chart.minimapDrawingParameters.oldCeiling);
        console.log("new:", ceiling);

        chart.animation(chart.minimapDrawingParameters);
        chart.minimapDrawingParameters.oldCeiling  = ceiling;
    } else {
        console.log("launching wrapper from mini");
        chart.drawWrapper(chart.minimapDrawingParameters);
    }

}
function drawGraphOnCheck(chart){
    configureGraphParams(chart);
    chart.drawGraph();
}
function drawGraphOnMovement(chart){
    calculateCutout(chart);
    configureGraphParams(chart);
    drawDates(chart, chart.graphDrawingParameters);
    chart.drawGraph();


}

function drawHorizontalLines(chart, {ctx}, rowHeight,){
    // TODO i prolly don't need the parameters object here
	  let drawLines = () =>{
        let x = 0;
        let xEnd = chart.graph.width;
	      let y = DATESPACE - 21;
	      for (let i = 0; i < NUMOFROWS; i++){
		        chart.iCtx.moveTo(x, y);
		        chart.iCtx.lineTo(xEnd, y);
		        y += rowHeight;
	      }
	  };
	  chart.iCtx.beginPath();
	  drawLines();

	  chart.iCtx.globalAlpha = 0.4;
	  chart.iCtx.lineWidth = "2";
	  chart.iCtx.strokeStyle = "grey";
    chart.iCtx.stroke();
	  chart.iCtx.globalAlpha = 1;
}
function declareChartVars(chart){
    chart.currentColumnCursor = null; // used to track which part of the info canv to redraw
    chart.numOfVisibleGraphColumns = null; // used to calculate number of columns on the screen
    chart.sliderOffset = null; //tracks diff between slider pos and closest column
    chart.previousTouchPosition = null; // for tracking finger movement

    chart.sliderColumnStart = null; // from slider; in calculateCutout()
    chart.sliderColumnEnd = null;
}
function launchChart(chart, data, title){
    console.log("doing ", title);
    chart.destructureData(data);
    createLayout(chart, title);
    initialConfiguration(chart);

    drawGraphOnMovement(chart);
    drawMinimap(chart);
    drawNumbers(chart, chart.graphDrawingParameters);
    // chart.drawHorizontalLine();
    
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
        declareChartVars(this);
        // this.currentColumnCursor = null; // used to track which part of the info canv to redraw
        // this.numOfVisibleGraphColumns = null; // used to calculate number of columns on the screen
        // this.sliderOffset = null; //tracks diff between slider pos and closest column
        // this.previousTouchPosition = null; // for tracking finger movement
        launchChart(this, data, title);

    }
    destructureData(data){

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

    drawGraph(){
        this.gCtx.clearRect(0, 0, this.graph.width, this.graph.height);
        // calculateCutout(this);
        if (this.graphDrawingParameters.oldCeiling != this.graphDrawingParameters.ceiling) { // TODO consider code optimization with drawMinimap
            this.animation(this.graphDrawingParameters);
            this.graphDrawingParameters.oldCeiling = this.graphDrawingParameters.ceiling;
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
                drawNumbers(this, parameters);
                counter += 1;
            }
        };
        requestAnimationFrame(drawAnimation);
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
        // TODO clear only what's necessary
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

window.addEventListener("resize", onResize);




// STAGE 2


class lineChart{
    // TODO merge with Chart
    constructor(){
        // importDays(1);
    }
}

class line2XChart{
    constructor(data){
        declareChartVars(this);
        // dummies TODO
        this.lines = [];

        let title = "LINE 2X + 2X";
        launchChart(this, data, title);

    }
    destructureData(data){

        this.x = data["columns"][0];
        // this.y = data["columns"][1];
        // this.x.splice(0, 1);
        // this.y.splice(0, 1);
        // this.color = data["colors"]["y0"];
    }
    // TODO dummies
    drawWrapper(){
        
    }
    drawGraph(){
        
    }
    drawPopup(){
        
    }
    animation(){
        
    }
}

class stackedBarChart{
    constructor(data){
        declareChartVars(this);
        // dummies TODO
        this.lines = [];

        let title = "STACKED + STACKED";
        launchChart(this, data, title);

    }
    destructureData(data){

        this.x = data["columns"][0];
        console.log("data:", data);
        // array of lines like in the first chart
        this.bars = [];
        for (let b = 1; b < data["columns"].length; b++){
            data["columns"][b].splice(0, 1);
            this.bars.push(data["columns"][b]);
        }
        // getting the colors
        this.colors = [];
        let color;
        let keys = Object.keys(data["colors"]);
        for (let c = 0; c < keys.length; c++){
            color = data.colors[keys[c]];
            this.colors.push(color);
        }
        // this.y = data["columns"][1];
        // this.x.splice(0, 1);
        // this.y.splice(0, 1);
        // this.color = data["colors"]["y0"];
    }
    // TODO dummies
    getSummedArray(xStart=0, xEnd=this.bars[0].length){
        // TODO change for all the active arrays
        // insert start and end
        let summedArray = [...this.bars[0].slice(xStart, xEnd+1)];
        let currentArray;
        for (let i= 1; i < this.bars.length; i++){
            currentArray = this.bars[i].slice(xStart, xEnd+1);
            for (let j = 0; j < currentArray.length; j++){
                summedArray[j] += currentArray[j];
            }
        }
        // send the array to find ceil
        let ceiling = myMath.findPrettyMaxForBarChart(summedArray, 0, summedArray.length);
        return summedArray;
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
            parameters.color = this.colors[b];
            parameters.yArray = this.bars[b];
            parameters.color = this.colors[b];
            parameters.yArray = this.bars[b];
            // HOW TO CALC X EACH ITER
            // subtract each step the calced bar height
            // currentY = this.graph.height - DATESPACE - currentBarHeight;
            // parameters.xStart = this.y;
            
            previousBarHeight = drawBars(this, parameters);
            // currentY = currentY - previousBarHeight;
            parameters.barOffset += previousBarHeight;
            // send the bar offset instead of Y, which will be the combined previous Widths
            // drawBars(this, parameters);
        }
        console.log("we launched the wrapper");
    }
    drawGraph(){
        // TODO clearing the canvas should prolly be done in the wrapper using the param ctx
        this.gCtx.clearRect(0, 0, this.graph.width, this.graph.height); 
        this.drawWrapper(this.graphDrawingParameters);
    }
    drawPopup(){
        
    }
    animation(){
        
    }
}

class barChart {
    constructor(data){
        declareChartVars(this);

        // dummies TODO
        this.lines = [];
        this.days = [];
        importDays(4, this.days);
        
        
        // let title = data["names"]["y0"];
        let title = "BARS + LINES";
        launchChart(this, data, title);

    }
    destructureData(data){
        this.x = data["columns"][0];
        this.y = data["columns"][1];
        this.x.splice(0, 1);
        this.y.splice(0, 1);
        this.color = data["colors"]["y0"];
    }

    // drawGraphOnMovement(){
    //     calculateCutout(this);
    //     configureGraphParams(this);
    //     drawDates(this, this.graphDrawingParameters);
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
        drawBars(this, parameters);
    }

    // TODO dummies
    drawPopup(){
        
    }
    animation(){
        
    }
}

function drawBars(chart, {ctx, yArray, xStart, xEnd, color, yEndPoint, yStartPoint, barOffset=0}){
    // let ceiling = Math.max(...yArray.slice(xStart, xEnd)); // TODO TEMP reuse old code and find pretty nums
    let ceiling = myMath.findPrettyMaxForBarChart(yArray, xStart, xEnd);
    // let areaHeight = //chart.graph.height - DATESPACE;
    let areaHeight = yEndPoint - yStartPoint;
    let areaWidth = chart.graph.width;

    let numOfColumns = xEnd - xStart;
    let columnWidth = chart.graph.width / numOfColumns;

    let numsPerPixel = areaHeight / ceiling; // TODO won't work with stacked bars

    let currentX = 0;
    let currentY = areaHeight - yArray[0] * numsPerPixel - barOffset;

    let fillDistance = chart.graph.height - DATESPACE - currentY; // on the Y axis
    let fillWidth = chart.graph.width / numOfColumns - 1; // on the X axis

    ctx.fillStyle = color;
    for (let x = xStart; x < xEnd; x++) {
        fillDistance = chart.graph.height - DATESPACE - currentY; // on the Y axis
        ctx.fillRect(currentX, currentY, fillWidth, fillDistance);

        currentY = areaHeight - yArray[x] * numsPerPixel;
        currentX += columnWidth;
        // TODO insert spaces between columns

    }
    // return the calculated stuff for
    // previous bar height (fill distance)
    return fillDistance; // for stacked bars

}

class areaChart{
    constructor(data){
        declareChartVars(this);
        // dummies TODO
        this.lines = [];

        let title = "AREA + AVERAGE PIE";
        launchChart(this, data, title);

    }
    destructureData(data){

        this.x = data["columns"][0];
        // this.y = data["columns"][1];
        // this.x.splice(0, 1);
        // this.y.splice(0, 1);
        // this.color = data["colors"]["y0"];
    }
    
    // TODO dummies
    drawWrapper(){
        
    }
    drawGraph(){
        
    }
    drawPopup(){
        
    }
    animation(){
        
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


