var fs = global.require('fs');


define(["dojo/Evented", "dojo/_base/declare"], function (Evented, declare) {
    var StartDate;
    var dataInfo;


    return declare([Evented], {
        filedata: function (file1, file2) {
            cleandata();
            selectdata(file1, file2, this);
        }
    });


    function cleandata() {
        StartDate = null;
        dataInfo = [];
        for (var i = 0; i < 8640; i++) {
            dataInfo[i] = {
                "HR": 0,
                "HRvar": 0,
                "ACT": 0,
                "fHRvar": 0,
                "ACTlog": 0
            };
        }

    }


    function setHR(data) {
        var splitdata = data.split("\r\n");
        for (var i = 1; i < splitdata.length; i++) {
            var splitdata2 = (splitdata[i].split(";")); //0:time,1:HR,2:HRvar
            var timeIndex = convertTime(splitdata2[0]);
            dataInfo[timeIndex].HR = parseFloat(splitdata2[1]);
            dataInfo[timeIndex].HRvar = parseInt(splitdata2[2]);
        }
    }

    function setHRvarFilter() {

        for (var i = 0; i < dataInfo.length; i++) {
                dataInfo[i].fHRvar = dataInfo[i].HRvar;
        }

    }

    function setACTlog(data) {

        var splitdata = data.split("\r\n");
        for (var i = 1; i < splitdata.length; i++) {
            var splitdata2 = (splitdata[i].split(";")); //0:time,1:PA
            var timeIndex = convertTime(splitdata2[0]);
            var ACT_log=parseFloat(Math.log10(splitdata2[1]).toFixed(3));
            dataInfo[timeIndex].ACTlog = ACT_log;
        }

    }
    function setACT(data) {
        var splitdata = data.split("\r\n");
        for (var i = 1; i < splitdata.length; i++) {
            var splitdata2 = (splitdata[i].split(";")); //0:time,1:PA
            var timeIndex = convertTime(splitdata2[0]);
            dataInfo[timeIndex].ACT = parseFloat(splitdata2[1]);
        }
    }

    function readfiledata(filename, callback) {

        fs.readFile(filename, "utf8", function (err, data) {
            if (err) {
                console.log(err);
                return;
            }
            if (callback)callback(data);

        });
    }


    function convertTime(data) {
        var NextDate = new Date(data);
        if (StartDate == undefined) {
            StartDate = new Date(NextDate.getFullYear(), NextDate.getMonth(), NextDate.getDate(), 0, 0, 0)
        }
        var diff = Math.floor((NextDate - StartDate) / ( 1000 * 10));
        return diff;
        //console.log(diff);
    }

    function selectdata(HRfile, ACTlogfile, event) {

        readfiledata(HRfile, function (data) {
            setHR(data);
            readfiledata(ACTlogfile, function (data) {
                setACT(data);
                setACTlog(data);
                setHRvarFilter();
                //   console.log(dataInfo);
                event.emit('data', dataInfo);
            });
        });
    }
});