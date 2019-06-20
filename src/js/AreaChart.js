'use strict';
import Chart from './Chart.js';
import {
  MONTHS,
  // DAYS_OF_WEEK,
  NUM_OF_ROWS,
  pixelRatio,
  DATE_SPACE,
  NUM_OF_FRAMES,
  help,
  // NIGHT,
  // DAY,
  SETTINGS,
  myMath
} from './utils.js';

export default class AreaChart extends Chart{
  constructor(data){
    let title = "Area/Pie Chart";
    super(data, title);

    this.boundChangeMode = this.changeMode.bind(this);
    this.boundSelectPieceOfPie = this.selectPieceOfPie.bind(this);
    this.popup.addEventListener("click", this.boundChangeMode);
    // this.popup.addEventListener("touchstart", this.drawGraphWithAPie.bind(this));
    this.mode = "area";


    // adding the zoom button
    this.zoomButton = document.createElement("button");
    this.canvases.appendChild(this.zoomButton);
    this.zoomButton.className = "zoom-button";
    this.zoomButton.textContent = "Zoom Out";
    this.zoomButton.style.display = "none";
    this.zoomButton.addEventListener("click", this.changeMode.bind(this));

    this.periodText = document.createElement("p");
    this.canvases.appendChild(this.periodText);
    this.periodText.className = "period-text";
    this.periodText.textContent = "whoo";
    this.periodText.style.display = "none";

    this.piePopup = document.createElement("div");
    this.canvases.appendChild(this.piePopup);
    this.piePopup.className = "pie-popup";
    this.piePopup.style.display = "none";
  }
  changeMode(){
    if (this.mode == "area"){
      this.mode = "pie";
      this.gCtx.clearRect(0, 0, this.graph.width, this.graph.height);
      this.iCtx.clearRect(0, 0, this.info.width, this.info.height);
      this.drawGraphWithAPie();
      // hide popup
      this.pCtx.clearRect(0, 0, this.popup.width, this.popup.height);
      this.tooltip.style.display = "none";
      this.zoomButton.style.display = "block";
      this.periodText.style.display = "block";
      this.drawDates(this.configureParametersForGraph());
      this.popup.removeEventListener("click", this.boundChangeMode);
      this.popup.addEventListener("click", this.boundSelectPieceOfPie);
    } else {
      this.mode = "area";
      this.gCtx.clearRect(0, 0, this.graph.width, this.graph.height);
      // TODO draw numbers
      this.drawGraph();
      this.drawDates(this.configureParametersForGraph());
      this.drawNumbers();
      this.zoomButton.style.display = "none";
      this.periodText.style.display = "none";
      this.popup.addEventListener("click", this.boundChangeMode);
      this.popup.removeEventListener("click", this.boundSelectPieceOfPie);
    }
  }
  selectPieceOfPie(){
    // check if the x/y are inside the circle
    if (!this.selectedPie){
      this.selectedPie = 0;
    }
    this.selectedPie += 1;
    // if inactive += 1
    if (this.selectedPie == this.lines.length){
      this.selectedPie = -1;
      this.selectPieceOfPie();
    } else if (!this.lines[this.selectedPie].isActive){
      this.selectPieceOfPie();
    } else {
      this.drawGraphWithAPie();
      this.popPiePopup();

    }
    // if = lines length = set to 0 and repeat
    // otherwise - redraw with this parameter

    // scroll through them
  }
  configureParametersForGraph(){
    let parameters = super.configureParametersForGraph();
    parameters.displayNumbers = false;
    return parameters;
  }
  drawGraph(){
    let parameters = this.configureParametersForGraph();
    this.gCtx.clearRect(0, 0, this.graph.width, this.graph.height);
    let configuredArea = this.configureArea(parameters);
    let percentLines = configuredArea[0];
    let arrayOfOffsets = configuredArea[1];

    if (!this.oldGraphPercentLines){
      this.oldGraphPercentLines = percentLines; // used to track changes for animation
    }

    if (!myMath.arraysOfArraysAreEqual(percentLines, this.oldGraphPercentLines)){
      this.animation(parameters, this.oldGraphPercentLines, percentLines, arrayOfOffsets);
      this.oldGraphPercentLines = percentLines;
    } else {
      this.sendAllActiveToDrawArea(parameters, percentLines, arrayOfOffsets);
    }

  }
  drawMinimap(){
    let parameters = this.configureParametersForMinimap();

    this.mCtx.clearRect(0, 0, this.minimap.width, this.minimap.height);
    // this.drawWithAnArea(parameters);
    let configuredArea = this.configureArea(parameters);
    let percentLines = configuredArea[0];
    let arrayOfOffsets = configuredArea[1];

    if (!this.oldMinimapPercentLines){
      this.oldMinimapPercentLines = percentLines; // used to track changes for animation
    }

    if (!myMath.arraysOfArraysAreEqual(percentLines, this.oldMinimapPercentLines)){
      this.animation(parameters, this.oldMinimapPercentLines, percentLines, arrayOfOffsets);
      this.oldMinimapPercentLines = percentLines;
    } else {
      this.sendAllActiveToDrawArea(parameters, percentLines, arrayOfOffsets);
    }
  }
  animationFrame(parameters){
    this.drawWithAnArea(parameters);
  }
  configureArea(parameters){

    parameters.floorArray = this.lines[0];// floorArray;
    parameters.roofArray = this.lines[0];
    parameters.color = this.lines[0].color;

    let percentLines = []; //array of arrays TODO really huge floats
    let arrayOfOffsets = [];

    // translating each array into an array of percentages
    // STEP 1: finding the sum of all active arrays
    let sumArray = [];
    for (let x = 0; x < this.x.length; x++){ // create an empty sum array
      sumArray.push(0);
    }
    for(let x = 0; x < this.x.length; x++){
      // sum all Y's
      for (let y = 0; y < this.lines.length; y++) {
        if (this.lines[y].isActive){
          sumArray[x] += this.lines[y].array[x];
        }
      }
      // creating array of offsets for drawArea
      arrayOfOffsets.push(1);
    }

    // STEP 2: finding % of each array relative to sum
    // for each Y - divide the sum by that and add to corresponding sumarray
    for (let y = 0; y < this.lines.length; y++) {
      percentLines.push([]);
      for (let x = 0; x < this.x.length; x++){
        if (!this.lines[y].isActive){ // NOTE
          percentLines[y].push(0);
        } else{
          percentLines[y].push(1 / sumArray[x] * this.lines[y].array[x]);
        }
      }
      // TODO if turned off - push all 0s

    }
    return [percentLines, arrayOfOffsets];
  }
  sendAllActiveToDrawArea(parameters, percentLines, arrayOfOffsets){
    for (let y = 0; y < percentLines.length; y++){
      if (this.lines[y].isActive || this.lines[y] == this.justBeenRemoved){
        parameters.arrayOfOffsets = arrayOfOffsets;
        parameters.yArray = percentLines[y];
        parameters.color = this.lines[y].color;
        this.drawArea(parameters);

      }
    }
  }
  drawGraphOnMovement(){
    this.drawDates(this.configureParametersForGraph());
    if (this.mode == "pie"){
      this.drawGraphWithAPie();
    } else {
      this.drawGraph();
    }
  }
  drawGraphOnCheck(){
    if (this.mode == "pie"){
      this.drawGraphWithAPie();
    } else {
      this.drawGraph();
    }
  }
  drawGraphWithAPie(){
    let cutout = this.calculateCutout();
    let xStart = cutout.sliderColumnStart;
    let xEnd = cutout.sliderColumnEnd;
    this.gCtx.clearRect(0, 0, this.graph.width, this.graph.height);

    // sum up each array and find a relatinship and convert that to a percentarr
    let sum;
    let arrayOfSums = [];
    for (let y = 0; y < this.lines.length; y++){
      sum = 0;
      if (this.lines[y].isActive){
        for (let x = xStart; x < xEnd; x++) {
          sum += this.lines[y].array[x];
        }
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
      if(this.lines[y].isActive){
        this.drawPie(percentPie[y], currentPieOffset, this.lines[y].color, y);
        currentPieOffset += percentPie[y];
      }
    }

  }
  drawArea({ctx, arrayOfOffsets, yArray, color, xEndPoint, xStartPoint, ceiling, yEndPoint, yStartPoint, xStart, xEnd, xOffset, columnsOnCanvas}){
    // takes an array of percentages of graph width
    // use the given percentage and multiply areaHeight by it
    // let yEndPoint = this.graph.height - DATE_SPACE;
    // let yStartPoint = 0;
    let areaHeight = yEndPoint - yStartPoint;
    let areaWidth = xEndPoint - xStartPoint;

    // let xStart = 0;
    // let xEnd = this.x.length;

    let columnWidth = areaWidth / columnsOnCanvas;

    let numsPerPixel = areaHeight / ceiling;


    let currentY;
    let currentX = xStartPoint - xOffset;

    ctx.beginPath();

    ctx.lineTo(0, areaHeight);
    for (let x = xStart; x < xEnd + 1; x++) {
      // draw a line and add the corresponding offset, then add that line's height to it
      currentX = help.round((x - xStart) * columnWidth) - xOffset;
      // currentY = yEndPoint - help.round( yArray[i] * numsPerPixel ) - yStartPoint;

      currentY = help.round(areaHeight - (arrayOfOffsets[x] + yArray[x] * numsPerPixel) * areaHeight);
      ctx.lineTo(currentX, currentY);

      // currentX += columnWidth;



      arrayOfOffsets[x] -= yArray[x];
    }
    ctx.lineTo(this.graph.width, areaHeight);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    // in every X iteration add to the array of offsets
    // currentOffset - the areaHeight * percentage of all the previous lines
  }

  drawPie(pieceOfPie, pieOffset, color, pieNum){
    // takes

    // takes a percentage value and starting radian
    // draws an arc based on that
    let ctx = this.gCtx;
    let xPos = this.graph.width / 2;
    let yPos = this.graph.height / 2;

    let radius = 120 * pixelRatio;
    let startAngle = pieOffset * Math.PI * 2;
    let endAngle = startAngle + Math.PI * 2 * pieceOfPie;

    if (pieNum == this.selectedPie){
      // ctx.fillStyle = "red";
      xPos = (radius / 5) * Math.cos(startAngle + (endAngle - startAngle) / 2) + xPos;
      yPos = (radius / 5) * Math.sin(startAngle + (endAngle - startAngle) / 2) + yPos;
      // this.selectedPie = null;
    }


    ctx.beginPath();
    ctx.arc(xPos, yPos, radius, startAngle, endAngle);

    // now draw path to center and close path
    ctx.lineTo(xPos, yPos);

    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    // draw %% in the middle; font depends on the size
    let fontSize = 16 * pixelRatio * Math.log10(pieceOfPie* 80);
    pieceOfPie = Math.round(pieceOfPie * 100);
    let text = `${pieceOfPie}%`;

    let x = (radius / 2) * Math.cos(startAngle + (endAngle - startAngle) / 2) + xPos;
    let y = (radius / 2) * Math.sin(startAngle + (endAngle - startAngle) / 2) + yPos;
    // let adjustedX = (radius / 2) * Math.cos(startAngle + (endAngle - startAngle) / 2) +
    //     (x - fontSize / 2);
    // let adjustedY = (radius / 2) * Math.sin(startAngle + (endAngle - startAngle) / 2) +
    //     (y + 1);
    x = x - fontSize / 2;
    y = y + fontSize / 2;
    ctx.font = `${fontSize}px Verdana`;
    ctx.fillStyle = "white";
    // ctx.fillText (text, x, adjustedY);
    ctx.fillText (text, x, y);


    // ctx.strokeStyle = color;
    // ctx.stroke();

  }
  drawGraphPopup(currentArrayColumn, currentXPos, convertedYValue, conversionQuotient){
    if (this.mode == "area"){
      this.pCtx.clearRect(0, 0, this.popup.width, this.popup.height);
      this.displayTooltip(currentArrayColumn, currentXPos / pixelRatio);
      this.drawVerticalLine(currentXPos);
    }
    // this.drawCircles(convertedYValue, conversionQuotient, currentXPos, currentArrayColumn);
  }
  popPiePopup(){
    let parameters = this.configureParametersForGraph();

    let left = this.piePopup.getBoundingClientRect().left;
    let top = this.piePopup.getBoundingClientRect().top;
    this.piePopup.style.left = window.event.clientX - left + "px";
    this.piePopup.style.top = window.event.clientY - top + "px";

    let name;
    let style;
    let percentage;
    let sumOfItems = 0;

    let sumOfCurArr = 0;
    let averageOfCurArr = 0;
    for (let i in this.lines){
      if (this.lines[i].isActive){
        for (let x = parameters.xStart; x < parameters.xEnd; x++){
          sumOfCurArr += this.lines[i]["array"][x];
        }
        averageOfCurArr = sumOfCurArr / (parameters.xEnd = parameters.xStart);
        sumOfItems += averageOfCurArr; //this.lines[i]["array"][currentArrayColumn];
        sumOfCurArr = 0;
      }
    }
    // calc average from start to end
    let sum = 0;
    for (let x = parameters.xStart; x < parameters.xEnd; x++){
      sum += this.lines[this.selectedPie]["array"][x];
    }
    let average = sum / (parameters.xEnd-parameters.xStart);


    name = this.lines[this.selectedPie]["checkboxName"];
    style = `margin: 10px; color: ${this.lines[this.selectedPie]["color"]}`;
    percentage = (Math.round(100 / sumOfItems * average));

    this.piePopup.innerHTML =
      `<div style="${style}"><p class="item"><span class="percentage">${percentage}%</span><span class="name">${name}</span><p class="number">${average}</></div>`;

    // this.piePopup.style.display = "block";
  }
  addItemsToTooltip(currentArrayColumn){
    // Displaying each item
    let number;
    let name;
    let style;
    let percentage;


    // sum all the items in that array
    let sumOfItems = 0;
    for (let i in this.lines){
      if (this.lines[i].isActive){
        sumOfItems += this.lines[i]["array"][currentArrayColumn];

      }
    }



    for (let i in this.lines){
      if (this.lines[i].isActive){
        // get the date
        number = this.lines[i]["array"][currentArrayColumn];
        name = this.lines[i]["checkboxName"];
        style = `margin: 10px; color: ${this.lines[i]["color"]}`;
        percentage = (Math.round(100 / sumOfItems * number));

        this.tooltip.innerHTML +=
          `<div style="${style}"><p class="item"><span class="percentage">${percentage}%</span><span class="name">${name}</span><p class="number">${number}</></div>`;

      }
    }
  }

  displayTooltip(currentArrayColumn, currentXPos){
    super.displayTooltip(currentArrayColumn, currentXPos);
    let width = this.tooltip.offsetWidth;
    this.tooltip.style.left = currentXPos - width - 50 + "px";

    let left = this.tooltip.offsetLeft;
    if (left < this.graph.offsetLeft) {
      this.tooltip.style.left = currentXPos + 50 + "px";
    }
    // if (left + width > innerWidth){
    //     this.tooltip.style.left = innerWidth - (left + width);
    // }
    if ((left + width) > innerWidth){
      this.tooltip.style.left = innerWidth - (left + width) + "px";
    }

  }
  drawNumbers(){
    let y = this.graph.height - DATE_SPACE * pixelRatio / 1.5;
    this.iCtx.clearRect(0, 0, this.graph.width, y);
    let rowHeight = (this.graph.height - DATE_SPACE) / (NUM_OF_ROWS - 1);
    let curNum = 20;
    let rowStep = 20;


    let xPosition = 20;
    this.iCtx.font = `${SETTINGS.fontSize}px Helvetica`; //font for the numbers
    this.iCtx.fillStyle = "white";
    this.iCtx.strokeStyle = "white";

    for (let i=0; i < NUM_OF_ROWS -1; i++){
      this.iCtx.fillText(myMath.formatNumber(curNum, true), xPosition, y - 50);
      curNum += rowStep;
      y -= rowHeight;
    }
    this.iCtx.lineWidth = 1 * pixelRatio;

    this.drawHorizontalLines(rowHeight);
  }
  // drawHorizontalLines(rowHeight){
  //     let drawLines = () =>{
  //         let x = 0;
  //         let xEnd = this.graph.width;
  //         let y = DATE_SPACE - 21;
  //         for (let i = 0; i < NUM_OF_ROWS; i++){
  //             this.iCtx.moveTo(x, y);
  //             this.iCtx.lineTo(xEnd, y);
  //             y += rowHeight;
  //         }
  //     };
  //     this.iCtx.beginPath();
  //     drawLines();

  //     this.iCtx.globalAlpha = 0.2;
  //     this.iCtx.lineWidth = "2";
  //     this.iCtx.strokeStyle = "grey";
  //     this.iCtx.stroke();
  //     this.iCtx.globalAlpha = 1;
  // }
  drawDates(parameters){
    if (this.mode == "pie"){
      let dateStart = new Date(this.x[parameters.xStart]);
      dateStart = MONTHS[dateStart.getMonth()] + ' ' + dateStart.getDate();

      let dateEnd = new Date(this.x[parameters.xEnd]);
      dateEnd = MONTHS[dateEnd.getMonth()] + ' ' + dateEnd.getDate();
      this.periodText.textContent = `${dateStart} - ${dateEnd}`;

    } else {
      super.drawDates(parameters);
    }
  }
  animation(parameters, oldPercentLines, newPercentLines, arrayOfOffsets){
    let arrayOfDistributedDifferences;
    // take values from first
    // note that it's an array of arrays; also that i cannot mutate the old one or new one
    let clonedNewPercentLines = myMath.cloneNestedArray(newPercentLines);
    myMath.subtractSecondNestedFromFirst(clonedNewPercentLines, oldPercentLines);
    // now that the clone is the difference, divide it by num of frames
    myMath.divideNestedArrayByNum(clonedNewPercentLines, NUM_OF_FRAMES);
    arrayOfDistributedDifferences = clonedNewPercentLines;

    // so i can mutate it during animation
    let clonedOldPercentLines = myMath.cloneNestedArray(oldPercentLines);

    let currentFrame = 1;
    this.drawAreaAnimation(parameters, currentFrame, clonedOldPercentLines, arrayOfOffsets,
                           arrayOfDistributedDifferences);
  }
  drawAreaAnimation(parameters, currentFrame, oldPercentLines, arrayOfOffsets,
                    arrayOfDistributedDifferences){
    // currentArray = Old * distributedDifference;

    if (currentFrame < NUM_OF_FRAMES){
      requestAnimationFrame(() => {
        this.drawAreaAnimation(parameters, currentFrame, oldPercentLines, arrayOfOffsets,
                               arrayOfDistributedDifferences);
      });


      // cloning array of offsets before animation so it doesn't mutate it
      let clonedArrayOfOffsets = [...arrayOfOffsets];
      this.sendAllActiveToDrawArea(parameters, oldPercentLines, clonedArrayOfOffsets); // NOTE maybe clone

      // add distributed difference to the old array
      myMath.addSecondNestedArrayToFirst(oldPercentLines, arrayOfDistributedDifferences);
      currentFrame += 1;
    } else {
      this.justBeenRemoved = null;
      this.justBeenSelected = null;
      this.animationActive = false;
      if (this.mode == "area"){
        this.drawGraph();
      }
      this.drawMinimap();
    }
  }

}
