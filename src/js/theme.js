import { DAY, NIGHT } from './utils.js';

let themeButton;
export function switchTheme(arrayOfCharts, arrayOfNewCharts){
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
    // chart.redraw(); // why did i put it here


  }
  for (let i = 0; i < arrayOfNewCharts.length; i++){

    chart = arrayOfNewCharts[i];
    if (color == DAY.lead){
      chart.div.style.color = NIGHT.lead;

      // if (!chart.checkmark.checked){
      //     chart.checkmark.style.backgroundColor = document.body.style.backgroundColor;
    } else {
      chart.div.style.color = DAY.lead;
      // chart.displayTooltip(window.event); // redraw the tooltip
    }
  }
  if (color == DAY.lead){
    themeButton.innerHTML = "Switch to Night Mode";
  } else {
    themeButton.innerHTML = "Switch to Day Mode";
  }
}
export function putThemeButton(){
  let buttonContainer = document.querySelector(".switch-button-container");
  // document.body.appendChild(buttonContainer);
  // buttonContainer.id = "switch-container";

  themeButton = document.createElement("span");
  buttonContainer.appendChild(themeButton);
  // themeButton.type = "a";
  themeButton.className = "switch-button";
  themeButton.innerHTML = "Switch to Day Mode";
  themeButton.addEventListener("click", switchTheme);
}
