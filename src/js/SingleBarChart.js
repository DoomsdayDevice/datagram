'use strict';
import BarChart from './BarChart.js';
import {
  // MONTHS,
  // DAYS_OF_WEEK,
  // NUM_OF_ROWS,
  pixelRatio,
  // DATE_SPACE,
  // NUM_OF_FRAMES,
  // help,
  // NIGHT,
  // DAY,
  // SETTINGS,
  myMath
} from './utils.js';

export default class SingleBarChart extends BarChart{
  constructor(data){
    let title = "Bars";
    super(data, title);

    // TODO days
    // this.days = [];
    // importDays(4, this.days);

    // hide the button
    this.buttons.style.display = "none";

  }
  destructureData(data){
    super.destructureData(data);

    // this.x = data["columns"][0];
    this.y = data["columns"][1];
    // this.x.splice(0, 1);
    this.y.splice(0, 1);
    this.color = data["colors"]["y0"];
  }
  findPrettyMax(xStart, xEnd){
    let array = this.y; // TODO make for cutout
    let slicedArray = array.slice(xStart, xEnd + 1);
    return myMath.findPrettyRoundNum(Math.max(...slicedArray));
  }

  drawGraph(){
    let parameters = this.configureParametersForGraph();

    if (this.oldCeiling != parameters.ceiling) {
      if (!this.animationActive){

        this.animationActive = true;
        this.animation(parameters);

        this.oldCeiling = parameters.ceiling; // NOTE that it will change before anim end
      }
    } else {
      parameters.ctx.clearRect(0, 0, this.graph.width, this.graph.height);
      // this.drawLinesForAllActiveArrays(parameters);
      this.drawBars(parameters);
    }
    // if the ceiling has shifted - launch anim
  }
  drawGraphOld(){
    // this.drawBars(this.y, 300, this.x.length, this.color);
    let parameters = this.configureParametersForGraph();

    this.gCtx.clearRect(0, 0, this.graph.width, this.graph.height);
    this.drawBars(parameters);

  }
  animationFrame(parameters){
    this.drawBars(parameters);
  }
  drawMinimap(){
    let parameters = this.configureParametersForMinimap();

    this.mCtx.clearRect(0, 0, this.minimap.width, this.minimap.height);

    let ceiling = this.findPrettyMax(0, this.x.length); //recal ceiling
    parameters.ceiling = ceiling;
    this.drawBars(parameters);
  }
  drawBars(parameters){
    // wrapper for drawBars at BarChart, creates an array of offsets of 0 for compatibility with stacked charts

    parameters.yArray = this.y;
    parameters.color = this.color;

    let arrayOfOffsets = [];
    for (let x = 0; x < this.x.length; x++){
      arrayOfOffsets.push(0);
    }
    parameters.arrayOfOffsets = arrayOfOffsets;
    super.drawBars(parameters);
  }
  drawGraphPopup(currentArrayColumn, currentXPos, convertedYValue, conversionQuotient){
    // PARENT: drawPopup in Chart
    this.displayTooltip(currentArrayColumn, currentXPos / pixelRatio);

    // making a column transparent
    let parameters = this.configureParametersForGraph();
    parameters.selectedColumn = currentArrayColumn;
    this.gCtx.clearRect(0, 0, this.graph.width, this.graph.height);
    this.drawBars(parameters);
  }
}
