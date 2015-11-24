var fs = require('fs');
function emitLines (stream) {
    stream.setEncoding('utf8');
    stream.on('data', function (data) {
        var str = data.toString(),
            lines = str.split(/(\r?\n)/g);
        for (var i=0; i<lines.length; i++) {
            stream.emit('line', lines[i]);
        }
    });
    stream.on('end', function () {

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
