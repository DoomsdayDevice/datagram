import Chart from './Chart.js';

export default class lineChart extends Chart{
  constructor(data){
    let title = "Line Chart";
    super(data, title);
    // importDays(1);
  }
}
