var filePath = "/var/www/myweb/gulp_auto_build_demo/gulpfile.js";
var readline = require('readline');
var projectPath = "/var/www/myweb/gulp_auto_build_demo";
var cp = require('child_process');
var help = require('./js/help');
var events = require('events');
var consoleEmitter = new events.EventEmitter();

var chooser = document.querySelector('#gulpfileInput');

chooser.addEventListener("change", function (evt) {
    apendText(this.value);
}, false);

function apendText(text) {
    console.log(text);
    $('#filePathText').html(text);
}


consoleEmitter.addListener('CONSOLE_ADD_ROW',function(data){
    $("#gulpInfo").append('<div>'+data+'</div>');
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
        var tasksHtml = '';
        for(var i=0;i<tasks.length;i++){
            var taskHtml = '<li><a href="" data-name="'+tasks[i]+'">'+tasks[i]+'</a></li>';
            tasksHtml = tasksHtml+taskHtml;
        }
        tasksHtml +='';
        $('#gulpTaskList').html(tasksHtml);
    },function(){
        console.log(arguments);
    });
}

buildTaskTree();

$('#gulpTaskList').on('click','a',function(ev){
    ev.preventDefault();
    var taskName = $(this).data('name');
    runGulpTask([taskName],projectPath).then(function(results){
        console.log('end');
    },function(errRes){

    })
});