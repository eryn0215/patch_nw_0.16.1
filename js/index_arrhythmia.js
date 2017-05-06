require([
        "dojo/parser",
        "dojo/dom",
        "dijit/registry",
        "dojo/dom-construct",
        "dojo/dom-style",
        "dijit/form/Button",
        "dijit/layout/BorderContainer", "dijit/layout/ContentPane",
        "dojox/charting/Chart", "dojox/charting/plot2d/Default", "dojox/charting/axis2d/Default", "dojox/charting/plot2d/Lines", "dojox/charting/plot2d/Grid",
        "dojox/charting/themes/PlotKit/blue", "dojox/charting/widget/SelectableLegend", "dojox/charting/axis2d/Base",
        "dojo/store/Memory", "dijit/form/ComboBox", "dojox/charting/action2d/PlotAction", "dijit/form/SimpleTextarea", "dijit/form/HorizontalSlider",
        "dijit/form/HorizontalRule", "dijit/form/HorizontalRuleLabels", "dojox/charting/action2d/MouseZoomAndPan",
        "dojox/charting/action2d/MouseIndicator", "dojox/charting/plot2d/Indicator", "dojo/on", "dojo/keys", "dojo/_base/event", "dojo/sniff",
        "dojo/ready", "dojo/domReady!", "app/arrhythmia"], function (parser,
                                                                     dom, registry, domConstruct, domStyle,
                                                                     Button, BorderContainer, ContentPane,
                                                                     Chart, Plot, Default, Lines, Grid, blue, SelectableLegend, Base,
                                                                     Memory, ComboBox, PlotAction, SimpleTextarea, HorizontalSlider, HorizontalRule,
                                                                     HorizontalRuleLabels, MouseZoomAndPan, MouseIndicator, Indicator, on, keys, eventUtil, has, ready, domReady, arrhythmia) {

        var chartHRvar, chartHR, chartACTlog, chartfHRvar;
        var serHR = [], serHRvar = [], serACTlog = [], serfHRvar = [], serACT = [], serfHRvar_original = [];
        var charts = [];
        var indicatorHR;
        var indi_HR;
        var shiftSwitch = false;
        var pointMax = 8640;
        var isFreeze = false;
        var patchdata = new arrhythmia();
        var threshold_vc;
        var moveable, scaleX = 1, scaleY = 1, offsetX = 0, offsetY = 0;
        var df;
        var HRfilename;
        var ACTfilename;
        var HRfile = "";
        var ACTfile = "";
        var sUnit = has("mozilla") ? 3 : 120;
        var xAxisLabels = [
            {text: "0:00", value: 0}, {text: "01:00", value: 360}, {text: "02:00", value: 720},
            {text: "03:00", value: 1080}, {text: "04:00", value: 1440}, {text: "05:00", value: 1800},
            {text: "06:00", value: 2160}, {text: "07:00", value: 2520}, {text: "08:00", value: 2880},
            {text: "09:00", value: 3240}, {text: "10:00", value: 3600}, {text: "11:00", value: 3960},
            {text: "12:00", value: 4320}, {text: "13:00", value: 4680}, {text: "14:00", value: 5040},
            {text: "15:00", value: 5400}, {text: "16:00", value: 5760}, {text: "17:00", value: 6120},
            {text: "18:00", value: 6480}, {text: "19:00", value: 6840}, {text: "20:00", value: 7200},
            {text: "21:00", value: 7560}, {text: "22:00", value: 7920}, {text: "23:00", value: 8280},
            {text: "24:00", value: 8640}];

        function init() {
            openfile();
            renderChart();
        }

        //----------------------------打開資料夾----------------------
        function openfile() {


            var button = new Button({
                label: "Execute",
                onClick: function () {
                    HRfilename = dom.byId("HRfile");
                    HRfile = HRfilename.value;
                    ACTfilename = dom.byId('ACTlogfile');
                    ACTfile = ACTfilename.value;
                    patchdata.filedata(HRfile, ACTfile);

                    patchdata.on('data', function (data) {
                        serHR = [];
                        serACTlog = [];
                        serfHRvar = [];
                        data.forEach(function (element) {
                            serHR.push(element.HR);
                            serACTlog.push(element.ACTlog);
                            serfHRvar.push(element.fHRvar);
                            serACT.push(element.ACT);
                            serfHRvar_original.push(element.fHRvar);
                        });

                        updateChart();
                    });

                }
            }, "btn");
            button.startup();


            var actInput = registry.byId("threshold");

            on(actInput, "change", function (input) {

                var threshold_v = input;

                for (var i = 0; i < 8640; i++) {
                    if (serACT[i] >= threshold_v) {
                        serfHRvar[i] = 0;
                    } else {
                        serfHRvar[i] = serfHRvar_original[i];
                    }
                    //  console.log(serACT[i],threshold_v,serfHRvar[i]);
                }

                threshold_vc = parseFloat(Math.log10(threshold_v));
                chartACTlog.getPlot("thresholdh").opt.values=[threshold_vc];

                updateChart();
            });


            on(dom.byId("chartOne"), "keydown", function (event) {
              chartHR.getPlot("thresholdv").opt.values.push(indi_HR);

            });


            var button2 = new Button({
                label: "Alternate",
                onClick: function () {
                }
            }, "btn2");
            button2.startup();

        }

        function updateChart() {
            chartHR.updateSeries("Series 1", serHR);
            chartACTlog.updateSeries("Series 3", serACTlog);
            chartfHRvar.updateSeries("Series 4", serfHRvar);
            chartHR.render();
            chartACTlog.render();
            chartfHRvar.render();
        }


        function renderChart() {
            //---------------------------- HR ----------------------
            chartHR = new Chart("chartOne");
            chartHR.title = "Heart Rate";
            chartHR.addPlot("default", {type: Lines, enableCache: true});
            chartHR.addPlot("default", {type: "Default", markers: false});
            chartHR.addAxis("x", {
                enableCache: true,
                labels: xAxisLabels,
                fontColor: "blue",
                max: pointMax, min: 0,
                majorTickStep: 360,
                minorTickStep: 60,
                majorLabels: true,
                minorLabels: false,
                majorTicks: true,
                minorTicks: true,
                fixLower: "major", fixUpper: "major"
            });
            chartHR.addAxis("y", {
                max: 150, min: 0,
                vertical: true,
                majorLabels: true,
                minorLabels: false,
                majorTicks: true,
                minorTicks: true,
                fixLower: "includeZero", fixUpper: "major"
            });
            chartHR.addPlot("thresholdv", {
                type: Indicator,
                lineStroke: {color: "blue", style: "ShortDash"},
                stroke: null,
                outline: null,
                fill: null,
                offset: {y: -7, x: 0},
                values: []
            });
            indicatorHR = MouseIndicator(chartHR, "default", {series: "Series 1", mouseOver: false});
//---------------------------- ACT ----------------------
            chartACTlog = new Chart("chartThree");
            chartACTlog.title = "Physical Activity";
            chartACTlog.addPlot("default", {type: Lines, enableCache: true});

            chartACTlog.addAxis("x", {
                enableCache: true,
                labels: xAxisLabels,
                fontColor: "blue",
                max: pointMax, min: 0,
                majorTickStep: 360,
                minorTickStep: 60,
                majorLabels: true,
                minorLabels: false,
                majorTicks: true,
                minorTicks: true,
                fixLower: "major", fixUpper: "major"
            });
            chartACTlog.addAxis("y", {
                max: 5, min: 0,
                vertical: true,
                majorLabels: true,
                minorLabels: false,
                majorTicks: true,
                minorTicks: true,
                fixLower: "includeZero", fixUpper: "major"
            });
            chartACTlog.addPlot("default", {
                type: Plot
            });

            chartACTlog.addPlot("thresholdh", {
                type: Indicator,
                vertical: false,
                lineStroke: {color: "red", style: "ShortDash"},
                stroke: null,
                outline: null,
                fill: {},
                offset: {y: -7, x: -10},
                values: []
            });

//---------------------------- fHRvar ----------------------
            chartfHRvar = new Chart("chartFour");
            chartfHRvar.title = "filter Heart Rate variaton ";
            chartfHRvar.addPlot("default", {type: Lines, enableCache: true});//
            chartfHRvar.addAxis("x", {
                enableCache: true,
                labels: xAxisLabels,
                fontColor: "blue",
                max: pointMax, min: 0,
                majorTickStep: 360,
                minorTickStep: 60,
                majorLabels: true,
                minorLabels: false,
                majorTicks: true,
                minorTicks: true,
                fixLower: "major", fixUpper: "major"
            });
            chartfHRvar.addAxis("y", {
                max: 200, min: 0,
                vertical: true,
                majorLabels: true,
                minorLabels: false,
                majorTicks: true,
                minorTicks: true,
                fixLower: "includeZero", fixUpper: "major"
            });

            chartHR.addSeries("Series 1", serHR, {color: "orange"});
            chartACTlog.addSeries("Series 3", serACTlog, {color: "green"});
            chartfHRvar.addSeries("Series 4", serfHRvar, {color: "red"});

            on(indicatorHR, "Change", function (event) {
                if (event.start != undefined) {
                    indi_HR = event.start.x;
                }
            });
//---------------------------- MouseZoomAndPan ----------------------
            var MouseHR = new MouseZoomAndPan(chartHR, "default", {axis: "x"});
            MouseHR.on("MouseWheel", function (event) {
                var scroll = event.wheelDelta / sUnit;
                if (scroll > -1 && scroll < 0) {
                    scroll = -1;
                } else if (scroll > 0 && scroll < 1) {
                    scroll = 1;
                }
                MouseACTlog._onZoom(scroll, event);
                MousefHRvar._onZoom(scroll, event);
            });

            MouseHR.on("MouseMove", function (event) {
                var charts = [chartACTlog, chartfHRvar];
                for (var i = 0; i < charts.length; i++) {
                    var chart = charts[i];

                    if (this._isPanning) {
                        chartHR = this.chart, axis = chartHR.getAxis(this.axis);
                        var delta = this._getDelta(event);
                        var bounds = axis.getScaler().bounds,
                            s = bounds.span / (bounds.upper - bounds.lower);
                        var scale = axis.getWindowScale();
                        chart.setAxisWindow(this.axis, scale, this._startOffset - delta / s / scale);
                        chart.render();
                    }
                }
            });


            var MouseACTlog = new MouseZoomAndPan(chartACTlog, "default", {axis: "x"});
            MouseACTlog.on("MouseWheel", function (event) {
                var scroll = event.wheelDelta / sUnit;
                if (scroll > -1 && scroll < 0) {
                    scroll = -1;
                } else if (scroll > 0 && scroll < 1) {
                    scroll = 1;
                }
                MouseHR._onZoom(scroll, event);
                MousefHRvar._onZoom(scroll, event);
            });

            MouseACTlog.on("MouseMove", function (event) {
                var charts = [chartHR, chartfHRvar];
                for (var i = 0; i < charts.length; i++) {
                    var chart = charts[i];
                    if (this._isPanning) {
                        chartACTlog = this.chart, axis = chartACTlog.getAxis(this.axis);
                        var delta = this._getDelta(event);

                        var bounds = axis.getScaler().bounds,
                            s = bounds.span / (bounds.upper - bounds.lower);

                        var scale = axis.getWindowScale();
                        chart.setAxisWindow(this.axis, scale, this._startOffset - delta / s / scale);
                        chart.render();
                    }
                }
            });


            var MousefHRvar = new MouseZoomAndPan(chartfHRvar, "default", {axis: "x"});
            MousefHRvar.on("MouseWheel", function (event) {

                var scroll = event.wheelDelta / sUnit;

                if (scroll > -1 && scroll < 0) {
                    scroll = -1;
                } else if (scroll > 0 && scroll < 1) {
                    scroll = 1;
                }

                MouseACTlog._onZoom(scroll, event);
                MouseHR._onZoom(scroll, event);
            });
            MousefHRvar.on("MouseMove", function (event) {
                var charts = [chartHR, chartACTlog];
                for (var i = 0; i < charts.length; i++) {

                    var chart = charts[i];
                    if (this._isPanning) {
                        chartfHRvar = this.chart, axis = chartfHRvar.getAxis(this.axis);
                        var delta = this._getDelta(event);

                        var bounds = axis.getScaler().bounds,
                            s = bounds.span / (bounds.upper - bounds.lower);

                        var scale = axis.getWindowScale();
                        chart.setAxisWindow(this.axis, scale, this._startOffset - delta / s / scale);
                        chart.render();
                    }
                }
            });
            chartHR.render();
            chartACTlog.render();
            chartfHRvar.render();
        }

        ready(function () {
            parser.parse().then(function () {

                init();

            });
        });

    }
);


