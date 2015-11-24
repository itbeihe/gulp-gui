var fs = require('fs');
function emitLines (stream) {
    var backlog = ''
    stream.on('data', function (data) {
        backlog += data
        var n = backlog.indexOf('\n')
        // got a \n? emit one or more 'line' events
        while (~n) {
            stream.emit('line', backlog.substring(0, n))
            backlog = backlog.substring(n + 1)
            n = backlog.indexOf('\n')
        }
    })
    stream.on('end', function () {
        if (backlog) {
            stream.emit('line', backlog)
        }
    })
}

function readJson(path,object){
    try{
        var dataString = fs.readFileSync(path);
        var data = JSON.parse(dataString);
        return data;
    }catch(e){
        return {};
    }
}

function writeJson(path,object){
    var dataString = JSON.stringify(object, null, "\t");
    fs.writeFileSync(path,dataString);
}

function checkFile(path,dc){
    console.log('-----------');
    try{
        var st = fs.statSync(path);
    }catch(e){
        console.log(st);
    }
}


module.exports={
    emitLines :emitLines,
    writeJson :  writeJson,
    readJson : readJson,
    checkFile:checkFile,
    filterArray:function(array,key,value){
        var rArr = [];
        for(var i= 0,len=array.length;i<len;i++){
            if(array[i][key] == value){
                rArr.push(array[i]);
            }
        }
        return rArr;
    }
}
