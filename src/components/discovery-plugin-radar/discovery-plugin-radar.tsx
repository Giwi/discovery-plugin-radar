import { ChartType, ColorLib, DataModel, DiscoveryEvent, GTSLib, Logger, Param, Utils } from '@senx/discovery-widgets';
import { Component, Element, Event, EventEmitter, h, Listen, Method, Prop, State, Watch } from '@stencil/core';
import { Chart, registerables } from 'chart.js';
import { v4 } from 'uuid';

@Component({
  tag: 'discovery-plugin-radar',
  styleUrl: 'discovery-plugin-radar.css',
  shadow: true,
})
export class DiscoveryPluginRadar {
  @Prop() result: DataModel | string;                 // mandatory, will handle the result of a Warp 10 script execution
  @Prop() type: ChartType;                            // optionnal, to handle the chart type if you want to handle more than one
  @Prop() options: Param | string = new Param();      // mandatory, will handle dashboard and tile option
  @State() @Prop() width: number;                     // optionnal
  @State() @Prop({ mutable: true }) height: number;   // optionnal, mutable because, in this tutorial, we compute it
  @Prop() debug: boolean = false;                     // optionnal, handy if you want to use the Discovery Logger
  @Event() draw: EventEmitter<void>;                  // mandatory
  @Element() el: HTMLElement;

  @State() innerOptions: Param;               // will handle merged options
  @State() innerResult: DataModel;            // will handle the parsed execution result

  private LOG: Logger;                        // The Discovery Logger
  private divider: number = 1000;             // Warp 10 time unit divider
  private chartElement: HTMLCanvasElement;    // The chart area
  private innerStyles: any = {};              // Will handle custom CSS styles for your tile
  private myChart: Chart;                     // The ChartJS instance

  private uuid = v4()

  /*
 * Called when the result is updated
 */
  @Watch('result') // mandatory
  updateRes(newValue: DataModel | string, oldValue: DataModel | string) {
    if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
      this.innerResult = GTSLib.getData(this.result);
      setTimeout(() => this.drawChart());   // <- we will see this function later
    }
  }

  /*
   * Called when the options are updated
   */
  @Watch('options') // mandatory
  optionsUpdate(newValue: string, oldValue: string) {
    if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
      if (!!this.options && typeof this.options === 'string') {
        this.innerOptions = JSON.parse(this.options);
      } else {
        this.innerOptions = { ...this.options as Param };
      }
      setTimeout(() => this.drawChart());
    }
  }

  /*
   * Mandatory
   * Called by Discovery when the component must be resized
   */
  @Method()
  async resize() {
    if (!!this.myChart) {
      this.myChart.resize();
    }
  }

  /*
   * Optionnal
   * Called by Discovery when the component has to export its content to PNG or SVG
   */
  @Method()
  async export(type: 'png' | 'svg' = 'png') {
    // insert your own implementation
  }

  /* Handy if you want to handle Discovery events coming from other tiles */
  @Listen('discoveryEvent', { target: 'window' })
  discoveryEventHandler(event: CustomEvent<DiscoveryEvent>) {
    const res = Utils.parseEventData(event.detail, this.innerOptions.eventHandler, this.uuid);
    if (res.data) {
      this.innerResult = res.data;
      setTimeout(() => this.drawChart());
    }
    if (res.style) {
      this.innerStyles = { ...this.innerStyles, ...res.style as { [k: string]: string } };
    }
  }
  /* 
   * Mandatory
   * Part of the lifecycle
   */
  componentWillLoad() {
    Chart.register(...registerables);                                               // ChartJS specific loading
    this.LOG = new Logger(DiscoveryPluginRadar, this.debug); // init the Discovery Logger
    // parse options
    if (typeof this.options === 'string') {
      this.innerOptions = JSON.parse(this.options);
    } else {
      this.innerOptions = this.options;
    }
    // parse result
    this.innerResult = GTSLib.getData(this.result);
    this.divider = GTSLib.getDivider(this.innerOptions.timeUnit || 'us'); // Warp 10 default time unit
    // Get tile dimensions of the container
    const dims = Utils.getContentBounds(this.el.parentElement);
    this.width = dims.w;
    this.height = dims.h;
  }

  /* 
   * Mandatory
   * Part of the lifecycle
   */
  componentDidLoad() {
    setTimeout(() => this.drawChart());
  }

  /* 
   * Mandatory
   * Render the content of the component
   */
  render() {
    return (
      <div class="chart-container">
        {this.innerResult ? <canvas id="myChart" ref={(el) => this.chartElement = el as HTMLCanvasElement}></canvas> : ''}
      </div>
    );
  }

  drawChart() {
    // Merge options
    let options = Utils.mergeDeep<Param>(this.innerOptions || {} as Param, this.innerResult.globalParams) as Param;
    this.innerOptions = { ...options };
    const labels = [];
    const datasets = [];
    // Flatten the data structure and add an id to GTS
    const gtsList = GTSLib.flattenGtsIdArray(this.innerResult.data as any[], 0).res;
    // For each GTS
    gtsList.forEach((gts, i) => {
      // if the GTS is a list of values
      if (GTSLib.isGtsToPlot(gts)) {
        const data = [];
        // Compute the GTS color
        const c = ColorLib.getColor(gts.id || i, this.innerOptions.scheme);
        const color = ((this.innerResult.params || [])[i] || { datasetColor: c }).datasetColor || c;
        // For each value
        gts.v.forEach(d => {
          // Handle date depending on the timeMode and the timeZone
          const date = GTSLib.utcToZonedTime(d[0], this.divider, this.innerOptions.timeZone);
          const dateLabel = (this.innerOptions.timeMode || 'date') === 'date'
            ? GTSLib.toISOString(GTSLib.zonedTimeToUtc(date, 1, this.innerOptions.timeZone), 1, this.innerOptions.timeZone, this.innerOptions.timeFormat)
              .replace('T', '\n').replace(/\+[0-9]{2}:[0-9]{2}$/gi, '')
            : date;
          // add the label
          if (!labels.includes(dateLabel)) {
            labels.push(dateLabel);
          }
          // add the value
          data.push(d[d.length - 1]);
        });
        // add the dataset
        datasets.push({
          label: ((this.innerResult.params || [])[i] || { key: undefined }).key || GTSLib.serializeGtsMetadata(gts),
          data,
          borderColor: color,
          backgroundColor: ColorLib.transparentize(color, 0.5)
        })
      }
    });
    if (!!this.chartElement) {
      const ctx = this.chartElement.getContext('2d');
      if (!this.myChart) {
        this.myChart = new Chart(ctx, {
          type: 'radar',
          data: { labels, datasets },
          options: {
            animation: false,
            responsive: true,
            maintainAspectRatio: false
          }
        });
      } else {
        this.myChart.data = { labels, datasets };
        this.myChart.update();
      }
    }
  }
}
