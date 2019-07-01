import {
  SETTINGS,
  PIXEL_RATIO,
  DATE_SPACE,
  myMath,
  NUM_OF_ROWS,
  NUM_OF_FRAMES,
  help,
  MONTHS,
  DAYS_OF_WEEK,
  DAY,
  NIGHT,
  detectMobile
} from './utils.js';
import DrawingParameters from './DrawingParameters.js';

export default class Chart {
  constructor(data, title) {
    // global vars
    this.previousTouchPosition = null; // for tracking finger movement
    this.animationActive = false; // one animation at a time
    this.oldCeiling = 0;
    this.oldMinimapCeiling = 0;
    this.then = Date.now();

    this.lines = [];

    this.destructureData(data);

    this.createLayout(title);
    this.initialConfiguration();

    this.drawGraphOnMovement();
    this.drawMinimap();
    this.drawNumbers(
      this.configureParametersForGraph().ceiling,
      1,
      NUM_OF_FRAMES
    );
  }
  destructureData(data) {
    // takes the passed data and converts into objects i can easily work with
    let yArrays = [];
    for (let l = 1; l < data['columns'].length; l++) {
      data['columns'][l].splice(0, 1);
      yArrays.push(data['columns'][l]);
    }
    for (let y = 0; y < yArrays.length; y++) {
      this.lines.push({
        name: data.names[y],
        array: yArrays[y],
        color: data.colors['y' + y],
        isActive: true,
        checkboxName: data.names['y' + y]
      });
    }

    this.x = [];
    this.x = data['columns'][0];
    this.x.splice(0, 1);
  }

  createLayout(title) {
    this.createMainElements(title);
    this.createSlider();
    this.createButtons();
    this.createTooltip();
  }
  findPrettyMax(xStart, xEnd) {
    //TODO findPrettyMax should take an array and return a max number

    // recursively call it for all the active arrays

    //find max THEN turn it into a pretty num
    let currentMax = 0;
    let slicedArray;
    let listOfArrays = this.lines;
    for (let i = 0; i < listOfArrays.length; i++) {
      if (listOfArrays[i].isActive) {
        slicedArray = listOfArrays[i]['array'].slice(xStart, xEnd + 1);
        currentMax = Math.max(myMath.findMaxInArray(slicedArray), currentMax);
      }
    }
    // turn into pretty
    return myMath.findPrettyRoundNum(currentMax);
  }
  initialConfiguration() {
    // this.calculateCutout();
    this.drawHorizontalLineAboveText();
  }

  createMainElements(title) {
    // main div

    this.div = document.createElement('div');

    document.querySelector('.charts-container').appendChild(this.div);
    this.div.className = 'chart';
    if (detectMobile()) {
      this.div.style.width = innerWidth + 'px';
      this.div.style.left = '0 px';
    } else {
      this.div.style.width = SETTINGS.canvasWidth + 'px';
    }

    // title
    let titleElem = document.createElement('h1');
    this.div.appendChild(titleElem);
    titleElem.textContent = title;

    // div for canvases
    this.canvases = document.createElement('div');
    this.div.appendChild(this.canvases);
    this.canvases.className = 'chart__canvases';

    //graph
    this.graph = document.createElement('canvas');
    this.canvases.appendChild(this.graph);
    this.gCtx = this.graph.getContext('2d');

    this.graph.width = SETTINGS.canvasWidth;
    this.graph.height = SETTINGS.canvasHeight;

    this.graph.style.width = this.graph.width + 'px';
    this.graph.style.height = this.graph.height + 'px';
    this.graph.width *= PIXEL_RATIO;
    this.graph.height *= PIXEL_RATIO;

    // canvas for LINES NUMBERS DATES
    this.info = document.createElement('canvas');
    this.canvases.appendChild(this.info);
    this.info.className = 'chart__info-canvas';

    this.iCtx = this.info.getContext('2d');

    this.info.width = SETTINGS.canvasWidth;
    this.info.height = SETTINGS.canvasHeight;
    this.info.style.width = this.info.width + 'px';
    this.info.style.height = this.info.height + 'px';
    this.info.width *= PIXEL_RATIO;
    this.info.height *= PIXEL_RATIO;

    // canvas for the POPUP
    this.popup = document.createElement('canvas');
    this.canvases.appendChild(this.popup);
    this.popup.className = 'chart__info-canvas';

    this.pCtx = this.popup.getContext('2d');
    this.popup.width = SETTINGS.canvasWidth;
    this.popup.height = SETTINGS.canvasHeight;
    this.popup.style.width = this.popup.width + 'px';
    this.popup.style.height = this.popup.height + 'px';
    this.popup.width *= PIXEL_RATIO;
    this.popup.height *= PIXEL_RATIO;

    this.popup.addEventListener('mousemove', this.drawPopup.bind(this));
    this.popup.addEventListener('touchstart', () => {
      this.popup.addEventListener('touchmove', this.drawPopup.bind(this));
      this.popup.addEventListener('touchend', () => {
        this.popup.removeEventListener('touchmove', this.drawPopup);
        this.tooltip.style.opacity = '0';
        this.tooltip.style.display = 'none';

        this.pCtx.clearRect(0, 0, this.popup.width, this.popup.height);
      });
    });

    // container for the minimap and the slider
    this.miniDiv = document.createElement('div');
    this.div.appendChild(this.miniDiv);
    this.miniDiv.className = 'chart__minimap';

    this.minimap = document.createElement('canvas');
    this.miniDiv.appendChild(this.minimap);
    this.mCtx = this.minimap.getContext('2d');
    this.minimap.width = SETTINGS.canvasWidth * 0.97;
    this.minimap.height = SETTINGS.minimapHeight;

    this.minimap.style.width = this.minimap.width + 'px';
    this.minimap.style.height = this.minimap.height + 'px';
    this.minimap.width *= PIXEL_RATIO;
    this.minimap.height *= PIXEL_RATIO;
  }
  createSlider() {
    this.lSpace = document.createElement('div');
    this.lSpace.className = 'left-space';

    this.rSpace = document.createElement('div');
    this.rSpace.className = 'right-space';

    this.slider = document.createElement('div');
    this.slider.className = 'slider';

    // sizes
    this.lSpace.style.height = this.minimap.style.height;
    this.slider.style.height = parseInt(this.minimap.style.height) - 6 + 'px';
    this.rSpace.style.height = this.minimap.style.height;

    this.lSpace.style.left = 0 + 'px';
    this.lSpace.style.width = parseInt(this.minimap.style.width) * 0.7 + 'px';

    this.slider.style.left =
      parseInt(this.lSpace.style.left) +
      parseInt(this.lSpace.style.width) +
      'px';
    this.slider.style.width =
      parseInt(this.minimap.style.width) * 0.3 - 11 + 'px';

    this.rSpace.style.left =
      parseInt(this.slider.style.left) +
      parseInt(this.slider.style.width) +
      12 +
      'px';

    this.rSpace.style.width =
      parseInt(this.minimap.style.width) -
      parseInt(this.rSpace.style.left) +
      'px';

    this.miniDiv.appendChild(this.lSpace);
    this.miniDiv.appendChild(this.slider);
    this.miniDiv.appendChild(this.rSpace);

    let moveSliderLeft = event => {
      this.moveSlider(event, 'left');
    };
    let moveSliderRight = event => {
      this.moveSlider(event, 'right');
    };
    let moveSliderMiddle = event => {
      this.moveSlider(event, 'mid');
    };

    let mouseMovement = () => {
      let addMovementListener = moveFunction => {
        window.addEventListener('mousemove', moveFunction);

        window.addEventListener('mouseup', function() {
          window.removeEventListener('mousemove', moveFunction);
        });
      };

      this.slider.addEventListener('mousedown', () => {
        let sliderRect = this.slider.getBoundingClientRect();

        if (window.event.clientX < sliderRect.left + 20) {
          addMovementListener(moveSliderLeft);
        } else if (
          window.event.clientX >
          sliderRect.left + parseInt(getComputedStyle(this.slider).width) - 20
        ) {
          addMovementListener(moveSliderRight);
        } else {
          addMovementListener(moveSliderMiddle);
        }
      });
    };

    // mobile touch support
    let mobileTouch = () => {
      function addMovementListener(moveFunction) {
        window.addEventListener('touchmove', moveFunction);

        window.addEventListener('touchend', () => {
          window.removeEventListener('touchmove', moveFunction);
        });
      }

      this.slider.addEventListener('touchstart', () => {
        this.previousTouchPosition = window.event.touches[0].clientX;
        let sliderLeft = this.slider.getBoundingClientRect().left;

        if (window.event.touches[0].clientX < sliderLeft + 20) {
          addMovementListener(moveSliderLeft);
        } else if (
          window.event.touches[0].clientX >
          sliderLeft + parseInt(getComputedStyle(this.slider).width) - 20
        ) {
          addMovementListener(moveSliderRight);
        } else {
          addMovementListener(moveSliderMiddle);
        }
      });
    };
    mouseMovement();
    mobileTouch();

    let cursorListener = () => {
      this.configureSlider();
      this.slider.addEventListener('mousemove', event => {
        if (event.clientX - this.sliderRect.left < 20) {
          this.slider.style.cursor = 'w-resize';
        } else if (event.clientX > this.sliderRect.left + this.sliderWidth) {
          this.slider.style.cursor = 'e-resize';
        } else {
          this.slider.style.cursor = 'move';
        }
      });
    };
    cursorListener();
  }
  createButtons() {
    let buttons = document.createElement('div');
    this.buttons = buttons; // to refer to in singleBarChart to hide it
    this.div.appendChild(buttons);
    for (let i = 0; i < this.lines.length; i++) {
      let label = document.createElement('label');
      buttons.appendChild(label);
      label.className = 'button-container';

      let input = document.createElement('input');
      input.type = 'checkbox';
      label.appendChild(input);
      input.checked = true;
      input.addEventListener('click', () => {
        if (input.checked === false) {
          this.justBeenRemoved = this.lines[i];
          this.lines[i].isActive = false;
        } else {
          this.justBeenSelected = this.lines[i];
          this.lines[i].isActive = true;
        }
        this.drawGraphOnCheck();
        this.drawMinimapOnCheck();
      });
      this.lines[i]['checkbox'] = input;

      let checkmark = document.createElement('span');
      label.appendChild(checkmark);
      //put text inside
      let text = document.createElement('p');
      label.appendChild(text);
      text.appendChild(document.createTextNode(this.lines[i].checkboxName));

      checkmark.className = 'checkmark';
      // assign the border as the color
      let color = this.lines[i]['color'];
      checkmark.style.border = '2px solid ' + color;
      checkmark.style.backgroundColor = color;
      input.addEventListener('change', function() {
        if (this.checked) {
          checkmark.style.backgroundColor = color;
        } else {
          checkmark.style.backgroundColor = document.body.style.backgroundColor;
        }
      });
    }

    let clrDiv = document.createElement('div');
    buttons.appendChild(clrDiv);
    clrDiv.style.clear = 'both';
  }
  createTooltip() {
    this.tooltip = document.createElement('div');
    this.div.appendChild(this.tooltip);
    this.tooltip.className = 'chart__tooltip';
    // this.tooltip.style.backgroundColor = DAY.lead;
  }

  calculateCutout() {
    // TODO gotta calc the columns and the offset
    // the offset is later used by drawgraph to calculate Translate
    let lPoint = parseInt(getComputedStyle(this.slider).left);
    let rPoint = lPoint + parseInt(getComputedStyle(this.slider).width);
    let mColumnWidth = this.minimap.width / this.x.length;

    let sliderColumnStart = Math.floor(lPoint / mColumnWidth);
    let sliderColumnEnd = Math.ceil(rPoint / mColumnWidth);
    let sliderOffset = lPoint - sliderColumnStart * mColumnWidth;
    let numOfVisibleGraphColumns = (rPoint - lPoint) / mColumnWidth;

    // TODO round this float probably
    // offset: difference between the position of slider coords and closest column coords
    // gotta convert that to the graph offset in drawGraph

    let cutout = {
      sliderColumnStart: sliderColumnStart,
      sliderColumnEnd: sliderColumnEnd,
      sliderOffset: sliderOffset,
      numOfVisibleGraphColumns: numOfVisibleGraphColumns
    };
    return cutout;
  }

  moveSlider(event, movement) {
    // WRAPPER
    event.preventDefault();
    let movementX;

    if (event.type === 'touchmove') {
      // check if on mobile
      movementX = Math.round(
        event.touches[0].clientX - this.previousTouchPosition
      );
      this.previousTouchPosition = event.touches[0].clientX;
    } else {
      movementX = event.movementX;
    }

    // TODO THROTTLE WITH TIMESTAMPS FOR FAST MOVEMENT
    if (movementX != 0 && this.isAnyArrayActive()) {
      this.actuallyMoveSlider(movementX, movement);
    }
  }
  actuallyMoveSlider(movementX, movement) {
    let sliderStyle = getComputedStyle(this.slider);
    let lSpaceStyle = getComputedStyle(this.lSpace);
    let rSpaceStyle = getComputedStyle(this.rSpace);
    let border = parseInt(sliderStyle.borderRightWidth) * 2;

    let moveMiddle = () => {
      this.lSpace.style.width = parseInt(lSpaceStyle.width) + movementX + 'px';

      this.rSpace.style.left = parseInt(rSpaceStyle.left) + movementX + 'px';
      this.rSpace.style.width = parseInt(rSpaceStyle.width) - movementX + 'px';

      this.slider.style.left = parseInt(sliderStyle.left) + movementX + 'px';

      if (parseInt(sliderStyle.left) < 0) {
        this.lSpace.style.width =
          parseInt(sliderStyle.left) - border / 2 + 'px';

        this.slider.style.left = parseInt(sliderStyle.left) - movementX + 'px';
        this.rSpace.style.left = parseInt(rSpaceStyle.left) - movementX + 'px';
        this.rSpace.style.width =
          parseInt(rSpaceStyle.width) + movementX + 'px';
      }
      if (
        parseInt(sliderStyle.left) + parseInt(sliderStyle.width) >
        parseInt(this.minimap.style.width) - border
      ) {
        this.slider.style.left = parseInt(sliderStyle.left) - movementX + 'px';

        this.lSpace.style.width =
          parseInt(lSpaceStyle.width) - movementX + 'px';

        this.rSpace.style.left =
          parseInt(sliderStyle.left) +
          parseInt(sliderStyle.width) +
          border +
          'px';
        this.rSpace.style.width =
          parseInt(this.minimap.style.width) -
          parseInt(this.rSpace.style.left) +
          'px';
      }
    };

    let moveLeft = () => {
      this.lSpace.style.width = parseInt(lSpaceStyle.width) + movementX + 'px';

      this.slider.style.left = parseInt(sliderStyle.left) + movementX + 'px';
      this.slider.style.width = parseInt(sliderStyle.width) - movementX + 'px';

      if (parseInt(sliderStyle.left) < 0) {
        // side of screen

        this.lSpace.style.width =
          parseInt(sliderStyle.left) - border / 2 + 'px';

        this.slider.style.left = parseInt(sliderStyle.left) - movementX + 'px';
        this.slider.style.width =
          parseInt(sliderStyle.width) + movementX + 'px';
      }

      if (parseInt(sliderStyle.width) < SETTINGS.minSliderWidth) {
        this.lSpace.style.width =
          parseInt(lSpaceStyle.width) - movementX + 'px';

        this.slider.style.left = parseInt(sliderStyle.left) - movementX + 'px';
        this.slider.style.width =
          parseInt(sliderStyle.width) + movementX + 'px';
      }
    };

    let moveRight = () => {
      this.slider.style.width = parseInt(sliderStyle.width) + movementX + 'px';

      this.rSpace.style.left = parseInt(rSpaceStyle.left) + movementX + 'px';
      this.rSpace.style.width = parseInt(rSpaceStyle.width) - movementX + 'px';

      if (
        parseInt(sliderStyle.left) + parseInt(sliderStyle.width) >
        parseInt(this.minimap.style.width) - border
      ) {
        this.slider.style.width =
          parseInt(sliderStyle.width) - movementX + 'px';

        this.rSpace.style.left =
          parseInt(sliderStyle.left) +
          parseInt(sliderStyle.width) +
          border +
          'px';
        this.rSpace.style.width =
          parseInt(this.minimap.style.width) -
          parseInt(this.rSpace.style.left) +
          'px';
      }

      if (parseInt(sliderStyle.width) < SETTINGS.minSliderWidth) {
        this.slider.style.width =
          parseInt(sliderStyle.width) - movementX + 'px';

        this.rSpace.style.left = parseInt(rSpaceStyle.left) - movementX + 'px';
        this.rSpace.style.width =
          parseInt(rSpaceStyle.width) + movementX + 'px';
      }
    };

    // checking mouse position on the button
    movement === 'left'
      ? moveLeft()
      : movement === 'right'
      ? moveRight()
      : moveMiddle();

    // apply all that shit
    let fps = 30;
    let now = Date.now();
    let elapsed = now - this.then;
    let fpsInterval = 1000 / fps;

    if (elapsed > fpsInterval) {
      this.then = now - (elapsed % fpsInterval);
      this.drawGraphOnMovement();
    }

    // TODO recalculate the position of the
    this.configureSlider();
  }
  configureSlider() {
    this.sliderRect = this.slider.getBoundingClientRect();
    this.sliderWidth = parseInt(getComputedStyle(this.slider).width);
  }

  drawGraphOnCheck() {
    this.drawGraph(true);
  }
  drawMinimapOnCheck() {
    this.drawMinimap(true);
  }
  drawGraphOnMovement() {
    this.drawDates(this.configureParametersForGraph());
    this.drawGraph();
  }

  configureParametersForGraph() {
    let parameters = new DrawingParameters();

    let cutout = this.calculateCutout();
    let xStart = cutout.sliderColumnStart;
    let xEnd = cutout.sliderColumnEnd;
    // let initialGraphCeiling = this.findPrettyMax(0, this.x.length); //TODO change to cutout size
    let ceiling = this.findPrettyMax(xStart, xEnd);

    // configuring the offset
    let xOffset = (cutout.sliderOffset / this.minimap.width) * this.graph.width;
    let numOfCutColumns = cutout.sliderColumnEnd - cutout.sliderColumnStart;
    xOffset = (xOffset / numOfCutColumns) * this.x.length;

    parameters.ctx = this.gCtx;
    parameters.xArray = this.x;
    parameters.yArray = null;
    parameters.color = null;
    parameters.yStartPoint = 0;
    parameters.yEndPoint = this.graph.height - DATE_SPACE;
    parameters.xStartPoint = 0;
    parameters.xEndPoint = this.graph.width;
    parameters.xStart = xStart;
    parameters.xEnd = xEnd;
    parameters.ceiling = ceiling;
    if (!this.oldCeiling) {
      // if we set it for the first time
      this.oldCeiling = ceiling;
    }
    parameters.oldCeiling = this.oldCeiling;
    parameters.xOffset = xOffset;
    parameters.columnsOnCanvas = cutout.numOfVisibleGraphColumns;

    return parameters;
  }
  drawGraph(onButtonPress = false) {
    let parameters = this.configureParametersForGraph();
    if (onButtonPress) {
      parameters.onButtonPress = true;
    }

    if (this.oldCeiling != parameters.ceiling || onButtonPress) {
      // TODO consider code optimization with drawMinimap since it uses the same code
      if (!this.animationActive) {
        this.animationActive = true;
        this.animation(parameters);

        this.oldCeiling = parameters.ceiling; // NOTE that it will change before anim end
      }
    } else {
      parameters.ctx.clearRect(0, 0, this.graph.width, this.graph.height);
      this.drawLinesForAllActiveArrays(parameters);
    }
    // if the ceiling has shifted - launch anim
  }
  configureParametersForMinimap() {
    let parameters = new DrawingParameters();
    let ceiling = this.findPrettyMax(0, this.x.length);
    parameters.ctx = this.mCtx;
    parameters.xArray = this.x;
    parameters.yArray = null;
    parameters.color = null;
    parameters.yStartPoint = 0;
    parameters.yEndPoint = this.minimap.height;
    parameters.xStartPoint = 0;
    parameters.xEndPoint = this.minimap.width;
    parameters.xStart = 0;
    parameters.xEnd = this.x.length - 1;
    parameters.ceiling = ceiling;
    parameters.oldCeiling = this.oldMinimapCeiling;
    parameters.xOffset = 0; // mini doesn't need an offset
    parameters.columnsOnCanvas = this.x.length;
    return parameters;
  }
  drawMinimap(onButtonPress = false) {
    // PARENTS: createButtons, launchChart,
    let parameters = this.configureParametersForMinimap();
    if (onButtonPress) {
      parameters.onButtonPress = true;
    }

    this.mCtx.clearRect(0, 0, this.minimap.width, this.minimap.height);

    // checking if i need to do an animation
    if (this.oldMinimapCeiling != parameters.ceiling || onButtonPress) {
      this.animation(parameters);
      this.oldMinimapCeiling = parameters.ceiling;
    } else {
      this.drawLinesForAllActiveArrays(parameters);
    }
  }
  findLowestLocalAmongActives() {
    let currentMin;
    currentMin = Math.min();
    // go through all the actives and find min
    //
    for (let l = 0; l < this.lines.length; l++) {}
  }
  cutArrayAtLocalMin(parameters) {
    let areaHeight = parameters.yEndPoint - parameters.yStartPoint;
    // lowest Local for all the active arrays at that slice

    let lowestLocal = Math.min(
      ...parameters.yArray.slice(parameters.xStart, parameters.xEnd + 1)
    );
    let localCeiling = parameters.ceiling - lowestLocal;
    let localNumsPerPixel = areaHeight / localCeiling;

    let cutArray = [];
    for (let x = 0; x < parameters.yArray.length; x++) {
      cutArray.push(parameters.yArray[x] - lowestLocal);
    }
    parameters.ceiling = localCeiling;
    parameters.yArray = cutArray;
  }

  drawLinesForAllActiveArrays(parameters) {
    //takes parameters from drawGraph or drawMinimap and paints all the active lines and stuff
    for (let i = 0; i < this.lines.length; i++) {
      if (this.lines[i].isActive || this.lines[i] === this.justBeenRemoved) {
        // when turning a line on/off
        if (
          this.lines[i] === this.justBeenSelected &&
          parameters.onButtonPress
        ) {
          parameters.ctx.globalAlpha =
            (1 / NUM_OF_FRAMES) * parameters.currentFrame;
        } else if (
          this.lines[i] === this.justBeenRemoved &&
          parameters.onButtonPress
        ) {
          parameters.ctx.globalAlpha =
            1 - (1 / NUM_OF_FRAMES) * parameters.currentFrame;
        }
        parameters.color = this.lines[i]['color'];
        parameters.yArray = this.lines[i]['array'];
        // this.cutArrayAtLocalMin(parameters);
        this.drawLine(parameters);
        parameters.ctx.globalAlpha = 1;
      }
    }
  }
  drawLine({
    ctx,
    xArray,
    yArray,
    color,
    yStartPoint,
    yEndPoint,
    xStartPoint,
    xEndPoint,
    xStart,
    xEnd,
    ceiling,
    xOffset,
    columnsOnCanvas
  }) {
    let areaHeight = yEndPoint - yStartPoint;
    let areaWidth = xEndPoint - xStartPoint;

    // find lowest local val
    //

    let columnWidth = areaWidth / columnsOnCanvas; //used to calculate the number of columns on the screen
    let numsPerPixel = areaHeight / ceiling;

    let currentX = xStartPoint - xOffset;
    let currentY = help.round(yArray[xStart] * numsPerPixel) - yStartPoint;

    ctx.beginPath();
    // ctx.moveTo(currentX, currentY);
    for (let i = xStart; i < xEnd + 1; i++) {
      currentX = help.round((i - xStart) * columnWidth) - xOffset;
      currentY = yEndPoint - help.round(yArray[i] * numsPerPixel) - yStartPoint;
      // currentY = yEndPoint - help.round((yArray[i]-lowestLocal) * localNumsPerPixel) - yStartPoint;

      ctx.lineTo(currentX, currentY);
    }
    ctx.lineJoin = 'round';
    if (ctx === this.gCtx) {
      ctx.lineWidth = 2 * PIXEL_RATIO;
    } else {
      ctx.lineWidth = 1 * PIXEL_RATIO;
    }
    ctx.strokeStyle = color;

    ctx.stroke();
  }
  animation(parameters) {
    let currentOldCeiling = parameters.oldCeiling;
    let currentFutureCeiling = parameters.ceiling;
    let currentNumOfFrames = NUM_OF_FRAMES;

    let difference = currentFutureCeiling - currentOldCeiling;
    let distributedDifference = difference / NUM_OF_FRAMES;

    let currentFrame = 1;

    this.drawAnimation(
      parameters,
      currentOldCeiling,
      distributedDifference,
      currentFrame,
      currentFutureCeiling
    );
  }
  animationFrame(parameters) {
    this.drawLinesForAllActiveArrays(parameters);
  }

  drawAnimation = (
    parameters,
    currentOldCeiling,
    distributedDifference,
    currentFrame,
    currentFutureCeiling
  ) => {
    if (currentFrame <= NUM_OF_FRAMES) {
      if (parameters.ctx === this.gCtx) {
        // detects whether it's the minimap or the graph
        if (parameters.onButtonPress) {
          // for ALPHA ANIMATION
          parameters = this.configureParametersForGraph();
          parameters.onButtonPress = true;
        } else {
          parameters = this.configureParametersForGraph();
        }
      } else {
        if (parameters.onButtonPress) {
          parameters = this.configureParametersForMinimap();
          parameters.onButtonPress = true;
        } else {
          parameters = this.configureParametersForMinimap();
        }
      }

      requestAnimationFrame(() => {
        this.drawAnimation(
          parameters,
          currentOldCeiling,
          distributedDifference,
          currentFrame,
          currentFutureCeiling
        );
      });

      parameters.currentFrame = currentFrame;
      parameters.ctx.clearRect(
        0,
        0,
        parameters.xEndPoint,
        parameters.yEndPoint
      );
      parameters.ceiling =
        currentOldCeiling + distributedDifference * currentFrame;
      this.animationFrame(parameters);

      currentFrame += 1;

      // find rel between ceilings

      let newOldRelationship = currentFutureCeiling / currentOldCeiling;
      this.drawNumbers(currentOldCeiling, newOldRelationship, currentFrame);
      this.drawNumbers(currentFutureCeiling, newOldRelationship, currentFrame);
    } else {
      this.justBeenRemoved = null;
      this.justBeenSelected = null;
      this.animationActive = false;
      this.drawGraph();
      // this.drawLinesForAllActiveArrays(parameters); // TODO drawgraph or this hmmm
      this.drawNumbers(currentFutureCeiling, 1, NUM_OF_FRAMES);
      if (!this.isAnyArrayActive()) {
        this.iCtx.clearRect(0, 0, this.graph.width, this.graph.height);
      }
    }
  };

  drawHorizontalLines(rowHeight) {
    let drawLines = () => {
      let x = 0;
      let xEnd = this.graph.width;
      let y = DATE_SPACE - 21 * PIXEL_RATIO;
      for (let i = 0; i < NUM_OF_ROWS; i++) {
        this.iCtx.moveTo(x, y);
        this.iCtx.lineTo(xEnd, y);
        y += rowHeight;
      }
    };
    this.iCtx.beginPath();
    drawLines();

    this.iCtx.globalAlpha = 0.2;
    this.iCtx.lineWidth = '2';
    // this.iCtx.strokeStyle = "grey";
    this.iCtx.stroke();
    this.iCtx.globalAlpha = 1;
  }
  drawHorizontalLineAboveText() {
    // above dates
    this.iCtx.beginPath();
    this.iCtx.strokeStyle = 'grey';
    this.iCtx.moveTo(0, this.graph.height - DATE_SPACE + 2);
    this.iCtx.lineTo(this.graph.width, this.graph.height - DATE_SPACE + 2);
    this.iCtx.stroke();
  }
  drawDates({ xStart, xEnd, xOffset, xEndPoint, xStartPoint }) {
    // fired on every redraw (for optimization - only fire when slider is moved)
    this.iCtx.clearRect(
      0,
      this.graph.height - DATE_SPACE,
      this.graph.width,
      DATE_SPACE
    );
    // takes the range start, end
    // better to draw this with each line draw OR use the same formulas
    // TODO make new consts for repetitive formulas, like calc position with offset
    let columnWidth = (xEndPoint - xStartPoint) / (xEnd - xStart);

    let dateSkipCounter = 0;
    let skipFactor;
    skipFactor = Math.floor((80 / columnWidth) * PIXEL_RATIO);

    let y = this.graph.height - 5 * PIXEL_RATIO;
    let currentX = 0;

    this.iCtx.font = `${SETTINGS.fontSize}px Helvetica`; //font for the numbers
    this.iCtx.fillStyle = 'grey';
    for (let i = xStart; i < xEnd + 1; i++) {
      if (dateSkipCounter === 0) {
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
  drawNumbers(ceiling, newOldRelationship = 1, currentFrame = 1, side = 'L') {
    // drawing the numbers on the left side
    let y = this.graph.height - DATE_SPACE;

    // old ceil is used to calc nums
    // new to calc position
    let opacity = 1 - 1 / currentFrame;

    if (side === 'L') this.iCtx.clearRect(0, 0, this.graph.width, y);

    let curNum = 0;
    let rowStep = ceiling / NUM_OF_ROWS;

    // let newRow = newOldRelationship * oldRow;
    let distributedRelationship = newOldRelationship / NUM_OF_FRAMES;
    // let distributedDifference = difference / NUM_OF_FRAMES;
    let rowHeight =
      ((this.graph.height - DATE_SPACE) / NUM_OF_ROWS) *
      distributedRelationship *
      currentFrame;
    // TODO round floats
    // let numsPerPixel = areaHeight / NUM_OF_ROWS;
    // get the difference between previous and new ceiling
    // use that difference to change LOCAL nums per pixel
    let xPosition;
    side === 'L'
      ? (xPosition = 20)
      : (xPosition = this.graph.width - 50 * PIXEL_RATIO);

    this.iCtx.globalAlpha = opacity;
    this.iCtx.font = `${SETTINGS.fontSize}px Helvetica`; //font for the numbers
    this.iCtx.fillStyle = 'grey';
    for (let i = 0; i < NUM_OF_ROWS; i++) {
      this.iCtx.fillText(myMath.formatNumber(curNum, true), xPosition, y - 10);
      curNum += rowStep;
      y -= rowHeight;
    }
    this.iCtx.lineWidth = 1;

    if (currentFrame % 2 == 0 || currentFrame == 1) {
      //launches lines but not too frequently
      this.drawHorizontalLines(rowHeight);
    } else {
    }
    this.iCtx.globalAlpha = 1;
  }

  displayTooltip(currentArrayColumn, currentXPos) {
    // displaying the tooltip

    //change the contents of the tooltip

    let date;
    date = new Date(this.x[currentArrayColumn]);
    date =
      DAYS_OF_WEEK[date.getDay()] +
      ', ' +
      MONTHS[date.getMonth()] +
      ' ' +
      date.getDate();
    let color;
    if (getComputedStyle(document.body).backgroundColor == DAY.lead) {
      color = NIGHT.lead;
      this.tooltip.style.backgroundColor = DAY.lead;
    } else {
      color = DAY.lead;
      this.tooltip.style.backgroundColor = NIGHT.lead;
    }
    this.tooltip.innerHTML = `<p class="header" style="color:${color};">${date}</p>`;

    // show the tooltip at needed location

    let width = this.tooltip.offsetWidth;
    // on the right side, if no space - on the left side
    this.tooltip.style.opacity = '1';
    this.tooltip.style.display = 'block';

    this.tooltip.style.left = currentXPos - width - 100 + 'px';
    this.tooltip.style.top = 70 + 'px';
    // if the width of the div is smaller than canvas-divleft

    let left = this.tooltip.offsetLeft;
    // left = this.tooltip.clientX;
    if (left < this.graph.offsetLeft) {
      this.tooltip.style.left = currentXPos + 75 + 'px';
    }
    left = this.tooltip.getBoundingClientRect().left;

    if (left + width > innerWidth) {
      this.tooltip.style.left = innerWidth - (left + width) + 'px';
    }
    this.addItemsToTooltip(currentArrayColumn);
  }
  addItemsToTooltip(currentArrayColumn) {
    // Displaying each item
    let number;
    let name;
    let style;
    for (let i in this.lines) {
      if (this.lines[i].isActive) {
        // get the date
        number = this.lines[i]['array'][currentArrayColumn];
        name = this.lines[i]['checkboxName'];
        style = `margin: 10px; color: ${this.lines[i]['color']}`;
        this.tooltip.innerHTML += `<div style="${style}"><span class="name">${name}</span><span class="number">${number}</span></div>`;
      }
    }
  }
  drawCircles(conversionQuotient, currentXPos, currentArrayColumn) {
    // drawing the circles for each line based on its configuration
    let convertedYValue;
    for (let i in this.lines) {
      if (this.lines[i].isActive) {
        convertedYValue =
          this.graph.height -
          this.lines[i]['array'][currentArrayColumn] * conversionQuotient -
          DATE_SPACE;

        this.pCtx.beginPath();
        this.pCtx.arc(
          currentXPos,
          convertedYValue,
          6 * PIXEL_RATIO,
          0,
          Math.PI * 2
        );
        this.pCtx.fillStyle = getComputedStyle(document.body).backgroundColor;
        this.pCtx.strokeStyle = this.lines[i]['color'];
        this.pCtx.fill();
        this.pCtx.lineWidth = 2 * PIXEL_RATIO;
        this.pCtx.stroke();
        this.pCtx.fillStyle = 'black';
      }
    }
  }
  drawVerticalLine(currentXPos) {
    this.pCtx.beginPath();
    this.pCtx.moveTo(currentXPos, 0);
    this.pCtx.lineTo(currentXPos, this.graph.height - DATE_SPACE);

    this.pCtx.lineWidth = '2';
    this.pCtx.strokeStyle = '#777';
    this.pCtx.stroke();
  }
  drawPopup(event) {
    let clientX;
    if (event.type === 'touchmove') {
      // check if on mobile
      clientX = event.touches[0].clientX * PIXEL_RATIO;
    } else {
      clientX = event.clientX * PIXEL_RATIO;
    }
    // gets the current mouse position and prints the appropriate array values
    let parameters = this.configureParametersForGraph();
    let cutout = this.calculateCutout();

    let cutoutSize = cutout.sliderColumnEnd - cutout.sliderColumnStart;
    let columnWidth = this.graph.width / cutout.numOfVisibleGraphColumns;
    let currentGraphColumn = Math.round(
      (clientX - this.graph.getBoundingClientRect().left) / columnWidth
    );
    let ceiling = parameters.ceiling;

    let currentArrayColumn = cutout.sliderColumnStart + currentGraphColumn;

    // TODO [#A] where do i get the old ceiling for the popup?
    let conversionQuotient = (this.graph.height - DATE_SPACE) / ceiling;

    // let convertedYValue;

    // TODO optimize this code for offset
    let xOffset = (cutout.sliderOffset / this.minimap.width) * this.graph.width;
    let numOfCutColumns = cutout.sliderColumnEnd - cutout.sliderColumnStart;
    xOffset = (xOffset / numOfCutColumns) * this.x.length;

    let currentXPos = currentGraphColumn * columnWidth - xOffset;

    this.drawGraphPopup(currentArrayColumn, currentXPos, conversionQuotient);
  }

  drawGraphPopup(currentArrayColumn, currentXPos, conversionQuotient) {
    this.pCtx.clearRect(0, 0, this.popup.width, this.popup.height);
    this.displayTooltip(currentArrayColumn, currentXPos / PIXEL_RATIO);
    this.drawVerticalLine(currentXPos);
    this.drawCircles(conversionQuotient, currentXPos, currentArrayColumn);
  }

  isAnyArrayActive() {
    for (let i in this.lines) {
      if (this.lines[i].isActive) return true;
    }
    return false;
  }
}
