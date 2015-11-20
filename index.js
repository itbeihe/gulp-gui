var filePath = "/var/www/myweb/gulp_auto_build_demo/gulpfile.js";
var readline = require('readline');
var projectPath = "/var/www/myweb/gulp_auto_build_demo";
var $ = require("jquery");
var cp = require('child_process');
var help = require('help.js');
var events = require('events');
var consoleEmitter = new events.EventEmitter();

consoleEmitter.addListener('CONSOLE_ADD_ROW',function(data){
    $("#gulpInfoBox").append('<div>'+data+'</div>');
});

function ab2str(buf) {
    return String.fromCharCode.apply(null, buf);
}


var runGulpTask = function(task,projectPath){
    var dtd = $.Deferred();
    var tasksList = [];
    var errList = [];
    var ls = cp.spawn(
        'gulp',
        task,
        {
            cwd: projectPath,
            env: process.env
        });
    help.emitLines(ls.stdout);
    ls.stdout.on('line',function(data){
        consoleEmitter.emit('CONSOLE_ADD_ROW',data);
    });

    ls.stderr.on('data', function (data) {
        errList.push(ab2str(data));
    });

    ls.on('exit', function (code) {
        if(code=='0'){
            var result = tasksList.join().split('\n');
            if(result[result.length-1]==''){
                result.pop();
            }
            dtd.resolve(result);
        }else{
            dtd.reject(errList);
        }
    });
    return dtd.promise();
};


var getTasks = function(projectPath){
    var dtd = $.Deferred();
    var tasksList = [];
    var errList = [];
    var ls = cp.spawn(
        'gulp',
        ['--tasks-simple'],
        {
            cwd: projectPath,
            env: process.env
        });
    ls.stdout.on('data', function (data) {
        console.log('dataing');
        var result  = ab2str(data);
        tasksList.push(result);
    });

    ls.stderr.on('data', function (data) {
        errList.push(ab2str(data));
    });

    ls.on('exit', function (code) {
        if(code=='0'){
            var result = tasksList.join().split('\n');
            if(result[result.length-1]==''){
                result.pop();
            }
            dtd.resolve(result);
        }else{
            dtd.reject(errList);
        }
    });
    return dtd.promise();
};


function buildTaskTree(){
    getTasks(projectPath).then(function(tasks){
        var tasksHtml = '<ul>';
        for(var i=0;i<tasks.length;i++){
            var taskHtml = '<li data-name="'+tasks[i]+'">'+tasks[i]+'</li>';
            tasksHtml = tasksHtml+taskHtml;
        }
        tasksHtml +='</ul>';
        $('#gulpTaskBox').html(tasksHtml);
    },function(){
        console.log(arguments);
    });
}

buildTaskTree();

$('#gulpTaskBox').on('click','li',function(){
    var taskName = $(this).data('name');
    runGulpTask([taskName],projectPath).then(function(results){
        //var tasksHtml = '<ul>';
        //for(var i=0;i<results.length;i++){
        //    var taskHtml = '<li data-name="'+results[i]+'">'+results[i]+'</li>';
        //    tasksHtml = tasksHtml+taskHtml;
        //}
        //tasksHtml +='</ul>';
        //$('#gulpInfoBox').html(tasksHtml);
        console.log('end');
    },function(errRes){

    })
});